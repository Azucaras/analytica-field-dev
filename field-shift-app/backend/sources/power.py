"""NASA POWER daily point API (R-17, R-20). Community AG, the centroid, format JSON."""

from __future__ import annotations

import math
from datetime import date
from typing import Iterable

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
CLIMATE_PARAMETERS = ("PRECTOTCORR", "T2M", "T2M_MAX", "T2M_MIN", "FROST_DAYS", "GWETROOT", "EVLAND")
NORMAL_PARAMETERS = ("PRECTOTCORR", "T2M_MAX")
FILL = -999.0


def url(lon: float, lat: float, start: date, end: date, parameters: Iterable[str]) -> str:
    return (
        f"{BASE_URL}?parameters={','.join(parameters)}&community=AG"
        f"&longitude={lon}&latitude={lat}&start={start:%Y%m%d}&end={end:%Y%m%d}&format=JSON"
    )


def parse(payload: dict) -> dict[str, dict[date, float]]:
    """Every parameter as {date: value}. The fill value is dropped here, before any arithmetic (R-17)."""
    parameter = payload["properties"]["parameter"]
    parsed: dict[str, dict[date, float]] = {}
    for name, series in parameter.items():
        clean: dict[date, float] = {}
        for key, value in series.items():
            day = date(int(key[:4]), int(key[4:6]), int(key[6:8]))
            if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value != FILL:
                clean[day] = float(value)
        parsed[name] = clean
    return parsed
