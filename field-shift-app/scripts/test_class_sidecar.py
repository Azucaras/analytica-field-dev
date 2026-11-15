#!/usr/bin/env python3
"""Checks for the zonal mode of `build_class_sidecar.py` on a synthetic raster.

The build cannot be run against the MapBiomas Collection 11 2025 raster on this
machine, so the raster half of the build is exercised here instead: a small
categorical raster with known pixel counts, polygons whose modal class is known
by hand, and a brute force reference that reads the raster one polygon at a
time. Any disagreement between the striped implementation and the reference is
a failure.

  python scripts/test_class_sidecar.py
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.windows import Window
from shapely.geometry import box

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_class_sidecar import RasterZonalMode  # noqa: E402

ROWS, COLS = 120, 120
RES = 30.0
ORIGIN_X, ORIGIN_Y = 500000.0, 8200000.0


def build_raster(path: Path) -> np.ndarray:
    data = np.zeros((ROWS, COLS), dtype="uint8")
    data[0:40, 0:40] = 39          # soy
    data[0:40, 40:80] = 15         # pasture
    data[40:80, 0:40] = 41         # other temporary crops
    data[40:80, 40:80] = 62        # cotton
    data[80:120, 0:120] = 0        # unmapped
    data[0:120, 80:120] = 3        # forest column on the right
    transform = rasterio.transform.from_origin(ORIGIN_X, ORIGIN_Y, RES, RES)
    with rasterio.open(
        path,
        "w",
        driver="GTiff",
        height=ROWS,
        width=COLS,
        count=1,
        dtype="uint8",
        crs="EPSG:32721",
        transform=transform,
        nodata=None,
    ) as dataset:
        dataset.write(data, 1)
    return data


def pixel_box(col0: int, row0: int, col1: int, row1: int):
    """A polygon covering columns [col0, col1) and rows [row0, row1) exactly."""
    x0 = ORIGIN_X + col0 * RES
    x1 = ORIGIN_X + col1 * RES
    y1 = ORIGIN_Y - row0 * RES
    y0 = ORIGIN_Y - row1 * RES
    return box(x0, y0, x1, y1)


def reference_mode(data: np.ndarray, polygon, ignore: set[int]) -> tuple[int, int]:
    """Brute force: read the polygon's window and count its pixels one by one."""
    transform = rasterio.transform.from_origin(ORIGIN_X, ORIGIN_Y, RES, RES)
    x0, y0, x1, y1 = polygon.bounds
    col0 = max(0, int(round((x0 - ORIGIN_X) / RES)))
    col1 = min(COLS, int(round((x1 - ORIGIN_X) / RES)))
    row0 = max(0, int(round((ORIGIN_Y - y1) / RES)))
    row1 = min(ROWS, int(round((ORIGIN_Y - y0) / RES)))
    if col1 <= col0 or row1 <= row0:
        return -1, 0
    window = Window(col0, row0, col1 - col0, row1 - row0)
    block = data[row0:row1, col0:col1]
    inside = geometry_mask(
        [polygon],
        out_shape=block.shape,
        transform=rasterio.windows.transform(window, transform),
        invert=True,
    )
    values = block[inside]
    values = values[~np.isin(values, list(ignore))]
    if values.size == 0:
        return -1, 0
    classes, counts = np.unique(values, return_counts=True)
    order = np.lexsort((classes, -counts))
    return int(classes[order[0]]), int(values.size)


def main() -> None:
    failures = 0
    with tempfile.TemporaryDirectory() as tmp:
        raster_path = Path(tmp) / "synthetic-col11.tif"
        data = build_raster(raster_path)

        polygons = {
            # a polygon wholly inside one class block: class 39, 1600 pixels
            101: pixel_box(0, 0, 40, 40),
            # a polygon over the 41/62 boundary with a clear majority: 62
            102: pixel_box(30, 42, 60, 52),
            # a polygon wholly inside the unmapped area, class 0 only
            103: pixel_box(0, 90, 40, 110),
            # a polygon split evenly between 41 and 62, a tie
            104: pixel_box(30, 60, 50, 70),
            # a polygon that crosses stripes and the 15/62 boundary: majority 15
            105: pixel_box(60, 0, 80, 60),
        }

        zone = RasterZonalMode(raster_path, 1, [0], stripe_rows=17, column_chunk=97)
        ids = np.array(sorted(polygons), dtype="int64")
        geoms = [polygons[int(value)] for value in ids]
        bboxes = np.array([geom.bounds for geom in geoms], dtype="float64")
        classes, pixels = zone.mode_for(ids, geoms, bboxes)
        zone.close()

        for index, polygon_id in enumerate(ids):
            expected_class, expected_pixels = reference_mode(data, polygons[int(polygon_id)], {0})
            ok = int(classes[index]) == expected_class and int(pixels[index]) == expected_pixels
            if not ok:
                failures += 1
            print(
                f"{'ok  ' if ok else 'FAIL'} Id {polygon_id}: striped=({classes[index]}, {pixels[index]} px) "
                f"reference=({expected_class}, {expected_pixels} px)"
            )

        # the tie must resolve to the smaller class id, not to whichever came first
        tie_index = list(ids).index(104)
        if int(classes[tie_index]) != 41:
            failures += 1
            print(f"FAIL Id 104: a tie resolved to {classes[tie_index]}, expected 41")

        # a polygon whose pixels are all ignored is not assigned a class
        unmapped_index = list(ids).index(103)
        if int(classes[unmapped_index]) != -1:
            failures += 1
            print("FAIL Id 103: a polygon over class 0 was given a class")

    print()
    print("failures:", failures)
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
