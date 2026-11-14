#!/usr/bin/env python3
"""One assertion per accepted finding, run against the assembled report.
Prints PASS/FAIL with the evidence each assertion used. Exit 1 on any FAIL.
"""
import pathlib, sys

REP = pathlib.Path("/run/media/carloshnp/D/Programming/analytica-field-dev/outputs/field-shift.md")
T = REP.read_text()
fails = []


def has(fid, needle, label=""):
    ok = needle in T
    print(("PASS" if ok else "FAIL"), fid, "-", label or needle[:60])
    if not ok:
        fails.append(fid)


def gone(fid, needle, label=""):
    ok = needle not in T
    print(("PASS" if ok else "FAIL"), fid, "removed:", label or needle[:60])
    if not ok:
        fails.append(fid)


# verifier link and attribution repairs
has("V-F1", "gridded-soil-survey-geographic-gssurgo-database", "live gSSURGO URL")
gone("V-F1", "gridded-soil-survey-geographic-database-gssurgo", "old gSSURGO URL")
has("V-F2", "nass.usda.gov/publications/agcensus/2022/", "live Census path")
has("V-F3", "tridge.com/news/pr-202526-harvest-prices-slow-wheat", "Tridge mirror")
has("V-F4", "screenshot audit", "screenshot caution attributed to the report")
has("V-M1", "07038992.2026.2645742", "Thakur et al. DOI")
has("V-M1", "59 AmeriFlux sites", "denominator")
has("V-M2", "ges-disc-gpm-3imergdl-07", "GES DISC Late product page")
has("V-M3", "pronasolos-platform-allow-access", "PronaSolos summary")
has("V-M3", "less than 5%", "mapped share with date and scope")
has("V-M4", "inference", "10 to 36 km relabelled")
has("V-M5", "revistacultivar.com.br/noticias/pr-safra-2025-26-milho", "Deral report for the maize figure")
has("V-M6", "agdaily.com/news/farmers-trust-ag-media", "AGDAILY attribution")
has("V-M7", "dtnpf.com/agriculture/web/ag/news/article/2026/11/10", "DTN WASDE report")
has("V-M9", "(documented)", "basis labels present in S8/S9")
has("V-m1", "organic matter improvement, or market suitability", "quote restored")
has("V-m2", "Figure S3-F1", "S3 figure ids")
has("V-m3", "last updated in October 2025 and checked on 2026-11-10", "update and check dates separated")
has("V-m4", "August 6, 2026 update", "transition notice dates")
has("V-m5", "SMAP L4 root-zone moisture", "antecedent named")
has("V-m6", "not a coverage maximum", "PROAGRO threshold corrected")
has("V-m7", "October 22, 2026", "Campo Grande date")
has("V-m8", "does not state the date of committee advancement", "Senate date qualified")
has("V-m9", "hearing testimony", "GMD 4 testimony cited")
has("V-m10", "ended on 2025-09-30", "V07 halt wording")
has("V-m11", "cross-entropy variant increases monotonically", "variants named")
has("V-m13", "planned and non-evidentiary", "S8 caption basis note")
has("V-m14", "no NASA raster was processed", "front matter says NASA raster")
has("V-m15", "cmr.earthdata.nasa.gov", "CMR query cited separately")
# reviewer findings
has("R-F1", "one synthetic field boundary in Santa Carmem, Mato Grosso", "committed geography")
has("R-F1", "explicitly scoped extension", "other country scoped out")
has("R-F2", "Criteria", "criteria table in the comparison")
has("R-F2", "Decision owner", "decision owner column")
has("R-M1", "Cut in this order if capacity is short", "ranked cut list")
has("R-M5", "2013-2017", "Sheridan term years")
has("R-M6", "FY2027 coverage is unknown", "farm bill boundary")
has("R-M7", "observational associations", "association not cause")
has("R-M8", "Drop from the minimum path", "keep optional drop list")
has("R-M9", "3.2 million hectares", "bounded reach figure")
has("R-M10", "Decision owner", "five challenge fields mapped")
has("R-M11", "research/site-prior-art/T6.md", "T6 defined")
has("R-M12", "recheck the Atlas on 2026-11-13", "recheck trigger")
has("R-M13", "FieldView", "FieldView Basic named")
has("R-M13", "farmer-correctable, provenance-transparent", "gap narrowed")
has("R-M14", "Voice, last", "build order with voice last")
has("R-M14", "fixture", "public fixture as demo floor")
has("R-M15", "PROVISIONAL_ABSTENTION_GATE", "named gate constant")
has("R-M16", "versioned evidence-card object", "card schema")
has("R-M17", "only a labelled on-screen confirmation writes", "voice write rule")
has("R-M18", "FIELD_VOICE_TEST_01", "voice noise test")
has("R-M19", "versioned", "versioned boundaries")
has("R-M20", "constraint form", "constraint input surface")
has("R-M21", "FIELD_UX_TEST_01", "UX test and revert")
has("R-M22", "aggregation rule", "aggregation rule stated")
has("R-M24", "strategy=\"netrc\"", "netrc path")
has("R-M25", "python3.12", "version gate names the interpreter")
has("R-M26", "429", "rate limit rung")
has("R-M27", "bbox", "spatial filter parameter")
has("R-M28", "calculate_default_transform", "runnable reprojection")
has("R-M29", "read -r -s", "silent password entry")
has("R-m1", "recalled", "legend covers recalled")
has("R-m3", "week ending October 2", "source date aligned")
has("R-m4", "about 1.2 days", "latency rounded")
has("R-m6", "projected price", "price purpose named")
has("R-m8", "Figure S8-F1", "figure id convention")
has("R-m10", "community=AG", "POWER parameters stated")
has("R-m11", "field_weight", "weight reconciled")
has("R-m12", "AI-generated", "transcript provenance")
has("R-m13b", "Execution date", "status dates")

# structural
has("STRUCT-1", "## 8. Making the app usable", "section 8 retitled")
has("STRUCT-2", "### 9.3 Agent boundary and validator", "9.3 retitled")
has("STRUCT-3", "### 8.5 Abstention", "8.5 retitled")
gone("V-M8", "../../../", "no triple-dot relative links")
print("\nFAILS:", len(fails), fails)
sys.exit(1 if fails else 0)
