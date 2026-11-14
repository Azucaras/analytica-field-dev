# T4 brief: Brazilian farmer decision drivers on rotation

You are one researcher on a deep research run. You have no session history, so everything you need is here. Sources are mostly Portuguese; write the pack in English and keep Portuguese terms in brackets on first use.

## Output contract

Write exactly one file: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/farmers-br/T4.md`. Nothing else is your output.

File structure:

1. `# T4 Brazilian farmer decision drivers`
2. `## Driver table` with exactly these columns: `driver | region | who it binds (owner, tenant, lender, co-op, agronomist) | how it shows up in practice | evidence of weight | what data would measure it | source URL | read status | date`
3. `## Per driver` one `###` block each: mechanism, numbers with units, who carries the cost, and the counterexample.
4. `## Region notes` for the Cerrado (MT, GO, MS, BA) soy-cotton-maize and integrated crop-livestock-forest, and for Parana and Rio Grande do Sul no-till soy-wheat.
5. `## Second crop timing` on the safrinha maize window and why the soy maturity group sets it.
6. `## What I could not find`.
7. `## Source list` with read status per line.

Labels on every claim: `(read)`, `(URL verified, not read)`, `(discovery only)`. Attribute every quote.

## Environment facts, measured before you started

- X is readable through `web_extract` on `https://x.com/<handle>`, which returns recent posts with ISO timestamps and status URLs; verify a specific post through `https://api.fxtwitter.com/i/status/<id>`. `portal_x_search` is absent.
- `web_search` and `web_extract` are available; Hound `smart_search` and `smart_fetch` reach pages plain extraction misses. Obscura MCP network-errors on `spaceappschallenge.org` only.
- Paper search works keyless: Semantic Scholar `https://api.semanticscholar.org/graph/v1/paper/search`, OpenAlex `https://api.openalex.org/works`, Crossref `https://api.crossref.org/works`.
- YouTube: `web_extract` on a watch URL gives the description; channel pages list recent uploads. Brazilian agronomy channels and Canal Rural, Globo Rural and Noticias Agricolas are the useful press.
- Arch Linux, `curl`, `jq`, `python3` present.

## Freshness window

2025-01-01 to 2026-11-10 for prices, credit, policy and current pest pressure. Embrapa bulletins and adoption literature from any year are welcome and must carry their year.

## Why this pack matters

Brazil is the harder half of the geographic scope and the one a US-centric tool gets wrong. Rotation there is driven by second-crop timing, rural credit and PROAGRO, cooperative and trader relationships, EUDR traceability, no-till tradition in the south, and a legal reserve regime that constrains area. A tool that recommends a cover crop without knowing the safrinha window, or a rotation without knowing the credit calendar, is unusable in Mato Grosso.

Cover at least: soybean-maize second crop timing, cotton in the rotation and its pesticide load, integrated crop-livestock-forest adoption and economics, no-till and the FEBRAPDP network, rural credit and Plano Safra terms, PROAGRO and crop insurance limits, EUDR and CAR traceability, fertiliser and freight cost (Mato Grosso freight to port), land value and lease arrangements, corn leafhopper (Dalbulus maidis) and stunt, soybean cyst and root-knot nematode, Cercospora and Asian rust resistance, frost risk in PR and RS, ZARC compliance as a credit condition, and the Embrapa and co-op extension channel.

## Rules

Say when a source is a co-op or trader with an interest in the recommendation. Distinguish Cerrado from southern practice rather than averaging them. Never round a price or a percentage without its date and its basis.