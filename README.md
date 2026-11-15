# Field Shift

Field Shift is a satellite backed field planning prototype built for the NASA Space Apps Challenge. It reads a
small fixture of three agricultural fields, shows satellite soil moisture from NASA GIBS on a MapLibre map, and
presents rotation scenarios with the evidence behind each one, including what is measured and what is only modelled.

Block 4 adds the 2026 El Nino signal. The current CPC ENSO state, NASA POWER rainfall and IBGE PAM yields, built
into analog year evidence by `field-shift-pipeline`, reach the screen as a dated fixture: an ENSO chip, a line of
rain since 1 September against normal and against strong El Nino years, and a climate table in the evidence panel.
Two synthetic pilot fields in Tupancireta (RS) and Luis Eduardo Magalhaes (BA) show the Brazilian dipole: excess
rain in the South, deficit in MATOPIBA.

Block 5 adds the full Field Phase analysis as a full-screen sheet on the same page, opened from the `Análise`
button in the top strip or the `Análise completa` button in the rotation panel, for the selected field's
municipality (the address becomes `/#analise/<IBGE code>`): the ENSO state and outlook, the municipality map, the season impact preview, the Meteomatics
forecasts, the rotation advisor (three weighted priorities, a July to June calendar, plain-language reasons and the
arithmetic behind every score), the analog-year evidence, yield by crop, and vegetation, land use and slope.
The whole app now opens in Portuguese, with a PT/EN switch in the top strip and on the page.

The project lives in three parts:

| Path | What it is | Runtime |
|---|---|---|
| `field-shift-app` | The application: Vite, React and TypeScript front end, plus the FastAPI backend that serves the fixture and proxies the GIBS tiles | Node and Python |
| `field-shift-pipeline` | The climate pipeline (ENSO, NASA POWER, IBGE PAM, analog years) and the exporter that writes the dated climate fixture the backend serves | Python via `uv` |
| `field-shift-docs` | The documentation site (Astro Starlight) that publishes the specs and the project write up | Node |
| `docs`, `plans`, `research`, `outputs` | Written material: briefing, plans, prior art, research notes and the dossier | none |

## Quick start: one command

On Windows, double-click `iniciar.cmd` at the repository root. Anywhere else, or from a terminal:

```sh
cd field-shift-app
npm start
```

`npm start` runs `field-shift-app/scripts/start.mjs`, which:

1. creates the backend virtual environment on first run (`backend/.venv`, Python 3.11 through `uv` when it is
   installed) and runs `npm install` when `node_modules` is missing;
2. picks free ports, starting at 8000 for the backend and 5173 for the front end, and says when it had to move
   because another process holds a port, so an old server can never shadow this one;
3. starts the backend, waits for `/health`, starts Vite pointed at that backend and opens the browser.

`Ctrl+C`, or closing the `iniciar.cmd` window, stops both. `npm start -- --no-open` skips the browser.
Measured on 2026-11-14 on Windows 11: with 8000 and 5173 already taken it chose 8001 and 5174, every endpoint
answered 200, the front end pointed at the backend it chose, and both processes were gone after its process
tree was stopped. Not measured that day: the first-run install path (the venv and `node_modules` already
existed), and stopping by pressing `Ctrl+C` or closing the window by hand.

The sections below are the manual route, one piece at a time.

## Short answer: `npm install` is not enough

`npm install` inside `field-shift-app` installs the front end only. The backend is Python and needs its own
virtual environment and `pip install`. The docs site has a third, separate `npm install`. `npm start` above
installs the first two on its first run; the docs site stays separate.

## Requirements

- Node.js 22 or newer. Verified here with Node 26.12.0 and npm 12.2.1.
- Python 3.11 or newer. Verified here with Python 3.14.9.
- Network access on first run, because the tile proxy talks to NASA GIBS.

## Install and run

### 1. Backend, port 8000

```sh
cd field-shift-app
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python -m uvicorn main:app --app-dir backend --port 8000
```

On Windows PowerShell the same steps are:

```powershell
cd field-shift-app
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --port 8000
```

Check it answers before starting the front end:

```sh
curl http://localhost:8000/health
# {"status":"ok"}
```

### 2. Front end, port 5173

```sh
cd field-shift-app
npm install
npm run dev
```

Open http://localhost:5173. This is the only front end: the analysis opens on the same page. Do not run the
old `nasa_chall_train/web` app alongside it; it is a separate project and takes the same port.
The front end calls the backend at `http://localhost:8000` by default; see the
environment variables below to point it somewhere else.

### 3. Climate pipeline, optional

The backend already ships both exports, recorded on 2026-11-14: `field-shift-app/backend/fixtures/climate/` for
the HUD and `field-shift-app/backend/fixtures/fieldphase/data/v1/` for the analysis page. The demo needs no
pipeline run. To refresh them (network required):

```sh
cd field-shift-pipeline
uv sync --extra planetary
uv run python -m pipeline.fetch_regions     # IBGE codes, boundaries, centroids
uv run python -m pipeline.fetch_enso        # CPC RONI, ONI, discussion, strength outlook
uv run python -m pipeline.fetch_power       # NASA POWER daily at each centroid, 1981 to today
uv run python -m pipeline.fetch_pam         # IBGE PAM yields via SIDRA
uv run python -m pipeline.fetch_soil        # ISRIC SoilGrids water holding capacity and texture
uv run python -m pipeline.fetch_planetary   # MODIS NDVI, land cover, elevation (Planetary Computer, no login)
uv run python -m pipeline.fetch_meteomatics # needs METEOMATICS_USERNAME and METEOMATICS_PASSWORD, see below
uv run python -m pipeline.build_evidence    # anomalies, ENSO composites, season to date, vegetation
uv run python -m pipeline.build_scoring     # FAO-56 ET0, soil water, rotation scores
uv run python -m pipeline.export_fieldshift # field-shift-app/backend/fixtures/climate/
uv run python -m api.export --out ../field-shift-app/backend/fixtures/fieldphase/data/v1
uv run pytest
```

Meteomatics is the only source behind a login. Set the two variables in your own shell, never in a file in the
repository; the fetch strips the account name from every saved response. Without them the analysis page shows the
forecast section as not downloaded and fills nothing in. PowerShell:

```powershell
$env:METEOMATICS_USERNAME = "<your user>"
$env:METEOMATICS_PASSWORD = "<your password>"
uv run python -m pipeline.fetch_meteomatics
```

Each fetch caches its raw response in `field-shift-pipeline/data/raw/` (gitignored) and re-runs from cache unless
`--refresh` is passed.

### 4. Documentation site, optional

```sh
cd field-shift-docs
npm install
npm run dev
```

## Tests and checks

Front end, from `field-shift-app`:

```sh
npx tsc -b --noEmit     # type check, no emit
npx vitest run          # 15 files, 107 tests
npm run build           # production build into dist/
```

Backend, from `field-shift-app/backend`:

```sh
.venv/bin/python -m unittest -q test_commands test_climate   # 16 tests
```

These are the numbers measured on 2026-11-14 on Windows 11 with Node 26.13.1: tsc exit 0, 107 vitest tests
green, 16 backend tests green, build clean, 85 pipeline tests green. The backend venv there was Python 3.11
created with `uv venv --python 3.11`, because `pip install -r requirements.txt` failed to build `pyyaml` (pulled
in by `uvicorn[standard]`) on Python 3.15.

## Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | front end | `http://localhost:8000` | Base URL of the backend the front end calls |
| `TILE_UPSTREAM_URL` | backend | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best` | Upstream origin for the tile proxy, useful for pointing at a mock |
| `TILE_CACHE_DIR` | backend | `backend/.tile-cache` | Where proxied tiles are cached for 24 hours |
| `CLIMATE_FIXTURE_DIR` | backend | `backend/fixtures/climate` | Where the dated climate fixture is read from |
| `FIELDPHASE_FIXTURE_DIR` | backend | `backend/fixtures/fieldphase` | Where the Field Phase export for the analysis page is read from |

No API key is required. The GIBS endpoint used here is open.

## Repository contents worth knowing

- `field-shift-app/specs`: the frozen specs for blocks 1, 2 and 3, each with an amendment ledger and a digest you
  can reproduce with the `sed` command printed inside the file. Block 3 uses the spec before code rule.
- `field-shift-app/artifacts`: the markdown checkpoints for blocks 2 and 3 and for the Constraints removal, plus
  the json and txt measurement dumps they cite. Screenshots are produced at run time and are not versioned.
- `field-shift-app/backend/fixtures/field-scenarios.json`: the whole data set, three fields with three scenarios
  each. Coverage is 86, 91 and 62 percent; SMAP soil moisture is 0.28, 0.31 and 0.19 m3/m3, all retrieved.
- `outputs/field-shift.md` and the `field-shift-docs` site: the narrative and the dossier.

## Known limitations

These are recorded rather than hidden, and they do not block a demo:

- The `Command` button does not carry the primary fill that requirement R-02 of block 3 describes, because no
  acceptance criterion measures it. It is an open item.
- `Rotation suitability` is the only `modelled` row in the fixture and it belongs to a scenario that the evidence
  panel does not render, so the modelled marker never shows on screen with this data. The behaviour is covered by
  tests, not by the running app.
- The block 3 carry-over list (CO-01 to CO-09) is still open: layer rail covered at 360 px width, attribution
  positioned mid screen at 360, evidence table truncation at 400 px, no field labels on the map, 7 to 9 px body
  type, fixture dates in 2025 against a 2026 satellite layer, and contrast of secondary labels.

Limits of the block 4 climate evidence, which the evidence panel also states:

- It is municipal. NASA POWER values are reanalysis grid cell averages of about 0.5 by 0.625 degree at the IBGE
  centroid, not station or field readings, and PAM yields are municipal statistics. None of it describes a field.
- Samples are small. Strong El Nino crop years number 5 in the POWER record, and 2 or 3 per crop in PAM
  (the Luis Eduardo Magalhaes PAM series starts in 2001). Rows with fewer than 3 years are flagged `small sample`.
- Crop seasons, which decide which ENSO year a crop is compared with, are assumptions until the CONAB crop calendar
  is cited; those rows are flagged `assumed crop season`.
- The two pilot fields are synthetic rectangles centred on the IBGE centroid, have no rotation scenarios and always
  abstain, because their coverage is not measured.
- The HUD rotation cards for Santa Carmem stay the hand-written fixture of blocks 1 to 3. The scored rotations live
  on the analysis page and exist only for Tupancireta and Luis Eduardo Magalhaes, because only their regions have
  candidate rotations and crop calendars in `config/rotations.yaml`.

Limits carried over from Field Phase, unchanged by the port:

- Planting calendars are not yet confirmed against CONAB and stay marked as an assumption.
- Scores are min-max within one municipality and kind of year, so they exaggerate small differences; fixed scales
  are proposed in `field-shift-pipeline/docs/scoring.md`, not applied.
- CHIRPS rainfall and the MapBiomas land-use history are not ingested.
- Only three municipalities, not all of RS and MATOPIBA.
- The scores have not been validated against observed yields (Field Phase Phase 4).

## Using this material

The repository is private and belongs to UFRJ Analytica. Contact the team before reusing the fixture data.
