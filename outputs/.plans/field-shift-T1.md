# T1 brief: NASA dataset capability pack

You are one researcher on a deep research run. You have no session history, so everything you need is here.

## Output contract

Write exactly one file: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/nasa-data/T1.md`
Create the directory if needed. Nothing else is your output. Do not write to another researcher's path.

Structure of the file, in this order:

1. `# T1 NASA dataset capability pack` and a one-line statement of what the pack covers.
2. `## Capability table` with exactly these columns: `dataset | short name | CMR concept id | native spatial resolution | revisit cadence | latency to near real time | record start year | known gaps or failure modes | rotation decision it can inform | decision it only illustrates | access route and cost | primary source URL | read status`
3. `## Per dataset` one `###` block per dataset covering: what the instrument physically measures; the proxy physics and where the proxy breaks; the measurement depth or footprint; what a farmer would have to believe for the number to mean anything; the two most credible validation papers or product-readme statements found.
4. `## Cannot do` a blunt list of the things no dataset here can establish about a rotation choice.
5. `## What I could not find` plain statements of gaps, including dead links and gated docs.
6. `## Source list` every URL used, one per line, with its read status.

Labels are mandatory on every claim: `(read)` when you opened the source and read it, `(URL verified, not read)` when the URL resolved but you took the claim from a snippet or abstract, and `(discovery only)` when you saw it cited elsewhere and did not open it. Never invent a resolution, cadence, latency or coverage date without a source on the same row.

Cover at least these twelve products, one row each: SPL3SMP_E (SMAP L3 enhanced 9 km soil moisture), SPL2SMP_E, SPL4SMGP (SMAP L4 root zone), ECO_L3T_JET (ECOSTRESS evapotranspiration), ECO_L4T_ESI (evaporative stress index), ECO_L2T_LSTE (ECOSTRESS land surface temperature), GPM_3IMERGDF (IMERG final), GPM_3IMERGDL (IMERG late), HLSL30 and HLSS30 (Harmonized Landsat Sentinel), MOD13Q1 (MODIS NDVI/EVI 16 day), MOD11A1 (MODIS land surface temperature), TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4 (GRACE/GRACE-FO mascon), SRTMGL1 or NASADEM, GEDI L4B, and the NASA POWER daily point API. Add any product you judge load-bearing.

## Environment facts, measured before you started

- Obscura MCP browser tools exist but network-error on `spaceappschallenge.org` and its asset host. Hound `smart_fetch` with the default auto fetcher sets returns those pages through its stealthy tier (200 OK). Use Obscura first on other hosts, fall back to Hound, fall back to `web_extract`.
- `web_search` and `web_extract` are available and rate-limit on some source-code and model-card pages. For repository files use `raw.githubusercontent.com`; for metadata use the GitHub REST API.
- Paper search works keyless through Semantic Scholar `https://api.semanticscholar.org/graph/v1/paper/search`, OpenAlex `https://api.openalex.org/works`, and Crossref `https://api.crossref.org/works`. Use `terminal` with `curl` for these. arXiv `abs` pages and publisher pages also resolve.
- Earthdata CMR is public and needs no key: `https://cmr.earthdata.nasa.gov/search/collections.json?short_name=SPL3SMP_E` and the granule endpoint work from `curl`. Downloads need an Earthdata Login, which you do not have, so record that rather than attempting a download.
- The host is Arch Linux with 12 cores. Nothing is installed for you; `python3`, `curl` and `jq` are available.

## Freshness window

Current capability claims from 2025-01-01 to 2026-11-10. Product readmes, algorithm theoretical basis documents and validation papers from any year are welcome and must carry their date. Any 2026 claim carries its month.

## What this pack is for

A team is building a decision-support tool for crop rotation choice, scoped to Brazil and the USA, that must compare at least three rotation strategies with evidence, gaps and risks. The pack is the ground truth for what each satellite measurement can and cannot support, so the report never claims a dataset decides something its physics cannot reach. Precision matters more than breadth: a product correctly described as 9 km, 2 to 3 day composite, top 5 cm, drought-scale, is worth more than six products described vaguely.

## Rules

Search many angles, not one query per product. Prefer the official product page, the algorithm theoretical basis document and the validation literature over blog explainers. Community claims are welcome only when attributed. If a product turns out to be dead, superseded or unavailable, say so with the source and keep the row.

Done when the table has twelve or more filled rows, every row carries resolution, cadence, latency and a source URL, and the cannot-do list is specific enough that a writer could quote it.
