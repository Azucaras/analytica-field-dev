# Resolution file

One row per finding from `verification.md` (F, M, m) and `review.md` (F, M, m). All fixed items were re-checked by `outputs/.plans/check_fixes.py` (73 assertions, 0 failures) and by the second verification pass (8 of 8 numbered checks PASS). Dashes: body zero; the only em dashes in the file are the ledger render separator inside the Sources block, which `verify` compares byte-wise, so they are kept deliberately.

## Verifier findings

| id | finding | check used | disposition |
|---|---|---|---|
| V-F1 | dead gSSURGO URL (2 places) | curl status vs T2 row 164 live URL | fixed |
| V-F2 | dead Census URL | curl 200 on replacement path | fixed |
| V-F3 | Deral/Cultivar redirects to homepage | live fetch vs quoted figures | fixed |
| V-F4 | Atlas mis-attribution of the screenshot caution | Atlas page text vs T6 audit | fixed |
| V-M1 | 55.1 percent uncited | T1 row 99 DOI registered | fixed |
| V-M2 | 14-hour latency uncited | Late product page linked, both values kept | fixed |
| V-M3 | under 5 percent of Brazil unsupported | T2 row 130 summary linked | fixed |
| V-M4 | 10 to 36 km labelled documented | relabel as inference, split documented values | fixed |
| V-M5 | 2.84 million ha maize on wrong source | cite the Forbes Agro/Deral report | fixed |
| V-M6 | Purdue link lacks the shares | cite AGDAILY | fixed |
| V-M7 | WASDE landing page lacks the prices | cite the DTW 2026-11-10 report | fixed |
| V-M8 | five relative links resolve outside the repo | rewrite as repo-relative with correct depth | fixed |
| V-M9 | S8 and S9 lack basis labels | add label per numeric claim | fixed |
| V-M10 | word count stale | drop the figure from the status line | (lead) |
| V-m1 | quote omits the examples | restore full clause | fixed |
| V-m2 | S3 tables lack figure ids | add ids and labels | fixed |
| V-m3 | FAQ date conflated | separate update date from check date | fixed |
| V-m4 | transition notice date wrong | give the notice dates | fixed |
| V-m5 | dangling antecedent for root zone | name SMAP L4 | fixed |
| V-m6 | PROAGRO threshold called a maximum | correct to mandatory-enrolment threshold | fixed |
| V-m7 | Campo Grande News dated November | correct to 22 October 2026 | fixed |
| V-m8 | Senate page lacks the vote date | qualify the date | fixed |
| V-m9 | 15 percent not on the LEMA page | cite the testimony | fixed |
| V-m10 | V07 Final halt wording | state ended on 2025-09-30 | fixed |
| V-m11 | non-monotonic overgeneralized | name the search variants | fixed |
| V-m12 | Mermaid labels broken | restore bracket syntax | (lead, done) |
| V-m13 | S8/S9 captions lack basis labels | add labels | fixed |
| V-m14 | front matter says no raster processed | say no NASA raster | (lead) |
| V-m15 | NSIDC link not the query evidence | cite the CMR query | fixed |

## Reviewer findings

| id | finding | check used | disposition |
|---|---|---|---|
| R-F1 | no demo geography selected | one committed demonstration case added | fixed |
| R-F2 | three-rotation comparison never instantiated | worked three-row comparison on the public path | fixed |
| R-M1 | semester line undefined, no cut line | countable MVP plus ranked cut list | fixed |
| R-M2 | 55.1 percent uncited | same as V-M1 | fixed |
| R-M3 | under 5 percent and October account unsupported | same as V-M3, plus farmer-account provenance | fixed |
| R-M4 | Terra end date inconsistent | one qualified date, uncertainty at first claim | fixed |
| R-M5 | Sheridan LEMA allocation without years, studies unreconciled | add periods, geography, sample, status distinction | fixed |
| R-M6 | farm bill boundary vs 2027 | state coverage boundary, mark 2027 unknown | fixed |
| R-M7 | continuous-crop penalties read as rotation benefits | label observational association, name confounding | fixed |
| R-M8 | no minimum ingest set | keep, optional, drop list | fixed |
| R-M9 | impact lever without a reach figure | one bounded reach example with exclusions | fixed |
| R-M10 | five per-strategy fields not mapped to output | output contract with the five fields | fixed |
| R-M11 | T6 undefined, relative links | define T6 at first use, fix links | fixed |
| R-M12 | Atlas review undated, 2026-11-13 recheck missing | date the review, add recheck trigger | fixed |
| R-M13 | gap understates Agreena and FieldView Basic | narrow the gap with both named | fixed |
| R-M14 | no build order, judge path unclear | ranked build order, voice last, public fixture floor | fixed |
| R-M15 | abstention gate has no threshold | one named provisional threshold | fixed |
| R-M16 | evidence card omits challenge fields | one card schema carrying them | fixed |
| R-M17 | voice write rule conflicts | voice initiates, on-screen confirmation writes | fixed |
| R-M18 | voice noise limit from another setting | conditional on a noise test, screen fallback | fixed |
| R-M19 | schema cannot version boundaries or periods | versioned boundaries, period start and end | fixed |
| R-M20 | no farmer constraint input surface | field-scoped constraint form with unknown states | fixed |
| R-M21 | UX recommendations assert transfer | mark as hypotheses with test and revert condition | fixed |
| R-M22 | scoring has no criteria or rule | criteria table plus aggregation rule | fixed |
| R-M23 | scenario table is placeholders, no decision owner | named sequences, filled card, decision owner | fixed |
| R-M24 | netrc versus environment login mismatch | separate strategies, authz check | fixed |
| R-M25 | python3.12 assumed | version gate and fallback | fixed |
| R-M26 | recovery misplaced, no 429 | failure-specific recovery at each step | fixed |
| R-M27 | curl output unvalidated, query unscoped | shape checks, temporal and spatial filters | fixed |
| R-M28 | no runnable reprojection example | minimal rasterio example | fixed |
| R-M29 | password in history | silent prompt or netrc route | fixed |
| R-m1 | tags undefined, sometimes misapplied | legend added | fixed |
| R-m2 | quote omits examples | same as V-m1 | fixed |
| R-m3 | source dates mismatch text | align to source dates | fixed |
| R-m4 | latency to the second | round to about 1.2 days | fixed |
| R-m5 | section 6 repeats 4 and 5 | accepted, cross-reference only | accepted: section 6 repeats evidence by design |
| R-m6 | insurance versus WASDE prices look inconsistent | name each price's purpose | fixed |
| R-m7 | no reversal test | point to the abstention gate | fixed |
| R-m8 | figure id formats inconsistent | one convention | fixed |
| R-m9 | no touch-target floor | provisional floor, flagged as default | fixed |
| R-m10 | POWER numbers unreconciled | state parameters and periods | fixed |
| R-m11 | field_weight unused, slots undefined | remove or use, define slots | fixed |
| R-m12 | title omits abstention, transcript called supplied notes | retitle, label provenance | fixed |
| R-m13 | Status blocks undated | add dates | fixed |
| R-m14 | 9.3 title promises the schema | retitle and cross-reference | fixed |
| R-m15 | Mermaid invalid, headings diverge | same as V-m12 | (lead, done) |
