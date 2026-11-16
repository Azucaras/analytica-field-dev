"""MapBiomas Collection 11 rotation history from the polygon_mapbiomas sidecar (R-33 to R-36).

Local read only: the module imports no HTTP client and never touches the MapBiomas bucket (M-07).
Every class is identified by its (product, code) pair (R-34, Table D); a code alone resolves nothing.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

COLLECTION_LABEL = "MapBiomas Collection 11"
FIRST_CROP = "agriculture_first_crop"
SECOND_CROP = "agriculture_second_crop"
FIRST_YEARS = range(1985, 2026)
SECOND_YEARS = range(2000, 2026)
NO_ROW_CAUSE = "no MapBiomas Collection 11 row for this polygon"
NO_SECOND_CAUSE = "no second crop row for this polygon: the second crop product maps ten states only (M-19)"

# Table D: nine first crop classes and three second crop classes, each under its own product.
TABLE_D: dict[tuple[str, int], str] = {
    (FIRST_CROP, 39): "Soybean",
    (FIRST_CROP, 20): "Sugar cane",
    (FIRST_CROP, 40): "Rice",
    (FIRST_CROP, 62): "Cotton (beta)",
    (FIRST_CROP, 41): "Other temporary crops",
    (FIRST_CROP, 46): "Coffee",
    (FIRST_CROP, 47): "Citrus",
    (FIRST_CROP, 35): "Palm oil",
    (FIRST_CROP, 48): "Other perennial crops",
    (SECOND_CROP, 1): "Second crop corn",
    (SECOND_CROP, 62): "Second crop cotton",
    (SECOND_CROP, 41): "Other second crop",
}


def class_for(product: str, code: int | None) -> str | None:
    if code is None:
        return None
    return TABLE_D.get((product, int(code)))


def _gap(cause: str, source: str, status: str, remediation: str, as_of: str | None) -> dict[str, Any]:
    return {"section": "rotation", "cause": cause, "source": source, "status": status,
            "date": as_of, "remediation": remediation}


def rotation_section(db_path: Path, polygon_id: str) -> dict[str, Any]:
    source = f"{db_path.name}, table polygon_mapbiomas (CO-B6-01)"
    # Forward slashes on every OS: the path is part of the API payload, and Windows printed backslashes.
    shown_path = db_path.as_posix()
    section: dict[str, Any] = {
        "basis": "modelled",
        "source": source,
        "sidecar": shown_path,
        "collection": COLLECTION_LABEL,
        "collection_year": None,
        "as_of": None,
        "first_crop": None,
        "second_crop": None,
        "gaps": [],
    }
    if not db_path.is_file():
        section.update(state="unavailable", error=f"sidecar file absent: {shown_path}")
        section["gaps"].append(_gap(f"the polygon_mapbiomas sidecar is absent at {shown_path}", source,
                                    "file absent", "CO-B6-01", None))
        return section
    try:
        connection = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        try:
            has_table = connection.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='polygon_mapbiomas'").fetchone()
            if has_table is None:
                section.update(state="unavailable", error="table polygon_mapbiomas is absent from the sidecar")
                section["gaps"].append(_gap("table polygon_mapbiomas is absent from the sidecar", source,
                                            "table absent", "CO-B6-01", None))
                return section
            rows = connection.execute(
                "SELECT product, code, class_name, year, collection FROM polygon_mapbiomas WHERE polygon_id = ?",
                (polygon_id,),
            ).fetchall()
        finally:
            connection.close()
    except sqlite3.Error as error:
        section.update(state="unavailable", error=f"sidecar read failed: {error}")
        section["gaps"].append(_gap(f"sidecar read failed: {error}", source, "read failed", "CO-B6-01", None))
        return section

    if not rows:
        section.update(state="abstained")
        section["gaps"].append(_gap(NO_ROW_CAUSE, source, "no row", "CO-B6-01", None))
        return section

    by_key = {(product, year): (code, name, collection) for product, code, name, year, collection in rows}
    years = sorted({year for _, year in by_key})
    section["collection_year"] = max(years) if years else None
    section["as_of"] = f"{max(years)}-12-31" if years else None

    first = _product_rows(by_key, FIRST_CROP, FIRST_YEARS)
    second = _product_rows(by_key, SECOND_CROP, SECOND_YEARS)
    section["first_crop"] = first
    section["second_crop"] = second
    gaps = section["gaps"]
    for product, held in ((FIRST_CROP, first), (SECOND_CROP, second)):
        if held is None:
            cause = NO_SECOND_CAUSE if product == SECOND_CROP else "no first crop row for this polygon"
            gaps.append(_gap(cause, source, "no row", "CO-B6-11", section["as_of"]))
            continue
        missing_class = [row["year"] for row in held if row["class_name"] is None]
        if missing_class:
            gaps.append(_gap(
                f"class missing for {len(missing_class)} year(s) of {product}: class_id is NULL in the sidecar, "
                "no Collection 11 class is computed",
                source, "class not computed", "CO-B6-01", section["as_of"]))
    any_class = any(row["class_name"] is not None for row in (first or []) + (second or []))
    section["state"] = "ok" if any_class else "abstained"
    return section


def _product_rows(by_key: dict, product: str, years: range) -> list[dict[str, Any]] | None:
    if not any(key[0] == product for key in by_key):
        return None
    rows = []
    for year in years:
        held = by_key.get((product, year))
        if held is None:
            continue  # R-35: one row per year the sidecar carries, never a year it does not hold
        code, name, collection = held
        rows.append({"year": year, "product": product, "code": code,
                     "class_name": name if name is not None else class_for(product, code),
                     "collection": collection})
    return rows
