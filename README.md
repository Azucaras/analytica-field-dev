# Field Shift

Field Shift helps a farmer decide which crop rotation to plant this season, given the El Nino that NOAA is
tracking for 2026. It was built for the NASA Space Apps Challenge 2026, *Field Shift: Adapting Farms with NASA
Data*.

The app opens on a map of fields. Pick one and you see the current ENSO state, how much rain has fallen since the
season started compared with normal and with past strong El Nino years, and the rotation options for that field.
The **Análise** button opens the full analysis for the field's municipality or county: forecasts, ranked rotations
with the arithmetic behind each score, yield history by crop, vegetation, land use and slope.

The map has two regions, chosen with `?region=us` (the default) or `?region=br`. Each shows real crop field
outlines (Crop Sequence Boundaries in the US, Trazo3 in Brazil), a layer rail of NASA products and a daily
timeline. The climate evidence and the analysis cover five places: Santa Carmem (MT), Tupanciretã (RS) and Luís
Eduardo Magalhães (BA) in Brazil, and McLean County (Illinois) and Lubbock County (Texas) in the United States. The
US region's own example fields are in Cass County (North Dakota), which the climate pipeline does not cover yet.

## Quick start

You need [Node.js](https://nodejs.org) 22 or newer, plus either [uv](https://docs.astral.sh/uv/) or Python 3.11
to 3.15. No key, account or data download is needed: the data the app shows is in the repository.

1. Get the code. On Windows, turn on long paths, because some documentation files have very long names:

   ```sh
   git clone -c core.longpaths=true https://github.com/Azucaras/analytica-field-dev.git
   ```

   The repository is private, so ask the team for access first.

2. Start it. On Windows, double-click `iniciar.cmd`. Anywhere else:

   ```sh
   cd analytica-field-dev/field-shift-app
   npm start
   ```

The first run takes a few minutes: it creates the backend's Python environment and installs the front end. Then it
picks free ports (8000 and 5173 unless they are taken), starts the backend and the front end, and opens the
browser. `Ctrl+C` stops both. The app opens in Portuguese; the PT/EN switch is at the end of the top bar.

The only network the app uses while running is for map tiles (OpenFreeMap, OpenStreetMap and NASA GIBS, all open).
Without internet the map background stays blank; the rest reads local data, though a fully offline run has not been tested.

## What is in the repository

| Folder | What it is |
|---|---|
| `field-shift-app` | The app: React and MapLibre front end, FastAPI backend, and the data the backend serves |
| `field-shift-pipeline` | The data pipeline: downloads every source, builds the evidence and the rotation scores, and writes the files the backend serves |
| `field-shift-docs` | The documentation site and the research dossier (Astro Starlight) |
| `docs`, `plans`, `research`, `outputs` | Research notes, plans and the dossier sources |

## Data

| What | Source | Key |
|---|---|---|
| ENSO state, history and outlook | NOAA CPC (RONI, ONI, weekly Niño 3.4, diagnostic discussion) | none |
| Daily weather since 1981 | NASA POWER, at each municipality or county centre | none |
| Yields, areas and revenue, Brazil | IBGE PAM (SIDRA tables 1612 and 839) | none |
| Yields, areas and revenue, US | USDA NASS Quick Stats | free key |
| Boundaries | IBGE (Brazil), US Census 2023 cartographic boundary file (US) | none |
| Soil water and texture | ISRIC SoilGrids | none |
| Vegetation, land use, elevation | MODIS NDVI, 10 m land cover, Copernicus DEM, via Microsoft Planetary Computer | none |
| Forecasts (15 days, 46 days, seasonal) | Meteomatics | account |
| Crop coefficients, root depths, ET0 | FAO-56 | none |
| US planting and harvest dates | USDA NASS Agricultural Handbook 628 (1997) | none |
| Satellite soil moisture layer on the map | NASA GIBS (SMAP) | none |

Brazil uses a July to June crop year. The US counties use the water year, October to September, because that is
where the El Nino signal shows up in the US (the cold season) and it keeps the summer crops inside one year.

## Refreshing the data

This is optional. The app already ships the data recorded on 2026-11-15. To download fresh data:

1. Copy `field-shift-pipeline/.env.example` to `field-shift-pipeline/.env` and fill in the keys you have. The file
   stays on your machine; git ignores it.
   - `NASS_API_KEY`: US yields, free at https://quickstats.nass.usda.gov/api
   - `METEOMATICS_USERNAME` and `METEOMATICS_PASSWORD`: forecasts, from a Meteomatics account
2. On Windows, double-click `atualizar-dados.cmd`. Anywhere else:

   ```sh
   cd field-shift-pipeline
   uv sync --extra planetary
   uv run python -m pipeline.update_all
   ```

It runs every step in order and ends with the two exports the app reads. A step whose key is missing is skipped and
the app keeps its old data for it. Every download is cached in `field-shift-pipeline/data/raw/`, so the second run
only fetches what is new; the satellite step takes about 20 minutes per place the first time. Leave a slow step out
with `--skip planetary`, for example. Restart the app afterwards to see the new data.

Each step can also run on its own, for example `uv run python -m pipeline.fetch_nass`; the list is in
`field-shift-pipeline/README.md`.

## Tests

```sh
cd field-shift-app && npx tsc -b --noEmit && npx vitest run && npm run build
cd field-shift-app/backend && .venv/Scripts/python -m unittest test_commands test_climate test_fieldphase
cd field-shift-pipeline && uv run pytest
```

On Linux or macOS the backend interpreter is `.venv/bin/python`.

## Settings

| Variable | Used by | Default |
|---|---|---|
| `VITE_API_BASE_URL` | front end | `http://localhost:8000` (`npm start` sets it for you) |
| `TILE_UPSTREAM_URL` | backend | the NASA GIBS WMTS endpoint |
| `TILE_CACHE_DIR` | backend | `backend/.tile-cache` |
| `CLIMATE_FIXTURE_DIR` | backend | `backend/fixtures/climate` |
| `FIELDPHASE_FIXTURE_DIR` | backend | `backend/fixtures/fieldphase` |

## Limits

- The climate and yield evidence describes a municipality or a county, not a field. NASA POWER is a reanalysis
  grid cell of about 50 km, and PAM and NASS are survey statistics.
- Samples are small: five strong El Nino years in the weather record, two or three per crop in the yield records.
  The app marks every comparison with fewer than three years.
- Brazilian planting dates are still an assumption until the CONAB calendar is cited. US dates come from a 1997
  USDA handbook at state level, not county level. The second crop after wheat in the US is an assumption.
- The pilot fields outside Santa Carmem are synthetic rectangles at the centre of their municipality or county,
  with no field-level rotation cards. Their scored rotations are in the analysis.
- Santa Carmem's rotation cards on the map are the hand-written examples from the first version. It has no
  scored rotations, because no candidate list or crop calendar has been set up for its region.
- McLean County was picked for the Corn Belt, but its winters are not drier under El Nino in the record (October
  to March rain is about 20 percent above normal in strong years), so it does not mirror Lubbock the way the two
  Brazilian pilots mirror each other.
- Scores are relative within one place and kind of year, so small differences look large. Gross revenue is used,
  not margin.
- A rotation is scored only when every crop in it is a main crop of the place (at least 1 percent of the recent
  planted area). Wheat in McLean and sorghum in Lubbock fall below that, so those rotations stay unranked.
- The scores have not been checked against observed yields.

## Ownership

The repository is private and belongs to UFRJ Analytica. Contact the team before reusing the data.
