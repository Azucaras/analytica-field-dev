"""Element84 Earth Search, collection sentinel-2-l2a (R-27 to R-30). Search only in wave 1.

The zonal NDVI statistic needs a cloud optimised GeoTIFF reader that is not approved (OD-01), so
this module returns scene counts and never a valid_fraction. No key, no login, no Google host.
"""

from __future__ import annotations

from datetime import date
from typing import Any

STAC_URL = "https://earth-search.aws.element84.com/v1/search"
COLLECTION = "sentinel-2-l2a"
CLEAR_CLOUD_PERCENT = 20.0


def search_body(ring: list[list[float]], start: date, end: date) -> dict[str, Any]:
    closed = list(ring) if ring[0] == ring[-1] else list(ring) + [ring[0]]
    return {
        "collections": [COLLECTION],
        "intersects": {"type": "Polygon", "coordinates": [closed]},
        "datetime": f"{start:%Y-%m-%d}T00:00:00Z/{end:%Y-%m-%d}T23:59:59Z",
        "limit": 100,
    }


def parse_scenes(payload: dict) -> list[dict[str, Any]]:
    scenes = []
    for feature in payload.get("features", []):
        properties = feature.get("properties", {})
        cloud = properties.get("eo:cloud_cover")
        scenes.append({
            "id": feature["id"],
            "date": str(properties["datetime"])[:10],
            "cloud_cover": float(cloud) if isinstance(cloud, (int, float)) else None,
        })
    return scenes


def clear_count(scenes: list[dict[str, Any]]) -> int:
    return sum(1 for scene in scenes if scene["cloud_cover"] is not None and scene["cloud_cover"] < CLEAR_CLOUD_PERCENT)
