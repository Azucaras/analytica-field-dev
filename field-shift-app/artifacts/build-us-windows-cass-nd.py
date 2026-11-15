#!/usr/bin/env python3
"""Rebuild artifacts/us-windows-cass-nd.json byte for byte.

Inputs (downloads, see the finding document for the access path):
  1. North Dakota Agricultural Statistics 2025, NASS North Dakota Field Office,
     PDF, 146 pages. The window table is page 20 of the printed report,
     "Usual Planting and Harvesting Dates by Crop - North Dakota: 20-Year Average".
  2. The CDL raster attribute table, used only for the CDL code and the CDL
     spelling that the join in the finding document rests on.

Both files are hashed before parsing and the hashes must equal the recorded
ones, so a changed upstream document fails loudly instead of silently
producing a new window.

Usage:
  python3 build-us-windows-cass-nd.py --bulletin us-nd-bulletin25.pdf \
      --rat cdl-rat.json --out us-windows-cass-nd.json
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request

BULLETIN_SHA256 = "688b2db2039c7300538b0bfaaf02c754e615795d9fa372bd7a478cd3c22cbda6"
RAT_SHA256 = "8b5cec2ff965a2d1f7f1205111b3a0fbe3cce5ed82cb0ef6a446ae304fe0b699"

RETRIEVED = "2026-11-14"
BULLETIN_URL = (
    "https://www.nass.usda.gov/sites/default/files/Statistics_by_State/North_Dakota/"
    "Publications/Annual_Statistical_Bulletin/2025/ND-Annual-Bulletin25.pdf"
)
RAT_URL = "https://pdi.scinet.usda.gov/image/rest/services/CDL_WM/ImageServer/rasterAttributeTable?f=json"

# The four crops of the demo, with the exact source label each one is read from.
# "None" as the source label means the source holds no row for that crop.
CROPS = [
    {"crop": "Corn", "source_label": "Corn for grain", "cdl_code": 1},
    {"crop": "Soybeans", "source_label": "Soybeans", "cdl_code": 5},
    {"crop": "Spring wheat", "source_label": "Wheat, spring", "cdl_code": 23},
    {"crop": "Canola", "source_label": None, "cdl_code": 31},
]

MONTHS = {
    "January": "01", "February": "02", "March": "03", "April": "04",
    "May": "05", "June": "06", "July": "07", "August": "08",
    "September": "09", "October": "10", "November": "11", "December": "12",
}

DATE = r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}"
ROW = re.compile(r"^(?P<label>[A-Z][A-Za-z ,]+?)\s*[.\s]{2,}"
                 r"(?P<begin>" + DATE + r")\s+"
                 r"(?P<active_start>" + DATE + r")-(?P<active_end>" + DATE + r")\s+"
                 r"(?P<end>" + DATE + r")")


def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def md_of(text):
    """'May 2' -> '05-02'. The window is a calendar date with no year."""
    month, day = text.split()
    return f"{MONTHS[month]}-{int(day):02d}"


def page_text(pdf_path):
    """Layout preserving text of the PDF, split into pages on form feed."""
    out = subprocess.run(["pdftotext", "-layout", pdf_path, "-"],
                         capture_output=True, check=True)
    return out.stdout.decode("utf-8", "replace").split("\f")


def find_window_table(pages):
    for index, page in enumerate(pages, start=1):
        if "Usual Planting and Harvesting Dates by Crop" in page and "20-Year Average" in page:
            printed = None
            first = page.strip().splitlines()[0].strip()
            head = first.split(" ", 1)[0]
            if head.isdigit():
                printed = int(head)
            return index, printed, page
    raise SystemExit("the window table was not found in the bulletin")


def parse_rows(page):
    rows = {}
    for line in page.splitlines():
        match = ROW.match(line)
        if not match:
            continue
        label = match.group("label").strip(" .")
        if label not in rows:
            rows[label] = match.groupdict()
    return rows


def cdl_names(rat_path):
    with open(rat_path) as fh:
        rat = json.load(fh)
    names = {}
    for feature in rat["features"]:
        attrs = feature["attributes"]
        names[int(attrs["Value"])] = attrs["Class_Names"]
    return names


def build(bulletin_path, rat_path, out_path):
    bulletin_sha = sha256_of(bulletin_path)
    rat_sha = sha256_of(rat_path)
    if bulletin_sha != BULLETIN_SHA256:
        raise SystemExit(f"bulletin sha256 mismatch: {bulletin_sha}")
    if rat_sha != RAT_SHA256:
        raise SystemExit(f"CDL RAT sha256 mismatch: {rat_sha}")
    with open(bulletin_path, "rb") as fh:
        bulletin_bytes = len(fh.read())

    pages = page_text(bulletin_path)
    page_number, printed_page, page = find_window_table(pages)
    parsed = parse_rows(page)
    names = cdl_names(rat_path)

    rows = []
    for crop in CROPS:
        label = crop["source_label"]
        record = {
            "crop": crop["crop"],
            "crop_source_string": label,
            "season": "annual",
            "cdl_code": crop["cdl_code"],
            "cdl_name": names[crop["cdl_code"]],
        }
        if label is None or label not in parsed:
            record["window_start_md"] = None
            record["window_end_md"] = None
            record["most_active_md"] = None
            record["empty_reason"] = (
                "The source holds no row for this crop: the North Dakota table lists 16 crops "
                "and canola is not one of them."
            )
        else:
            match = parsed[label]
            record["window_start_md"] = md_of(match["begin"])
            record["window_start_text"] = " ".join(match["begin"].split())
            record["window_end_md"] = md_of(match["end"])
            record["window_end_text"] = " ".join(match["end"].split())
            record["most_active_md"] = {
                "start": md_of(match["active_start"]),
                "end": md_of(match["active_end"]),
            }
            record["most_active_text"] = (
                f"{' '.join(match['active_start'].split())} to {' '.join(match['active_end'].split())}"
            )
        record["source_record"] = {
            "table": "Usual Planting and Harvesting Dates by Crop - North Dakota: 20-Year Average",
            "pdf_page": page_number,
            "printed_page": printed_page,
            "row_label": label,
            "start_column": "(begin)",
            "end_column": "(end)",
        }
        rows.append(record)

    document = {
        "source_id": "nass-nd-bulletin-2025",
        "region": {
            "country": "US",
            "state": "North Dakota",
            "state_code_rma": "38",
            "county": "Cass",
            "county_fips": "38017",
            "note": "The source is per state. Cass County is named because the pilot is Cass County; the window is the North Dakota window, not a Cass County window.",
        },
        "grain": "state",
        "season_dimension": "none",
        "window_definition": {
            "begin": "about 5 percent of the crop planted",
            "end": "about 95 percent of the crop planted",
            "most_active": "the source's most active column, published in this bulletin without a percentage definition; the 2010 edition of the same handbook describes the most active range as 15 to 85 percent planted, and that edition could not be opened in this card",
            "basis": "20 years of historical crop progress estimates, stated in the table note of page 20",
            "stated_where": "the 5 percent and 95 percent definitions are stated in the introduction of NASS Agricultural Handbook 628 (1997 edition, read in this card); the 2025 bulletin restates only the 20 year basis",
        },
        "retrieved": RETRIEVED,
        "response": {
            "url": BULLETIN_URL,
            "sha256": bulletin_sha,
            "bytes": bulletin_bytes,
            "pages": len(pages) - 1,
        },
        "cdl_reference": {
            "url": RAT_URL,
            "sha256": rat_sha,
            "note": "Read only for the CDL code and the CDL spelling of each crop name.",
        },
        "rows": rows,
    }

    text = json.dumps(document, indent=1, ensure_ascii=False, sort_keys=True) + "\n"
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(text)
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    print(f"bulletin sha256 {bulletin_sha}")
    print(f"table page {page_number} (printed {printed_page}), crops parsed {sorted(parsed)}")
    print(f"wrote {out_path}, {len(text)} bytes, sha256 {digest}")
    return digest


def download(url, path):
    """Fetch one input if it is not already on disk, with a browser UA."""
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64)"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        body = resp.read()
    with open(path, "wb") as fh:
        fh.write(body)
    print(f"downloaded {url} -> {path}, {len(body)} bytes")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bulletin", default="us-nd-bulletin25.pdf")
    parser.add_argument("--rat", default="cdl-rat.json")
    parser.add_argument("--out", default="us-windows-cass-nd.json")
    parser.add_argument("--fetch", action="store_true",
                        help="download the two inputs first if they are absent")
    args = parser.parse_args()
    if args.fetch:
        download(BULLETIN_URL, args.bulletin)
        download(RAT_URL, args.rat)
    build(args.bulletin, args.rat, args.out)


if __name__ == "__main__":
    main()
