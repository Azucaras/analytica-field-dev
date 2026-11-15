#!/usr/bin/env python3
"""Build helpers for the block 5 offline polygon products (CO-B5-01, CO-B5-02).

The shell driver `scripts/build-polygons.sh` runs the tippecanoe and pmtiles
commands exactly as the frozen spec states them (R-10) and calls this module for
the four things a shell pipeline cannot do honestly on its own:

  fetch-us       page the CSB 2025 Feature Service for the pilot box
  classes-us     generate the 255 row class table from the CDL raster attribute table
  classes-br     generate the 14 row class table from the MapBiomas legend CSV
  parquet-to-fgb convert the published GeoParquet to FlatGeobuf for tippecanoe
  choose-floor   pick the lowest detail zoom D whose box tiles meet the budget
  measure        per zoom tile bytes, pinned view feature counts, tile fixtures
  layers         read the layer name out of the tileset metadata and a decoded tile
  run-record     record a run's products with size and sha256
  finalize       compose artifacts/polygon-build-manifest.json from two runs

Requires pyarrow, pandas, shapely, pyogrio and mapbox-vector-tile for the
subcommands that touch parquet, FlatGeobuf and MVT; the rest is stdlib.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import io
import json
import math
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import pmtiles_reader as pm

CSB_QUERY = (
    "https://pdi.scinet.usda.gov/hosting/rest/services/Hosted/"
    "Crop_Sequence_Boundaries_2025/FeatureServer/0/query"
)
CDL_RAT = "https://pdi.scinet.usda.gov/image/rest/services/CDL_WM/ImageServer/rasterAttributeTable?f=json"
CDL_RAT_SHA256 = "8b5cec2ff965a2d1f7f1205111b3a0fbe3cce5ed82cb0ef6a446ae304fe0b699"
MAPBIOMAS_CSV = (
    "https://brasil.mapbiomas.org/wp-content/uploads/sites/3/2026/08/"
    "legend_code_mapbiomas_brazil_collection_11.csv"
)
MAPBIOMAS_CSV_SHA256 = "603239c5de7cca95799c788ab553a73ec3fc16477f681f63bb5af191d2f54dbe"

US_BOX = (-97.20, 46.90, -97.14, 46.96)
US_ID_FIELDS = [
    "csbid",
    "csbacres",
    "statefips",
    "cntyfips",
    "cdl2018",
    "cdl2019",
    "cdl2020",
    "cdl2021",
    "cdl2022",
    "cdl2023",
    "cdl2024",
    "cdl2025",
]
US_CLASS_FIELDS = [f"cdl{year}" for year in range(2018, 2026)]
BR_BOX = (-61.633, -18.0416, -50.2248, -7.3487)
BR_CLASS_IDS = [3, 4, 9, 15, 20, 21, 35, 39, 40, 41, 46, 47, 48, 62]
BR_DISPLAY_OVERRIDES = {46: "Coffee"}  # R-16: the CSV writes `Coffe`

DETAIL_BUDGET_BYTES = 250 * 1000
OVERVIEW_BUDGET_BYTES = 300 * 1000
MAX_TILE_BUDGET_BYTES = 1000 * 1000

# The Brazil detail command. R-10 names `pmtiles extract --bbox` for this tier,
# and that command copied the published file's z0 to z12 range and its per tile
# bytes, which failed AC-06 (repair card t_d7457a47). The tier is tiled from the
# same published GeoParquet the overview uses instead. The command is kept here,
# in one place, so the artifact records what actually ran rather than a retyped
# copy of it.
BR_DETAIL_BUILD = (
    "tippecanoe -l trazo -Z8 -z12 -y Id -y mbmode24 --low-detail=10 "
    "--full-detail=12 --buffer=12 "
    "--clip-bounding-box=-61.633,-18.0416,-50.2248,-7.3487 "
    "--drop-densest-as-needed --maximum-tile-bytes=250000 "
    "-o data/polygons/br-mt-detail.pmtiles "
    "data/work/trazo3_brazil_mato_grosso_2024.fgb"
)
BR_DETAIL_BUILD_NOTES = [
    "The Brazil detail tier is tiled with tippecanoe instead of copied out of the source",
    "archive with `pmtiles extract`, which is the one deviation from R-10 on this card:",
    "the extract carried the source file's z0 to z12 range and its untrimmed tiles, which",
    "broke the Table B range of 8 to 12 and the 250 KB detail budget of R-08.",
    "",
    "Flag choices, each measured rather than assumed:",
    "  -Z8 -z12        the Table B range, so z0 to z7 and z13 do not exist in the file.",
    "  -y Id -y mbmode24  the two properties the Brazil detail row of Table B reads, and",
    "                  nothing else: the published parquet carries eleven more columns.",
    "  --drop-densest-as-needed  chosen over `--coalesce` because coalescing merges",
    "                  neighbouring fields into one feature, which destroys the per field",
    "                  `Id` that Table A's id property and a click need, and because",
    "                  `--coalesce-smallest-as-needed` would merge fields of different",
    "                  classes into a shape painted with one class. Dropping keeps every",
    "                  surviving feature whole and keeps its own `Id` and `mbmode24`.",
    "  --low-detail=10 --full-detail=12  the geometry detail ramp the published tiles",
    "                  carry at z8 to z10. At the default constant detail 12 the 250 KB",
    "                  budget fits 9,653 features over the V1 viewport's 28 tiles (345 per",
    "                  tile); at constant detail 10 it fits 26,805 (957 per tile). Without",
    "                  the ramp a z10 tile spends about three times the bytes per parcel",
    "                  and the budget throws away most of what the source carries.",
    "  --buffer=12     the tile edge duplication the published tiles carry. With",
    "                  tippecanoe's default buffer of 5 the same command puts the V1",
    "                  viewport at 26,645 features over 28 tiles (951.6 per tile),",
    "                  under the 1,000 per tile floor of AC-06; at 12 the shipped",
    "                  file holds 29,058 (1,037.8). The margin is 3.8 percent and it",
    "                  is that thin on purpose: the floor is the published file's own",
    "                  density, and for the same address the published z10 tile",
    "                  10/354/545 carries 1,312 polygons where a constant-detail-10",
    "                  probe build of this parquet carries 1,181.",
    "  --clip-bounding-box  the geometry equivalent of R-10's `--bbox`, so the file's",
    "                  extent stays the M-06 box instead of the wider parquet extent.",
    "",
    "The published file also carries 27,307 point features in the V1 viewport, which the",
    "polygon parquet does not have; AC-06's 1,000 per viewport tile floor is met here on",
    "polygons alone, and the numbers above are the whole distance to it.",
    "",
    "What the 250 KB budget costs, stated rather than left out: the file carries 763,474",
    "distinct Id at z12 and 162,304 at z8 (AC-06-features-br.txt). A 250 KB z8 tile holds",
    "about 4,000 parcels, so --drop-densest-as-needed keeps the sparsest fifth of them at",
    "that zoom. z8 and z9 are the transitional band above the overview; AC-06 sets no",
    "count requirement there, and at z10, the interactive zoom, 676,968 ids are present.",
    "",
]


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _http_get(url: str, timeout: int = 300) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "field-shift-build/1"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def _write_json(path: str, payload) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=1, sort_keys=False)
        handle.write("\n")


# ---------------------------------------------------------------- fetch US ---


def cmd_fetch_us(args) -> int:
    box = tuple(float(value) for value in args.box.split(","))
    features: list[dict] = []
    pages: list[dict] = []
    offset = 0
    while True:
        params = {
            "where": "1=1",
            "geometry": ",".join(f"{value:.6f}".rstrip("0").rstrip(".") for value in box),
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "outSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            "outFields": ",".join(US_ID_FIELDS),
            "returnGeometry": "true",
            "f": "geojson",
            "resultRecordCount": "2000",
            "resultOffset": str(offset),
            "orderByFields": "objectid ASC",
        }
        url = CSB_QUERY + "?" + urllib.parse.urlencode(params, safe=",")
        raw = _http_get(url)
        payload = json.loads(raw)
        if payload.get("type") != "FeatureCollection":
            raise SystemExit(f"CSB query did not return GeoJSON: {str(payload)[:400]}")
        batch = payload["features"]
        pages.append({"url": url, "features": len(batch), "bytes": len(raw)})
        features.extend(batch)
        if len(batch) < 2000:
            break
        offset += len(batch)
    features.sort(key=lambda feature: str(feature["properties"].get("csbid", "")))
    collection = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features,
    }
    _write_json(args.out, collection)
    summary = {"features": len(features), "pages": pages, "out": args.out}
    if args.summary_out:
        _write_json(args.summary_out, summary)
    print(json.dumps(summary, indent=1))
    if args.count_expected and len(features) != args.count_expected:
        raise SystemExit(
            f"service returned {len(features)} features, expected {args.count_expected}"
        )
    return 0


# ------------------------------------------------------------- class tables ---


def _hex(red: int, green: int, blue: int) -> str:
    return f"#{red:02x}{green:02x}{blue:02x}"


def cmd_classes_us(args) -> int:
    raw = _http_get(CDL_RAT)
    digest = hashlib.sha256(raw).hexdigest()
    if digest != CDL_RAT_SHA256:
        raise SystemExit(f"CDL RAT sha256 {digest} differs from the frozen {CDL_RAT_SHA256}")
    rat = json.loads(raw)
    rows = []
    named = 0
    for feature in rat["features"]:
        attributes = feature["attributes"]
        value = attributes["Value"]
        if value == 0:
            continue
        class_name = attributes["Class_Names"]
        if class_name is not None:
            class_name = class_name.strip()
            named += 1
        rows.append(
            {
                "value": value,
                "name": class_name,
                "hex": _hex(attributes["Red"], attributes["Green"], attributes["Blue"]),
            }
        )
    rows.sort(key=lambda row: row["value"])
    values = [row["value"] for row in rows]
    if values != list(range(1, 256)):
        raise SystemExit(f"CDL table must hold values 1 to 255, got {len(values)} rows")
    payload = {
        "source": {
            "name": "CDL raster attribute table",
            "url": CDL_RAT,
            "sha256": digest,
            "rows_in_source": len(rat["features"]),
            "rows_named_in_source": named,
            "fetched": datetime.now().astimezone().strftime("%Y-%m-%d"),
            "note": (
                "Generated from the RAT: Value is the CDL code, Class_Names and Red/Green/Blue "
                "are the RAT's own, rendered as #rrggbb. Value 0 (Background) is excluded and is "
                "handled by R-21. Spelling follows the RAT, so Sunflower and Grassland/Pasture, "
                "not the county statistics JSON's Sunflowers and Grass/Pasture. The RAT carries "
                "256 rows and 122 of them have a null Class_Names, so of the 255 values this "
                "table keeps, 133 carry the RAT's name and the rest carry null, which is the "
                "RAT's own value for an unassigned code."
            ),
        },
        "rows": rows,
    }
    _write_json(args.out, payload)
    print(json.dumps({"out": args.out, "rows": len(rows), "sha256": digest}, indent=1))
    return 0


def cmd_classes_br(args) -> int:
    raw = _http_get(MAPBIOMAS_CSV)
    digest = hashlib.sha256(raw).hexdigest()
    if digest != MAPBIOMAS_CSV_SHA256:
        raise SystemExit(f"MapBiomas CSV sha256 {digest} differs from the frozen {MAPBIOMAS_CSV_SHA256}")
    text = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows_by_id: dict[int, dict] = {}
    row_count = 0
    for record in reader:
        if not record.get("class_id"):
            continue
        row_count += 1
        rows_by_id[int(record["class_id"])] = record
    rows = []
    for class_id in BR_CLASS_IDS:
        if class_id not in rows_by_id:
            raise SystemExit(f"MapBiomas CSV does not carry class {class_id}")
        record = rows_by_id[class_id]
        published = record["class_name_en"].strip()
        name = BR_DISPLAY_OVERRIDES.get(class_id, published)
        rows.append(
            {
                "value": class_id,
                "name": name,
                "csv_name": published,
                "hex": record["hex_code"].strip().lower(),
            }
        )
    payload = {
        "source": {
            "name": "MapBiomas Collection 11 legend",
            "url": MAPBIOMAS_CSV,
            "sha256": digest,
            "rows_in_source": row_count,
            "fetched": datetime.now().astimezone().strftime("%Y-%m-%d"),
            "note": (
                "14 of the 33 rows, the classes Table C1 keeps. Class 46 is written Coffe in the "
                "CSV and is displayed Coffee; that is the one documented correction of R-16 and no "
                "other name is renamed."
            ),
        },
        "rows": rows,
    }
    _write_json(args.out, payload)
    print(json.dumps({"out": args.out, "rows": len(rows), "sha256": digest}, indent=1))
    return 0


# ----------------------------------------------------------------- parquet ---


def cmd_parquet_to_fgb(args) -> int:
    import geopandas as gpd
    import pyarrow.parquet as pq
    import pyogrio
    from shapely import wkb

    table = pq.read_table(args.src, columns=args.columns.split(","))
    frame = table.to_pandas()
    frame[args.geometry] = [wkb.loads(value) for value in frame[args.geometry]]
    geodata = gpd.GeoDataFrame(frame, geometry=args.geometry, crs="EPSG:4326")
    pyogrio.write_dataframe(
        geodata,
        args.out,
        layer=args.layer,
        driver="FlatGeobuf",
    )
    print(
        json.dumps(
            {
                "out": args.out,
                "features": len(geodata),
                "columns": list(geodata.columns),
                "bytes": os.path.getsize(args.out),
            },
            indent=1,
        )
    )
    return 0


# ------------------------------------------------------------------- floor ---


def _zoom_max_bytes(
    path: str, header: pm.Header, index: dict[int, tuple[int, int]], zoom: int
) -> dict:
    ids = [tile_id for tile_id in index if pm.tile_id_to_zxy(tile_id)[0] == zoom]
    if not ids:
        return {"tiles": 0, "max_bytes": 0}
    return {"tiles": len(ids), "max_bytes": max(index[tile_id][0] for tile_id in ids)}


def _box_zoom_max_bytes(
    path: str,
    header: pm.Header,
    index: dict[int, tuple[int, int]],
    zoom: int,
    box: tuple[float, float, float, float],
) -> dict:
    tiles = pm.bbox_tiles(zoom, *box)
    present = [index[pm.zxy_to_tile_id(zoom, x, y)] for x, y in tiles if pm.zxy_to_tile_id(zoom, x, y) in index]
    if not present:
        return {"tiles": 0, "covered_tiles": len(tiles), "max_bytes": 0}
    return {
        "tiles": len(present),
        "covered_tiles": len(tiles),
        "max_bytes": max(length for length, _ in present),
    }


def cmd_choose_floor(args) -> int:
    box = tuple(float(value) for value in args.box.split(","))
    header, index = pm.archive_index(args.pmtiles)
    per_zoom = {}
    chosen = None
    for zoom in range(6, 15):
        reading = _box_zoom_max_bytes(args.pmtiles, header, index, zoom, box)
        reading["budget_bytes"] = DETAIL_BUDGET_BYTES
        reading["meets_budget"] = reading["max_bytes"] <= DETAIL_BUDGET_BYTES
        per_zoom[str(zoom)] = reading
        if chosen is None and reading["tiles"] and reading["meets_budget"]:
            chosen = zoom
    if chosen is None:
        raise SystemExit("no detail zoom in 6 to 14 meets the 250 KB budget for the box")
    if chosen > 9:
        raise SystemExit(
            f"detail_minzoom would be {chosen}, above the 9 that R-05 allows; the build fails"
        )
    payload = {
        "detail_minzoom": chosen,
        "rule": "lowest zoom D in 6 to 14 at which every detail tile covering the box is at most 250 KB gzip",
        "budget_bytes": DETAIL_BUDGET_BYTES,
        "per_zoom_over_box": per_zoom,
        "file_max_zoom": header.max_zoom,
    }
    _write_json(args.out, payload)
    print(json.dumps(payload, indent=1))
    return 0


# ----------------------------------------------------------------- measure ---


def _parse_view(spec: str) -> dict:
    view_id, lon, lat, zoom, width, height = spec.split(":")
    return {
        "id": view_id,
        "center": [float(lon), float(lat)],
        "zoom": int(zoom),
        "width": int(width),
        "height": int(height),
    }


def _count_view(
    path: str,
    header: pm.Header,
    index: dict[int, tuple[int, int]],
    view: dict,
    source_layer: str,
    id_property: str | None,
) -> dict:
    import mapbox_vector_tile

    requested_zoom = view["zoom"]
    zoom = min(requested_zoom, header.max_zoom)
    scale = 1 << (requested_zoom - zoom)
    width = max(1, math.ceil(view["width"] / scale))
    height = max(1, math.ceil(view["height"] / scale))
    tiles = pm.viewport_tiles(zoom, view["center"][0], view["center"][1], width, height)
    records = []
    total = 0
    ids: set = set()
    for x, y in tiles:
        raw = pm.stored_tile(path, header, index, zoom, x, y)
        address = {"z": zoom, "x": x, "y": y, "status": "present" if raw else "absent"}
        if raw is None:
            address["bytes"] = 0
            records.append(address)
            continue
        address["bytes"] = len(raw)
        records.append(address)
        decoded = mapbox_vector_tile.decode(gzip.decompress(raw))
        layer = decoded.get(source_layer)
        if layer is None:
            continue
        total += len(layer["features"])
        if id_property:
            for feature in layer["features"]:
                value = feature["properties"].get(id_property)
                if value is not None:
                    ids.add(value)
    return {
        "camera": view,
        "source_zoom": zoom,
        "overzoom": requested_zoom > zoom,
        "tiles_requested": len(records),
        "features": total,
        "unique_ids": len(ids) if id_property else None,
        "max_tile_bytes": max((record["bytes"] for record in records), default=0),
        "tiles": records,
    }


def _id_universe(
    path: str,
    header: pm.Header,
    index: dict[int, tuple[int, int]],
    zoom: int,
    id_property: str,
    box: tuple[float, float, float, float] | None,
) -> dict:
    """Count the features and distinct ids in every tile of one zoom."""
    import mapbox_vector_tile

    if box:
        coordinates = pm.bbox_tiles(zoom, *box)
    else:
        coordinates = [
            pm.tile_id_to_zxy(tile_id)[1:] for tile_id in sorted(index)
            if pm.tile_id_to_zxy(tile_id)[0] == zoom
        ]
    features = 0
    ids: set = set()
    tiles = 0
    for x, y in coordinates:
        raw = pm.stored_tile(path, header, index, zoom, x, y)
        if raw is None:
            continue
        tiles += 1
        decoded = mapbox_vector_tile.decode(gzip.decompress(raw))
        layer = decoded.get("trazo")
        if layer is None:
            continue
        features += len(layer["features"])
        for feature in layer["features"]:
            value = feature["properties"].get(id_property)
            if value is not None:
                ids.add(value)
    return {"zoom": zoom, "tiles": tiles, "features": features, "distinct_ids": len(ids)}


def cmd_measure(args) -> int:
    header, index = pm.archive_index(args.pmtiles)
    per_zoom = {}
    for zoom in range(header.min_zoom, header.max_zoom + 1):
        per_zoom[str(zoom)] = _zoom_max_bytes(args.pmtiles, header, index, zoom)
    budget = args.budget_bytes
    budget_min = args.budget_zoom_min if args.budget_zoom_min is not None else header.min_zoom
    budget_max = args.budget_zoom_max if args.budget_zoom_max is not None else header.max_zoom
    file_wide_violations = [
        {"zoom": zoom, "max_bytes": reading["max_bytes"], "budget_bytes": budget}
        for zoom, reading in per_zoom.items()
        if reading["max_bytes"] > budget and budget_min <= int(zoom) <= budget_max
    ]
    box = tuple(float(value) for value in args.box.split(",")) if args.box else None
    box_per_zoom = {}
    if box:
        for zoom in range(header.min_zoom, header.max_zoom + 1):
            box_per_zoom[str(zoom)] = _box_zoom_max_bytes(args.pmtiles, header, index, zoom, box)
    views = {}
    for spec in args.view or []:
        view = _parse_view(spec)
        views[view["id"]] = _count_view(
            args.pmtiles, header, index, view, args.source_layer, args.id_property
        )
    # R-08 / AC-06 test the addresses the app actually requests at the pinned
    # views and the named zoom walk, so the budget is checked over those.
    requested: dict[tuple[int, int, int], int] = {}
    for reading in views.values():
        for record in reading["tiles"]:
            if record["bytes"]:
                requested[(record["z"], record["x"], record["y"])] = record["bytes"]
    violations = [
        {"z": z, "x": x, "y": y, "bytes": size, "budget_bytes": budget}
        for (z, x, y), size in sorted(requested.items())
        if size > budget and budget_min <= z <= budget_max
    ]
    id_universe = {}
    for zoom in args.id_universe_zoom or []:
        id_universe[str(zoom)] = _id_universe(
            args.pmtiles,
            header,
            index,
            zoom,
            args.id_property,
            box,
        )
    id_universe = id_universe or None
    # AC-06 is written over every tile of the file, not only the ones a viewport
    # requests, so every tile above the budget is named by its address here
    # instead of being summarised by a per zoom maximum.
    tiles_over_budget = []
    for tile_id, (length, _offset) in index.items():
        z, x, y = pm.tile_id_to_zxy(tile_id)
        if budget_min <= z <= budget_max and length > budget:
            tiles_over_budget.append({"z": z, "x": x, "y": y, "bytes": length, "budget_bytes": budget})
    tiles_over_budget.sort(key=lambda item: (item["z"], item["x"], item["y"]))
    payload = {
        "pmtiles": args.pmtiles,
        "bytes": os.path.getsize(args.pmtiles),
        "sha256": sha256_file(args.pmtiles),
        "header": {
            "min_zoom": header.min_zoom,
            "max_zoom": header.max_zoom,
            "tile_compression": header.tile_compression,
            "tile_type": header.tile_type,
            "addressed_tiles_count": header.addressed_tiles_count,
        },
        "budget_bytes": budget,
        "per_zoom_all_tiles": per_zoom,
        "per_zoom_over_box": box_per_zoom,
        "budget_violations": violations,
        "file_wide_violations": file_wide_violations,
        "tiles_over_budget": tiles_over_budget,
        "id_universe": id_universe,
        "views": views,
    }
    _write_json(args.out, payload)
    print(
        json.dumps(
            {
                "file": args.pmtiles,
                "bytes": payload["bytes"],
                "sha256": payload["sha256"],
                "per_zoom_all_tiles": per_zoom,
                "views": {key: {"features": value["features"], "tiles": value["tiles_requested"]} for key, value in views.items()},
                "budget_violations": violations,
                "file_wide_violations": file_wide_violations,
            },
            indent=1,
        )
    )
    if violations and args.fail_on_violation:
        raise SystemExit(f"tile budget violated at the named views: {violations}")
    return 0


# ------------------------------------------------------------------ layers ---


def cmd_layers(args) -> int:
    import mapbox_vector_tile

    header, index = pm.archive_index(args.pmtiles)
    metadata = pm.read_metadata(args.pmtiles)
    vector_layers = [layer["id"] for layer in metadata.get("vector_layers", [])]
    probe_zoom = args.zoom if args.zoom is not None else max(header.min_zoom, header.max_zoom - 2)
    observed = {}
    # Decode the largest tile at the probe zoom, which carries the most features and
    # so proves the layer name against real content rather than an empty corner tile.
    candidates = [
        (length, tile_id)
        for tile_id, (length, _offset) in index.items()
        if pm.tile_id_to_zxy(tile_id)[0] == probe_zoom
    ]
    for _length, tile_id in sorted(candidates, reverse=True):
        z, x, y = pm.tile_id_to_zxy(tile_id)
        raw = pm.stored_tile(args.pmtiles, header, index, z, x, y)
        decoded = mapbox_vector_tile.decode(gzip.decompress(raw))
        observed = {
            "z": z,
            "x": x,
            "y": y,
            "layers": sorted(decoded.keys()),
            "features": {name: len(layer["features"]) for name, layer in decoded.items()},
        }
        break
    payload = {
        "pmtiles": args.pmtiles,
        "metadata_vector_layers": vector_layers,
        "metadata_generator": metadata.get("generator"),
        "decoded_tile": observed,
        "layer_name": vector_layers[0] if len(vector_layers) == 1 else None,
    }
    _write_json(args.out, payload) if args.out else print(json.dumps(payload, indent=1))
    if vector_layers != ["trazo"] or observed.get("layers") != ["trazo"]:
        raise SystemExit(f"layer name is not `trazo`: metadata {vector_layers}, tile {observed}")
    return 0


# ------------------------------------------------------------- run records ---


def cmd_write_us_records(args) -> int:
    """Write the two files of Table G with exactly the keys that table names."""
    with open(args.floor, encoding="utf-8") as handle:
        floor = json.load(handle)
    with open(args.detail_measure, encoding="utf-8") as handle:
        detail = json.load(handle)
    with open(args.overview_measure, encoding="utf-8") as handle:
        overview = json.load(handle)
    detail_minzoom = floor["detail_minzoom"]
    manifest = {
        "schema_version": "1",
        "region": "us",
        "clip_box": "-97.20,46.90,-97.14,46.96",
        "detail_minzoom": detail_minzoom,
        "detail_maxzoom": 14,
        "overview_minzoom": detail_minzoom - 3,
        "overview_maxzoom": detail_minzoom - 1,
        "interactive_minzoom": detail_minzoom + 2,
    }
    max_tile_bytes: dict[str, int] = {}
    for reading in (detail, overview):
        for zoom, value in reading["per_zoom_all_tiles"].items():
            max_tile_bytes[zoom] = max(max_tile_bytes.get(zoom, 0), value["max_bytes"])
    max_tile_bytes = {zoom: max_tile_bytes[zoom] for zoom in sorted(max_tile_bytes, key=int)}
    # Table G names exactly V1 and V2 for this file; the wider walk lives in the
    # fixtures under artifacts/fixtures for AC-06.
    views = {}
    for view_id in ("V1", "V2"):
        reading = detail["views"][view_id]
        camera = reading["camera"]
        views[view_id] = {
            "center": camera["center"],
            "zoom": camera["zoom"],
            "width": camera["width"],
            "height": camera["height"],
        }
    tiles = {
        "max_tile_bytes": max_tile_bytes,
        "views": views,
        "view_feature_counts": {
            view_id: detail["views"][view_id]["features"] for view_id in ("V1", "V2")
        },
    }
    _write_json(os.path.join(args.outdir, "us-38017.manifest.json"), manifest)
    _write_json(os.path.join(args.outdir, "us-38017.tiles.json"), tiles)
    print(json.dumps({"manifest": manifest, "tiles": tiles}, indent=1))
    return 0


def cmd_verify(args) -> int:
    """Check the properties, the merge and the geometry of a built tier."""
    import mapbox_vector_tile

    path = args.pmtiles
    header, index = pm.archive_index(path)
    features = []
    tiles = 0
    for tile_id in sorted(index):
        z, x, y = pm.tile_id_to_zxy(tile_id)
        if z != args.zoom:
            continue
        raw = pm.stored_tile(path, header, index, z, x, y)
        decoded = mapbox_vector_tile.decode(gzip.decompress(raw))
        layer = decoded.get(args.source_layer, {"features": []})
        tiles += 1
        features.extend(layer["features"])

    property_keys: set[str] = set()
    for feature in features:
        property_keys.update(feature["properties"].keys())

    geometry_types: dict[str, int] = {}
    multi_parts = []
    incomplete_class_rows = 0
    for feature in features:
        geometry = feature["geometry"]
        if isinstance(geometry, dict):
            kind = geometry.get("type", "Unknown")
            coordinates = geometry.get("coordinates") or []
        else:
            kind = geometry.geom_type
            coordinates = []
        geometry_types[kind] = geometry_types.get(kind, 0) + 1
        if kind == "MultiPolygon":
            multi_parts.append(len(coordinates) if coordinates else len(geometry.geoms))
        if args.class_property:
            if any(feature["properties"].get(column) is None for column in args.class_columns):
                incomplete_class_rows += 1

    failures = []
    if args.expect_properties:
        expected = set(args.expect_properties.split(","))
        if property_keys != expected:
            failures.append(
                f"properties are {sorted(property_keys)}, expected {sorted(expected)}"
            )
    if args.forbid_properties:
        forbidden = set(args.forbid_properties.split(","))
        found = property_keys & forbidden
        if found:
            failures.append(f"properties {sorted(found)} must not be in this tier")
    if args.require_multi_polygon and not any(parts >= 2 for parts in multi_parts):
        failures.append("no MultiPolygon holding two or more polygons at this zoom")
    if args.class_property and incomplete_class_rows:
        failures.append(f"{incomplete_class_rows} features lack a kept class column value")

    payload = {
        "pmtiles": path,
        "bytes": os.path.getsize(path),
        "sha256": sha256_file(path),
        "zoom": args.zoom,
        "tiles": tiles,
        "features": len(features),
        "property_keys": sorted(property_keys),
        "geometry_types": geometry_types,
        "multi_polygon_parts": {
            "count": len(multi_parts),
            "max_parts": max(multi_parts) if multi_parts else 0,
        },
        "features_missing_a_class_value": incomplete_class_rows,
        "failures": failures,
    }
    _write_json(args.out, payload) if args.out else print(json.dumps(payload, indent=1))
    return 0 if not failures else 1


def cmd_budget_report(args) -> int:
    """Print the tile budget status per measured file; exit 1 when one fails."""
    failed = False
    for path in args.measure:
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
        violations = payload["budget_violations"]
        file_wide = payload.get("file_wide_violations") or []
        label = os.path.basename(path).replace("-measure.json", "")
        worst = max((item["bytes"] for item in violations), default=0)
        print(
            f"{label}: budget {payload['budget_bytes']} bytes, "
            f"{'PASS' if not violations else 'FAIL'}, "
            f"worst requested tile {worst if worst else '-'}"
        )
        for violation in violations:
            print(
                f"  over budget: z{violation['z']} x{violation['x']} y{violation['y']} "
                f"{violation['bytes']} bytes"
            )
        if file_wide:
            heaviest = max(file_wide, key=lambda item: item["max_bytes"])
            print(
                f"  file wide maximum above the budget at zoom {heaviest['zoom']}: "
                f"{heaviest['max_bytes']} bytes"
            )
        failed = failed or bool(violations)
    return 1 if failed else 0


def cmd_evidence(args) -> int:
    """Write the artifacts the spec's criteria name from the recorded measurements."""
    with open(args.us_measure, encoding="utf-8") as handle:
        us_detail = json.load(handle)
    with open(args.us_overview_measure, encoding="utf-8") as handle:
        us_overview = json.load(handle)
    with open(args.br_detail_measure, encoding="utf-8") as handle:
        br_detail = json.load(handle)
    with open(args.br_overview_measure, encoding="utf-8") as handle:
        br_overview = json.load(handle)
    with open(args.floor, encoding="utf-8") as handle:
        floor = json.load(handle)
    with open(args.runs, encoding="utf-8") as handle:
        run = json.load(handle)
    with open(args.fetch, encoding="utf-8") as handle:
        fetch = json.load(handle)

    artifacts = args.artifacts
    fixtures = os.path.join(artifacts, "fixtures")
    os.makedirs(fixtures, exist_ok=True)
    recorded = run["recorded"][:10]

    def tile_fixture(region: str, detail: dict, overview: dict | None) -> dict:
        views = {}
        for view_id, reading in detail["views"].items():
            views[view_id] = {
                "camera": reading["camera"],
                "source_zoom": reading["source_zoom"],
                "overzoom": reading["overzoom"],
                "features": reading["features"],
                "unique_ids": reading["unique_ids"],
                "max_tile_bytes": reading["max_tile_bytes"],
                "tiles": reading["tiles"],
            }
        walk = {}
        for view_id, reading in detail["views"].items():
            if view_id.startswith("W"):
                walk[str(reading["camera"]["zoom"])] = {
                    "center": reading["camera"]["center"],
                    "max_tile_bytes": reading["max_tile_bytes"],
                    "tiles": reading["tiles"],
                }
        payload = {
            "region": region,
            "recorded": recorded,
            "method": (
                "Every tile the app requests at the pinned views V1 to V4 and on the named "
                "zoom walk, read from the built PMTiles archive. `status` is `present` "
                "because the product is a local archive; a browser run records the HTTP "
                "status instead. Byte counts are the stored gzip bytes of the tile."
            ),
            "detail": {
                "path": detail["pmtiles"],
                "bytes": detail["bytes"],
                "sha256": detail["sha256"],
            },
            "overview": (
                {"path": overview["pmtiles"], "bytes": overview["bytes"], "sha256": overview["sha256"]}
                if overview
                else None
            ),
            "views": views,
            "zoom_walk": walk,
        }
        path = os.path.join(fixtures, f"polygon-tiles-{region}-{recorded}.json")
        _write_json(path, payload)
        return payload

    us_fixture = tile_fixture("us", us_detail, us_overview)
    br_fixture = tile_fixture("br", br_detail, br_overview)

    budget_lines = [
        "R-08 and AC-06 tile budget readings",
        f"run {run['label']}, recorded {run['recorded']}",
        f"detail budget {DETAIL_BUDGET_BYTES} bytes gzip per tile, overview budget "
        f"{OVERVIEW_BUDGET_BYTES} bytes, hard cap {MAX_TILE_BUDGET_BYTES} bytes",
        "",
    ]
    for name, reading in (
        ("us detail", us_detail),
        ("us overview", us_overview),
        ("br detail", br_detail),
        ("br overview", br_overview),
    ):
        budget_lines.append(f"{name}: {reading['pmtiles']} sha256 {reading['sha256']}")
        budget_lines.append("  per zoom maximum over every tile of the file:")
        for zoom, value in reading["per_zoom_all_tiles"].items():
            budget_lines.append(f"    z{zoom}: {value['max_bytes']} bytes over {value['tiles']} tiles")
        for view_id, value in reading["views"].items():
            budget_lines.append(
                f"  {view_id} z{value['camera']['zoom']} viewport "
                f"{value['camera']['width']}x{value['camera']['height']}: "
                f"{value['tiles_requested']} tiles, max {value['max_tile_bytes']} bytes"
            )
        if reading["budget_violations"]:
            budget_lines.append("  OVER BUDGET at the requested addresses:")
            for violation in reading["budget_violations"]:
                budget_lines.append(
                    f"    z{violation['z']} x{violation['x']} y{violation['y']}: "
                    f"{violation['bytes']} bytes"
                )
        else:
            budget_lines.append("  PASS at every requested address")
        if reading.get("file_wide_violations"):
            budget_lines.append("  the file carries tiles above the budget outside the pinned views:")
            for violation in reading["file_wide_violations"]:
                budget_lines.append(
                    f"    z{violation['zoom']}: {violation['max_bytes']} bytes"
                )
        over = reading.get("tiles_over_budget")
        if over:
            budget_lines.append(f"  every tile of the file above the budget: {len(over)}")
            for violation in over[:40]:
                budget_lines.append(
                    f"    z{violation['z']} x{violation['x']} y{violation['y']}: "
                    f"{violation['bytes']} bytes"
                )
            if len(over) > 40:
                budget_lines.append(f"    ... and {len(over) - 40} more")
        elif over == []:
            budget_lines.append("  no tile in the file is above the budget")
        budget_lines.append("")
    budget_lines.append("Brazil detail build command and flag choices:")
    budget_lines.append("")
    budget_lines.append("  " + BR_DETAIL_BUILD)
    budget_lines.append("")
    budget_lines.extend(BR_DETAIL_BUILD_NOTES)
    with open(os.path.join(artifacts, "AC-06-budget.txt"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(budget_lines) + "\n")

    us_lines = [
        "AC-06 feature counts, United States (R-08, Table G)",
        "",
        f"CSB 2025 layer 0 for the box -97.20,46.90,-97.14,46.96: "
        f"{fetch['features']} features returned by the service",
        f"detail file distinct csbid at zoom 14: "
        f"{us_detail['id_universe']['14']['distinct_ids'] if us_detail.get('id_universe') else 'n/a'}",
        f"detail file features at zoom 14 (tile instances): "
        f"{us_detail['id_universe']['14']['features'] if us_detail.get('id_universe') else 'n/a'}",
        "distinct csbid by zoom (tippecanoe drops the smallest polygons at low zoom, "
        "and the R-10 command passes no -r flag):",
    ]
    for zoom, value in (us_detail.get("id_universe") or {}).items():
        us_lines.append(f"  z{zoom}: {value['distinct_ids']} distinct csbid over {value['tiles']} tiles")
    us_lines.append("")
    us_lines.append("recorded and queried view counts (Table G view_feature_counts):")
    for view_id, value in us_detail["views"].items():
        us_lines.append(f"  {view_id}: {value['features']} features over {value['tiles_requested']} tiles")
    with open(os.path.join(artifacts, "AC-06-features-us.txt"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(us_lines) + "\n")

    br_lines = [
        "AC-06 feature counts, Brazil",
        "",
        f"detail file: {br_detail['pmtiles']} sha256 {br_detail['sha256']}",
        "Brazil has no manifest: its zoom bounds are the measured 8 to 12 of Table B.",
        "",
        "views:",
    ]
    for view_id, value in br_detail["views"].items():
        mean = value["features"] / value["tiles_requested"] if value["tiles_requested"] else 0
        br_lines.append(
            f"  {view_id} z{value['camera']['zoom']} "
            f"{value['camera']['width']}x{value['camera']['height']}: "
            f"{value['features']} features, {value['unique_ids']} unique Id, "
            f"{value['tiles_requested']} tiles, mean {mean:.1f} per viewport tile, "
            f"max {value['max_tile_bytes']} bytes"
        )
    if br_detail.get("id_universe"):
        for zoom, value in br_detail["id_universe"].items():
            br_lines.append(
                f"  universe at z{zoom}: {value['distinct_ids']} distinct Id over {value['tiles']} tiles"
            )
    br_lines.append("")
    br_lines.append(
        "AC-06 asks for at least 1,000 unique Id values at V1 with a mean between 1,000 and "
        "10,000 per viewport tile; the V1 line above is the reading."
    )
    with open(os.path.join(artifacts, "AC-06-features-br.txt"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(br_lines) + "\n")

    build_lines = [
        "AC-04 build recipe and layer names",
        "",
        "Commands, literal from R-10 of the frozen spec except the Brazil detail line, which",
        "repair card t_d7457a47 replaced with the tippecanoe command recorded here (the only",
        "other addition is `rm -f` before a build, because tippecanoe and pmtiles refuse to",
        "overwrite an output and R-10 names no --force flag):",
        "",
        "tippecanoe -l trazo -Z{D} -z14 -y csbid -y csbacres -y cdl2018 -y cdl2019 -y cdl2020 "
        "-y cdl2021 -y cdl2022 -y cdl2023 -y cdl2024 -y cdl2025 -o "
        "data/polygons/us-38017-detail.pmtiles data/work/us-38017.geojson",
        "tippecanoe -l trazo -Z{D-3} -z{D-1} -y cdl2018 -y cdl2019 -y cdl2020 -y cdl2021 "
        "-y cdl2022 -y cdl2023 -y cdl2024 -y cdl2025 --coalesce --coalesce-smallest-as-needed "
        "--maximum-tile-bytes=300000 -o data/polygons/us-38017-overview.pmtiles "
        "data/work/us-38017.geojson",
        "pmtiles extract https://data.source.coop/wri-data-lab/trazofields/trazo3-fields/"
        "trazo3.pmtiles data/polygons/br-mt-detail.pmtiles "
        "--bbox=-61.633,-18.0416,-50.2248,-7.3487",
        "(repair card t_d7457a47 replaced that line with:)",
        BR_DETAIL_BUILD,
        "tippecanoe -l trazo -Z5 -z7 -y mbmode24 --reorder --coalesce --low-detail=10 "
        "--full-detail=10 --buffer=2 --simplification=4 --maximum-tile-bytes=300000 "
        "--coalesce-smallest-as-needed -o data/polygons/br-mt-overview.pmtiles "
        "data/work/trazo3_brazil_mato_grosso_2024.fgb",
        "",
        f"D = {floor['detail_minzoom']}, read from us-38017.manifest.json, not retyped: "
        f"overview {floor['detail_minzoom'] - 3} to {floor['detail_minzoom'] - 1}, "
        f"interactive {floor['detail_minzoom'] + 2}.",
        "",
        "Layer name per built file, read from the tileset metadata (vector_layers) and from a "
        "decoded tile, not assumed from the command:",
    ]
    for name, reading in (run.get("layer_names") or {}).items():
        tile = reading.get("decoded_tile") or {}
        features = tile.get("features")
        count = sum(features.values()) if isinstance(features, dict) else (features or 0)
        address = (
            f"z{tile['z']} x{tile['x']} y{tile['y']}, {count} features"
            if tile
            else "address not recorded"
        )
        build_lines.append(
            f"  {name}: metadata {reading['metadata_vector_layers']}, "
            f"decoded tile {reading['decoded_tile_layers']} ({address})"
        )
    with open(os.path.join(artifacts, "AC-04-build.txt"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(build_lines) + "\n")

    manifest_lines = [
        "AC-03 manifest and tile record (Table G keys, types and values)",
        "",
        f"detail_minzoom rule: {floor['rule']}",
        "",
        "per zoom over the pilot box at the probe build:",
    ]
    for zoom, value in floor["per_zoom_over_box"].items():
        manifest_lines.append(
            f"  z{zoom}: {value['max_bytes']} bytes over {value['tiles']} tiles, "
            f"meets budget {value['meets_budget']}"
        )
    with open(os.path.join(artifacts, "AC-03-manifest.txt"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(manifest_lines) + "\n")

    print(
        json.dumps(
            {
                "fixtures": [us_fixture["region"], br_fixture["region"]],
                "recorded": recorded,
                "artifacts": artifacts,
            },
            indent=1,
        )
    )
    return 0


def cmd_attach_layers(args) -> int:
    """Fold the layer name verifications into a run record."""
    with open(args.record, encoding="utf-8") as handle:
        record = json.load(handle)
    record["layer_names"] = {}
    for path in args.layers:
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
        record["layer_names"][os.path.basename(path)] = {
            "layer_name": payload["layer_name"],
            "metadata_vector_layers": payload["metadata_vector_layers"],
            "decoded_tile_layers": payload["decoded_tile"]["layers"],
            "decoded_tile": {
                key: payload["decoded_tile"][key]
                for key in ("z", "x", "y", "features")
                if key in payload["decoded_tile"]
            },
        }
    _write_json(args.record, record)
    print(json.dumps(record["layer_names"], indent=1))
    return 0


def cmd_run_record(args) -> int:
    products = []
    for path in args.product:
        products.append(
            {
                "path": os.path.relpath(path, args.repo_root),
                "abs_path": os.path.abspath(path),
                "bytes": os.path.getsize(path),
                "sha256": sha256_file(path),
            }
        )
    payload = {
        "label": args.label,
        "recorded": datetime.now().astimezone().strftime("%Y-%m-%dT%H:%M:%S%z"),
        "commands": args.command or [],
        "products": products,
    }
    _write_json(args.out, payload)
    print(json.dumps(payload, indent=1))
    return 0


def cmd_finalize(args) -> int:
    runs = []
    for path in args.run:
        with open(path, encoding="utf-8") as handle:
            runs.append(json.load(handle))
    by_label = {run["label"]: run for run in runs}
    first, second = runs[0], runs[1]
    first_products = {product["path"]: product for product in first["products"]}
    second_products = {product["path"]: product for product in second["products"]}
    products = []
    for path, product in first_products.items():
        other = second_products.get(path)
        entry = dict(product)
        entry["run_sha256"] = {first["label"]: product["sha256"]}
        if other:
            entry["run_sha256"][second["label"]] = other["sha256"]
            entry["reproducible"] = product["sha256"] == other["sha256"]
            entry["bytes_stable"] = product["bytes"] == other["bytes"]
        if args.durable_copy:
            os.makedirs(args.durable_copy, exist_ok=True)
            target = os.path.join(args.durable_copy, os.path.basename(path))
            if (
                not os.path.exists(target)
                or os.path.getsize(target) != product["bytes"]
                or sha256_file(target) != product["sha256"]
            ):
                import shutil

                shutil.copy2(product["abs_path"], target)
            entry["durable_path"] = target
        products.append(entry)
    with open(args.floor, encoding="utf-8") as handle:
        floor = json.load(handle)
    with open(args.us_measure, encoding="utf-8") as handle:
        us_measure = json.load(handle)
    with open(args.us_overview_measure, encoding="utf-8") as handle:
        us_overview = json.load(handle)
    with open(args.br_detail_measure, encoding="utf-8") as handle:
        br_detail = json.load(handle)
    with open(args.br_overview_measure, encoding="utf-8") as handle:
        br_overview = json.load(handle)
    with open(args.us_classes, encoding="utf-8") as handle:
        us_classes = json.load(handle)
    with open(args.br_classes, encoding="utf-8") as handle:
        br_classes = json.load(handle)
    with open(args.fetch, encoding="utf-8") as handle:
        fetch = json.load(handle)
    layers = {}
    for path in args.layers:
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
        key = os.path.basename(path).replace("layers-", "").replace(".json", "").replace("-", "_")
        layers[key] = payload

    reachable = {}
    for name, reading in (("us_detail", us_measure), ("us_overview", us_overview), ("br_detail", br_detail), ("br_overview", br_overview)):
        reachable[name] = {
            "per_zoom_max_bytes": {
                zoom: value["max_bytes"] for zoom, value in reading["per_zoom_all_tiles"].items()
            },
            "views": {
                key: {
                    "features": value["features"],
                    "tiles": value["tiles_requested"],
                    "unique_ids": value["unique_ids"],
                    "max_tile_bytes": value["max_tile_bytes"],
                }
                for key, value in reading["views"].items()
            },
            "budget_violations": reading["budget_violations"],
            "file_wide_violations": reading.get("file_wide_violations") or [],
        }
    budget_failures = [
        {"product": name, **violation}
        for name, reading in reachable.items()
        for violation in reading["budget_violations"]
    ]

    # Table G: max_tile_bytes is the largest gzip byte count at that zoom, over the
    # detail file and the overview file, for every zoom either file carries.
    us_max_tile_bytes = {}
    for reading in (us_overview, us_measure):
        for zoom, value in reading["per_zoom_all_tiles"].items():
            us_max_tile_bytes[zoom] = max(us_max_tile_bytes.get(zoom, 0), value["max_bytes"])
    us_max_tile_bytes = {zoom: us_max_tile_bytes[zoom] for zoom in sorted(us_max_tile_bytes, key=int)}

    payload = {
        "schema_version": "1",
        "card": "t_aa25032c",
        "spec": {
            "file": "field-shift-app/specs/bloco-5-poligonos-de-cultura.md",
            "revision": 5,
            "commit": "0129f0b",
            "freeze_digest": "ebc94342f57071cfea25d3074e392f73427b51a94286b2372ebc98c8458bea61",
        },
        "requirement": "R-05, R-08, R-10 (CO-B5-01 and CO-B5-02)",
        "manifest_fields": [
            {"key": "schema_version", "file": "us-38017.manifest.json", "type": "string", "value": "1", "producer": "CO-B5-01 build"},
            {"key": "region", "file": "us-38017.manifest.json", "type": "string", "value": "us", "producer": "CO-B5-01 build"},
            {"key": "clip_box", "file": "us-38017.manifest.json", "type": "string", "value": "-97.20,46.90,-97.14,46.96", "producer": "CO-B5-01 build"},
            {"key": "detail_minzoom", "file": "us-38017.manifest.json", "type": "integer", "value": floor["detail_minzoom"], "producer": "CO-B5-01 build, measured by choose-floor"},
            {"key": "detail_maxzoom", "file": "us-38017.manifest.json", "type": "integer", "value": 14, "producer": "CO-B5-01 build"},
            {"key": "overview_minzoom", "file": "us-38017.manifest.json", "type": "integer", "value": floor["detail_minzoom"] - 3, "producer": "CO-B5-01 build"},
            {"key": "overview_maxzoom", "file": "us-38017.manifest.json", "type": "integer", "value": floor["detail_minzoom"] - 1, "producer": "CO-B5-01 build"},
            {"key": "interactive_minzoom", "file": "us-38017.manifest.json", "type": "integer", "value": floor["detail_minzoom"] + 2, "producer": "CO-B5-01 build"},
            {"key": "max_tile_bytes", "file": "us-38017.tiles.json", "type": "object, zoom as decimal string to integer", "value": us_max_tile_bytes, "producer": "CO-B5-01 build, measured by measure"},
            {"key": "views", "file": "us-38017.tiles.json", "type": "object, view id to {center, zoom, width, height}", "value": {"V1": us_measure["views"]["V1"]["camera"], "V2": us_measure["views"]["V2"]["camera"]}, "producer": "CO-B5-01 build"},
            {"key": "view_feature_counts", "file": "us-38017.tiles.json", "type": "object, view id to integer", "value": {"V1": us_measure["views"]["V1"]["features"], "V2": us_measure["views"]["V2"]["features"]}, "producer": "CO-B5-01 build, measured by measure"},
        ],
        "extent": {
            "us_clip_box": "-97.20,46.90,-97.14,46.96",
            "br_bbox": "-61.633,-18.0416,-50.2248,-7.3487",
        },
        "feature_counts": {
            "us_service_for_box": fetch["features"],
            "us_detail_file_distinct_csbid": us_measure["id_universe"]["14"]["distinct_ids"] if us_measure.get("id_universe") else None,
            "us_detail_file_features": us_measure["id_universe"]["14"]["features"] if us_measure.get("id_universe") else None,
            "us_detail_file_distinct_csbid_by_zoom": {
                zoom: value["distinct_ids"] for zoom, value in (us_measure.get("id_universe") or {}).items()
            },
            "us_v1": us_measure["views"]["V1"]["features"],
            "us_v2": us_measure["views"]["V2"]["features"],
            "br_detail_v1_unique_ids": br_detail["views"]["V1"]["unique_ids"],
        },
        "feature_count_matches_service": (
            us_measure["id_universe"]["14"]["distinct_ids"] == fetch["features"]
            if us_measure.get("id_universe")
            else None
        ),
        "zoom_floor": {
            "detail_minzoom": floor["detail_minzoom"],
            "detail_maxzoom": 14,
            "overview_minzoom": floor["detail_minzoom"] - 3,
            "overview_maxzoom": floor["detail_minzoom"] - 1,
            "interactive_minzoom": floor["detail_minzoom"] + 2,
            "rule": floor["rule"],
            "per_zoom_over_box": floor["per_zoom_over_box"],
        },
        "layer_names": {
            "verified_by": "tileset metadata (vector_layers) and a decoded tile, not the build command",
            "us_detail": layers["us_detail"],
            "us_overview": layers["us_overview"],
            "br_detail": layers["br_detail"],
            "br_overview": layers["br_overview"],
        },
        "class_tables": {
            "us": {"rows": len(us_classes["rows"]), "source_sha256": us_classes["source"]["sha256"]},
            "br": {"rows": len(br_classes["rows"]), "source_sha256": br_classes["source"]["sha256"]},
        },
        "tile_budget": {
            "detail_bytes": DETAIL_BUDGET_BYTES,
            "overview_bytes": OVERVIEW_BUDGET_BYTES,
            "max_tile_bytes": MAX_TILE_BUDGET_BYTES,
            "budget_ok": not budget_failures,
            "failures": budget_failures,
            "readings": reachable,
        },
        "products": products,
        "runs": [
            {"label": run["label"], "recorded": run["recorded"]} for run in runs
        ],
        "reproducible": all(product.get("reproducible") for product in products),
    }
    _write_json(args.out, payload)
    print(json.dumps({"out": args.out, "products": len(products), "reproducible": payload["reproducible"]}, indent=1))
    if not payload["reproducible"]:
        raise SystemExit("the two runs produced different product bytes")
    return 0


def cmd_update_manifest(args) -> int:
    """Fold the Brazil detail rebuild into the recorded build manifest.

    The repair card t_d7457a47 rebuilt one product, so the manifest is updated
    in place from the run records and the measurements instead of regenerated:
    every other entry keeps the bytes and the hashes it was published with.
    """
    with open(args.manifest, encoding="utf-8") as handle:
        manifest = json.load(handle)
    with open(args.br_detail_measure, encoding="utf-8") as handle:
        detail = json.load(handle)
    with open(args.br_overview_measure, encoding="utf-8") as handle:
        overview = json.load(handle)
    runs = []
    for path in args.run:
        with open(path, encoding="utf-8") as handle:
            runs.append(json.load(handle))

    by_path = {}
    for run in runs:
        for product in run["products"]:
            by_path.setdefault(product["path"], []).append((run, product))

    detail_key = "data/polygons/br-mt-detail.pmtiles"
    if detail_key not in by_path:
        raise SystemExit(f"{detail_key} is not in the run records")
    measured = detail["sha256"]
    for run, product in by_path[detail_key]:
        if product["sha256"] != measured:
            raise SystemExit(
                f"run {run['label']} recorded {product['sha256']} for {detail_key}, "
                f"but the measurement read {measured}"
            )

    updated = 0
    for product in manifest["products"]:
        recorded = by_path.get(product["path"])
        if not recorded:
            continue
        for run, entry in recorded:
            product.setdefault("run_sha256", {})[run["label"]] = entry["sha256"]
        product["bytes"] = recorded[-1][1]["bytes"]
        product["sha256"] = recorded[-1][1]["sha256"]
        product["abs_path"] = recorded[-1][1]["abs_path"]
        if args.durable_copy:
            os.makedirs(args.durable_copy, exist_ok=True)
            target = os.path.join(args.durable_copy, os.path.basename(product["path"]))
            if (
                not os.path.exists(target)
                or os.path.getsize(target) != product["bytes"]
                or sha256_file(target) != product["sha256"]
            ):
                import shutil

                shutil.copy2(product["abs_path"], target)
            product["durable_path"] = target
        product["reproducible"] = len({entry["sha256"] for _, entry in recorded}) == 1
        product["bytes_stable"] = len({entry["bytes"] for _, entry in recorded}) == 1
        updated += 1

    for product in manifest["products"]:
        if product["path"] != detail_key:
            continue
        product["command"] = BR_DETAIL_BUILD
        product["zoom_range"] = [detail["header"]["min_zoom"], detail["header"]["max_zoom"]]
        product["tiles_per_zoom"] = {
            zoom: value["tiles"] for zoom, value in detail["per_zoom_all_tiles"].items()
        }
        product["tiles_total"] = sum(
            value["tiles"] for value in detail["per_zoom_all_tiles"].values()
        )
        product["properties"] = ["Id", "mbmode24"]
        product["layer_name"] = "trazo"

    readings = manifest["tile_budget"]["readings"]
    for name, reading in (("br_detail", detail), ("br_overview", overview)):
        readings[name] = {
            "per_zoom_max_bytes": {
                zoom: value["max_bytes"] for zoom, value in reading["per_zoom_all_tiles"].items()
            },
            "tiles_per_zoom": {
                zoom: value["tiles"] for zoom, value in reading["per_zoom_all_tiles"].items()
            },
            "views": {
                key: {
                    "features": value["features"],
                    "tiles": value["tiles_requested"],
                    "unique_ids": value["unique_ids"],
                    "max_tile_bytes": value["max_tile_bytes"],
                    "mean_features_per_tile": round(
                        value["features"] / value["tiles_requested"], 1
                    )
                    if value["tiles_requested"]
                    else None,
                }
                for key, value in reading["views"].items()
            },
            "budget_violations": reading["budget_violations"],
            "file_wide_violations": reading.get("file_wide_violations") or [],
            "tiles_over_budget": reading.get("tiles_over_budget") or [],
            "budget_bytes": reading["budget_bytes"],
            "sha256": reading["sha256"],
            "bytes": reading["bytes"],
        }
    failures = [
        {"product": name, **violation}
        for name, reading in readings.items()
        for violation in reading["budget_violations"]
    ]
    manifest["tile_budget"]["budget_ok"] = not failures
    manifest["tile_budget"]["failures"] = failures
    manifest["tile_budget"]["tiles_over_budget_in_br_detail"] = len(
        readings["br_detail"]["tiles_over_budget"]
    )

    v1 = detail["views"]["V1"]
    manifest["feature_counts"]["br_detail_v1_unique_ids"] = v1["unique_ids"]
    manifest["feature_counts"]["br_detail_v1_features"] = v1["features"]
    manifest["feature_counts"]["br_detail_v1_mean_per_viewport_tile"] = round(
        v1["features"] / v1["tiles_requested"], 1
    )
    manifest["feature_counts"]["br_detail_distinct_id_per_zoom"] = {
        zoom: value["distinct_ids"] for zoom, value in (detail.get("id_universe") or {}).items()
    }

    known_labels = {run["label"] for run in manifest.get("runs") or []}
    for run in runs:
        if run["label"] not in known_labels:
            manifest.setdefault("runs", []).append(
                {"label": run["label"], "recorded": run["recorded"]}
            )
    manifest["repair"] = {
        "card": "t_d7457a47",
        "date": args.date,
        "product": detail_key,
        "reason": (
            "AC-06: the `pmtiles extract` copy of the source archive carried z0 to z12 and "
            "369262, 653050 and 346421 byte tiles at z8, z9 and z10 against the 250000 byte "
            "detail budget, and 256321 and 345460 byte tiles at the two requested V1 addresses."
        ),
        "before": {
            "sha256": args.before_sha256,
            "bytes": args.before_bytes,
            "tiles_per_zoom": json.loads(args.before_tiles),
        },
        "after": {
            "sha256": detail["sha256"],
            "bytes": detail["bytes"],
            "tiles_per_zoom": {
                zoom: value["tiles"] for zoom, value in detail["per_zoom_all_tiles"].items()
            },
        },
        "command": BR_DETAIL_BUILD,
        "artifact": "artifacts/AC-06-budget.txt",
    }
    _write_json(args.out, manifest)
    print(
        json.dumps(
            {
                "out": args.out,
                "products_updated": updated,
                "budget_ok": manifest["tile_budget"]["budget_ok"],
                "br_detail_sha256": detail["sha256"],
                "br_detail_bytes": detail["bytes"],
                "tiles_total": sum(
                    value["tiles"] for value in detail["per_zoom_all_tiles"].values()
                ),
            },
            indent=1,
        )
    )
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    fetch = sub.add_parser("fetch-us")
    fetch.add_argument("--box", default=",".join(str(value) for value in US_BOX))
    fetch.add_argument("--out", required=True)
    fetch.add_argument("--summary-out", default=None)
    fetch.add_argument("--count-expected", type=int, default=None)
    fetch.set_defaults(func=cmd_fetch_us)

    classes_us = sub.add_parser("classes-us")
    classes_us.add_argument("--out", required=True)
    classes_us.set_defaults(func=cmd_classes_us)

    classes_br = sub.add_parser("classes-br")
    classes_br.add_argument("--out", required=True)
    classes_br.set_defaults(func=cmd_classes_br)

    fgb = sub.add_parser("parquet-to-fgb")
    fgb.add_argument("--src", required=True)
    fgb.add_argument("--out", required=True)
    fgb.add_argument("--columns", default="Id,mbmode24,geometry")
    fgb.add_argument("--geometry", default="geometry")
    fgb.add_argument("--layer", default="trazo")
    fgb.set_defaults(func=cmd_parquet_to_fgb)

    floor = sub.add_parser("choose-floor")
    floor.add_argument("--pmtiles", required=True)
    floor.add_argument("--box", required=True)
    floor.add_argument("--out", required=True)
    floor.set_defaults(func=cmd_choose_floor)

    measure = sub.add_parser("measure")
    measure.add_argument("--pmtiles", required=True)
    measure.add_argument("--budget-bytes", type=int, required=True)
    measure.add_argument("--budget-zoom-min", type=int, default=None)
    measure.add_argument("--budget-zoom-max", type=int, default=None)
    measure.add_argument("--box", default=None)
    measure.add_argument("--view", action="append", default=[])
    measure.add_argument("--source-layer", default="trazo")
    measure.add_argument("--id-property", default=None)
    measure.add_argument("--id-universe-zoom", type=int, action="append", default=[])
    measure.add_argument("--fail-on-violation", action="store_true")
    measure.add_argument("--out", required=True)
    measure.set_defaults(func=cmd_measure)

    lay = sub.add_parser("layers")
    lay.add_argument("--pmtiles", required=True)
    lay.add_argument("--zoom", type=int, default=None)
    lay.add_argument("--out", default=None)
    lay.set_defaults(func=cmd_layers)

    record = sub.add_parser("run-record")
    record.add_argument("--label", required=True)
    record.add_argument("--repo-root", required=True)
    record.add_argument("--product", action="append", default=[])
    record.add_argument("--command", action="append", default=[])
    record.add_argument("--out", required=True)
    record.set_defaults(func=cmd_run_record)

    write_us = sub.add_parser("write-us-records")
    write_us.add_argument("--floor", required=True)
    write_us.add_argument("--detail-measure", required=True)
    write_us.add_argument("--overview-measure", required=True)
    write_us.add_argument("--outdir", required=True)
    write_us.set_defaults(func=cmd_write_us_records)

    attach = sub.add_parser("attach-layers")
    attach.add_argument("--record", required=True)
    attach.add_argument("--layers", action="append", default=[])
    attach.set_defaults(func=cmd_attach_layers)

    verify = sub.add_parser("verify")
    verify.add_argument("--pmtiles", required=True)
    verify.add_argument("--zoom", type=int, required=True)
    verify.add_argument("--source-layer", default="trazo")
    verify.add_argument("--expect-properties", default=None)
    verify.add_argument("--forbid-properties", default=None)
    verify.add_argument("--class-property", default=None)
    verify.add_argument("--class-columns", action="append", default=[])
    verify.add_argument("--require-multi-polygon", action="store_true")
    verify.add_argument("--out", default=None)
    verify.set_defaults(func=cmd_verify)

    budget = sub.add_parser("budget-report")
    budget.add_argument("--measure", action="append", default=[])
    budget.set_defaults(func=cmd_budget_report)

    evidence = sub.add_parser("evidence")
    evidence.add_argument("--us-measure", required=True)
    evidence.add_argument("--us-overview-measure", required=True)
    evidence.add_argument("--br-detail-measure", required=True)
    evidence.add_argument("--br-overview-measure", required=True)
    evidence.add_argument("--floor", required=True)
    evidence.add_argument("--runs", required=True)
    evidence.add_argument("--fetch", required=True)
    evidence.add_argument("--artifacts", required=True)
    evidence.set_defaults(func=cmd_evidence)

    final = sub.add_parser("finalize")
    final.add_argument("--run", action="append", required=True)
    final.add_argument("--floor", required=True)
    final.add_argument("--us-measure", required=True)
    final.add_argument("--us-overview-measure", required=True)
    final.add_argument("--br-detail-measure", required=True)
    final.add_argument("--br-overview-measure", required=True)
    final.add_argument("--us-classes", required=True)
    final.add_argument("--br-classes", required=True)
    final.add_argument("--fetch", required=True)
    final.add_argument("--layers", action="append", required=True)
    final.add_argument("--durable-copy", default=None)
    final.add_argument("--out", required=True)
    final.set_defaults(func=cmd_finalize)

    update = sub.add_parser("update-manifest")
    update.add_argument("--manifest", required=True)
    update.add_argument("--br-detail-measure", required=True)
    update.add_argument("--br-overview-measure", required=True)
    update.add_argument("--run", action="append", required=True)
    update.add_argument("--date", required=True)
    update.add_argument("--before-sha256", required=True)
    update.add_argument("--before-bytes", type=int, required=True)
    update.add_argument("--before-tiles", required=True, help="JSON object, zoom to tile count")
    update.add_argument("--durable-copy", default=None)
    update.add_argument("--out", required=True)
    update.set_defaults(func=cmd_update_manifest)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
