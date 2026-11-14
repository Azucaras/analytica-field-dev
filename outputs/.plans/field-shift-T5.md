# T5 brief: the 2026 pressure landscape

You are one researcher on a deep research run. You have no session history, so everything you need is here.

## Output contract

Write exactly one file: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/pressures/T5.md`. Nothing else is your output.

File structure:

1. `# T5 2026 pressure landscape`
2. `## Pressure table` with exactly these columns: `pressure | domain (policy, economics, climate, water, pest, market access, programme) | geography | state as of date | who it binds | direction of travel | what it changes about rotation choice | source URL | read status | date`
3. `## Per pressure` one `###` block each: the sequence of events, the numbers with units, and what would have to happen for it to stop mattering.
4. `## Chronology` a dated timeline from 2025-01-01 to 2026-11-10 of only the events in the table.
5. `## Two-year outlook` separating scheduled events from speculation and labelling each.
6. `## What I could not find`.
7. `## Source list` with read status per line.

Labels on every claim: `(read)`, `(URL verified, not read)`, `(discovery only)`. Any 2026 claim carries its month. An unverified rumour is labelled as one.

## Environment facts, measured before you started

- Obscura MCP network-errors on `spaceappschallenge.org`; Hound `smart_fetch` returns those pages. `web_search` and `web_extract` are available and are the main route here.
- X is readable through `web_extract` on `https://x.com/<handle>` (recent posts, ISO timestamps, status URLs); verify a post through `https://api.fxtwitter.com/i/status/<id>`. `portal_x_search` is absent.
- Paper and legal-metadata search: Semantic Scholar `https://api.semanticscholar.org/graph/v1/paper/search`, OpenAlex `https://api.openalex.org/works`, Crossref `https://api.crossref.org/works`. Federal Register `https://www.federalregister.gov/api/v1/documents.json` and Brazil's `https://www.in.gov.br` consulta API are public.
- Arch Linux, `curl`, `jq`, `python3` present.

## Leads already verified in this run, confirm and date them

- A US executive order on glyphosate dated 2026-02-18, framed around domestic supply and food security, discussed on X in February 2026.
- Terra science operations ending around 2027-02.
- IMERG V07 Final halted on 2025-09-30 during the V08 transition, with V08 Final projected for autumn 2026.
- GRACE-FO in wide-pointing mode with the LRI suspended and RL07 reprocessing pending.

## Freshness window

2025-01-01 to 2026-11-10, strictly. This pack is worthless if it drifts older. Anything from 2024 is background and must say so.

## Why this pack matters

The report must state the conditions a 2026 recommendation lands in, or it reads as timeless advice. Keep every item tied to a rotation decision: a glyphosate rule changes cover-crop termination; an interest rate changes whether a second crop pencils; an EUDR deadline changes what a buyer will accept; a water allocation cut removes a rotation from the table.

Cover at least: US glyphosate and pesticide policy, the US farm bill state, US interest rates and operating credit, fertilizer and fuel prices, US tariff exposure to China and Brazil's exposure to China and the EU, the EUDR deadline and enforcement, Brazil's pesticide law and registration backlog, Plano Safra and rural credit volume, PROAGRO changes, La Nina or El Nino state through 2026, the Ogallala and Kansas LEMAs, California SGMA, Palmer amaranth and corn leafhopper spread, and the mid-2026 state of the 2026 US crop.

## Rules

Distinguish an announced rule from an enforced one. Distinguish a weather forecast from an observed season. Never let a scheduled event read as a settled fact.