"""Block 6 wave 1: the water balance (R-22, R-23, R-24).

`in` is the sum of PRECTOTCORR over the window, `out` the sum of EVLAND (land surface evaporation,
not crop transpiration) and `remaining` the difference. One missing day in either series abstains
the balance as a whole. The function takes no SMAP input by design: SMAP is never on either side.
"""

from __future__ import annotations

from datetime import date

from aggregates import Window, is_valid, round_half_up, window_days

FORMULA = "remaining = in - out"


def water_balance(rain: dict[date, float], evland: dict[date, float], window: Window) -> dict:
    days = window_days(window)
    missing = {
        "PRECTOTCORR": sum(1 for d in days if not is_valid(rain.get(d))),
        "EVLAND": sum(1 for d in days if not is_valid(evland.get(d))),
    }
    if missing["PRECTOTCORR"] or missing["EVLAND"]:
        return {"ok": False, "in": None, "out": None, "remaining": None, "missing": missing}
    rain_sum = sum(rain[d] for d in days)
    evland_sum = sum(evland[d] for d in days)
    return {
        "ok": True,
        "in": round_half_up(rain_sum, 1),
        "out": round_half_up(evland_sum, 1),
        "remaining": round_half_up(rain_sum - evland_sum, 1),
        "missing": missing,
    }
