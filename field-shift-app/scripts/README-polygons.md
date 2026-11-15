# Polygon build (block 5, CO-B5-01 and CO-B5-02)

Produces the offline products the block 5 map mounts, with the commands of R-10 of
`specs/bloco-5-poligonos-de-cultura.md` revision 5 kept literal.

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
| `data/polygons/br-mt-detail.pmtiles` | Trazo3 extract over the Mato Grosso box, layer `trazo` |
| `data/polygons/br-mt-overview.pmtiles` | the GeoParquet merged on `mbmode24` |
| `data/polygons/polygon-classes-br.json` | 14 rows from the MapBiomas Collection 11 legend |

The binary products are git ignored (see the root `.gitignore`); only the two small
Table G records and the class tables are versioned. `scripts/polygon_build.py` also
measures the tiers and writes the artifacts under `artifacts/` that AC-03, AC-04 and
AC-06 read.

Two known readings the app card has to handle, both recorded in
`artifacts/polygon-build-manifest.json`:

- the Brazil detail extract carries a points level at zoom 8 (no `Id`, no polygon)
  and both points and polygons at zooms 9 to 11, because the published file was
  built from a points file and two polygon files joined together;
- the Brazil detail tier exceeds the 250 KB detail budget at zoom 9 for two tiles in
  the pinned V1 viewport (256,321 and 345,460 bytes) and in the worst tile of the
  file at zooms 8, 9 and 10 (369,262, 653,050 and 346,421 bytes).
