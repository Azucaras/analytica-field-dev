#!/usr/bin/env python3
"""Independent checks on the six fixture fields (block 5 R-24, AM-10).

This script re-derives every figure of the three United States entries from the
sources rather than trusting the generator: the ring area is compared with the
service's own `csbacres`, the crop codes with the table the card publishes, and
the Brazil entries with the file as committed before this build.

  python verify_fixture_us.py [--fixture PATH] [--csb-geojson PATH]
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from pyproj import Geod
from shapely.geometry import shape

REPO = Path(__file__).resolve().parents[1]
CARDS = {
    "381825001868504": {"acres": 153.2, "codes": [23, 41, 23, 5, 1, 5, 1, 5]},
    "381825001868512": {"acres": 150.3, "codes": [1, 5, 1, 5, 6, 23, 1, 5]},
    "381825001868517": {"acres": 155.6, "codes": [41, 23, 5, 1, 5, 1, 5, 1]},
}
BRAZIL_IDS = ["mt-santa-carmem-01", "mt-santa-carmem-02", "mt-santa-carmem-03"]
BOX = (-97.20, 46.90, -97.14, 46.96)
ACRE_M2 = 4046.8564224
GEOD = Geod(ellps="WGS84")

failures: list[str] = []
checks = 0


def check(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(message)
        print(f"FAIL  {message}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", type=Path, default=REPO / "backend/fixtures/field-scenarios.json")
    parser.add_argument("--csb-geojson", type=Path, default=REPO / "data/work/us-38017.geojson")
    parser.add_argument(
        "--base-ref",
        default="70329fc",
        help="the commit whose fixture is the Brazil-only state this build started from",
    )
    args = parser.parse_args()

    raw = args.fixture.read_text(encoding="utf-8")
    data = json.loads(raw)
    fields = data["fields"]

    # 1. the file parses and carries six entries in the documented order
    check(len(fields) == 6, f"expected 6 fields, found {len(fields)}")
    check(
        [field["id"] for field in fields] == BRAZIL_IDS + list(CARDS),
        "field ids or order differ from the card",
    )
    check(
        all(field.get("region") in {"br", "us"} for field in fields),
        "every entry carries a region of br or us (block 6 R-51)",
    )
    check(
        [field["region"] for field in fields] == ["br"] * 3 + ["us"] * 3,
        "the six entries are separable by region, three each",
    )

    # 2. the Brazil entries are the committed ones, plus the region key
    relative = args.fixture.resolve().relative_to(REPO.parent)
    base = subprocess.run(
        ["git", "show", f"{args.base_ref}:{relative}"],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    if base.returncode != 0:
        before = None
        print(f"note: could not read the fixture at {args.base_ref}, Brazil comparison skipped")
    else:
        before = {field["id"]: field for field in json.loads(base.stdout)["fields"]}
        check(
            all(field_id in before for field_id in BRAZIL_IDS),
            f"{args.base_ref} does not carry the three Brazil entries",
        )
        print(f"Brazil comparison against the fixture at {args.base_ref}")
    for field in fields[:3]:
        if before is None:
            continue
        stripped = {key: value for key, value in field.items() if key != "region"}
        check(stripped == before[field["id"]], f"{field['id']}: the Brazil entry changed beyond region")

    # 3. the service geometry is the ring source, unchanged
    features = {f["properties"]["csbid"]: f for f in json.loads(args.csb_geojson.read_text())["features"]}
    for field in fields[3:]:
        csbid = field["id"]
        check(csbid in features, f"{csbid}: not found in the Feature Service result")
        if csbid not in features:
            continue
        service_ring = features[csbid]["geometry"]["coordinates"][0]
        ring = field["boundary"]["coordinates"][0]
        check(ring == service_ring, f"{csbid}: the ring is not the service geometry verbatim")
        check(ring[0] == ring[-1], f"{csbid}: the ring is not closed")
        # The service answers every feature that intersects the envelope, so a
        # returned field can reach a short way past the box edge. The check is
        # an intersects one with a stated tolerance, and the overshoot is printed.
        overshoot = max(
            max(BOX[0] - x, x - BOX[2], BOX[1] - y, y - BOX[3], 0.0) for x, y in ring
        )
        print(f"  {csbid}: ring overshoot past the query box {overshoot:.5f} deg")
        check(
            overshoot < 0.01,
            f"{csbid}: a ring vertex is more than 0.01 deg outside the pilot box",
        )
        geom = shape(field["boundary"])
        check(geom.is_valid, f"{csbid}: the ring is not a valid polygon")
        area_m2, _ = GEOD.geometry_area_perimeter(geom)
        area_acres = abs(area_m2) / ACRE_M2
        csbacres = features[csbid]["properties"]["csbacres"]
        rel = abs(area_acres - csbacres) / csbacres
        print(
            f"  {csbid}: ring area {area_acres:.3f} acres, csbacres {csbacres:.3f}, "
            f"delta {rel * 100:.3f}%"
        )
        check(rel < 0.005, f"{csbid}: ring area differs from csbacres by {rel * 100:.3f}% (limit 0.5%)")
        check(
            abs(field["acres"] - round(csbacres, 1)) < 1e-9,
            f"{csbid}: displayed acres is not csbacres rounded to one decimal",
        )
        check(
            abs(field["csbacres"] - csbacres) < 1e-9,
            f"{csbid}: csbacres does not match the service",
        )

        # 4. the card's table of codes and acres
        card = CARDS[csbid]
        codes = [row["cdl"] for row in field["history"]]
        check(codes == card["codes"], f"{csbid}: history codes differ from the card")
        check([row["year"] for row in field["history"]] == list(range(2018, 2026)), f"{csbid}: years are not 2018 to 2025")
        check(abs(field["acres"] - card["acres"]) < 1e-9, f"{csbid}: acres differ from the card")

        # 5. scenarios
        observed = set(field["crops_observed"])
        check(
            observed == {row["crop"] for row in field["history"]},
            f"{csbid}: crops_observed is not the set of crops in history",
        )
        check(len(field["scenarios"]) == 3, f"{csbid}: expected 3 scenarios")
        check(
            sum(1 for scenario in field["scenarios"] if scenario["is_current"]) == 1,
            f"{csbid}: expected exactly one current scenario",
        )
        for scenario in field["scenarios"]:
            check(bool(scenario["crops"]), f"{csbid}/{scenario['id']}: no crops")
            check(
                set(scenario["crops"]) <= observed,
                f"{csbid}/{scenario['id']}: a crop is not in the field's own record",
            )
            for key in ("why", "evidence", "benefit", "gap", "risk"):
                check(bool(scenario.get(key)), f"{csbid}/{scenario['id']}: empty {key}")
            check(bool(scenario["evidence_rows"]), f"{csbid}/{scenario['id']}: no evidence rows")
            for row in scenario["evidence_rows"]:
                check(
                    set(row) == {"layer", "value", "basis", "as_of", "source"},
                    f"{csbid}/{scenario['id']}: evidence row keys differ",
                )
                check(row["basis"] in {"observed", "retrieved", "modelled", "entered"}, f"{csbid}: bad basis {row['basis']}")

        # 6. soil and climate
        soil = field["soil"]
        check(bool(soil["map_unit"]) and bool(soil["drainage_class"]), f"{csbid}: soil row incomplete")
        check(isinstance(field["climate"]["september_2026_ppt_mm"], float), f"{csbid}: no September rain value")

        # 7. centre inside the ring
        center = shape({"type": "Point", "coordinates": field["center"]})
        check(geom.contains(center), f"{csbid}: centre is outside the ring")

    # 8. the US entries carry no SMAP row, which is the honest state for a CDL field
    smap_rows = sum(
        1
        for field in fields[3:]
        for scenario in field["scenarios"]
        for row in scenario["evidence_rows"]
        if row["layer"] == "SMAP soil moisture"
    )
    check(smap_rows == 0, "a United States entry carries an SMAP row that no source measured")

    print()
    print(f"checks: {checks}, failures: {len(failures)}")
    if failures:
        raise SystemExit(1)
    print("fixture: OK")


if __name__ == "__main__":
    main()
