# T6 brief: the spacedata companion site and prior art

You are one researcher on a deep research run. You have no session history, so everything you need is here.

## Part A: the companion site, logged-out only

Target: `https://spacedata.swapniltamse.com/challenges/field-shift-adapting-farms/`

The user has approved inference from logged-out pages only. Do not log in. Where a page or feature clearly needs a session, say so and say what it would unlock.

Map the site's information architecture from what a stranger can see: the challenge entry, the dataset list and its access badges (no login, free API key, Earthdata Login, works in browser), the "your first hour" sequence, the starter code blocks, the live CMR search widget, the matched-theme cards, the filter and navigation structure, and any scoring or submission framing. Then answer what the site reveals about the intended solution shape that the official challenge page does not: which datasets a domain expert ranks first, what the first hour says to build, which products carry an access cost, and what the example winners suggest about scope.

Note every site-wide page you can reach without a login: challenge index, other challenges, about, any blog or methodology page. Record the timer, the tracker or scoreboard if one exists.

## Part B: prior art

Two layers.

1. Direct evidence: read `/run/media/carloshnp/D/Programming/hackathon_nasa_2026/relatorio-nasa-2026.md`, a previous run's report on 2024 and 2025 Space Apps winners. Extract the reusable patterns and, separately, the patterns that won and would not survive judging today. Note the screenshots under `prints/` by filename as evidence of what those teams shipped.
2. Commercial prior art: Regrow Ag, Climate FieldView, Corteva Granular, CIBO Technologies, OneSoil, Aegro, Solinftec, Stratus, Agmatix, plus any 2025 or 2026 product that already does rotation scoring. For each: what it actually sells, how it gets field boundaries, whether it is farmer-facing or enterprise-facing, its pricing model where public, and the specific gap a hackathon tool could occupy without pretending to beat it.

## Output contract

Write exactly one file: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/site-prior-art/T6.md`. Nothing else is your output.

File structure:

1. `# T6 Companion site and prior art`
2. `## Site map` a table with `page or feature | what it does | login needed | what it reveals | read status`
3. `## What the site implies about the intended solution` with each inference marked as inference and the observed detail it rests on.
4. `## Starter code review` on whether the supplied snippets would run as printed, what is missing from them, and what a reader would have to supply.
5. `## Prior art table` with `product | what it sells | boundary source | customer | pricing basis if public | rotation capability | gap left open | source URL | read status`
6. `## Winners teardown` on the 2024 and 2025 patterns, with the screenshot filenames cited as evidence.
7. `## What I could not find`, and for part A a list of pages or features worth logging in for.
8. `## Source list` with read status per line.

Labels on every claim: `(read)`, `(URL verified, not read)`, `(discovery only)`.

## Environment facts, measured before you started

- Obscura MCP network-errors on `spaceappschallenge.org`. Hound `smart_fetch` with the default auto fetcher returns those pages. On `spacedata.swapniltamse.com`, try Obscura first, then Hound, then `web_extract`.
- `web_search` and `web_extract` are available. `portal_x_search` is absent; for an X handle use `web_extract` on `https://x.com/<handle>`.
- The site's live CMR widget calls `https://cmr.earthdata.nasa.gov/search/`, which is public from `curl`, so you can reproduce what the widget does.
- Arch Linux, `curl`, `jq`, `python3` present. Read local files with `read_file`, not `cat`.

## Freshness window

2025-01-01 to 2026-11-10 for product status and any site change. The 2024 and 2025 winners material is dated to its own event and must say so.

## Why this pack matters

The report has to tell the team what is already built and what the challenge author expects, so the app aims at an unoccupied gap. It must not recommend building a worse version of a product that has a decade head start.

## Rules

Never claim a feature the site only implies. Distinguish "the site ranks SMAP first" from "the site counts soil moisture as the starting measurement". For part B, separate what a product demonstrably ships from what its marketing page promises.