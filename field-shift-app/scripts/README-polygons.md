# Polygon build (block 5, CO-B5-01 and CO-B5-02)

Produces the offline products the block 5 map mounts, with the commands of R-10 of
`specs/bloco-5-poligonos-de-cultura.md` revision 5 kept literal, except for the one
deviation recorded under "Brazil detail tier" below.

```sh
uv venv .venv-polygons --python 3.12
uv pip install --python .venv-polygons/bin/python -r scripts/requirements-polygons.txt
POLYGON_PYTHON=.venv-polygons/bin/python scripts/build-polygons.sh --label run-1
```

Needs `tippecanoe` (v2.82.0 built from source here) and the `pmtiles` CLI (v1.31.2)
on `PATH`, plus network access to `pdi.scinet.usda.gov` and `data.source.coop`.

Outputs, all recorded with size and sha256 in `artifacts/polygon-build-manifest.json`:

| File | What it is |
|---|---|
| `data/polygons/us-38017-detail.pmtiles` | CSB 2025 pilot box, layer `trazo`, `detail_minzoom` to 14 |
| `data/polygons/us-38017-overview.pmtiles` | the same input merged on the eight `cdl` columns |
| `data/polygons/us-38017.manifest.json` | the Table G zoom contract the app reads at load |
| `data/polygons/us-38017.tiles.json` | the Table G tile and feature counts |
| `data/polygons/polygon-classes-us.json` | 255 rows from the CDL raster attribute table |
| `data/polygons/br-mt-detail.pmtiles` | the published GeoParquet tiled at zooms 8 to 12 over the Mato Grosso box, layer `trazo` |
| `data/polygons/br-mt-overview.pmtiles` | the GeoParquet merged on `mbmode24` |
| `data/polygons/polygon-classes-br.json` | 14 rows from the MapBiomas Collection 11 legend |

The binary products are git ignored (see the root `.gitignore`); only the two small
Table G records and the class tables are versioned. `scripts/polygon_build.py` also
measures the tiers and writes the artifacts under `artifacts/` that AC-03, AC-04 and
AC-06 read.

## The class sidecar and the fixture fields (card `t_cf98ed11`)

The two clauses of CO-B5-01 and CO-B5-02 that the tile build does not own:

```sh
# the Brazil class sidecar: Id -> class, collection, year, area_ha
python scripts/build_class_sidecar.py \
  --parquet data/work/trazo3_brazil_mato_grosso_2024.parquet \
  --out data/polygons/polygon-class-mt-2025.sqlite
python scripts/record_sidecar.py \
  --sqlite data/polygons/polygon-class-mt-2025.sqlite \
  --out data/polygons/polygon-class-mt-2025.build.json
python scripts/verify_class_sidecar.py --json-out artifacts/AC-B5-02-sidecar-check.json

# the three Cass County fixture fields of R-24
git show 535bd9d:field-shift-app/artifacts/data-probe-us-first.json \
  > field-shift-app/artifacts/data-probe-us-first.json
python scripts/fixture_us_fields.py --write
python scripts/verify_fixture_us.py
```

| File | What it is |
|---|---|
| `data/polygons/polygon-class-mt-2025.sqlite` | one row per `Id`: `area_ha` from the source geometry, `class_id`, `collection`, `year` |
| `data/polygons/polygon-class-mt-2025.build.json` | the sidecar's size, sha256, row count, build command and the whole `build_meta` |
| `backend/fixtures/field-scenarios.json` | six fixture fields, three `br` and three `us`, each carrying its `region` |

**`class_id` is NULL on every row of the sidecar as built here.** The class comes
from a zonal mode over the MapBiomas Collection 11 2025 raster, and no copy of that
raster is reachable from this machine: the documented object
`brazil_coverage-col11_2025.tif` answers 403 for an anonymous caller and for the
authenticated Google account on this host, the MapBiomas download page says the map
download is suspended, and no Google Cloud project on this host has the Earth Engine
API enabled. The area column is complete and verified in both cases. Rerun
`build_class_sidecar.py` with `--raster <path> --raster-band <n>` once a local copy
exists; the zonal mode itself is checked against a brute force reference by
`scripts/test_class_sidecar.py`, which needs no network.

## Brazil detail tier

R-10 names `pmtiles extract --bbox` for `br-mt-detail.pmtiles`. That command copies
the published archive's zoom range and its per tile bytes, and the product it made
carried z0 to z12 plus tiles of 369,262, 653,050 and 346,421 bytes at z8, z9 and z10
against the 250 KB detail budget of R-08, which fails AC-06. Repair card `t_d7457a47`
tiles the tier with tippecanoe from the same published GeoParquet the overview uses:

```sh
POLYGON_PYTHON=.venv-polygons/bin/python scripts/build-polygons.sh \
  --only br-detail --label br-detail-repair
```

`--only br-detail` rebuilds this one product and leaves the United States tier, the
Brazil overview and both class tables as they are. The command, the flag choices and
the measurement are in `artifacts/AC-06-budget.txt`; the short version is `-Z8 -z12`
(Table B's range), `-y Id -y mbmode24` (the two properties the detail row reads),
`--drop-densest-as-needed` with `--maximum-tile-bytes=250000` (dropping keeps each
surviving field's own `Id`, where coalescing would merge fields), `--low-detail=10
--full-detail=12` and `--buffer=12` (the geometry and the tile edge duplication the
published tiles carry), and `--clip-bounding-box` on the M-06 box.

The rebuilt tier is at most 235,949 bytes per tile, carries z8 to z12 and nothing
else, and every tile at every zoom carries both `Id` and `mbmode24`. The previous
extract carried a points level at zoom 8 with no `Id`, and both points and polygons
at zooms 9 to 11, because the published file was built from a points file and two
polygon files joined together; the rebuilt tier is polygons only.
