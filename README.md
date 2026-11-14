# Field Shift

Field Shift is a satellite backed field planning prototype built for the NASA Space Apps Challenge. It reads a
small fixture of three agricultural fields, shows satellite soil moisture from NASA GIBS on a MapLibre map, and
presents rotation scenarios with the evidence behind each one, including what is measured and what is only modelled.

The project lives in three parts:

| Path | What it is | Runtime |
|---|---|---|
| `field-shift-app` | The application: Vite, React and TypeScript front end, plus the FastAPI backend that serves the fixture and proxies the GIBS tiles | Node and Python |
| `field-shift-docs` | The documentation site (Astro Starlight) that publishes the specs and the project write up | Node |
| `docs`, `plans`, `research`, `outputs` | Written material: briefing, plans, prior art, research notes and the dossier | none |

## Short answer: `npm install` is not enough

`npm install` inside `field-shift-app` installs the front end only. The backend is Python and needs its own
virtual environment and `pip install`. The docs site has a third, separate `npm install`. There is no single
command that installs all three.

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

Open http://localhost:5173. The front end calls the backend at `http://localhost:8000` by default; see the
environment variables below to point it somewhere else.

### 3. Documentation site, optional

```sh
cd field-shift-docs
npm install
npm run dev
```

## Tests and checks

Front end, from `field-shift-app`:

```sh
npx tsc -b --noEmit     # type check, no emit
npx vitest run          # 12 files, 97 tests
npm run build           # production build into dist/
```

Backend, from `field-shift-app/backend`:

```sh
.venv/bin/python -m unittest -q test_commands   # 8 tests
```

These are the numbers measured on the state that is committed here: tsc exit 0, 97 vitest tests green, 8 backend
tests green, build clean.

## Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | front end | `http://localhost:8000` | Base URL of the backend the front end calls |
| `TILE_UPSTREAM_URL` | backend | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best` | Upstream origin for the tile proxy, useful for pointing at a mock |
| `TILE_CACHE_DIR` | backend | `backend/.tile-cache` | Where proxied tiles are cached for 24 hours |

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

## Using this material

The repository is private and belongs to UFRJ Analytica. Contact the team before reusing the fixture data.
