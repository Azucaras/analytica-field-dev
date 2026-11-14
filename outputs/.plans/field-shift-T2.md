# T2 brief: non-NASA soil, crop and management data sources

You are one researcher on a deep research run. You have no session history, so everything you need is here.

## Output contract

Write exactly one file: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/sources/T2.md`. Nothing else is your output.

File structure:

1. `# T2 Non-NASA soil and crop data sources`
2. `## Source table` with exactly these columns: `source | steward | geography covered | native resolution | vintage and update cadence | field it supplies (soil, crop, management, boundary, market) | access route | licence and redistribution constraints | rotation decision it can inform | primary source URL | read status`
3. `## Per source` one `###` block per row: what the source actually records and how it was collected, the resolution or aggregation trap, whether it is sample-based, modelled or administrative, and what it costs to join to a 30 m satellite grid.
4. `## Brazilian specifics` covering soil mapping coverage in the Cerrado, PronaSolos status, SICAR and the CAR, ZARC, MapBiomas and PRODES/DETER, and the licensing or political sensitivity of each.
5. `## US specifics` covering gSSURGO and gNATSGO, the Cropland Data Layer and CroplandCROS, NASS statistics, RUSLE2 and erosion models, and state-level water allocation data.
6. `## What I could not find`, including any source that is paid, gated or coverage-limited.
7. `## Source list` with read status per line.

Labels on every claim: `(read)`, `(URL verified, not read)`, `(discovery only)`. Licence terms matter as much as content: a source the app cannot redistribute is a design constraint, so record it.

## Environment facts, measured before you started

- Obscura MCP browser tools exist but network-error on `spaceappschallenge.org`. Hound `smart_fetch` returns those pages fine. Use Obscura first on other hosts, fall back to Hound, fall back to `web_extract`.
- `web_search` and `web_extract` are available. For repository files prefer `raw.githubusercontent.com`; for metadata the GitHub REST API.
- Paper search works keyless through Semantic Scholar `https://api.semanticscholar.org/graph/v1/paper/search`, OpenAlex `https://api.openalex.org/works` and Crossref `https://api.crossref.org/works` from `curl`.
- The Web Soil Survey and gSSURGO need no key. `https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest` answers Soil Data Access queries by POST. CropScape and CroplandCROS are public. IBGE and Embrapa PDFs are public.
- Arch Linux, 12 cores, `curl`, `jq`, `python3` present. No Earthdata Login, no downloads of bulk archives: record access cost instead.

## Freshness window

2025-01-01 to 2026-11-10 for currency and policy status. Soil surveys and older atlas sheets are welcome and must carry their survey year.

## Why this pack matters

The challenge states plainly that local soil and crop data are not NASA products and must come from a partner or a public survey. This pack decides whether the app can do that at field scale in Brazil and the USA, or has to fall back to coarser regional priors. Be honest about Brazilian soil-map scarcity: a map at 1:250,000 is a different product from a 10 m SSURGO map unit.

Cover at minimum: gSSURGO, gNATSGO, Web Soil Survey, Cropland Data Layer, CroplandCROS, NASS Quick Stats, RUSLE2, PRISM or gridMET climate normals, Embrapa soil maps, PronaSolos, IBGE pedology, MapBiomas Collection 10 or newer, PRODES, DETER, SICAR/CAR, ZARC, Embrapa cultivar and forage catalogues, and one market data source per country. Add what you judge load-bearing.

## Rules

Verify the licence before praising coverage. Where a Brazilian source has no public API, say what the alternative is. Never state a resolution without the source that gives it.