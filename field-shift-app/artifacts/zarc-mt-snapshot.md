# ZARC Mato Grosso planting-window snapshot: Santa Carmem (IBGE 5107248)

Task t_65ec8668. Read-only. CSVs downloaded 2026-11-14 (UTC 20:21 to 20:23). Output: `zarc-mt-snapshot.json` (same folder), 93 rows.

## Answer

- Municipality containing -55.27, -11.91: **Santa Carmem, MT, IBGE 5107248**. The three fixture fields (`mt-santa-carmem-01/02/03`, centres -55.27/-11.91, -55.24/-11.94, -55.21/-11.97) also fall in 5107248. The fixture JSON has no municipality field; the test used the coordinates only.
- Rows kept: **93 of 2,154,942 CSV data rows**. Safra 2026/2027: 54 of 1,127,969 CSV rows (54 of the 192 municipal rows). Safra 2025/2026: 39 of 1,026,973 CSV rows (39 of the 168 municipal rows).
- Crop coverage: all four crops are in both seasons. No window is missing for any kept row. Soil coverage is not uniform (section 4). Nothing was filled from memory.

## 1. Source

- CKAN package `tabua-de-risco-zoneamento-agricola-de-risco-climatico` (id `6d3d141c-885e-41a4-ab7f-dc8ff323b96f`), licence Creative Commons Attribution, `metadata_modified` 2026-11-13T07:11:58. Season resources used: 2026/2027 (`139e5a60-1f43-4cc8-aeab-a35dbbf816c0`, sha256 `b5d242f7...f5efe3`, 247,703,248 bytes) and 2025/2026 (`f9d597f9-0fee-47eb-9344-8642274ca9da`, sha256 `f49e6868...7267a9581`, 223,474,002 bytes). Full hashes are in the JSON.
- Data dictionary PDF (`bebb0ebb-bc75-460c-b900-a7a1ebd87bee`), sha256 `2143127c...4d917c`.
- Access: the host reset every curl connection with the default user agent. With `-A "Mozilla/5.0"` the same URLs returned HTTP 200. No credentials were used.

## 2. Column layout (55 columns, `;` separated, UTF-8 with BOM)

Key columns (type; example from a kept row): `Nome_cultura` text (Soja); `SafraIni` integer (2026); `SafraFin` integer (2027); `Cod_Cultura` integer (12016720000011); `Cod_Ciclo` integer (21 = Grupo II); `Cod_Solo` integer (11); `geocodigo` integer (5107248); `UF` text (MT); `municipio` text (Santa Carmem); `Cod_Outros_Manejos` integer (1 = Sequeiro); `Cod_Munic` text (051592, a SICOR code, not IBGE); `Portaria` text (Port.202_de_03-07-2026); `dec1` to `dec36` integer (values 0, 20, 30, 40).
The other columns (`Nome_Clima`, `Nome_Outros_Manejos`, `Produtividade`, `Cod_NM`, `Cod_Meso`, `Cod_Micro`, ...) are listed with type and example in the JSON under `sources[].csv_layout`.

Dictionary codes: `Cod_Ciclo` 20 Grupo I, 21 Grupo II, 22 Grupo III. `Cod_Solo` 1 Arenoso, 2 Textura Media, 3 Argiloso, 11 to 16 labelled AD1 to AD6 (no definition given).

## 3. Decendio rule and two checks

- 36 decendios per calendar year, 3 per month. For decendio n: month = (n-1)//3 + 1; part = (n-1) % 3 gives days 1 to 10, 11 to 20, and 21 to month end.
- Calendar year (my rule, not stated in the dictionary): decendios in Jul to Dec belong to SafraIni; Jan to Jun belong to SafraFin. This is inferred from the windows: soybean runs dec28 to dec1 (Oct 2026 to Jan 2027) and cotton runs dec36 to dec3 (Dec 2026 to Feb 2027), so the window crosses 31 Dec.
- Check 1, Soja 2026/2027, soil 11, cycle 20: raw dec1 = 20, dec28 = 30, dec36 = 20. Rule gives dec1 = 2027-01-01 to 2027-01-10, dec28 = 2026-10-01 to 2026-10-10, dec36 = 2026-12-21 to 2026-12-31. Window (all risk levels) = 2026-10-01 to 2027-01-10. Matches the JSON.
- Check 2, Milho 2a Safra 2026/2027, soil 13, cycle 20: raw dec1 to dec6 = 20, 20, 20, 20, 30, 40. dec4 = 2027-02-01 to 02-10, dec6 = 2027-02-21 to 02-28. Window (all) = 2027-01-01 to 2027-02-28. The 20-only window = 2027-01-01 to 2027-02-10. Matches the JSON.

## 4. Snapshot (envelope over soil groups and cycles)

| Season | Crop | Any non-zero cell | Cells equal to 20 |
|---|---|---|---|
| 2026/2027 | Soja | 2026-10-01 to 2027-01-10 | same |
| 2026/2027 | Milho 1a Safra | 2026-09-21 to 2026-12-31 | 2026-10-01 to 2026-12-31 |
| 2026/2027 | Milho 2a Safra | 2027-01-01 to 2027-03-10 | same |
| 2026/2027 | Algodao Herbaceo | 2026-12-21 to 2027-02-28 | 2026-12-21 to 2027-02-20 |
| 2025/2026 | Soja | 2025-10-01 to 2026-01-10 | same |
| 2025/2026 | Milho 1a Safra | 2025-10-01 to 2025-12-31 | 2025-10-11 to 2025-12-31 |
| 2025/2026 | Milho 2a Safra | 2026-01-01 to 2026-03-10 | 2026-01-01 to 2026-02-28 |
| 2025/2026 | Algodao Herbaceo | 2025-12-21 to 2026-02-28 | 2025-12-21 to 2026-02-20 |

| Season | Crop | Soil codes | Cycle codes | Rows | Portaria (as stated) |
|---|---|---|---|---|---|
| 2026/2027 | Soja | 11 to 16 | 20, 21, 22 | 18 | Port.202_de_03-07-2026 |
| 2026/2027 | Milho 1a Safra | 11 to 16 | 20, 21, 22 | 18 | Port.225_de_10-07-2026 |
| 2026/2027 | Milho 2a Safra | 11 to 16 | 20, 21 | 12 | Port.326_de_30-07-2026 |
| 2026/2027 | Algodao Herbaceo | 1 to 3 | 21, 22 | 6 | Port.176_de_03-06-2026 |
| 2025/2026 | Soja | 11 to 16 | 20, 21, 22 | 18 | Port.372_de_26-06-2025 |
| 2025/2026 | Milho 1a Safra | 1 to 3 | 20, 21, 22 | 9 | Port.182_de_27-05-2025 |
| 2025/2026 | Milho 2a Safra | 1 to 3 | 20, 21 | 6 | Port.390_de_26-08-2025 |
| 2025/2026 | Algodao Herbaceo | 1 to 3 | 21, 22 | 6 | Port.293_de_09-06-2025 |

All 93 rows are Sequeiro (rainfed). No irrigated row exists for these four crops here. Each row in the JSON carries its own portaria, `source_url`, `resource_id`, `csv_sha256` and the 36 raw decendio values.

## 5. Municipality call

- `GET https://servicodados.ibge.gov.br/api/v1/localidades/municipios/5107248` returns "Santa Carmem", microrregiao Sinop, MT.
- Point test: ray casting of (-55.27, -11.91) against the 141 polygons of `GET https://servicodados.ibge.gov.br/api/v3/malhas/estados/51?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=intermediaria&divisao=municipio&ano=2022` (file sha256 `ec3845b2...381a`). Only codarea 5107248 matched. The three fixture centres also match only 5107248. Distance to the boundary was not computed.

## 6. Ambiguities and limits

1. **Risk level.** The CSV has no risk-percent column. Cells hold 0, 20, 30 or 40, and the dictionary does not define them. I read 0 as outside the window and 20 as the recommended (lowest) risk level. The JSON gives both `window_risk_20` and `window_all_risk_levels`. This reading is an assumption.
2. **Year assignment** (Jul to Dec in SafraIni, Jan to Jun in SafraFin) is inferred from the wrap pattern, not stated in the data.
3. **Decendio-to-date convention** (1 to 10, 11 to 20, 21 to end) is standard but not stated in the dictionary.
4. **Soil codes are not comparable across seasons for maize.** 2025/2026 maize uses codes 1 to 3; 2026/2027 maize uses 11 to 16. Soybean uses 11 to 16 in both seasons; cotton uses 1 to 3 in both. No crosswalk is in the files. The AD1 to AD6 labels have no definition.
5. **Cultivar cycle** is a maturity group (Grupo I to III), not a cultivar name.
6. **Portarias** are reported as the CSV states them. I did not check them against the Diario Oficial.
7. **Excluded rows.** Not requested: "consorciado com Braquiaria" maize (30 municipal rows in 2026/2027, 15 in 2025/2026) and other crops (Feijao, Sorgo, Arroz, Amendoim, Girassol, Mamona, Feijao Caupi). Rows with blank or 0 `Produtividade` are kept; that column is not used.
8. `Algodao Herbaceo` is the CSV's name for cotton. `Cod_Munic` 051592 is the SICOR code; the IBGE code 5107248 is used throughout.
9. The CSVs are a daily-updated public resource. The sha256 pins the files read here; a later download may differ.

## 7. Reproduce

```bash
mkdir -p zarc-src && cd zarc-src
B=https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f/resource
curl -sS -A "Mozilla/5.0" -o safra-2026-2027.csv "$B/139e5a60-1f43-4cc8-aeab-a35dbbf816c0/download/dados-abertos-tabua-de-risco-safra-2026-2027.csv"
curl -sS -A "Mozilla/5.0" -o safra-2025-2026.csv "$B/f9d597f9-0fee-47eb-9344-8642274ca9da/download/dados-abertos-tabua-de-risco-safra-2025-2026.csv"
sha256sum safra-2026-2027.csv safra-2025-2026.csv   # expect b5d242f7...f5efe3 and f49e6868...7267a9581
# copy the script in Appendix A to zarc-src/zarc_extract.py, then:
python3 zarc_extract.py . ../field-shift-app/artifacts/zarc-mt-snapshot.json
sha256sum ../field-shift-app/artifacts/zarc-mt-snapshot.json   # expect b53c8a7be60948fccb72e5cfa108b95debfdd932f5f15b315363d42a332dfde9
```

The script is stdlib only and runs in about 20 seconds. The municipality step (section 5) is not in the script; the code 5107248 is a constant in it, cited above. The check run: JSON parses; 93 rows; 0 windows with start after end; every row has portaria and source_url; per-crop counts match section 4.

## Appendix A: zarc_extract.py (verbatim)

```python
#!/usr/bin/env python3
"""Extract Santa Carmem (IBGE 5107248, MT) planting windows from the ZARC Tabua de Risco CSVs.

Usage: python3 zarc_extract.py CSV_DIR OUT_JSON
CSV_DIR must hold safra-2026-2027.csv and safra-2025-2026.csv (downloaded from the URLs in the JSON).
Stdlib only. Deterministic: no timestamps, no set iteration order in the output.
"""
import calendar
import csv
import hashlib
import json
import os
import re
import sys

MUN = "5107248"
MUN_NAME = "Santa Carmem"
DOWNLOAD_DATE = "2026-11-14"
CROP_ORDER = ["Soja", "Milho 1ª Safra", "Milho 2ª Safra", "Algodão Herbáceo"]
BASE = "https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f/resource"
FILES = [
    ("2026/2027", "safra-2026-2027.csv", "139e5a60-1f43-4cc8-aeab-a35dbbf816c0",
     "dados-abertos-tabua-de-risco-safra-2026-2027.csv"),
    ("2025/2026", "safra-2025-2026.csv", "f9d597f9-0fee-47eb-9344-8642274ca9da",
     "dados-abertos-tabua-de-risco-safra-2025-2026.csv"),
]
SOIL = {"1": "Arenoso", "2": "Textura Média", "3": "Argiloso", "11": "AD1", "12": "AD2",
        "13": "AD3", "14": "AD4", "15": "AD5", "16": "AD6"}
CICLO = {"13": "Perene", "19": "Semiperene", "20": "Grupo I", "21": "Grupo II", "22": "Grupo III",
         "24": "Grupo IV", "25": "Grupo V", "26": "Grupo VI"}
MANEJO = {"1": "Sequeiro", "2": "Irrigado", "3": "Irrigado com controle de geada"}
ALLOWED_DEC = {"0", "20", "30", "40"}
AXIS = list(range(19, 37)) + list(range(1, 19))  # season axis: decendio 19 (1 Jul) to 18 (30 Jun)
def is_int(v):
    """Plain integer text with no leading zero (for example "20" or "-3"); "009025" is text."""
    body = v[1:] if v[0] == "-" else v
    if not body.isdigit():
        return False
    return body == "0" or body[0] != "0"


def dec_bounds(n, year):
    """Decendio n (1..36) of calendar year -> (start_date, end_date) as ISO strings."""
    month = (n - 1) // 3 + 1
    part = (n - 1) % 3
    start_day = [1, 11, 21][part]
    end_day = [10, 20, calendar.monthrange(year, month)[1]][part]
    return "%04d-%02d-%02d" % (year, month, start_day), "%04d-%02d-%02d" % (year, month, end_day)


def year_of(n, safra_ini, safra_fin):
    """Rule applied: decendios in Jul to Dec belong to SafraIni, Jan to Jun to SafraFin."""
    month = (n - 1) // 3 + 1
    return safra_ini if month >= 7 else safra_fin


def runs(values, keep):
    """Maximal runs along the season axis where keep(value) is true."""
    out, cur = [], []
    for n in AXIS:
        if keep(values[n]):
            cur.append(n)
        elif cur:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def window(values, keep, safra_ini, safra_fin):
    rs = runs(values, keep)
    if not rs:
        return None
    segs = []
    for r in rs:
        s_year = year_of(r[0], safra_ini, safra_fin)
        e_year = year_of(r[-1], safra_ini, safra_fin)
        s_date = dec_bounds(r[0], s_year)[0]
        e_date = dec_bounds(r[-1], e_year)[1]
        segs.append({"start_dec": r[0], "end_dec": r[-1], "start_date": s_date, "end_date": e_date,
                     "values": [values[n] for n in r]})
    return {"start_dec": rs[0][0], "end_dec": rs[-1][-1], "start_date": segs[0]["start_date"],
            "end_date": segs[-1]["end_date"], "n_segments": len(segs), "segments": segs}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main(csv_dir, out_path):
    rows_out, sources = [], []
    for season, fname, rid, leaf in FILES:
        path = os.path.join(csv_dir, fname)
        n_total = n_mun = 0
        nonempty, all_int = {}, {}
        col_example = {}
        with open(path, encoding="utf-8-sig", newline="") as fh:
            rd = csv.DictReader(fh, delimiter=";")
            header = rd.fieldnames
            for c in header:
                nonempty[c] = 0
                all_int[c] = True
            for r in rd:
                n_total += 1
                for c in header:
                    v = r[c]
                    if v:
                        nonempty[c] += 1
                        if all_int[c] and not is_int(v):
                            all_int[c] = False
                if r["geocodigo"] != MUN:
                    continue
                n_mun += 1
                for c in header:
                    col_example.setdefault(c, r[c])
                if r["Nome_cultura"] not in CROP_ORDER:
                    continue
                vals = {}
                for n in range(1, 37):
                    v = r["dec%d" % n]
                    if v not in ALLOWED_DEC:
                        raise SystemExit("unexpected decendio value %r in %s" % (v, fname))
                    vals[n] = int(v)
                sini, sfin = int(r["SafraIni"]), int(r["SafraFin"])
                if sfin != sini + 1 or season != "%d/%d" % (sini, sfin):
                    raise SystemExit("season mismatch in %s" % fname)
                cod_solo, cod_ciclo, cod_man = r["Cod_Solo"], r["Cod_Ciclo"], r["Cod_Outros_Manejos"]
                m = re.match(r"^Port\.([0-9]+)_de_([0-9]{2})-([0-9]{2})-([0-9]{4})$", r["Portaria"])
                if not m:
                    raise SystemExit("unparsed portaria %r" % r["Portaria"])
                rows_out.append({
                    "season": season,
                    "crop": r["Nome_cultura"],
                    "cultivar_cycle_code": cod_ciclo,
                    "cultivar_cycle": CICLO.get(cod_ciclo, "unmapped"),
                    "soil_code": cod_solo,
                    "soil_group": SOIL.get(cod_solo, "unmapped"),
                    "management_code": cod_man,
                    "management": MANEJO.get(cod_man, "unmapped"),
                    "municipality_ibge_code": MUN,
                    "municipality": r["municipio"],
                    "uf": r["UF"],
                    "municipality_sicor_code": r["Cod_Munic"],
                    "portaria": r["Portaria"],
                    "portaria_number": m.group(1),
                    "portaria_date": "%s-%s-%s" % (m.group(4), m.group(3), m.group(2)),
                    "risk_level_used_pct": 20,
                    "decendio_values_raw": [vals[n] for n in range(1, 37)],
                    "window_all_risk_levels": window(vals, lambda x: x != 0, sini, sfin),
                    "window_risk_20": window(vals, lambda x: x == 20, sini, sfin),
                    "source_url": "%s/%s/download/%s" % (BASE, rid, leaf),
                    "resource_id": rid,
                    "csv_file": fname,
                    "csv_sha256": None,  # filled below
                    "download_date": DOWNLOAD_DATE,
                })
        layout = []
        for c in header:
            if nonempty[c] == 0:
                typ = "empty"
            elif all_int[c]:
                typ = "integer"
            else:
                typ = "text"
            layout.append({"name": c, "type": typ, "example": col_example.get(c, "")})
        sources.append({"season": season, "csv_file": fname, "resource_id": rid,
                        "source_url": "%s/%s/download/%s" % (BASE, rid, leaf),
                        "download_date": DOWNLOAD_DATE, "sha256": sha256(path),
                        "bytes": os.path.getsize(path), "data_rows": n_total,
                        "municipality_rows": n_mun, "column_count": len(header),
                        "csv_layout": layout})
    sha_by_file = {s["csv_file"]: s["sha256"] for s in sources}
    for row in rows_out:
        row["csv_sha256"] = sha_by_file[row["csv_file"]]
    order = {c: i for i, c in enumerate(CROP_ORDER)}
    rows_out.sort(key=lambda x: (x["season"], order[x["crop"]], int(x["soil_code"]),
                                 int(x["cultivar_cycle_code"]), x["management_code"]))
    doc = {
        "schema": "zarc-mt-snapshot/1",
        "municipality": {
            "ibge_code": MUN, "name": MUN_NAME, "uf": "MT",
            "resolution": "point (-55.27, -11.91) inside IBGE malha municipal polygon codarea 5107248",
            "calls": [
                "https://servicodados.ibge.gov.br/api/v1/localidades/municipios/5107248",
                "https://servicodados.ibge.gov.br/api/v3/malhas/estados/51?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=intermediaria&divisao=municipio&ano=2022",
            ],
            "fixture_fields": [
                {"id": "mt-santa-carmem-01", "center": [-55.27, -11.91], "ibge_code": MUN},
                {"id": "mt-santa-carmem-02", "center": [-55.24, -11.94], "ibge_code": MUN},
                {"id": "mt-santa-carmem-03", "center": [-55.21, -11.97], "ibge_code": MUN},
            ],
        },
        "dictionary": {
            "url": "%s/bebb0ebb-bc75-460c-b900-a7a1ebd87bee/download/dicionario-de-dados-tabua-de-risco-2026.pdf" % BASE,
            "note": "The dictionary defines dec1 to dec36 only as planting period by decendio. It does not define the cell values or the decendio-to-date rule.",
        },
        "decendio_rule": "decendio n = month (n-1)//3 + 1, part (n-1)%3 -> days 1-10, 11-20, 21-end; calendar year = SafraIni if month >= 7 else SafraFin",
        "risk_level_note": "The CSV has no risk-percent column. Cells dec1 to dec36 hold 0, 20, 30 or 40. window_risk_20 is the window of cells equal to 20 and is the risk level used here; window_all_risk_levels is any non-zero cell. Interpretation, not stated in the CSV.",
        "sources": sources,
        "row_count": len(rows_out),
        "rows_by_season": {s["season"]: sum(1 for r in rows_out if r["season"] == s["season"]) for s in sources},
        "rows": rows_out,
    }
    text = json.dumps(doc, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    print("wrote", out_path, "rows", len(rows_out), "sha256", hashlib.sha256(text.encode("utf-8")).hexdigest())


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
```
