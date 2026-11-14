# Plan: Field Shift (NASA Space Apps 2026) research run

Tier: **Deep**. Run root: `/run/media/carloshnp/D/Programming/analytica-field-dev/`.
Status: **approved 2026-11-10** (user: "Yes, proceed as written"; all four regions in scope; spacedata inferred logged-out only, with what a login would unlock named).


## Scope

The build target is a decision-support app: interactive map, agent assistance through text-to-SQL, voice commands, and interaction patterns borrowed from game UX so insight lands on a farmer without a data-literacy course. The research has to serve that build, not sit beside it.

Surfaces the topic touches, so the run does not wander into the wrong one:

| Surface | Where it lives | What it can do |
|---|---|---|
| Challenge submission | spaceappschallenge.org challenge page, judging rubric | Defines the deliverable, the three-rotation comparison and the "does not replace farmer judgment" boundary |
| NASA data access | Earthdata Login, CMR, earthaccess, GIBS, POWER | Determines which of the named datasets are actually obtainable inside a hackathon window |
| Non-NASA soil and crop data | gSSURGO, SoilGrids, PronaSolos, MapBiomas, CDL, CroplandCROS | Supplies the local soil and crop facts NASA does not carry |
| App surface | the app the user will spec later | Map, agent, voice, game-derived interaction |
| Deliverable | this run | Cited report plus a build annex |

Out of scope unless the user reopens it: the two other 2026 challenge themes, a working prototype, model training, and any run on remote hardware.

Geographic scope is Brazil and the USA, per the user. Crop systems named for depth: US Corn Belt corn-soybean, Plains wheat-fallow and irrigated alfalfa; Brazilian Cerrado soy-cotton-maize second crop, Parana and Rio Grande do Sul no-till soy-wheat, and integrated crop-livestock-forest. Sub-national narrowing is a clarify item.

## Key questions

1. What does the challenge actually require, in the Objectives and Potential Considerations text, and what does the judging rubric reward?
2. For each named dataset, what is the real spatial resolution, revisit cadence, latency, coverage and failure mode, and which rotation decision can it inform versus merely illustrate?
3. Which non-NASA soil, crop and management datasets cover Brazil and the USA at field-relevant resolution, and under what licence?
4. What do farmers in each region actually weigh when they pick a rotation, in their own words, and which of those weights does satellite data touch?
5. What are the live 2026 pressures on rotation choice: policy, price ratios, fertilizer and fuel costs, water allocation, resistance, extreme events?
6. What does the spacedata.swapniltamse.com companion site expose without a login, and what does the shape of its dataset list reveal about the intended solution?
7. Which game-derived interaction patterns reduce cognitive load for a map plus agent app, and what evidence exists that they transfer outside games?
8. How is text-to-SQL kept honest over a geospatial schema, and how are voice commands made reliable in a noisy field?
9. Where does the tool have to say "ask your agronomist", and how is that said without reading as a dodge?

## Evidence needed

Primary: challenge page text, judging rubric, dataset landing pages and CMR metadata, instrument specs and validation papers, USDA and Embrapa extension material, farm-press and cooperative reporting, soil survey documentation, peer-reviewed rotation and cover-crop literature, spacedata site structure, game UX research and accessibility guidance, text-to-SQL benchmark papers, voice-in-noise studies.

Community signal (searched first-class, quoted, verified): X posts from farmers, agronomists, agtech founders and remote-sensing practitioners; Reddit r/farming and r/agriculture; YouTube grower and extension channels.

## Freshness window

Primary window 2025-01-01 to run date for policy, prices, releases and current conditions. Foundational agronomy and instrument documentation older than the window is admitted and dated in place. Any 2026 claim carries its month.

## Scale decision

Nine sections, thirty-seven subsections, one file per subsection. Depth budget concentrates on the three areas the user asked about most (dataset inventory, farmer decision drivers, UX) and holds policy and prior art to fewer, denser subsections. Build annex is in scope at spec level because the oracle chose it and because a report that stops before the interaction layer cannot be handed to a build.

Execution: `delegate_task` batches, every child pinned to `explabs_gpt_6_luna`, no kanban board created. Waves drain in sequence, the first child of wave 1 runs alone as the gate, audits gate fixers. Rationale in the decision log.

## Waves

| Wave | Cards | Children | Gate |
|---|---|---|---|
| 1 source packs | T1 NASA dataset capability (runs alone first), T2 non-NASA sources, T3 US farmers, T4 Brazil farmers, T5 2026 pressures, T6 spacedata site plus prior art | 6 luna | T1 checked for per-dataset resolution, cadence, latency and failure columns before T2 to T6 go out |
| 2 section plans | P1 sections 1 to 3, P2 sections 4 to 6, P3 sections 7 to 9 | 3 luna | lead freezes each plan, twelve fields per subsection |
| 3 writers | sections 1 to 9, three batches of three | 9 luna | each section file exists and cites its pack rows |
| 4 review | verifier and reviewer, one batch | 2 luna | both reports land with severities |
| 5 fixers | one per section with FATAL or MAJOR findings | n luna | per-change assertion script passes |

## Task ledger

| Id | Task | Output path | State |
|---|---|---|---|
| T1 | NASA dataset capability pack | `research/nasa-data/T1.md` | pending |
| T2 | Non-NASA soil and crop sources | `research/sources/T2.md` | pending |
| T3 | US farmer decision drivers | `research/farmers-us/T3.md` | pending |
| T4 | Brazil farmer decision drivers | `research/farmers-br/T4.md` | pending |
| T5 | 2026 pressure landscape | `research/pressures/T5.md` | pending |
| T6 | spacedata site and prior art | `research/site-prior-art/T6.md` | pending |
| P1-P3 | Section plans | `plans/S1.md` ... `plans/S9.md` | pending |
| W1-W9 | Section writers | `outputs/sections/subsections/` | pending |
| V1, R1 | Verifier, reviewer | `outputs/.drafts/verification.md`, `review.md` | pending |

## Verification log

| Probe | Result |
|---|---|
| Obscura MCP on the challenge page | network error on the URL; reachable elsewhere |
| Hound `smart_fetch` on the challenge page | 200 OK via stealthy fetcher, 87.7 KB, content_ok true |
| `desktop_preview` open plus read on X live search | logged-in timeline text with handle, date and body |
| `portal_x_search` | absent from this session |
| Semantic Scholar, OpenAlex, Crossref | all return results, no key needed |
| Dispatcher | `dispatch_in_gateway: true`, gateway running, 2 active agents |
| Active board | `benchmark-eval`, unrelated project, so board mode needs a DB change |
| Host | 12 cores, 15 GiB RAM, 853 MiB free plus 6.3 GiB cache |
| First verification pass | 4 FATAL, 10 MAJOR, 15 MINOR |
| Reviewer pass | 2 FATAL, 29 MAJOR, 15 MINOR |
| Fix wave | 6 children, 71 of 75 findings fixed, 1 accepted |
| Assertion script `check_fixes.py` | 73 assertions, 0 failures |
| Second verification pass | 8 of 8 numbered checks PASS, 1 new MINOR found and fixed |
| Replacement URLs | 6 of 6 measured HTTP 200 |
| Citation ledger | 150 entries, `verify` exit 0 |
| Closing oracle check | yes, p=1.00, backed by artifact, sha256 and dash checks |

## Ledger outcome

T1 to T6 done. P1 to P3 done. W1 to W9 done. V1 and R1 done. Fixers X1 to X6 done. Report assembled at 29,376 words from 37 subsections, 150 sources registered, status PASS WITH NOTES.

Channel limits carried into every child brief: Obscura fails on `spaceappschallenge.org` and on `assets.spaceappschallenge.org`, so hound stealthy fetch is the route there. X is reachable only through the preview pane; `portal_x_search` is absent and `browser_exec local=true` fights the desktop app for the Chromium profile.

## Decision log

| Decision | Answer | Note |
|---|---|---|
| Executor mode | `delegate_task` batches pinned to luna, confidence 0.95 | Followed. No DB change, every child on the model the user asked for |
| Report shape | nine sections with per-dataset table and build annex, confidence 0.99 | Followed |
| Depth budget | concentrate on data inventory, farmer drivers, UX, confidence 1.00 | Followed |
| Clarify timed out, no reply | re-asked, answered | All four regions; spacedata logged-out inference only; plan approved as written |

## Deliverables

`outputs/field-shift.md`, `outputs/field-shift.provenance.md`, subsection files under `outputs/sections/subsections/`, packs under `research/`, plans under `plans/`.

## Standing limits applied

No remote host, no inference run, no GUI launch beyond the preview pane, no installs. Every figure is labelled measured, computed, documented or recalled. Corpus and API counts are computed by script.
