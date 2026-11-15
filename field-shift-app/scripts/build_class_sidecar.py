#!/usr/bin/env python3
"""Build `polygon-class-mt-2025.sqlite`, the Brazil class sidecar of CO-B5-02.

The sidecar holds, for every `Id` of the Mato Grosso Trazo3 extract published as
`trazo3_brazil_mato_grosso_2024.parquet`:

  area_ha     the polygon's area computed from the source polygon geometry, not
              from a tile fragment (geodesic area on the WGS84 ellipsoid, m2/10000)
  class_id    the class of the MapBiomas Collection 11 2025 raster by zonal mode
              (only with --raster; NULL otherwise, with the reason in build_meta)
  collection  11 and year 2025, the collection and year the class was computed
              against, NULL when no class was computed
  class_basis `zonal_mode` when the class came from the raster
  class_source the raster object and the pixel rule used
  mbmode24    the publisher's own per-polygon mode carried on the parquet, kept
              for audit only. It is 2024 and its collection is unverified (M-05),
              so it is never written into class_id.

The geometry, and therefore the area, come from the parquet, which the R-10
build used to tile the extract. That is the "source polygon geometry" the card
asks for; a tile fragment would count a polygon once per tile and understate it
(M-04).

Usage, area only:

  python scripts/build_class_sidecar.py \
      --parquet data/work/trazo3_brazil_mato_grosso_2024.parquet \
      --out data/polygons/polygon-class-mt-2025.sqlite

Usage with the Collection 11 raster, when a local copy of it exists:

  python scripts/build_class_sidecar.py \
      --parquet data/work/trazo3_brazil_mato_grosso_2024.parquet \
      --out data/polygons/polygon-class-mt-2025.sqlite \
      --raster /data/mapbiomas/brasil_coverage-col11_2025.tif \
      --raster-band 1 --collection 11 --year 2025 --label raster-run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pyarrow.parquet as pq
import shapely
from pyproj import Geod
from shapely.geometry import box

SCHEMA = """
CREATE TABLE polygon_class (
  Id           INTEGER PRIMARY KEY,
  area_ha      REAL    NOT NULL,
  class_id     INTEGER,
  collection   INTEGER,
  year         INTEGER,
  class_basis  TEXT,
  class_source TEXT,
  mbmode24     INTEGER
);
CREATE TABLE build_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
"""


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def geodesic_area_m2(geoms, geod: Geod) -> np.ndarray:
    """Signed geodesic area per geometry, in m2, sign dropped."""
    out = np.empty(len(geoms), dtype="float64")
    for index, geom in enumerate(geoms):
        if geom is None or geom.is_empty:
            out[index] = np.nan
            continue
        out[index] = abs(geod.geometry_area_perimeter(geom)[0])
    return out


def sample_overlaps(geoms: list, ids: list, latitude: float) -> tuple[int, int, float]:
    """Count overlapping polygon pairs in a sample of the input.

    A shared pixel can only be burned with one polygon id, so two polygons that
    overlap would steal pixels from each other and neither count would be a
    clean zonal statistic. Trazo3 fields are disjoint by construction, and this
    measures it instead of assuming it: the sample, the number of pairs whose
    intersection has a positive area, and the largest such overlap in m2
    (approximated from degrees with the sample's own latitude).
    """
    if len(geoms) < 2:
        return len(geoms), 0, 0.0
    tree = shapely.STRtree(geoms)
    pairs = tree.query(geoms, predicate="intersects")
    seen = set()
    overlaps = 0
    largest = 0.0
    metres_per_degree = 111320.0 * max(np.cos(np.radians(latitude)), 0.1)
    for left, right in zip(pairs[0], pairs[1]):
        if left >= right:
            continue
        key = (int(left), int(right))
        if key in seen:
            continue
        seen.add(key)
        area = shapely.intersection(geoms[left], geoms[right]).area
        if area > 1e-12:
            overlaps += 1
            largest = max(largest, area * metres_per_degree * metres_per_degree)
    return len(geoms), overlaps, largest


class RasterZonalMode:
    """Zonal mode of a categorical raster over polygon rings, in row stripes.

    Each stripe of the raster is read once, clipped to the column span the
    polygons actually occupy. The polygons that intersect the stripe are burned
    onto it with their `Id`, and the (Id, class) pairs are counted in chunks of
    columns, so memory stays bounded and the cost is linear in raster pixels
    rather than in polygons. A pixel belongs to a polygon when its centre falls
    inside the ring (GDAL's default, `all_touched=False`), which is the rule
    `zonal mode` names here.
    """

    PACK = 100000  # wider than any MapBiomas code, so Id * PACK + class stays exact

    def __init__(
        self,
        raster_path: Path,
        band: int,
        ignore: list[int],
        stripe_rows: int = 512,
        column_chunk: int = 8192,
    ):
        import rasterio  # imported here so the area-only run needs no GDAL wheel

        self.rasterio = rasterio
        self.path = raster_path
        self.band = band
        self.ignore = set(ignore)
        self.stripe_rows = stripe_rows
        self.column_chunk = column_chunk
        self.dataset = rasterio.open(raster_path)

    def close(self) -> None:
        self.dataset.close()

    def mode_for(self, ids: np.ndarray, geoms, bboxes: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Return (class per polygon, counted pixels per polygon).

        A polygon that holds no pixel, or only ignored classes, gets class -1
        and 0 pixels, which the caller writes as NULL.
        """
        from rasterio.features import rasterize
        from rasterio.windows import Window

        counts: dict[int, dict[int, int]] = {int(value): {} for value in ids}
        transform = self.dataset.transform
        left = min(transform.c, transform.c + transform.a * self.dataset.width)
        top = max(transform.f, transform.f + transform.e * self.dataset.height)

        # Clip the stripe range and the column range to the polygons, so a state
        # mosaic is not read across its whole width for one state's polygons.
        col_lo = int(max(0, np.floor((bboxes[:, 0].min() - left) / transform.a)))
        col_hi = int(min(self.dataset.width, np.ceil((bboxes[:, 2].max() - left) / transform.a)))
        row_lo = int(max(0, np.floor((top - bboxes[:, 3].max()) / -transform.e)))
        row_hi = int(min(self.dataset.height, np.ceil((top - bboxes[:, 1].min()) / -transform.e)))
        col_lo = max(col_lo, 0)
        col_hi = min(col_hi, self.dataset.width)
        width = col_hi - col_lo
        if width <= 0 or row_hi <= row_lo:
            raise RuntimeError("no polygon intersects the raster")
        window_left = left + col_lo * transform.a
        window_right = left + col_hi * transform.a

        # An index over the polygon boxes, so a stripe asks "which polygons reach
        # into this band" instead of scanning all of them.
        tree = shapely.STRtree([box(*bounds) for bounds in bboxes])

        for row0 in range(row_lo, row_hi, self.stripe_rows):
            row1 = min(row0 + self.stripe_rows, row_hi)
            stripe_top = top - row0 * -transform.e
            stripe_bottom = top - row1 * -transform.e
            band = box(window_left, stripe_bottom, window_right, stripe_top)
            selected = [int(index) for index in tree.query(band) if bboxes[index, 2] >= window_left and bboxes[index, 0] <= window_right]
            if not selected:
                continue

            window = Window(col_lo, row0, width, row1 - row0)
            block = self.dataset.read(self.band, window=window)
            if block.size == 0:
                continue
            burned = rasterize(
                ((geoms[index], int(ids[index])) for index in selected),
                out_shape=block.shape,
                transform=self.rasterio.windows.transform(window, transform),
                fill=0,
                dtype="int32",
                all_touched=False,
            )
            mask = burned > 0
            if not mask.any():
                continue
            burned = burned[mask]
            classes = block[mask]

            for start in range(0, burned.size, self.column_chunk):
                stop = start + self.column_chunk
                chunk_ids = burned[start:stop].astype("int64")
                chunk_classes = classes[start:stop].astype("int64")
                for ignored in self.ignore:
                    keep = chunk_classes != ignored
                    chunk_ids = chunk_ids[keep]
                    chunk_classes = chunk_classes[keep]
                if chunk_ids.size == 0:
                    continue
                packed = chunk_ids * self.PACK + chunk_classes
                unique, pair_counts = np.unique(packed, return_counts=True)
                for value, count in zip(unique, pair_counts):
                    polygon = int(value // self.PACK)
                    class_id = int(value % self.PACK)
                    bucket = counts.get(polygon)
                    if bucket is not None:
                        bucket[class_id] = bucket.get(class_id, 0) + int(count)

        result = np.full(len(ids), -1, dtype="int64")
        pixels = np.zeros(len(ids), dtype="int64")
        for index, polygon in enumerate(ids):
            bucket = counts.get(int(polygon)) or {}
            if not bucket:
                continue
            # ties resolve to the smaller class id, so the build is deterministic
            best = max(sorted(bucket.items()), key=lambda item: item[1])
            result[index] = best[0]
            pixels[index] = sum(bucket.values())
        return result, pixels


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--raster", type=Path, default=None)
    parser.add_argument("--raster-band", type=int, default=1)
    parser.add_argument("--collection", type=int, default=11)
    parser.add_argument("--year", type=int, default=2025)
    parser.add_argument("--ignore-class", type=int, nargs="*", default=[0])
    parser.add_argument("--batch-size", type=int, default=25000)
    parser.add_argument("--limit", type=int, default=None, help="build only the first N rows (tests)")
    parser.add_argument("--label", default="")
    args = parser.parse_args()

    if args.raster is not None and not args.raster.exists():
        raise SystemExit(f"raster not found: {args.raster}")
    if args.out.exists():
        raise SystemExit(f"{args.out} exists; remove it or choose another path")

    started = time.time()
    parquet_file = pq.ParquetFile(args.parquet)
    total = parquet_file.metadata.num_rows
    rows_wanted = min(total, args.limit) if args.limit else total

    zonal = None
    if args.raster is not None:
        zonal = RasterZonalMode(args.raster, args.raster_band, args.ignore_class)

    geod = Geod(ellps="WGS84")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(args.out)
    connection.execute("PRAGMA journal_mode=OFF")
    connection.execute("PRAGMA synchronous=OFF")
    connection.executescript(SCHEMA)

    insert = (
        "INSERT INTO polygon_class "
        "(Id, area_ha, class_id, collection, year, class_basis, class_source, mbmode24) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )

    written = 0
    class_null = 0
    class_counts: dict[int, int] = {}
    area_total_ha = 0.0
    area_min = float("inf")
    area_max = 0.0
    degenerate = 0
    sample_geoms: list = []
    sample_ids: list = []
    sample_step = max(1, rows_wanted // 5000)
    latitude_total = 0.0
    latitude_n = 0
    class_source = None
    if zonal is not None:
        class_source = (
            f"{args.raster.name} band {args.raster_band}, zonal mode over pixels whose centre "
            f"falls in the ring, class {'/'.join(str(value) for value in args.ignore_class)} ignored, "
            "ties resolved to the smaller class id"
        )

    batch_started = time.time()
    for batch in parquet_file.iter_batches(
        batch_size=args.batch_size,
        columns=["Id", "mbmode24", "geometry", "bbox"],
    ):
        if written >= rows_wanted:
            break
        columns = batch.to_pydict()
        ids = np.asarray(columns["Id"], dtype="int64")
        modes = columns["mbmode24"]
        geoms = shapely.from_wkb(columns["geometry"])
        bbox_dict = columns["bbox"]
        bboxes = np.array(
            [[row["xmin"], row["ymin"], row["xmax"], row["ymax"]] for row in bbox_dict],
            dtype="float64",
        )

        areas_m2 = geodesic_area_m2(geoms, geod)
        areas_ha = areas_m2 / 10000.0

        if zonal is None:
            classes = np.full(len(ids), -1, dtype="int64")
        else:
            classes, _pixels = zonal.mode_for(ids, geoms, bboxes)

        payload = []
        for index in range(len(ids)):
            if written >= rows_wanted:
                break
            area_ha = float(areas_ha[index])
            if not np.isfinite(area_ha) or area_ha <= 0:
                degenerate += 1
            class_id = int(classes[index])
            if zonal is None or class_id < 0:
                row_class = None
                row_collection = None
                row_year = None
                row_basis = None
                row_source = None
                class_null += 1
            else:
                row_class = class_id
                row_collection = args.collection
                row_year = args.year
                row_basis = "zonal_mode"
                row_source = class_source
                class_counts[class_id] = class_counts.get(class_id, 0) + 1
            payload.append(
                (
                    int(ids[index]),
                    round(area_ha, 6),
                    row_class,
                    row_collection,
                    row_year,
                    row_basis,
                    row_source,
                    int(modes[index]) if modes[index] is not None else None,
                )
            )
            written += 1
            area_total_ha += area_ha
            area_min = min(area_min, area_ha)
            area_max = max(area_max, area_ha)
            if written % sample_step == 0 and len(sample_geoms) < 5000:
                sample_geoms.append(geoms[index])
                sample_ids.append(int(ids[index]))
                latitude_total += float((bboxes[index, 1] + bboxes[index, 3]) / 2.0)
                latitude_n += 1

        connection.executemany(insert, payload)
        connection.commit()
        elapsed = time.time() - batch_started
        print(
            f"  {written}/{rows_wanted} rows, {elapsed:.1f}s, "
            f"{written / max(elapsed, 1e-9):.0f} rows/s",
            flush=True,
        )

    if zonal is not None:
        zonal.close()

    sample_n, sample_overlap_pairs, sample_overlap_largest_m2 = sample_overlaps(
        sample_geoms,
        sample_ids,
        latitude_total / latitude_n if latitude_n else -12.0,
    )

    meta = {
        "schema_version": "1",
        "label": args.label,
        "built_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "rows": str(written),
        "parquet": str(args.parquet),
        "parquet_sha256": sha256(args.parquet),
        "parquet_bytes": str(args.parquet.stat().st_size),
        "source_rows": str(total),
        "area_method": "geodesic area on the WGS84 ellipsoid (pyproj Geod), m2 / 10000",
        "area_unit": "ha",
        "area_source": "the source polygon geometry of the parquet, not a tile fragment",
        "area_min_ha": f"{area_min:.6f}",
        "area_max_ha": f"{area_max:.6f}",
        "area_total_ha": f"{area_total_ha:.3f}",
        "degenerate_area_rows": str(degenerate),
        "class_rows": str(written - class_null),
        "class_null_rows": str(class_null),
        "class_counts": json.dumps(dict(sorted(class_counts.items()))),
        "overlap_sample_rows": str(sample_n),
        "overlap_sample_pairs": str(sample_overlap_pairs),
        "overlap_sample_largest_m2": f"{sample_overlap_largest_m2:.3f}",
        "overlap_sample_note": (
            "One in every (rows/5000) row was sampled and tested for positive-area overlap. A "
            "shared pixel can only carry one polygon id, so an overlapping pair would split its "
            "pixels between two polygons."
        ),
        "collection": str(args.collection) if zonal is not None else "",
        "year": str(args.year) if zonal is not None else "",
        "raster": str(args.raster) if args.raster is not None else "",
        "raster_sha256": sha256(args.raster) if args.raster is not None else "",
        "raster_band": str(args.raster_band) if zonal is not None else "",
        "class_source": class_source or "",
        "class_status": "computed" if zonal is not None else "not_computed",
        "class_not_computed_reason": (
            ""
            if zonal is not None
            else (
                "No MapBiomas Collection 11 2025 raster is reachable from this machine: the "
                "documented object brazil_coverage-col11_2025.tif answers 403 for anonymous "
                "callers and for the authenticated Google account, the MapBiomas download page "
                "says the map download is suspended, and no Google Cloud project here has the "
                "Earth Engine API enabled. class_id, collection and year are therefore NULL, not "
                "guessed; rerun this script with --raster once a local copy exists."
            )
        ),
    }
    connection.executemany(
        "INSERT INTO build_meta (key, value) VALUES (?, ?)",
        [(key, str(value)) for key, value in meta.items()],
    )
    connection.commit()
    connection.close()

    elapsed = time.time() - started
    print()
    print(f"rows: {written}")
    print(f"class rows: {written - class_null}, class null: {class_null}")
    print(f"area total: {area_total_ha:,.1f} ha, min {area_min:.4f}, max {area_max:.2f}")
    print(f"degenerate areas: {degenerate}")
    print(f"output: {args.out} ({args.out.stat().st_size / 1e6:.1f} MB)")
    print(f"sha256: {sha256(args.out)}")
    print(f"elapsed: {elapsed:.1f}s")


if __name__ == "__main__":
    main()
