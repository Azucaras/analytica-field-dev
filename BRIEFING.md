# BRIEFING: Field Shift research report

Every worker reads this file first. It wins over any paraphrase in a brief or a card.

## Purpose and audience

A cited research report for a small team competing in the NASA Space Apps 2026 challenge "Field Shift: Adapting Farms with NASA Data". The team is building a decision-support app: an interactive map, agent assistance through text-to-SQL, voice commands, and interaction patterns borrowed from game UX.

The report's job is to make the team dangerous in four days. It has to give them the challenge's real requirements, the physical truth about every sensor, the farmer constraints that decide whether advice is usable, the 2026 conditions, the interaction design, and a build path. It is not a survey for its own sake.

Reader: technically competent, remote-sensing literate, agronomically literate but not a farmer. They will build from this.

## The clock

Submission is 2026-11-15, the event runs 2026-11-14 to 2026-11-15, and this report is written on 2026-11-10.

But do not scope to those two days. The build is agent-heavy, components get tested before the event, and the target is the largest feature surface the team can carry, on the order of a semester of work compressed by heavy AI agent use. The two-day event is the submission and demonstration window, not the build ceiling.

Three consequences for every section:
1. Breadth beats trimming. When a subsection names capabilities, list the full set and let the team cut, rather than pre-cutting for a two-day sprint.
2. Phase the build rather than shrink it. Where a plan calls for a path, give a working-thin version and the full version behind it.
3. Hard constraints move from time to validity. The things that actually bite are wrong joins, unlabelled proxies, unsourced numbers, and a demo a judge cannot reproduce.

## Language and hard style rules

- English. Brazilian terms stay in Portuguese in brackets on first use.
- One idea per sentence, subject named. No filler openers ("It is important to note").
- No em dashes and no en dashes anywhere in prose. Use commas, or "to" for numeric ranges.
- Mechanism over impression. Say how a thing works, not how impressive it is.
- Explain a technical term at first use in one clause.
- Numbers carry units and a date. Prices carry a currency and a month.
- Every figure carries one basis label in parentheses: `measured`, `computed`, `documented` or `recalled`. A resolution quoted from a product page is `documented`. A number you calculated is `computed`. Nothing here is `measured` by this run except the checks the packs record.
- No process notes in the body: no "the plan says", no confidence values, no wave or card names.
- Attribute any farmer or practitioner quote with handle or publication and date.

## Structure and assembly

Nine sections, thirty-seven subsections, one file per subsection at `outputs/sections/subsections/S<s>.<k>.md`. The lead assembles sections from those files and the report from the sections. You write only your own files.

Section titles and subsection titles come from your section plan verbatim. Do not rename or merge them, and do not write a section introduction; the lead assembles.

## Scope

Brazil and the USA. Brazil: Cerrado (MT, GO, MS, BA) soy-cotton-maize and integrated crop-livestock-forest; Parana and Rio Grande do Sul no-till soy-wheat. USA: Corn Belt (IA, IL, NE, MN); Plains and irrigated West (KS, NE, TX, CA). Out of scope: the other 2026 challenge themes, a working prototype, model training, remote hardware.

## Source rules

Write from the packs in `research/`. Each subsection plan names its source ranges. You may fetch one narrow missing fact per subsection, and then it goes into the subsection with its URL and read status. Prefer the pack over the web: a fact the pack already carries, re-fetched, invites a contradiction nobody reconciles.

Never invent a resolution, a cadence, a latency, a price, a statute number or a quote. If the pack says a product is unconfirmed, keep it unconfirmed.

Retrieval, if you need it: Hound `smart_fetch` for pages that resist plain extraction (it clears `spaceappschallenge.org`, where Obscura network-errors). `web_search` and `web_extract` otherwise. Paper search is keyless through Semantic Scholar, OpenAlex and Crossref from `curl`. X is readable through `web_extract` on `https://x.com/<handle>` and a specific post verifies through `https://api.fxtwitter.com/i/status/<id>`.

## Citation style

Inline markdown link on first mention of a source inside a subsection, using the canonical URL from the pack row, then plain text afterwards. Example: `the SMAP grid ([NSIDC user guide](https://nsidc.org/...)) posts 9 km`. Keep the read-status label the pack used. No footnotes, no numbered citation list: the lead renders sources from the ledger.

## Figures

Each plan has a figure manifest. Emit a figure only if the plan names one for your subsection, and emit it as an inline markdown table or an ASCII-free mermaid block, capped at 10 lines. Label it with its basis label. Do not draw anything the packs do not support.

## Done criteria per subsection

- The subsection answers its planned question in its planned point, and does not drift into its neighbours' boundary.
- Length within about 15 percent of the plan budget.
- Every load-bearing number and claim traces to a pack row or a fetched URL.
- The limit field is honoured: where the point stops holding is said, in the text.
- No dashes, no process notes, no placeholders, no "TBD".

## Workspace

Run root `/run/media/carloshnp/D/Programming/analytica-field-dev/`. Packs under `research/`, plans under `plans/`, subsection files under `outputs/sections/subsections/`. Absolute paths everywhere; the shell's working directory may be `/`.

## The spine, so every section pulls the same way

The challenge invites satellite-derived rotation advice. The sensors observe proxies with hard limits. The constraints that decide a rotation sit mostly outside the satellite, with lenders, landlords, co-ops and seasons. The app still has to be usable by someone without remote-sensing training. Every section serves that and says so in its own terms.
