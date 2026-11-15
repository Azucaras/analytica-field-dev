#!/usr/bin/env python3
"""Add the three Cass County (ND) CSB fixture fields of block 5 R-24.

This is the CO-B5-01 clause that asks for the three CSB fixture fields "with
their real rings, eight years of history, soil and climate per the research,
and scenarios drawn from crops the fields really had".

Inputs, all recorded with a sha256 in the `sources` block of the fixture:

  --csb-geojson  the paged Feature Service result for the pilot box, written by
                 `polygon_build.py fetch-us` (data/work/us-38017.geojson).
                 Real rings, `csbid`, `csbacres` and `cdl2018` to `cdl2025`.
  --probe        artifacts/data-probe-us-first.json at commit 535bd9d, whose
                 `pilot.fixture_fields` carries the SSURGO soil row and the
                 PRISM September 2026 rain of each field.
  --classes      data/polygons/polygon-classes-us.json, the CDL raster
                 attribute table of R-17, used for the crop names only.

The three Brazil entries keep their id, name, location, coverage, centre,
boundary and scenarios byte for byte; the only change to them is the `region`
key that block 6 R-51 requires every fixture entry to carry.

Usage:
  python fixture_us_fields.py            # verify, print the diff summary, no write
  python fixture_us_fields.py --write    # rewrite the fixture in place
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import shapely

REPO = Path(__file__).resolve().parents[1]
DEFAULTS = {
    "csb_geojson": REPO / "data/work/us-38017.geojson",
    "probe": REPO / "artifacts/data-probe-us-first.json",
    "classes": REPO / "data/polygons/polygon-classes-us.json",
    "fixture": REPO / "backend/fixtures/field-scenarios.json",
}

CSB_IDS = ["381825001868504", "381825001868512", "381825001868517"]
BRAZIL_IDS = ["mt-santa-carmem-01", "mt-santa-carmem-02", "mt-santa-carmem-03"]
YEARS = list(range(2018, 2026))

# A coordinate pair that json.dumps expanded over three lines.
PAIR = re.compile(r"\[\s*\n\s*(-?\d+(?:\.\d+)?),\s*\n\s*(-?\d+(?:\.\d+)?)\s*\n\s*\]")

CSB_SERVICE = (
    "https://pdi.scinet.usda.gov/hosting/rest/services/Hosted/"
    "Crop_Sequence_Boundaries_2025/FeatureServer/0/query"
)
SDA_WFS = (
    "https://sdmdataaccess.sc.egov.usda.gov/Spatial/SDMWGS84Geographic.wfs"
    "?Service=WFS&Version=1.1.0&Request=GetFeature&TypeName=MapunitPoly"
)
SDA_TABULAR = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest"
PRISM = "https://data.prism.oregonstate.edu/time_series/us/an/4km/ppt/monthly/2026/"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def check_ring(ring: list[list[float]]) -> None:
    if ring[0] != ring[-1]:
        raise SystemExit("ring is not closed")
    if len(ring) < 4:
        raise SystemExit("ring has fewer than four points")


def scenario_entry(
    scenario_id: str,
    name: str,
    is_current: bool,
    crops: list[str],
    why: str,
    evidence: str,
    benefit: str,
    gap: str,
    risk: str,
    history_value: str,
    history_as_of: str,
    soil_text: str,
    rain_text: str,
    rain_as_of: str,
    soil_as_of: str,
) -> dict:
    return {
        "id": scenario_id,
        "name": name,
        "is_current": is_current,
        "crops": crops,
        "why": why,
        "evidence": evidence,
        "benefit": benefit,
        "gap": gap,
        "risk": risk,
        "evidence_rows": [
            {
                "layer": "Crop history",
                "value": history_value,
                "basis": "retrieved",
                "as_of": history_as_of,
                "source": CSB_SERVICE,
            },
            {
                "layer": "Soil (SSURGO map unit)",
                "value": soil_text,
                "basis": "retrieved",
                "as_of": soil_as_of,
                "source": f"{SDA_TABULAR} (mapunit, muaggatt)",
            },
            {
                "layer": "September 2026 rain (PRISM 4 km)",
                "value": rain_text,
                "basis": "retrieved",
                "as_of": rain_as_of,
                "source": f"{PRISM} (prism_ppt_us_25m_202609.zip, 4 km monthly)",
            },
        ],
    }


def build_fields(csb: dict, probe: dict, classes: dict) -> list[dict]:
    names_by_code = {row["value"]: row["name"] for row in classes["rows"]}
    probe_by_id = {row["csbid"]: row for row in probe["pilot"]["fixture_fields"]}
    soil_as_of = probe["meta"]["last_run"][:10]

    features = {}
    for feature in csb["features"]:
        features[feature["properties"]["csbid"]] = feature

    missing = [csbid for csbid in CSB_IDS if csbid not in features]
    if missing:
        raise SystemExit(f"csbid missing from the Feature Service result: {missing}")

    fields = []
    for index, csbid in enumerate(CSB_IDS, start=1):
        feature = features[csbid]
        props = feature["properties"]
        geom = feature["geometry"]
        if geom["type"] != "Polygon":
            raise SystemExit(f"{csbid}: expected a Polygon, found {geom['type']}")
        ring = geom["coordinates"][0]
        check_ring(ring)

        probe_row = probe_by_id.get(csbid)
        if probe_row is None:
            raise SystemExit(f"{csbid}: no row under pilot.fixture_fields")

        # The codes on the geometry and in the probe are two reads of the same
        # record; a disagreement means one of the two files is not the pilot box.
        service_codes = [props[f"cdl{year}"] for year in YEARS]
        if service_codes != probe_row["codes"]:
            raise SystemExit(f"{csbid}: cdl codes differ between geojson and probe")

        crops_by_year = {}
        history = []
        for year, code in zip(YEARS, service_codes):
            crop = names_by_code.get(code)
            if crop is None:
                raise SystemExit(f"{csbid}: CDL code {code} has no name in the RAT table")
            crops_by_year[year] = crop
            history.append({"year": year, "cdl": code, "crop": crop})

        distinct: list[str] = []
        for year in YEARS:
            crop = crops_by_year[year]
            if crop not in distinct:
                distinct.append(crop)

        poly = shapely.geometry.shape(geom)
        centroid = poly.centroid
        if not poly.contains(centroid):
            centroid = poly.representative_point()

        mukey, muname, slope, hydgrp, drainage = probe_row["soil"]
        soil_text = f"{muname} (SSURGO map unit {mukey}, {slope}% slope, hydrologic group {hydgrp}, {drainage})"
        rain_mm = probe_row["prism_ppt_mm_sep2026"]
        rain_text = f"{rain_mm} mm"
        acres_source = props["csbacres"]
        acres_display = round(acres_source, 1)

        current_pair = [crops_by_year[2024], crops_by_year[2025]]

        # Prefer the earliest adjacent pair that brings in a crop the current
        # pair does not carry, and fall back to the earliest pair that differs.
        # Either way it is a rotation the field itself ran, not a proposal.
        earlier = None
        fallback = None
        for year in YEARS[:-1]:
            pair = [crops_by_year[year], crops_by_year[year + 1]]
            if pair == current_pair or pair[0] == pair[1]:
                continue
            if fallback is None:
                fallback = (year, pair)
            if set(pair) - set(current_pair):
                earlier = (year, pair)
                break
        earlier = earlier or fallback
        if earlier is None:
            raise SystemExit(f"{csbid}: no earlier rotation pair distinct from the current one")

        earlier_year, earlier_pair = earlier
        first_year = min(YEARS)
        last_year = max(YEARS)
        counts = {crop: sum(1 for y in YEARS if crops_by_year[y] == crop) for crop in distinct}
        added = [crop for crop in earlier_pair if crop not in current_pair]
        words = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six"}
        count_word = words.get(len(distinct), str(len(distinct)))

        if added:
            benefit = (
                f"Adds {added[0]}, which the current pair does not carry, and it is taken from the "
                f"field's own history in {earlier_year} and {earlier_year + 1} rather than from a "
                "county average."
            )
        else:
            benefit = (
                f"Runs the same two crops as the current pair in the other order, which is the order "
                f"the field actually used in {earlier_year} and {earlier_year + 1}."
            )

        thinnest = min(counts[crop] for crop in earlier_pair)
        if thinnest == 1:
            once = [crop for crop in earlier_pair if counts[crop] == 1][0]
            risk = (
                f"{once} appears in only one of the eight years, and the record holds no yield or "
                "cost for it, so half of this pair rests on a single observation."
            )
        else:
            risk = (
                f"Both crops appear at least {words.get(thinnest, str(thinnest))} times in the eight "
                "years, which is as much as the record can say: it shows the class each year, not what "
                "the pair cost or returned."
            )

        # Does the field's record hold the distinct crops in this order as one
        # continuous stretch of years? It decides what the third card may claim.
        run_start = None
        for offset in range(len(YEARS) - len(distinct) + 1):
            window = [crops_by_year[year] for year in YEARS[offset:offset + len(distinct)]]
            if window == distinct:
                run_start = YEARS[offset]
                break
        if run_start is not None:
            distinct_risk = (
                f"The {count_word} crops do appear in this order from {run_start} to "
                f"{run_start + len(distinct) - 1}, which is one continuous stretch of the record, but "
                "that stretch also carries the price and weather of those years and no other."
            )
        else:
            distinct_risk = (
                "The order above is the order each crop first appears in the record, not a sequence "
                "the field has run in one continuous stretch of years."
            )

        current_value = f"{current_pair[0]} → {current_pair[1]}"
        rotation_value = f"{earlier_pair[0]} → {earlier_pair[1]} ({earlier_year} to {earlier_year + 1})"
        distinct_value = f"{', '.join(distinct)} ({first_year} to {last_year})"

        scenarios = [
            scenario_entry(
                scenario_id=f"csb-{csbid}-current",
                name="Current sequence",
                is_current=True,
                crops=current_pair,
                why=(
                    f"The {2024} and {2025} Crop Sequence Boundary records for this field are "
                    f"{crops_by_year[2024]} and {crops_by_year[2025]}, so the current sequence is the "
                    "pair of crops the field actually grew in its two most recent years."
                ),
                evidence=(
                    f"Eight CDL years, {first_year} to {last_year}, are carried on this field's Crop "
                    f"Sequence Boundary record: {' '.join(f'{y} {crops_by_year[y]}' for y in YEARS)}."
                ),
                benefit=(
                    f"Repeats the pair the field grew in {2024} and {2025}, which is the sequence the "
                    "record shows rather than a proposed one."
                ),
                gap="The record carries no yield, input cost or planting date for either year.",
                risk=(
                    "The record holds the crop class only, so a late harvest or a wet spring is not "
                    "visible in it and cannot be ruled out from this evidence."
                ),
                history_value=current_value,
                history_as_of="2025",
                soil_text=soil_text,
                rain_text=rain_text,
                rain_as_of="2026-09-30",
                soil_as_of=soil_as_of,
            ),
            scenario_entry(
                scenario_id=f"csb-{csbid}-observed-rotation",
                name=f"{earlier_pair[0]} → {earlier_pair[1]}",
                is_current=False,
                crops=earlier_pair,
                why=(
                    f"{earlier_pair[0]} in {earlier_year} and {earlier_pair[1]} in {earlier_year + 1} are "
                    "adjacent years of this field's own record, so this rotation has already run here."
                ),
                evidence=(
                    f"CDL {earlier_year} is {service_codes[YEARS.index(earlier_year)]} "
                    f"{earlier_pair[0]} and CDL {earlier_year + 1} is "
                    f"{service_codes[YEARS.index(earlier_year + 1)]} {earlier_pair[1]} on this field."
                ),
                benefit=benefit,
                gap="No yield, price or input record is attached to either year of the pair.",
                risk=risk,
                history_value=rotation_value,
                history_as_of=str(earlier_year + 1),
                soil_text=soil_text,
                rain_text=rain_text,
                rain_as_of="2026-09-30",
                soil_as_of=soil_as_of,
            ),
            scenario_entry(
                scenario_id=f"csb-{csbid}-distinct-crops",
                name=" → ".join(distinct),
                is_current=False,
                crops=distinct,
                why=(
                    f"{count_word.capitalize()} crops appear in this field's record between {first_year} "
                    f"and {last_year}; this sequence keeps all {count_word} in the order the record shows "
                    "them."
                ),
                evidence=(
                    f"The distinct crop classes of the eight CDL years are {', '.join(distinct)}, in the "
                    "order they first appear."
                ),
                benefit=(
                    f"Keeps {count_word} crops in the rotation, which is the diversity this field has "
                    "actually carried, not a rotation imported from another field."
                ),
                gap=(
                    "The record is one class per year, so a double-cropped year counts as one crop and "
                    "a cover crop is not recorded at all."
                ),
                risk=distinct_risk,
                history_value=distinct_value,
                history_as_of=str(last_year),
                soil_text=soil_text,
                rain_text=rain_text,
                rain_as_of="2026-09-30",
                soil_as_of=soil_as_of,
            ),
        ]

        fields.append(
            {
                "id": csbid,
                "region": "us",
                "name": f"Cass Field {index:02d}",
                "location": "Cass County, North Dakota",
                "coverage": 100,
                "coverage_basis": (
                    "8 of 8 CDL years (2018 to 2025) carry a non-zero class on this field's Crop "
                    "Sequence Boundary record. This counts years with a class, not the share of the "
                    "field's area covered by a satellite observation, which is what the Brazil "
                    "entries' coverage counts."
                ),
                "center": [round(centroid.x, 6), round(centroid.y, 6)],
                "boundary": {"type": "Polygon", "coordinates": [ring]},
                "csbid": csbid,
                "acres": acres_display,
                "csbacres": acres_source,
                "statefips": props["statefips"],
                "cntyfips": props["cntyfips"],
                "history": history,
                "crops_observed": distinct,
                "soil": {
                    "mukey": mukey,
                    "map_unit": muname,
                    "slope_grad_wta_pct": slope,
                    "hydrologic_group": hydgrp,
                    "drainage_class": drainage,
                    "source": SDA_TABULAR,
                    "method": "SDA Tabular post.rest, mapunit joined to muaggatt on mukey, at the field centroid",
                    "as_of": soil_as_of,
                },
                "climate": {
                    "september_2026_ppt_mm": rain_mm,
                    "product": "PRISM 4 km monthly precipitation",
                    "source": f"{PRISM}prism_ppt_us_25m_202609.zip",
                    "as_of": "2026-09-30",
                    "note": "One month at a 4 km cell, read at the field centroid; it is a reanalysis product of the cell, not a gauge at the field.",
                },
                "scenarios": scenarios,
            }
        )
    return fields


def sources_block(args, csb: dict, probe: dict, classes: dict) -> str:
    """The provenance of the three United States entries, as a top level key.

    Nothing reads this key: the backend reads `seasons`, `default_season` and
    `fields`. It is here so that a later card can re-derive every number in the
    three entries without trusting this commit.
    """
    block = {
        "note": (
            "Provenance of the three United States fixture fields. The three Brazilian entries "
            "are unchanged by this build apart from the region key that block 6 R-51 requires."
        ),
        "us_geometry": {
            "service": CSB_SERVICE,
            "box": "-97.20,46.90,-97.14,46.96",
            "fetched": "2026-11-14",
            "features_in_pilot_box": len(csb["features"]),
            "file": "field-shift-app/data/work/us-38017.geojson",
            "sha256": sha256(args.csb_geojson),
            "note": "Rings are the service's own geometry, WGS84, as returned for the pilot box.",
        },
        "us_soil": {
            "service": f"{SDA_TABULAR} (mapunit joined to muaggatt)",
            "prototype": SDA_WFS,
            "fields_with_a_row": probe["pilot"]["checks"]["fields_with_soil"],
            "fields_sampled": probe["pilot"]["checks"]["fields_sampled"],
            "as_of": probe["meta"]["last_run"][:10],
            "file": "field-shift-app/artifacts/data-probe-us-first.json",
            "sha256": sha256(args.probe),
            "read_from_commit": "535bd9d (branch block4/wave4-dock)",
        },
        "us_climate": {
            "product": "PRISM 4 km monthly precipitation, September 2026",
            "file": f"{PRISM}prism_ppt_us_25m_202609.zip",
            "fields_with_a_row": probe["pilot"]["checks"]["fields_with_climate"],
            "note": (
                "One month at a 4 km cell read at the field centroid. It is the cell's reanalysis "
                "value, not a gauge at the field."
            ),
            "as_of": "2026-09-30",
        },
        "us_crop_names": {
            "source": "CDL raster attribute table (R-17), via data/polygons/polygon-classes-us.json",
            "sha256": sha256(args.classes),
        },
        "coverage": (
            "coverage is 100 on each United States entry because 8 of 8 CDL years carry a class. "
            "It counts years with a class, not satellite observation coverage like the Brazil "
            "entries, and coverage_basis says so on every entry."
        ),
    }
    rendered = json.dumps(block, indent=2, ensure_ascii=False)
    return "\n".join("  " + line for line in rendered.splitlines())


def insert_fields(text: str, fields: list[dict]) -> str:
    text = text.rstrip("\n")
    for brazil_id in BRAZIL_IDS:
        needle = f'      "id": "{brazil_id}",\n'
        if text.count(needle) != 1:
            raise SystemExit(f"could not locate the id line of {brazil_id} exactly once")
        text = text.replace(needle, needle + '      "region": "br",\n', 1)

    if text.count('"region": "br"') != len(BRAZIL_IDS):
        raise SystemExit("the region key count does not match the Brazil entries")

    tail = "\n    }\n  ]\n}"
    if not text.endswith(tail):
        raise SystemExit("the fixture does not end where this script expects")

    rendered = []
    for field in fields:
        block = json.dumps(field, indent=2, ensure_ascii=False)
        # One coordinate pair per line, as `[lon, lat]`, so the rings stay readable
        # and the diff stays scoped to the three new entries.
        block = PAIR.sub(r"[\1, \2]", block)
        rendered.append("\n".join("    " + line for line in block.splitlines()))
    return text[: -len(tail)] + "\n    },\n" + ",\n".join(rendered) + "\n  ]\n}\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csb-geojson", type=Path, default=DEFAULTS["csb_geojson"])
    parser.add_argument("--probe", type=Path, default=DEFAULTS["probe"])
    parser.add_argument("--classes", type=Path, default=DEFAULTS["classes"])
    parser.add_argument("--fixture", type=Path, default=DEFAULTS["fixture"])
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    csb = load_json(args.csb_geojson)
    probe = load_json(args.probe)
    classes = load_json(args.classes)
    original = args.fixture.read_text(encoding="utf-8")
    original_json = json.loads(original)

    if any(field["id"] in CSB_IDS for field in original_json["fields"]):
        raise SystemExit("the fixture already carries a CSB field; this script inserts once")

    fields = build_fields(csb, probe, classes)
    updated = insert_fields(original, fields)

    anchor = '  "default_season": "2025/26",\n'
    if updated.count(anchor) != 1:
        raise SystemExit("could not locate the default_season line exactly once")
    updated = updated.replace(anchor, anchor + '  "sources": ' + sources_block(args, csb, probe, classes).lstrip() + ",\n", 1)

    # Re-read and re-check before the write, so a malformed insert never lands.
    parsed = json.loads(updated)
    ids = [field["id"] for field in parsed["fields"]]
    if ids != BRAZIL_IDS + CSB_IDS:
        raise SystemExit(f"unexpected field order or ids: {ids}")

    by_id = {field["id"]: field for field in original_json["fields"]}
    for field in parsed["fields"]:
        if field["id"] not in by_id:
            continue
        stripped = {key: value for key, value in field.items() if key != "region"}
        if stripped != by_id[field["id"]]:
            raise SystemExit(f"{field['id']}: a Brazil entry changed beyond its region key")

    if args.write:
        args.fixture.write_text(updated, encoding="utf-8")

    print(f"fixture: {args.fixture}")
    print(f"fields: {len(parsed['fields'])} ({len(BRAZIL_IDS)} br, {len(CSB_IDS)} us)")
    print(f"bytes: {len(original)} -> {len(updated)}")
    print(f"written: {args.write}")
    for field in fields:
        print(
            f"  {field['id']} {field['acres']} acres, ring {len(field['boundary']['coordinates'][0])} points, "
            f"{len(field['history'])} years, crops {field['crops_observed']}, "
            f"scenarios {[s['id'] for s in field['scenarios']]}"
        )


if __name__ == "__main__":
    main()
