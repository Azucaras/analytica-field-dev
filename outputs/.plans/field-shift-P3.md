# P3 brief: section plans for S7, S8, S9

You are drafting frozen section plans for a deep research report. You write plans, not prose.

## What the report is

A cited research report on the NASA Space Apps 2026 challenge "Field Shift: Adapting Farms with NASA Data", for a team building a decision-support app with an interactive map, agent assistance through text-to-SQL, voice commands and game-derived interaction. Geography is Brazil and the USA. Language is English.

S7 to S9 are the delivery half: what the companion site and existing products already do, how the interaction layer should work, and what a buildable shape looks like. The app itself is still being specified by the user, so these sections give principles and a path, not a fixed design.

## Source packs to read first

- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/site-prior-art/T6.md`
- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/nasa-data/T1.md` (S9 needs the access and latency rows)
- `/run/media/carloshnp/D/Programming/analytica-field-dev/Game UX.md` (the game UX basis the user supplied)

S7 draws on T6. S8 draws on Game UX.md plus its own literature search. S9 draws on all three.

## Output contract

Write exactly three files: `plans/S7.md`, `plans/S8.md`, `plans/S9.md`, under `/run/media/carloshnp/D/Programming/analytica-field-dev/`. Follow the template exactly.

Per file:

```
# Section plan: field-shift S<n>

## Section
- id: S<n>
- title: <given below>
- part / level: <where it sits in the report's arc>
- target words: <sum of entry budgets, and the band>
- sources: <pack paths with line or heading ranges>

## Entries
### S<n>.<k> <subsection title>
- **question:**
- **reader:**
- **entry:**
- **point:**
- **chain:**
- **principle:**
- **instance:**
- **limit:**
- **budget:**
- **boundary:**
- **source:**
- **file:**

## Figure manifest
| Figure | Kind | What it shows | Used in subsection |

## Open questions and risks

## Freeze
<the checklist, ticked>
```

Field meanings: `question` the subsection answers; `reader` who it is written for and what they know; `entry` what the reader arrives with; `point` the single claim; `chain` the steps carrying it; `principle` the general rule; `instance` the specific case or product; `limit` where it stops holding; `budget` words; `boundary` what the neighbour owns; `source` pack headings or line ranges; `file` under `outputs/sections/subsections/`.

Every field filled, no placeholders.

## Subsections, use these titles verbatim

S7 The companion site and what is already built
- S7.1 What the companion site exposes to a stranger
- S7.2 What the starter code does and does not prove
- S7.3 What existing products already own, and the open gap

S8 Making the app usable: game UX, the map, the agent, the voice
- S8.1 What transfers from game UX and what does not
- S8.2 A map that carries the answer: thumb zones, radial actions, progressive disclosure
- S8.3 Text-to-SQL over a geospatial schema without lying
- S8.4 Voice in a noisy field
- S8.5 Showing uncertainty, and the moment the tool says ask your agronomist

S9 Build annex
- S9.1 Ingestion and the common grid
- S9.2 Scoring three rotations with evidence, gaps and risk
- S9.3 The agent layer: schema, tools, guardrails
- S9.4 Access reality: Earthdata Login, quotas, and what a judge can actually run

## Budgets

1,600 to 1,900 words for S7, 3,000 to 3,600 for S8, 2,200 to 2,600 for S9.

## Style the plans must assume

Writer prose rules: one idea per sentence with the subject named, no em or en dashes, no filler openers, mechanism over impression, technical terms explained at first use, numbers with units. Every figure carries a basis label: `measured`, `computed`, `documented` or `recalled`.

## Rules for S8 and S9 specifically

- S8 must name the evidence behind each transferred pattern (cognitive load, Fitts, progressive disclosure, radial menu studies) and the counter-evidence, since game UX claims are usually asserted rather than tested.
- S8.3 must cover the failure that makes text-to-SQL untrustworthy in public: a plausible wrong join. The subsection must reach schema design, validation and disclosure.
- S8.4 must be practical: a small command grammar beats free dictation, and confirmation is mandatory for anything that writes.
- S9 must keep every command runnable by the reader, naming the binary and the build it assumes, with the setting flags the evidence says are required and a failure path ordered by what to relax first.
- Nothing in S9 may describe a component the run did not verify: label anything unbuilt as planned.

Done when all three files exist, every field is filled, and each Freeze checklist is honestly ticked or marked short.
