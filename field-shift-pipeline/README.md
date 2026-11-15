# field-shift-pipeline

The climate pipeline behind block 4 of Field Shift. It was brought in from the sibling project Field Phase
(`nasa_chall_train`) on 2026-11-14 with its tests, and Santa Carmem (IBGE 5107248) was added next to the two
Field Phase pilots, Tupancireta (4322202) and Luis Eduardo Magalhaes (2919553).

| Step | Module | Writes |
|---|---|---|
| Municipality codes, boundaries, centroids | `pipeline.fetch_regions` | `regions.parquet`, `regions.geojson` |
| CPC RONI, ONI, weekly Nino, discussion, strength outlook | `pipeline.fetch_enso` | `enso_*.parquet` |
| NASA POWER daily point data, 1981 to today | `pipeline.fetch_power` | `power_daily.parquet` |
| IBGE PAM yields, SIDRA tables 1612 and 839 | `pipeline.fetch_pam` | `pam.parquet` |
| Rain indices, anomalies, ENSO composites, season to date | `pipeline.build_evidence` | `climate_seasonal`, `composites`, `yield_anomalies`, `season_progress` |
| Soil water holding capacity and texture, ISRIC SoilGrids, 0 to 200 cm | `pipeline.fetch_soil` | `soil_profile.parquet` |
| MODIS NDVI since 2000, 10 m land cover 2017 to 2023, Copernicus elevation (Planetary Computer, no login) | `pipeline.fetch_planetary` | `ndvi_*`, `land_cover`, `terrain` parquet |
| Meteomatics 15 day, 46 day and seasonal forecasts, 51 members (needs a credential) | `pipeline.fetch_meteomatics` | `forecast_*.parquet` |
| FAO-56 ET0, daily soil water bucket, rotation scores per ENSO class | `pipeline.build_scoring` | `rotation_scores.parquet`, `monthly_climate_by_class.parquet`, `soil_water_years.parquet` |
| Dated JSON fixture for the block 4 HUD | `pipeline.export_fieldshift` | `../field-shift-app/backend/fixtures/climate/` |
| Field Phase contract v1.2 as static JSON for the analysis page (block 5) | `api.export --out ../field-shift-app/backend/fixtures/fieldphase/data/v1` | that folder |

The Field Phase commits `68ee20d` to `4d1d7b4` (Meteomatics, Planetary Computer, SoilGrids, FAO-56 and the rotation
scoring) were applied on 2026-11-14 for block 5. Santa Carmem has no candidate rotations or crop calendar in
`config/rotations.yaml`, so `build_scoring` skips it with a log line instead of borrowing another region's list.
The method is in `docs/scoring.md`; Meteomatics and Planetary Computer are in `docs/integrations.md`.

Run order and commands are in the root README. `data/` is gitignored and fully reproducible; every fetch caches
its raw response and re-runs from cache unless `--refresh` is passed. No credentials are needed.

Rules carried over from Field Phase: no value is typed by hand, every method choice in `config/*.yaml` carries a
`source:` (a citation, `project choice` or `suposicao`), and `pipeline/evidence.py` is pure so it stays unit
testable. `api/repository.py` is kept because the exporter reuses its payload builders; the Field Phase FastAPI
app in `api/main.py` is not part of the Field Shift demo. `docs/` holds the Field Phase notes on data sources and
on how the backend works.
