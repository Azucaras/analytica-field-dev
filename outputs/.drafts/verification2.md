# Second-pass verification: Field Shift

Scope: revised `outputs/field-shift.md`; evidence packs under `research/`; first-pass findings and `resolution.md`. PASS/FAIL counts are for the eight requested checks. One new minor defect is listed below.

| # | Result | Evidence checked | New defect found |
|---|---|---|---|
| 1 | PASS | The gSSURGO links at report lines 205 and 272 now use the NRCS page that describes the dataset; the 2022 Census link at 266 opens the edition page; the Tridge mirror carries R$62.19, 56 sacks/ha cost, and 57 sacks/ha yield; the screenshot caution at 816 is attributed to this report's T6 audit, not the Atlas. All six newly measured URLs are recorded HTTP 200 in the fix-round context. | None. |
| 2 | PASS | Line 100 says the 55.1% figure is across all sites and time steps, identifies 59 AmeriFlux sites, and limits the result to ECO4ESIPTJPL. T1's ESI entry and the linked Thakur record state the same denominator and study scope. | None. |
| 3 | PASS | Line 90 separates documented 9 km posting and approximately 36 km footprint from the “roughly 10 to 36 km” decision scale, explicitly labelled an inference, consistent with T1's SMAP row. | None. |
| 4 | PASS | Line 514 cites the live Revista Cultivar/Deral article, which states the 2.84 million hectare second-crop estimate under its 2025/26 heading. It carries the figure and season. | None. |
| 5 | PASS | Re-read S9.2 and `outputs/sections/subsections/S9.2.md`. POWER's exact query returned HTTP 200 with 31 January 2025 T2M values; recomputation gave 25.28 C. The scoped CMR query returned five records, latest 2026-11-09. Query coordinates are explicitly a representative point for Santa Carmem, matching the Brazil/Mato Grosso MVP in 1.2, not a field boundary. Scenario histories are marked manual/recalled or hypothetical; crop counts and 67/100 and 100/100 scores are marked computed; formulas and provisional thresholds are labelled. No scenario outcome, yield, or winner is invented. | None. |
| 6 | PASS | S8.3 references `PROVISIONAL_ABSTENTION_GATE` in the coverage/season handling and trace; S8.5 defines the same named gate with 0.80 coverage, 2 seasons, and product QA. Its thresholds and status are explicitly marked provisional and unvalidated; S8.3 supplies no conflicting values. | None. |
| 7 | PASS | The Keep list at 291-293 matches the MVP in 1.2 (one field, POWER context, farmer-entered crop history, three scenarios, no ranking without support). The ranked build order at 835-840 makes fixture/schema/public context precede comparison and UX, with voice last; optional layers and drop-from-minimum inputs do not contradict the MVP. | None. |
| 8 | PASS | Whole-file scan: zero em dashes and zero en dashes; all three repository-relative links resolve from `outputs/field-shift.md`; no newly changed URL was found dead (six new URLs were already measured HTTP 200 per the fix-round record). | N-1 below: stale source-count statement. |

## Counts

- PASS: 8
- FAIL: 0
- New defects: 1 (MINOR)

## New defect

- **N-1 - MINOR, report line 5:** status says 140 distinct cited URLs. The current report has 150 distinct external URLs in its body and 150 entries in `## Sources` (185 inline link occurrences). The stated count was not updated after the revision.