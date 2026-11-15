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
