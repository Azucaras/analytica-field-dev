#!/usr/bin/env python3
"""Acceptance checks for `polygon-class-mt-2025.sqlite` (CO-B5-02, Table C).

What this proves, and from which source:

  rows        every `Id` of the parquet is in the sidecar, once
  lookup      a lookup by `Id` answers class_id, collection, year and area_ha
  area        ten `Id`s spread across the file were re-read from the parquet and
              their area recomputed twice: geodesic on the WGS84 ellipsoid and
              planar in an equal-area projection. Both must agree with the
              sidecar's area_ha within one percent.
  publisher   the same ten rows are compared with the publisher's own
              `mbvalid_area_2024`, which is an independent area read; it is
              reported, not asserted, because the publisher's pixel rule is not
              documented

The class columns are reported as they are: this build computed no class,
because no MapBiomas Collection 11 2025 raster is reachable from this machine.
The script fails if a class is present without a raster recorded in build_meta,
which would mean a class had been invented.

  python scripts/verify_class_sidecar.py \
      --sqlite data/polygons/polygon-class-mt-2025.sqlite \
      --parquet data/work/trazo3_brazil_mato_grosso_2024.parquet
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
from pathlib import Path

import numpy as np
import pyarrow.parquet as pq
import shapely
from pyproj import Geod, Transformer

REPO = Path(__file__).resolve().parents[1]
GEOD = Geod(ellps="WGS84")
EQUAL_AREA = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)

failures: list[str] = []
checks = 0


def check(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(message)
        print(f"FAIL  {message}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rows_for(parquet: Path, wanted: set[int]) -> dict[int, tuple]:
    """Read only the row groups that hold the wanted Ids."""
    parquet_file = pq.ParquetFile(parquet)
    out: dict[int, tuple] = {}
    for group in range(parquet_file.metadata.num_row_groups):
        table = parquet_file.read_row_group(group, columns=["Id", "geometry", "mbvalid_area_2024"])
        ids = table.column("Id").to_pylist()
        if not wanted.intersection(ids):
            continue
        geoms = shapely.from_wkb(table.column("geometry").to_pylist())
        valid = table.column("mbvalid_area_2024").to_pylist()
        for index, value in enumerate(ids):
            if value in wanted:
                out[value] = (geoms[index], valid[index])
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite", type=Path, default=REPO / "data/polygons/polygon-class-mt-2025.sqlite")
    parser.add_argument("--parquet", type=Path, default=REPO / "data/work/trazo3_brazil_mato_grosso_2024.parquet")
    parser.add_argument("--sample", type=int, default=10)
    parser.add_argument("--json-out", type=Path, default=None)
    args = parser.parse_args()

    connection = sqlite3.connect(args.sqlite)
    connection.row_factory = sqlite3.Row
    meta = {row["key"]: row["value"] for row in connection.execute("select key, value from build_meta")}

    total_parquet = pq.ParquetFile(args.parquet).metadata.num_rows
    sidecar_rows = connection.execute("select count(*) from polygon_class").fetchone()[0]
    print(f"rows: sidecar {sidecar_rows}, parquet {total_parquet}")
    check(sidecar_rows == total_parquet, "the sidecar does not hold one row per parquet row")
    check(int(meta["rows"]) == sidecar_rows, "build_meta rows does not match the table")

    check(meta["parquet_sha256"] == sha256(args.parquet), "build_meta does not name this parquet")
    check(meta["source_rows"] == str(total_parquet), "build_meta source_rows differs")

    # every Id, once, and no Id the parquet does not carry
    ids_table = pq.read_table(args.parquet, columns=["Id"]).column("Id").to_numpy().astype("int64")
    sidecar_ids = connection.execute("select Id from polygon_class order by Id").fetchall()
    sidecar_idset = np.array([row[0] for row in sidecar_ids], dtype="int64")
    check(len(np.unique(sidecar_idset)) == sidecar_idset.size, "the sidecar holds a duplicated Id")
    check(
        np.array_equal(np.sort(ids_table), sidecar_idset),
        "the sidecar's Id set differs from the parquet's",
    )

    # the class state is stated, not implied
    print(f"class_status: {meta['class_status']}")
    print(f"class rows: {meta['class_rows']}, null rows: {meta['class_null_rows']}")
    if meta["class_status"] == "computed":
        check(meta["raster"] != "", "a computed class with no raster recorded")
        check(meta["raster_sha256"] != "", "a computed class with no raster sha256 recorded")
        check(meta["collection"] == "11" and meta["year"] == "2025", "a computed class with the wrong collection or year")
        check(int(meta["class_rows"]) > 0, "a computed class with no class rows")
    else:
        nulls = connection.execute(
            "select count(*) from polygon_class where class_id is null and collection is null and year is null"
        ).fetchone()[0]
        check(nulls == sidecar_rows, "a class was written while build_meta says no raster was used")

    # the acceptance spot check: ten Ids spread across the file
    positions = np.linspace(0, total_parquet - 1, args.sample, dtype="int64")
    wanted = {int(ids_table[index]) for index in positions}
    print()
    print(f"spot check: {len(wanted)} Ids, re-read from the parquet")
    rows = rows_for(args.parquet, wanted)
    check(len(rows) == len(wanted), "the parquet did not answer every sampled Id")

    worst = 0.0
    publisher_deltas = []
    results = []
    for polygon_id in sorted(wanted):
        row = connection.execute(
            "select class_id, collection, year, area_ha from polygon_class where Id = ?",
            (polygon_id,),
        ).fetchone()
        check(row is not None, f"{polygon_id}: no sidecar row")
        if row is None:
            continue
        keys = set(row.keys())
        check(
            keys == {"class_id", "collection", "year", "area_ha"},
            f"{polygon_id}: the lookup does not answer class, collection, year and area_ha",
        )
        geom, valid_m2 = rows[polygon_id]
        area_geod = abs(GEOD.geometry_area_perimeter(geom)[0]) / 10000.0
        projected = shapely.transform(geom, lambda c: np.column_stack(EQUAL_AREA.transform(c[:, 0], c[:, 1])))
        area_equal = abs(shapely.area(projected)) / 10000.0
        delta_geod = abs(row["area_ha"] - area_geod) / area_geod
        delta_equal = abs(row["area_ha"] - area_equal) / area_equal
        worst = max(worst, delta_geod, delta_equal)
        check(delta_geod < 0.01, f"{polygon_id}: area_ha differs from the geodesic area by {delta_geod * 100:.4f}%")
        check(delta_equal < 0.01, f"{polygon_id}: area_ha differs from the equal-area area by {delta_equal * 100:.4f}%")
        delta_pub = abs(row["area_ha"] - valid_m2 / 10000.0) / (valid_m2 / 10000.0)
        publisher_deltas.append(delta_pub)
        results.append(
            {
                "Id": polygon_id,
                "area_ha": row["area_ha"],
                "area_geodesic_ha": round(area_geod, 6),
                "area_equal_area_ha": round(area_equal, 6),
                "publisher_mbvalid_area_ha": round(valid_m2 / 10000.0, 6),
                "delta_geodesic_pct": round(delta_geod * 100, 6),
                "delta_equal_area_pct": round(delta_equal * 100, 6),
                "delta_publisher_pct": round(delta_pub * 100, 6),
                "class_id": row["class_id"],
                "collection": row["collection"],
                "year": row["year"],
            }
        )
        print(
            f"  Id {polygon_id:<10} area_ha {row['area_ha']:>12.4f} | geodesic {area_geod:>12.4f} "
            f"({delta_geod * 100:.5f}%) | equal area {area_equal:>12.4f} ({delta_equal * 100:.5f}%) "
            f"| publisher {valid_m2 / 10000.0:>12.4f} ({delta_pub * 100:.3f}%)"
        )

    print()
    print(f"worst deviation from a recomputed geometry area: {worst * 100:.6f}%")
    check(worst < 0.01, "a sampled area_ha is more than one percent away from a geometry-derived area")
    if publisher_deltas:
        print(
            f"publisher mbvalid_area_2024: median delta {np.median(publisher_deltas) * 100:.3f}%, "
            f"max {max(publisher_deltas) * 100:.3f}%"
        )

    summary = {
        "rows": sidecar_rows,
        "class_status": meta["class_status"],
        "area_total_ha": meta["area_total_ha"],
        "area_min_ha": meta["area_min_ha"],
        "area_max_ha": meta["area_max_ha"],
        "degenerate_area_rows": meta["degenerate_area_rows"],
        "overlap_sample": {
            "rows": meta["overlap_sample_rows"],
            "pairs": meta["overlap_sample_pairs"],
            "largest_m2": meta["overlap_sample_largest_m2"],
        },
        "spot_check": results,
        "worst_deviation_pct": round(worst * 100, 6),
        "checks": checks,
        "failures": failures,
    }
    if args.json_out:
        args.json_out.write_text(json.dumps(summary, indent=1) + "\n", encoding="utf-8")
        print(f"json: {args.json_out}")

    connection.close()
    print()
    print(f"checks: {checks}, failures: {len(failures)}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
