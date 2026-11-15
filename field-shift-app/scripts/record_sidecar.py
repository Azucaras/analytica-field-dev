#!/usr/bin/env python3
"""Write the build record of `polygon-class-mt-2025.sqlite`.

The sidecar is a binary under `data/polygons/`, which `.gitignore` keeps out of
the tree the same way it keeps the PMTiles files out. This record is the small,
versioned file that names the product, its size, its sha256, its row count and
the `build_meta` the build wrote into it, so a later card can check that the
file it loaded is the file that was built.

  python scripts/record_sidecar.py \
      --sqlite data/polygons/polygon-class-mt-2025.sqlite \
      --out data/polygons/polygon-class-mt-2025.build.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def versions() -> dict[str, str]:
    out = {"python": platform.python_version(), "platform": platform.platform()}
    for module in ("numpy", "pyarrow", "shapely", "pyproj", "rasterio"):
        try:
            out[module] = __import__(module).__version__
        except Exception:  # noqa: BLE001 - a missing optional module is not an error here
            out[module] = "absent"
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--command", default="")
    args = parser.parse_args()

    connection = sqlite3.connect(args.sqlite)
    meta = dict(connection.execute("select key, value from build_meta").fetchall())
    rows = connection.execute("select count(*) from polygon_class").fetchone()[0]
    connection.close()

    record = {
        "product": "polygon-class-mt-2025.sqlite",
        "spec": "block 5 R-10 and Table C, CO-B5-02",
        "purpose": (
            "Per `Id` answer for the Brazil readout: `class` (class_id), the collection and year "
            "it was computed against, and `area_ha` from the source polygon geometry."
        ),
        "path": str(args.sqlite),
        "bytes": args.sqlite.stat().st_size,
        "sha256": sha256(args.sqlite),
        "rows": rows,
        "recorded_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "command": args.command,
        "versions": versions(),
        "build_meta": meta,
        "read_me": (
            "class_status says whether a class was computed. If it is not_computed, class_id, "
            "collection and year are NULL on every row and class_not_computed_reason in build_meta "
            "says why; the area_ha column is complete in either case."
        ),
    }
    args.out.write_text(json.dumps(record, indent=1) + "\n", encoding="utf-8")
    print(f"record: {args.out}")
    print(f"rows: {rows}, bytes: {record['bytes']}, sha256: {record['sha256']}")
    print(f"class_status: {meta.get('class_status')}")


if __name__ == "__main__":
    main()
