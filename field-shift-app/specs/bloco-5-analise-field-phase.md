# Spec: Block 5, the Field Phase analysis page

Status: short-form spec, revision 1, 2026-11-14. The user asked on 2026-11-14 for every Field Phase feature to be applied to this project, using `nasa_chall_train` as the basis, and answered the four decisions below the same day. This file records that instruction as the block's contract (ADR 0005); STATE.md carries the approval line. Short form by the precedent of block 4 (D-04): requirements, acceptance criteria and an amendment ledger.

## Decisions taken by the user on 2026-11-14

| Id | Question | Answer |
|---|---|---|
| D-05 | Where the features go | Into `analytica-field-dev`. The local `nasa_chall_train` is fast-forwarded to its remote branch (commit `4d1d7b4`) and serves as the source. |
| D-06 | How the Field Phase sections enter the app | As a second route, the analysis page, linked from the HUD. Blocks 1 to 3 keep their HUD. |
| D-07 | Language | Portuguese by default across the whole app, with an English switch. Block 3 R-37 is amended: `pt-BR.ts` is filled. |
| D-08 | Meteomatics credential | The user sets `METEOMATICS_USERNAME` and `METEOMATICS_PASSWORD` in their own shell and runs the fetch. The agent never sees or stores the credential, and the account name is stripped from every saved response. |

## Problem

Block 4 brought the ENSO state and the analog-year climate evidence into the HUD, but the larger Field Phase work stayed in the sibling repository: the ENSO page, the municipality map, the season impact preview with the ensemble forecast, the Meteomatics forecasts, the rotation advisor with weighted priorities and the arithmetic behind every score, the yield and vegetation evidence, and the analysis behind them (FAO-56 ET0 and soil water, SoilGrids, Planetary Computer). A judge using Field Shift sees none of it.

## Scope

- In scope: the pipeline commits `68ee20d` to `4d1d7b4` applied to `field-shift-pipeline/`; Santa Carmem handled honestly by every new step; the static Field Phase contract exported as dated JSON and served by the Field Shift backend; the `fieldphase` kit ported to React 19 and mounted as the analysis route; a link from the HUD; Portuguese default with an English switch on both the HUD and the page; docs.
- Out of scope: new analysis beyond the Field Phase commits; rotations for Santa Carmem (no candidate list or crop calendar is configured for its region, so it is not scored); planting calendars confirmed against CONAB; a fixed score scale; CHIRPS and MapBiomas; municipalities beyond the three; Phase 4 validation. These are the Field Phase "not built yet" list, carried unchanged.

## Requirements

### Pipeline

- R-01: `field-shift-pipeline/` SHALL carry the Field Phase modules `agromet`, `soilwater`, `scoring`, `build_scoring`, `fetch_soil`, `fetch_planetary`, `raster_stats`, `fetch_meteomatics`, the configs `rotations.yaml`, `planetary.yaml`, `meteomatics.yaml`, and their tests, and `uv run pytest` SHALL pass.
- R-02: A municipality whose region has no rotation list or crop calendar in `rotations.yaml` SHALL be skipped by `build_scoring` with a log line, and its payload SHALL carry no rotations, rather than borrow another region's list.
- R-03: `python -m api.export` SHALL write the Field Phase contract into `field-shift-app/backend/fixtures/fieldphase/data/v1/`, and the block 4 exporter SHALL keep writing `fixtures/climate/`.
- R-04: Meteomatics SHALL stay optional. Without a credential every forecast product is recorded as unavailable and the page says so; nothing is filled in.

### Backend

- R-05: `GET /fieldphase/data/v1/{path}.json` SHALL serve the exported files read-only, reject any path outside that folder with 404, and answer 503 naming the file when the export is missing. No other endpoint changes.

### Analysis page

- R-06: The route `/analise/:code` SHALL render the Field Phase page for that municipality with every section of the kit: ENSO now, municipality map, season impact preview, Meteomatics forecast, recommended rotations, analog years, yield by crop, vegetation, land use and slope, and the sources footer. `/analise` without a code SHALL open the first municipality.
- R-07: The kit SHALL keep its rules: no unlabelled mock, assumption and small-sample warnings, n and years on every comparison, a table view on every chart, light and dark themes.
- R-08: The HUD rotation panel SHALL carry one link to `/analise/{municipality_code}` for the selected field, labelled from the catalog.
- R-09: The HUD at `/` SHALL be unchanged apart from R-08, the language switch of R-10 and the strings of R-11.

### Language

- R-10: The default locale SHALL be `pt-BR` on both the HUD and the page, with one switch that sets `en` or `pt-BR`, stored under the existing `fs.locale` key and shared by both.
- R-11: `pt-BR.ts` SHALL carry a Portuguese value for every key of `en.ts`, and a test SHALL fail when a key is missing.

## Acceptance criteria

- AC-01 (R-01, R-02; tests): `uv run pytest` passes in `field-shift-pipeline/`, and `build_scoring` writes rotation scores for 4322202 and 2919553 and none for 5107248.
- AC-02 (R-03, R-05; tests): after the export, `/fieldphase/data/v1/enso.json` and `/fieldphase/data/v1/municipalities/4322202.json` return 200 with the same bytes as the files, `/fieldphase/data/v1/../main.py` returns 404, and a missing file returns 503.
- AC-03 (R-06, R-07; tests and browser): `/analise/4322202` renders the ENSO status tiles, the rotation cards with a total and three component bars, and at least one "Show table" control; `/analise/5107248` renders without rotation cards and says why.
- AC-04 (R-08; tests): with Field 01 selected the HUD shows one link whose `href` ends in `/analise/5107248`.
- AC-05 (R-10, R-11; tests): with no stored locale the HUD prints Portuguese strings; after the switch it prints English; every `en.ts` key has a `pt-BR.ts` value.
- AC-06 (all; tests): `npx tsc -b --noEmit` exits 0, `npx vitest run` is green, `npm run build` exits 0, the backend suite is green.

## Amendments

| Id | Date | Change | Why |
|---|---|---|---|
| AM-01 | 2026-11-14 | R-02: the municipality payload gains `rotations_status` (`ready`, `not_built`, `not_configured`), and the page prints the reason for `not_configured`. | Measured on `/analise/5107248`: the kit's only empty-state text told the user to run `build_scoring`, which had run; the true reason is that the `mt` region has no candidate list. |
| AM-02 | 2026-11-14 | R-04: the forecast section always renders; without an export it prints that the Meteomatics forecast is not downloaded and how to fetch it. | The kit hid the section when `forecast` was null, so the page did not say the forecast was missing. |
| AM-03 | 2026-11-14 | R-10: at 640 px and below the rotation heading tightens (title 15 px, coverage pill 9 px) and the link label is `Análise completa` / `Full analysis`. | Measured at 360x640 in Portuguese: the heading grew from 74 px to 117 px and pushed the block 4 climate line to y 674, below the panel's bottom at y 632. After the change the heading is 53 px and the climate line ends at y 602. |
| AM-04 | 2026-11-14 | D-06 and R-06, R-08: the analysis is a full-screen sheet on the HUD page, not a second route. An `Análise` / `Analysis` toggle at the end of the top strip and the `Análise completa` button in the rotation panel open it for the selected field's municipality; `Voltar ao mapa de talhões` and Escape close it and return focus to the toggle. Its state is the hash `#analise/<code>`; the former `/analise/<code>` address is rewritten to it. An error boundary closes only the sheet if it fails. React Router is no longer used. | The user asked on 2026-11-14 to unite the two front ends: "é estranho eu precisar entrar em links distintos". |

## Gate record, 2026-11-14

Measured on Windows 11, Node 26.13.1, backend venv Python 3.11, pipeline `uv` Python 3.11.

| Check | Result |
|---|---|
| `uv run pytest` in `field-shift-pipeline/` | 152 passed |
| `build_scoring` | Tupancireta 6 rotations, Luis Eduardo Magalhaes 5, Santa Carmem skipped (`mt` not configured) |
| Backend `unittest` (`test_commands`, `test_climate`, `test_fieldphase`) | 19 passed, 3 of them new |
| `npx tsc -b --noEmit` | exit 0 |
| `npx vitest run` | 16 files, 112 tests passed |
| `npm run build` | exit 0; the analysis page is its own chunk |
| Browser `/analise/4322202` | seven sections in Portuguese, rotation cards ranked under strong El Nino, forecast section says not downloaded, no console error |
| Browser `/analise/5107248` | no rotation card, the not configured reason printed |
| Browser HUD 1440x900 and 360x640 | `Talhões`, link to `/analise/5107248`, PT/EN switch at the end of the top strip, no horizontal scroll, map centre clear |

Meteomatics, later the same day: the user ran `pipeline.fetch_meteomatics` with their own credential (D-08); all 9 requests returned OK for the three municipalities, no saved response carries the `user` field, and after `build_evidence` and `api.export` the browser shows the 15-day, 46-day and seasonal panels on the sheet for Tupancireta.

