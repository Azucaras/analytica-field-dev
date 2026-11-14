# T3 brief: US farmer decision drivers on rotation

You are one researcher on a deep research run. You have no session history, so everything you need is here.

## Output contract

Write exactly one file: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/farmers-us/T3.md`. Nothing else is your output.

File structure:

1. `# T3 US farmer decision drivers`
2. `## Driver table` with exactly these columns: `driver | region | who it binds (owner, tenant, lender, agronomist) | how it shows up in practice | evidence of weight | what data would measure it | source URL | read status | date`
3. `## Per driver` one `###` block each: the mechanism, the numbers with units, who pays the cost, and the counterexample that weakens it.
4. `## Region notes` for the Corn Belt (IA, IL, NE, MN) and for the Plains and irrigated West (KS, NE, TX, CA), naming what differs.
5. `## Tenant and landlord split` because roughly half of US farmland is rented and a rotation change usually needs a landlord.
6. `## What I could not find`.
7. `## Source list` with read status per line.

Labels on every claim: `(read)`, `(URL verified, not read)`, `(discovery only)`. A farmer quote carries the handle or publication and the date.

## Environment facts, measured before you started

- X is readable only through the desktop preview pane, which is the lead's tool, so for X use `web_extract` on `https://x.com/<handle>` which returns recent posts with ISO timestamps and status URLs. If a specific post matters, verify it through `https://api.fxtwitter.com/i/status/<id>`.
- `web_search` and `web_extract` are available. Hound `smart_search` and `smart_fetch` are available and reach pages that block plain extraction.
- `portal_x_search` is absent from this session. `browser_exec` with `local=true` fights the desktop app for the Chromium profile, so do not rely on it.
- Paper search works keyless: Semantic Scholar `https://api.semanticscholar.org/graph/v1/paper/search`, OpenAlex `https://api.openalex.org/works`, Crossref `https://api.crossref.org/works`.
- Arch Linux, `curl`, `jq`, `python3` present.
- YouTube: `web_extract` on a watch URL returns the description and sometimes the transcript; grab the channel page for a grower's recent uploads.

## Freshness window

2025-01-01 to 2026-11-10 for prices, policy and current practice. Extension bulletins and adoption surveys from any year are welcome and must carry their year.

## Why this pack matters

The team is building a tool that tells a farmer which rotation to consider. That only works if the drivers are the farmer's real ones: cash rent, crop insurance base acres, equipment width, landlord terms, elevator basis, water rights, labour at harvest, and the fact that changing rotation can lose a farm programme payment. The classic agronomic list (nitrogen, erosion, organic matter) is the easy half. This pack must reach the costly half.

Cover at least: cash rent and land tenure, crop insurance and base acres, price and basis for corn and soybean, fertilizer and fuel cost, equipment and labour constraints at planting and harvest, landlord and multi-generation decision authority, cover crop cost share through NRCS EQIP and CSP, herbicide resistance (Palmer amaranth, waterhemp), Ogallala depletion and Kansas LEMAs, California SGMA and fallowing, alfalfa and forage value in the irrigated West, frost and freeze risk in the Plains, and the role of the agronomist or retailer in the recommendation.

## Rules

Prefer the farmer's own words where you can get them: farm press quotes, podcasts, grower X accounts, Reddit r/farming threads. Mark clearly when a driver is asserted by industry rather than by farmers. Never round a price without its date.