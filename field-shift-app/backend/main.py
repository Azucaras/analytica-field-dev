from __future__ import annotations

import json
import math
import os
import threading
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
from fastapi import Body, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "field-scenarios.json"
with FIXTURE_PATH.open(encoding="utf-8") as fixture_file:
    FIXTURE: dict[str, Any] = json.load(fixture_file)

BACKEND_DIR = Path(__file__).parent

# Dated climate fixtures written by field-shift-pipeline/pipeline/export_fieldshift.py.
# The backend only reads them; a missing file answers 503 on the climate endpoints and never
# takes /fields down.
CLIMATE_DIR = Path(os.getenv("CLIMATE_FIXTURE_DIR", str(BACKEND_DIR / "fixtures" / "climate")))


def _load_pilot_fields() -> list[dict[str, Any]]:
    path = CLIMATE_DIR / "pilot-fields.json"
    try:
        with path.open(encoding="utf-8") as pilot_file:
            return list(json.load(pilot_file)["fields"])
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return []


def all_fields() -> list[dict[str, Any]]:
    """The three fixture fields, then the synthetic pilot fields."""
    return [*FIXTURE["fields"], *_load_pilot_fields()]


def _field_or_404(field_id: str) -> dict[str, Any]:
    field = next((entry for entry in all_fields() if entry["id"] == field_id), None)
    if field is None:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


def _climate_file(name: str) -> dict[str, Any]:
    path = CLIMATE_DIR / name
    try:
        with path.open(encoding="utf-8") as climate_file:
            return json.load(climate_file)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail=f"Climate fixture {name} is missing; run the pipeline exporter") from None
    except json.JSONDecodeError:
        raise HTTPException(status_code=503, detail=f"Climate fixture {name} is unreadable") from None


TILE_CACHE_DIR = Path(os.getenv("TILE_CACHE_DIR", str(BACKEND_DIR / ".tile-cache")))
GIBS_MAX_ZOOM = 6
TILE_CACHE_TTL = timedelta(hours=24)
GIBS_BASE_URL = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best"
TILE_LAYER_IDS = {
    "smap-soil-moisture": "SMAP_L3_Passive_Enhanced_Day_Soil_Moisture",
}
_upstream_requests = 0
_tile_lock = threading.RLock()

app = FastAPI(title="Field Shift API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Tile-Source", "X-Tile-Fallback", "X-Tile-Date"],
)

COMMANDS: tuple[dict[str, Any], ...] = (
    {
        "name": "select_field",
        "label": "Select a field",
        "input_schema": {"type": "object", "properties": {"field_id": {"type": "string", "minLength": 1}}, "required": ["field_id"], "additionalProperties": False},
        "effect": "select_field",
        "idempotent": False,
        "guard": "field_id must identify a field in the field list",
    },
    {
        "name": "set_composition",
        "label": "Set map composition",
        "input_schema": {"type": "object", "properties": {"preset": {"type": "string", "enum": ["map", "satellite", "satellite-with-labels"]}}, "required": ["preset"], "additionalProperties": False},
        "effect": "set_composition",
        "idempotent": True,
        "guard": "preset must be a supported map composition",
    },
    {
        "name": "open_panel",
        "label": "Open a panel",
        "input_schema": {"type": "object", "properties": {"panel": {"type": "string", "enum": ["scenarios", "evidence"]}}, "required": ["panel"], "additionalProperties": False},
        "effect": "open_panel",
        "idempotent": True,
        "guard": "panel must be one of the available workspace panels",
    },
    {
        "name": "apply_filter",
        "label": "Apply a scenario filter",
        "input_schema": {"type": "object", "properties": {"filter": {"type": "string", "enum": ["all", "ranked", "abstained"]}}, "required": ["filter"], "additionalProperties": False},
        "effect": "apply_filter",
        "idempotent": False,
        "guard": "filter must be all, ranked, or abstained",
    },
)
COMMANDS_BY_NAME = {command["name"]: command for command in COMMANDS}
COMMAND_NAMES = [command["name"] for command in COMMANDS]
command_state: dict[str, Any] = {
    "selected_field_id": None,
    "composition": "map",
    "open_panel": None,
    "filter": None,
}


def _validate_command_arguments(name: str, arguments: Any) -> dict[str, Any]:
    if not isinstance(arguments, dict):
        raise HTTPException(status_code=422, detail="Command arguments must be a JSON object")
    schema = COMMANDS_BY_NAME[name]["input_schema"]
    properties = schema["properties"]
    if set(arguments) != set(properties):
        raise HTTPException(status_code=422, detail=f"Arguments must contain exactly: {', '.join(properties)}")
    for key, value in arguments.items():
        rule = properties[key]
        if not isinstance(value, str):
            raise HTTPException(status_code=422, detail=f"{key} must be a string")
        if len(value) < rule.get("minLength", 0) or ("enum" in rule and value not in rule["enum"]):
            raise HTTPException(status_code=422, detail=f"Invalid value for {key}")
    return arguments


@app.get("/commands")
def list_commands() -> dict[str, Any]:
    return {"commands": list(COMMANDS)}


@app.post("/commands/{name}")
def execute_command(name: str, arguments: Any = Body(...)) -> dict[str, Any]:
    if name not in COMMANDS_BY_NAME:
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=422,
            content={"detail": "Unknown command", "valid_names": COMMAND_NAMES},
        )
    validated_arguments = _validate_command_arguments(name, arguments)
    state_key, state_value = {
        "select_field": ("selected_field_id", validated_arguments.get("field_id")),
        "set_composition": ("composition", validated_arguments.get("preset")),
        "open_panel": ("open_panel", validated_arguments.get("panel")),
        "apply_filter": ("filter", validated_arguments.get("filter")),
    }[name]
    command_state[state_key] = state_value
    return {"name": name, "effect": COMMANDS_BY_NAME[name]["effect"], "arguments": validated_arguments, "state": dict(command_state)}


def _tile_cache_path(layer: str, z: int, x: int, y: int) -> Path:
    return TILE_CACHE_DIR / layer / str(z) / str(x) / f"{y}.png"


def _read_fresh_cache(path: Path) -> bytes | None:
    try:
        if datetime.now(timezone.utc).timestamp() - path.stat().st_mtime < TILE_CACHE_TTL.total_seconds():
            return path.read_bytes()
    except FileNotFoundError:
        pass
    return None


def _reserve_tile(layer: str, upstream_status: int | str) -> Response:
    reserve_path = BACKEND_DIR / "reserve" / f"{layer}.png"
    if not reserve_path.is_file():
        raise HTTPException(status_code=502, detail=f"No reserve tile available for {layer}")
    return Response(
        content=reserve_path.read_bytes(),
        media_type="image/png",
        headers={
            "X-Tile-Source": "reserve",
            "X-Tile-Fallback": f"Local reserve tile served after upstream failure ({upstream_status})",
        },
    )


def _upstream_url(layer: str, tile_date: date, z: int, x: int, y: int) -> str:
    base_url = os.getenv("TILE_UPSTREAM_URL", GIBS_BASE_URL).rstrip("/")
    return (
        f"{base_url}/{TILE_LAYER_IDS[layer]}/default/{tile_date.isoformat()}"
        f"/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png"
    )


def _tile_for_coordinate(longitude: float, latitude: float, zoom: int) -> tuple[int, int]:
    scale = 2**zoom
    x = int((longitude + 180.0) / 360.0 * scale)
    latitude_radians = math.radians(latitude)
    y = int((1 - math.asinh(math.tan(latitude_radians)) / math.pi) / 2 * scale)
    return min(max(x, 0), scale - 1), min(max(y, 0), scale - 1)


def _first_field_tile(zoom: int) -> tuple[int, int]:
    center = FIXTURE["fields"][0]["center"]
    return _tile_for_coordinate(center[0], center[1], zoom)


def _fetch_latest_upstream_tile(
    layer: str, z: int, x: int, y: int, today: date | None = None
) -> tuple[date | None, httpx.Response | None, int | str]:
    global _upstream_requests
    check_date = today or datetime.now(timezone.utc).date()
    zoom = min(z, GIBS_MAX_ZOOM)
    scale = 2 ** (z - zoom)
    upstream_x, upstream_y = x // scale, y // scale
    last_status: int | str = "no date tried"
    for back in range(5):
        tile_date = check_date - timedelta(days=back)
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                with _tile_lock:
                    _upstream_requests += 1
                upstream = client.get(_upstream_url(layer, tile_date, zoom, upstream_x, upstream_y))
        except httpx.HTTPError as exc:
            return None, None, f"connection error: {exc.__class__.__name__}"

        last_status = upstream.status_code
        if upstream.status_code in (400, 404):
            continue
        if not 200 <= upstream.status_code < 300:
            return None, None, last_status
        return tile_date, upstream, last_status
    return None, None, last_status


@app.get("/layers")
def list_layers(z: int = 11, x: int | None = None, y: int | None = None) -> list[dict[str, str]]:
    if x is None or y is None:
        default_x, default_y = _first_field_tile(z)
        x = default_x if x is None else x
        y = default_y if y is None else y
    if min(z, x, y) < 0 or z > 30 or x >= 2**z or y >= 2**z:
        raise HTTPException(status_code=400, detail="Invalid tile coordinates")

    today = datetime.now(timezone.utc).date()
    layers: list[dict[str, str]] = []
    for layer_id, label, basis, resolution, proxy_layer in (
        ("smap", "SMAP soil moisture", "retrieved", "9 km", "smap-soil-moisture"),
    ):
        tile_date, _upstream, last_status = _fetch_latest_upstream_tile(proxy_layer, z, x, y, today)
        if tile_date is None:
            raise HTTPException(status_code=502, detail=f"No tile date available for {layer_id} ({last_status})")
        layers.append({
            "id": layer_id,
            "label": label,
            "basis": basis,
            "resolution": resolution,
            "as_of": tile_date.isoformat(),
        })
    return layers


@app.get("/tiles/stats/upstream")
def tile_upstream_stats() -> dict[str, int]:
    with _tile_lock:
        return {"upstream_requests": _upstream_requests}


@app.get("/tiles/{layer}/{z}/{x}/{y}")
def get_tile(layer: str, z: int, x: int, y: int) -> Response:
    if layer not in TILE_LAYER_IDS:
        raise HTTPException(status_code=404, detail="Unknown tile layer")
    if min(z, x, y) < 0 or z > 30 or x >= 2**z or y >= 2**z:
        raise HTTPException(status_code=400, detail="Invalid tile coordinates")

    cache_path = _tile_cache_path(layer, z, x, y)
    with _tile_lock:
        cached = _read_fresh_cache(cache_path)
        if cached is not None:
            return Response(
                content=cached,
                media_type="image/png",
                headers={"X-Tile-Source": "cache"},
            )

        tile_date, upstream, last_status = _fetch_latest_upstream_tile(layer, z, x, y)
        if upstream is None:
            if isinstance(last_status, str) and last_status.startswith("connection error"):
                return _reserve_tile(layer, last_status)
            if isinstance(last_status, int) and last_status >= 500:
                return _reserve_tile(layer, last_status)
            return _reserve_tile(layer, "tile unavailable for today and previous four days")
        if tile_date is None:
            return _reserve_tile(layer, last_status)

        TILE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = cache_path.with_suffix(".png.tmp")
        temporary_path.write_bytes(upstream.content)
        temporary_path.replace(cache_path)
        return Response(
            content=upstream.content,
            media_type="image/png",
            headers={"X-Tile-Source": "upstream", "X-Tile-Date": tile_date.isoformat()},
        )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/fields")
def list_fields() -> dict[str, Any]:
    return {
        "seasons": FIXTURE["seasons"],
        "default_season": FIXTURE["default_season"],
        "fields": [
            {
                **{key: value for key, value in field.items() if key != "scenarios"},
                "municipality_code": field.get("municipality_code"),
                "synthetic": bool(field.get("synthetic", False)),
            }
            for field in all_fields()
        ],
    }


@app.get("/fields/{field_id}/scenarios")
def get_scenarios(field_id: str) -> dict[str, Any]:
    field = _field_or_404(field_id)

    # A field with no coverage measurement abstains; abstention is a result, not an error.
    if field["coverage"] is None:
        threshold: str | None = "coverage_not_measured"
    else:
        threshold = "coverage_below_80_percent" if field["coverage"] < 80 else None
    return {
        "field_id": field["id"],
        "season": FIXTURE["default_season"],
        "state": "abstained" if threshold else "ranked",
        "threshold": threshold,
        "coverage": field["coverage"],
        "scenarios": field["scenarios"],
    }


@app.get("/climate/enso")
def get_enso() -> dict[str, Any]:
    """Current CPC ENSO state and strength outlook, as a dated fixture."""
    return _climate_file("enso.json")


@app.get("/fields/{field_id}/climate")
def get_field_climate(field_id: str) -> dict[str, Any]:
    """The municipal climate evidence of the field's municipality."""
    field = _field_or_404(field_id)
    code = field.get("municipality_code")
    if code is None:
        return {"field_id": field_id, "state": "not_available", "municipality": None, "season_progress": None, "rows": []}
    data = _climate_file(f"municipality-{code}.json")
    return {"field_id": field_id, "state": "available", **data}


# The Field Phase contract, exported by `field-shift-pipeline` (`python -m api.export`)
# as static JSON, served read-only for the analysis page.
FIELDPHASE_DIR = Path(os.getenv("FIELDPHASE_FIXTURE_DIR", str(BACKEND_DIR / "fixtures" / "fieldphase")))


@app.get("/fieldphase/data/v1/{path:path}")
def get_fieldphase_file(path: str) -> Response:
    root = (FIELDPHASE_DIR / "data" / "v1").resolve()
    target = (root / path).resolve()
    if not path.endswith(".json") or not target.is_relative_to(root):
        raise HTTPException(status_code=404, detail="Not found")
    try:
        content = target.read_bytes()
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail=f"Field Phase export {path} is missing; run the pipeline exporter") from None
    return Response(content=content, media_type="application/json")
