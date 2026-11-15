"""Recorded transport for the Block 6 suite. It replays the responses under artifacts/block6 and
records every request it receives, so a test can prove which hosts a route touched."""

from __future__ import annotations

import json
import sqlite3
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import httpx

ARTIFACTS = Path(__file__).resolve().parents[1] / "artifacts" / "block6"


def _load(name: str) -> dict:
    return json.loads((ARTIFACTS / name).read_text(encoding="utf-8"))


def _ymd(text: str) -> date:
    return date(int(text[:4]), int(text[4:6]), int(text[6:8]))


class ReplayTransport:
    """A callable with the same shape as field_numbers.transport(method, url, json_body)."""

    def __init__(
        self,
        *,
        offline_hosts: tuple[str, ...] = (),
        status_overrides: dict[str, int] | None = None,
        offline: bool = False,
    ) -> None:
        self.requests: list[tuple[str, str, object]] = []
        self.offline_hosts = offline_hosts
        self.offline = offline
        self.status_overrides = status_overrides or {}
        climate = _load("power-climate-2026-07-01-2026-11-14.json")["properties"]["parameter"]
        normals = _load("power-normals-1991-2025.json")["properties"]["parameter"]
        self.power: dict[str, dict[str, float]] = {}
        for source in (climate, normals):
            for name, series in source.items():
                self.power.setdefault(name, {}).update(series)
        self.soilgrids = _load("soilgrids-55.27--11.91.json")
        self.sidra_state = _load("sidra-n3-51.json")
        self.sidra_municipality = _load("sidra-n6-5107248.json")
        self.stac = _load("earth-search-2026-10-01-2026-11-11-ring.json")

    def __call__(self, method: str, url: str, json_body: object = None) -> httpx.Response:
        self.requests.append((method, url, json_body))
        request = httpx.Request(method, url)
        host = urlparse(url).netloc
        if self.offline or any(item in host for item in self.offline_hosts):
            raise httpx.ConnectError("network unavailable (recorded transport)", request=request)
        for item, status in self.status_overrides.items():
            if item in host:
                return httpx.Response(status, content=b"", request=request)
        if "power.larc.nasa.gov" in host:
            return httpx.Response(200, json=self._power(url), request=request)
        if "rest.isric.org" in host:
            return httpx.Response(200, json=self.soilgrids, request=request)
        if "servicodados.ibge.gov.br" in host:
            body = self.sidra_municipality if "5107248" in unquote(url) else self.sidra_state
            return httpx.Response(200, json=body, request=request)
        if "earth-search.aws.element84.com" in host:
            return httpx.Response(200, json=self.stac, request=request)
        raise AssertionError(f"unrecorded host requested: {host}")

    def _power(self, url: str) -> dict:
        query = parse_qs(urlparse(url).query)
        names = query["parameters"][0].split(",")
        start = _ymd(query["start"][0])
        end = _ymd(query["end"][0])
        parameter: dict[str, dict[str, float]] = {}
        for name in names:
            series = self.power.get(name, {})
            parameter[name] = {
                key: value
                for key, value in series.items()
                if start <= _ymd(key) <= end
            }
        return {"header": {"fill_value": -999.0}, "properties": {"parameter": parameter}}

    def hosts(self) -> set[str]:
        return {urlparse(url).netloc for _, url, _ in self.requests}


def ring_with_area_ha(target_ha: float, lat0: float = -11.91, lon0: float = -55.27) -> list[list[float]]:
    """A square ring centred on the fixture point whose spherical area is target_ha (test helper)."""
    from field_numbers import area_of_ring_m2

    def square(half: float) -> list[list[float]]:
        return [
            [lon0 - half, lat0 - half],
            [lon0 + half, lat0 - half],
            [lon0 + half, lat0 + half],
            [lon0 - half, lat0 + half],
        ]

    low, high = 1e-5, 1.0
    for _ in range(200):
        middle = (low + high) / 2
        if area_of_ring_m2(square(middle)) / 10000.0 < target_ha:
            low = middle
        else:
            high = middle
    return square((low + high) / 2)


SIDECAR_SCHEMA = """
CREATE TABLE polygon_mapbiomas (
  polygon_id TEXT NOT NULL,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  code INTEGER,
  class_name TEXT,
  year INTEGER NOT NULL,
  collection INTEGER,
  area_ha REAL,
  fraction REAL,
  basis TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (polygon_id, product, year)
);
"""


def create_sidecar(path: Path, rows: list[tuple] | None = None) -> None:
    """Build a polygon_mapbiomas sidecar in a temporary path. Test only: never written to data/."""
    connection = sqlite3.connect(path)
    try:
        connection.executescript(SIDECAR_SCHEMA)
        if rows:
            connection.executemany("INSERT INTO polygon_mapbiomas VALUES (?,?,?,?,?,?,?,?,?,?,?)", rows)
        connection.commit()
    finally:
        connection.close()


def fixture_rows(polygon_id: str, classes: bool = True) -> list[tuple]:
    """TEST-ONLY rows for one polygon: the first crop 1985 to 2025 and the second crop 2000 to 2025.

    The class values are synthetic test values, not MapBiomas data. With classes=False the code and
    the class name are NULL, which is the state CO-B5-02 measured on the real sidecar."""
    rows: list[tuple] = []
    source = "TEST-ONLY synthetic rows (not MapBiomas)"
    for year in range(1985, 2026):
        code, name = (39, "Soybean") if classes else (None, None)
        rows.append((polygon_id, "br", "agriculture_first_crop", code, name, year, 11, 22.4, 1.0, "modelled", source))
    for year in range(2000, 2026):
        code, name = (1, "Second crop corn") if classes else (None, None)
        rows.append((polygon_id, "br", "agriculture_second_crop", code, name, year, 11, 22.4, 0.5, "modelled", source))
    return rows


if __name__ == "__main__":
    # Builds artifacts/block6/polygon-mapbiomas-fixture.sqlite (spec, Assumptions): two polygons with rows,
    # one of them with NULL classes, and a third polygon with no row at all. Every class is a TEST-ONLY value.
    import sys

    target = Path(sys.argv[1])
    if target.exists():
        target.unlink()
    create_sidecar(target, rows=fixture_rows("trazo:12345") + fixture_rows("trazo:67890", classes=False))
