# Spec: Block 4, ENSO signal and real climate evidence

Status: approved by the user on 2026-11-14, verbatim "Aprovado, implemente", at revision 1, and amended once during implementation (AM-01, revision 2). This is a short-form spec by the user's decision D-04: requirements, acceptance criteria and an amendment ledger, no review passes and no digest.

Governing rule: ADR 0005. Revision 1 was written and approved before any code changed; implementation started after the approval line above.

## Decisions taken by the user on 2026-11-14

| Id | Question | Answer |
|---|---|---|
| D-01 | Geographic scope | Santa Carmem plus the dipole: the existing Santa Carmem fields gain real municipal evidence, and two synthetic fields are added in Tupancireta (RS) and Luis Eduardo Magalhaes (BA). ADR 0001 is revised. |
| D-02 | How the real data reaches the backend | Dated fixture: the pipeline exports JSON with its recording date into `backend/fixtures/climate/`. The backend reads JSON only. |
| D-03 | Basis label for IBGE PAM yield | A fifth basis, `reported`: an official statistic published by an agency. |
| D-04 | Process | Short spec, user approval, then code. |

## Problem

The app compares rotations with no climate context. NOAA CPC has an El Nino Advisory in force for 2026 with the event still strengthening, and in Brazil that signal is a dipole: excess rain in the South from September to December, deficit and mid season dry spells (*veranicos*) in the North, Northeast and MATOPIBA. The rotation that protects a field therefore changes with the sign of the signal, and the app cannot show that today.

Three gaps make it worse. ADR 0002 names NASA POWER as part of the demo floor, but the backend serves no POWER value. Every fixture date sits in 2025 against a 2026 satellite layer (carry-over CO-08 of block 3). And no number on screen comes from a fetched dataset except the GIBS tile.

The sibling project Field Phase (`nasa_chall_train`) already ingests CPC RONI and ONI, the CPC Diagnostic Discussion and strength outlook, NASA POWER daily point data from 1981, and IBGE PAM yields from 1974, and builds analog year evidence: rainfall indices, 1991 to 2020 anomalies, detrended yield anomalies and composites by ENSO class, each with its n and its years. Block 4 brings that pipeline into this repository and puts its results on screen.

## Users and scope

- Users: the producer who reads the map and the judge who evaluates it.
- In scope: the pipeline import, Santa Carmem in the pipeline, the dated climate fixture and its exporter, two backend endpoints, the `reported` basis, the municipality link on every field, two synthetic pilot fields, the ENSO chip, the climate signal line in the rotation panel, the climate table in the evidence panel, and the doc changes (ADR 0001, glossary, README).
- Out of scope: rotation scoring and any ranking change; rotation scenarios for the two new fields (OD-01); satellite products behind Earthdata Login (IMERG, SMAP L4, MODIS); a pt-BR translation (R-37 of block 3 still holds); a charting library (OD-05); any new agent command (OD-04); every block 3 carry-over item except CO-08, which this block narrows but does not close.

## Requirements

### Pipeline and fixture

- R-01 (ubiquitous): The Field Phase pipeline SHALL live at `field-shift-pipeline/` at the repository root as its own `uv` project, with `pipeline/`, `config/`, `tests/`, `pyproject.toml` and `uv.lock` carried over, and `uv run pytest` SHALL pass there. Its `data/` folder SHALL stay gitignored and reproducible.
- R-02 (ubiquitous): `config/regions.yaml` SHALL add a region `mt` holding Santa Carmem, IBGE code 5107248, read from the IBGE *localidades* API on 2026-11-14. Its `enso_signal` SHALL be `unclassified`, because no source in the pack states the sign of the El Nino rainfall signal at Santa Carmem; the composites show it empirically instead. The pipeline SHALL accept `unclassified` wherever it accepts `excess` or `deficit`.
- R-03 (ubiquitous): An exporter, `uv run python -m pipeline.export_fieldshift`, SHALL write `field-shift-app/backend/fixtures/climate/enso.json`, one `municipality-<code>.json` per municipality, and `pilot-fields.json`. Every file SHALL carry `recorded_at` (UTC ISO timestamp of the export), `contract_version` and, per block, a `source` URL. The exporter is the only writer of that folder: no value in it is typed by hand.
- R-04 (ubiquitous): `pilot-fields.json` SHALL hold the two synthetic fields `rs-tupancireta-01` (`Field 04`, Tupancireta, Rio Grande do Sul) and `ba-lem-01` (`Field 05`, Luis Eduardo Magalhaes, Bahia). Each boundary SHALL be a rectangle 0.025 degrees wide and 0.02 degrees tall, the size of Field 01, centred on the municipality centroid that `fetch_regions` computes from the IBGE mesh. Each SHALL carry `synthetic: true`, `coverage: null` and `scenarios: []`.
- R-05 (ubiquitous): Every field in `field-scenarios.json` SHALL gain `municipality_code`. Field 01 to Field 03 carry 5107248. No other fixture value changes.

### Backend

- R-06 (ubiquitous): `GET /fields` SHALL return the three fixture fields followed by the two pilot fields, each with `municipality_code`, `synthetic` and `coverage` (number or null).
- R-07 (state-driven): For a field whose `coverage` is null, `GET /fields/{id}/scenarios` SHALL return `state: "abstained"`, `threshold: "coverage_not_measured"` and the field's empty scenario list. Abstention is a result, not an error.
- R-08 (ubiquitous): `GET /climate/enso` SHALL return the current ENSO block: CPC alert status, issue date and source URL of the Diagnostic Discussion; the latest RONI season, value, phase and strength; the latest ONI season and value; the CPC strength outlook; and `recorded_at`.
- R-09 (ubiquitous): `GET /fields/{id}/climate` SHALL return, for the field's municipality: its official name and UF; the season to date block (crop year, start date, last observed date, rain so far, 1991 to 2020 mean to the same day, strong El Nino analog mean to the same day, n analog years and their list); and a list of climate evidence rows. An unknown field returns 404.
- R-10 (unwanted behaviour): If a climate fixture file is missing or unreadable, the climate endpoints SHALL return 503 with a message naming the file, and `/fields` and `/fields/{id}/scenarios` SHALL keep answering as before.
- R-11 (ubiquitous): A climate evidence row SHALL carry the five existing fields (`layer`, `value`, `basis`, `as_of`, `source`) plus `support` (the spatial unit, for example `municipality centroid, NASA POWER grid cell of about 0.5 degree`) and `n_years` (integer or null). The rows SHALL be: rain September to December, strong El Nino years against 1991 to 2020; longest dry spell January to April, same comparison; yield against trend in strong El Nino years for each crop the PAM series carries for the municipality; and rain since 1 September of the current season against normal.
- R-12 (ubiquitous): Basis rules for the new rows. RONI and ONI are `reported` (published by CPC). PAM yield is `reported`. NASA POWER is `modelled`, because it is MERRA-2 reanalysis. A derived row SHALL take the weakest basis among its inputs, ordered observed, retrieved, reported, modelled, so a yield anomaly is `reported` and a rain composite is `modelled`. The layer text SHALL name the comparison, so a derived number never reads as a raw one.
- R-13 (ubiquitous): Every crop row whose crop entry carries `source: suposicao` SHALL carry `assumption: true`, and every row with `n_years` below 3 SHALL carry `small_sample: true`.

### Front end

- R-14 (ubiquitous): `reported` SHALL join the basis union in `layer-catalog.ts`, `EvidencePanel.tsx` and `ScenarioCards.tsx`, with the catalog key `evidence.basis_reported` and a `basis-reported` badge style. `SmapBar` keeps its measured set unchanged: a `reported` SMAP row draws the empty state.
- R-15 (ubiquitous): An ENSO chip SHALL render in the top left strip immediately right of the brand chip at widths above 640 px, and at the top of the rotation panel, above the climate line, at 640 px and below (AM-01). It SHALL have exactly one mount at any width. It SHALL print the phase and strength from catalog keys, the index name `RONI`, the season, the signed value in degrees Celsius, the `reported` badge and the CPC issue date. Its accessible name SHALL carry the same facts. It is read-only in this block (OD-02).
- R-16 (state-driven): While `/climate/enso` is loading the chip SHALL show a skeleton; when it fails the chip SHALL print `ENSO unavailable` and nothing else on screen SHALL change.
- R-17 (ubiquitous): When a field is selected, the rotation panel SHALL show one climate signal line under the `Rotation outlook` heading row: the municipality name, then three labelled values in millimetres, rain since 1 September, normal to date, strong El Nino years to date, each as text beside a bar on one shared scale whose maximum is the largest of the three. The line SHALL print the `modelled` badge, the last observed date and the n of analog years. The line prints its own crop year label, because the climate season does not follow the Season select (OD-03).
- R-18 (state-driven): When the field has no climate data, or the climate request fails, the climate line SHALL print one literal state (`Climate signal unavailable`) with no bar and no number, and the scenario cards SHALL render exactly as they do without it.
- R-19 (ubiquitous): The evidence panel SHALL render the climate rows in a second table under the scenario table, headed `Climate signal, {municipality}`, with the same five columns. The `support` and `n_years` facts print inside the value cell; a row with `small_sample` prints `small sample`, and a row with `assumption` prints `assumed crop season`.
- R-20 (state-driven): For a field whose `coverage` is null, the coverage pill SHALL print `Coverage not measured` instead of a percentage, the abstention notice SHALL print `Ranking withheld: coverage not measured.`, and the card row SHALL show the existing empty state. A pilot field SHALL show a `synthetic field` label in its field chip.
- R-21 (ubiquitous): Every new visible string and accessible name SHALL come from `src/strings/en.ts`. `pt-BR.ts` stays empty (block 3 R-37).
- R-22 (ubiquitous): No criterion of blocks 1 to 3 that this spec does not supersede SHALL regress. The 97 vitest tests and the 8 backend tests SHALL stay green, updated only where a requirement here changes an asserted value.

### Docs

- R-23 (ubiquitous): ADR 0001 SHALL be revised to record D-01, with Santa Carmem kept as the field that carries rotation scenarios and the two pilot fields carrying climate evidence only. `GLOSSARY.md` and the docs glossary SHALL add `Reportado` (`reported`) and `Município`. The root README SHALL add the pipeline commands, the climate fixture and the limitations of R-24.
- R-24 (ubiquitous): The README and the evidence panel SHALL state the limits honestly: small n (the LEM PAM series starts in 2001), POWER is a reanalysis grid cell and not a field reading, the crop seasons are assumptions until the CONAB calendar is cited, and the climate evidence is municipal and does not describe the field.

## Acceptance criteria

Methods: `tests` is vitest in jsdom or unittest/pytest; `computer use` is the real browser at 1440x900 and 360x640.

- AC-01 (R-01, R-02; tests): `uv run pytest` in `field-shift-pipeline/` passes, and `regions.parquet` holds 5107248, 4322202 and 2919553. False if a test fails or a code is missing.
- AC-02 (R-03, R-04; tests): After the exporter runs, every file in `fixtures/climate/` parses, carries `recorded_at` and `contract_version`, and the two pilot field centres equal the `regions.parquet` centroids to 6 decimals. False if a file lacks a key or a centre differs.
- AC-03 (R-06, R-07; tests): `/fields` returns five fields in the stated order; `/fields/ba-lem-01/scenarios` returns `abstained`, `coverage_not_measured` and an empty list. False otherwise.
- AC-04 (R-08, R-09; tests): `/climate/enso` and `/fields/mt-santa-carmem-01/climate` return the keys of R-08 and R-09, and every number in them equals the corresponding value in the fixture file. False if a key is missing or a number differs.
- AC-05 (R-10; tests): With `enso.json` removed, `/climate/enso` returns 503 naming the file and `/fields` still returns 200. False otherwise.
- AC-06 (R-11, R-12, R-13; tests): Every climate row has the seven fields; POWER rows are `modelled`, PAM and RONI rows are `reported`; a row with `n_years` 2 has `small_sample: true`. False on any mismatch.
- AC-07 (R-14; tests): `EvidencePanel` renders a `reported` row with the `reported` badge, and `SmapBar` given a `reported` row draws 0 px. False otherwise.
- AC-08 (R-15, R-16; tests and computer use): The chip prints phase, strength, `RONI`, season, value with unit, `reported` and the issue date, all matching `enso.json`; with the endpoint failing it prints `ENSO unavailable` and the field list still loads. False if a fact is missing, differs from the fixture, or the failure changes another box.
- AC-09 (R-17, R-18; tests and computer use): With Field 05 selected the climate line prints the municipality, the three values, `modelled`, the date and n, matching `municipality-2919553.json`, and the longest bar measures 100 percent of the track within 2 px. With the climate request failing it prints `Climate signal unavailable` and no digit. False otherwise.
- AC-10 (R-19; tests): The evidence panel shows the climate table under the scenario table with one row per climate row, and `small sample` and `assumed crop season` print exactly on the flagged rows. False otherwise.
- AC-11 (R-20; tests): Field 04 prints `Coverage not measured`, the coverage abstention message, the empty card state and the `synthetic field` label, and no percentage. False if a percent sign renders for that field.
- AC-12 (R-21; tests): The literal string scan of block 1 passes with the new keys in `en.ts` and no entry added to `pt-BR.ts`. False otherwise.
- AC-13 (R-22; tests): `npx tsc -b --noEmit` exits 0, `npx vitest run` is green, `npm run build` exits 0 and the backend unittest suite is green. False on any failure.
- AC-14 (R-15, R-17; computer use; screenshots AC-14-1440.png, AC-14-360.png): At 1440x900 and 360x640 with Field 01 selected, the chip and the climate line are fully visible, no block 3 box overlaps them, and the map centre point stays clear. False if a box overlaps or a value is clipped.

## Open decisions

Each has its default encoded above; approving the file approves the default.

| Id | Question | Default | If changed |
|---|---|---|---|
| OD-01 | Do the two pilot fields get rotation scenarios | No. They carry climate evidence only, because writing scenarios for them would invent agronomic claims before the scoring block exists. | Scenarios need a source per claim, or the scoring block, and a requirement here. |
| OD-02 | Is the ENSO chip a toggle that opens the CPC outlook | No, read-only. | A third toggle in the right column, which changes the 360 layout rules R-39 and R-40 of block 3. |
| OD-03 | Does the climate line follow the Season select | No. It prints its own crop year, the current one, because the El Nino event is in that season and the fixture seasons end at 2025/26. | Adding 2026/27 to the Season select makes the scenario fixture answer a season it has no data for. |
| OD-04 | Does the agent get a climate command | No new command in this block. | A command entry in `/commands`, the registry, and an AC per ADR 0004. |
| OD-05 | Are the Field Phase Recharts charts ported | No. The climate line uses CSS bars in the style of `SmapBar`, so no dependency is added. | Recharts must be checked against React 19.3 first, and the charts need a place in the HUD. |

## Amendments

| Id | Date | Change | Why |
|---|---|---|---|
| AM-01 | 2026-11-14 | R-15: below 641 px the ENSO chip mounts at the top of the rotation panel instead of beside the brand. | Measured at 360x640 in the browser: the chip beside the brand spanned x 125 to 345, y 12 to 42, and the block 3 top strip spans x 139 to 348, y 12 to 56, so the two shared area and AC-14 failed. In the panel the chip spans y 518 to 531 inside a panel that ends at y 632. |

## Gate record, 2026-11-14

Measured on Windows 11, Node 26.13.1, backend venv Python 3.11, pipeline `uv` Python 3.11.

| Check | Result |
|---|---|
| `uv run pytest` in `field-shift-pipeline/` | 85 passed |
| Backend `unittest` (`test_commands`, `test_climate`) | 16 passed, 8 of them new |
| `npx tsc -b --noEmit` | exit 0 |
| `npx vitest run` | 15 files, 107 tests passed, 10 of them new |
| `npm run build` | exit 0 |
| Browser at 1440x900, Field 01 | chip and climate line visible, no overlap with the top strip, map centre point hits the map canvas |
| Browser at 360x640, Field 01 | one chip, inside the rotation panel; climate line y 539 to 602 inside the panel; no horizontal scroll |

AC-14 was measured by DOM geometry in the real browser; the screenshots it names were not captured, because the pane did not draw while the app window was hidden. That is a gap in the evidence, not a pass by screenshot.

Delta outside the AC: the rotation panel is 47 px taller at 1440x900 because of the climate line, so its top moves from y 558 to y 511, and at 360x640 the scenario cards now start lower inside the panel's internal scroll. No criterion of blocks 1 to 3 fixes those positions.
