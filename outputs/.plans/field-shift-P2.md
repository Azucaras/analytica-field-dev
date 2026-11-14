# P2 brief: section plans for S4, S5, S6

You are drafting frozen section plans for a deep research report. You write plans, not prose.

## What the report is

A cited research report on the NASA Space Apps 2026 challenge "Field Shift: Adapting Farms with NASA Data". The audience is a small team building a decision-support app: interactive map, agent assistance through text-to-SQL, voice commands, game-derived interaction. Geography is Brazil and the USA. Language is English.

The report's spine: the challenge invites satellite-derived rotation advice, the sensors have hard physical limits, the farmers' real constraints sit mostly outside the satellite, and the app has to be usable by someone with no remote-sensing training. S4, S5 and S6 are the spine's middle: they are where the report earns the right to say what a rotation recommendation must contain.

## Source packs to read first

- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/farmers-us/T3.md`
- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/farmers-br/T4.md`
- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/pressures/T5.md`

S4 draws on T3, S5 on T4, S6 on T5 across all three.

## Output contract

Write exactly three files: `plans/S4.md`, `plans/S5.md`, `plans/S6.md`, under `/run/media/carloshnp/D/Programming/analytica-field-dev/`. Follow the template exactly.

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

Field meanings: `question` the subsection answers; `reader` who it is written for and what they already know; `entry` the concrete thing the reader arrives with; `point` the single claim; `chain` the causal or numeric steps carrying the point; `principle` the general rule the instance proves; `instance` the specific case, field or farmer carrying it; `limit` where it stops holding; `budget` words; `boundary` what the neighbouring subsection owns; `source` pack headings or line ranges; `file` under `outputs/sections/subsections/`.

Every field filled, no placeholders.

## Subsections, use these titles verbatim

S4 What US farmers weigh
- S4.1 Cash rent, tenure and the landlord veto
- S4.2 Crop insurance, base acres and programme payments
- S4.3 Price, basis and where a rotation stops paying
- S4.4 Water: the Ogallala, Kansas LEMAs and SGMA fallowing
- S4.5 Resistance, frost risk and the agronomist channel

S5 What Brazilian farmers weigh
- S5.1 The safrinha window sets the whole rotation
- S5.2 Credit, ZARC and PROAGRO as rotation constraints
- S5.3 Freight, barter and the Mato Grosso netback
- S5.4 No-till tradition, frost and the southern system
- S5.5 EUDR, the CAR and the legal reserve

S6 The 2026 conditions a recommendation lands in
- S6.1 Policy and credit: glyphosate, the farm bill, Plano Safra
- S6.2 Input prices and the second-crop arithmetic
- S6.3 Climate and pest pressure through 2026

## Budgets

3,000 to 3,600 words for S4, 3,000 to 3,600 for S5, 1,700 to 2,000 for S6. Allocate per entry so the sum sits inside the band.

## Style the plans must assume

Writer prose rules: one idea per sentence with the subject named, no em or en dashes, no filler openers, mechanism over impression, technical terms explained at first use, numbers with units and a date. Every figure carries a basis label: `measured`, `computed`, `documented` or `recalled`.

## Rules

- S4 and S5 must keep the farmer's own words where the pack has them, attributed.
- S6 must date every claim by month and separate a scheduled event from a settled fact.
- Distinguish what satellite data can touch from what only a lender, landlord or co-op can settle. That distinction is the sections' working value.
- Where the pack marks something unconfirmed (Terra end date, IMERG V08, EPA glyphosate decision, GRACE-FO mode), the plan says so in Open questions.
- No section may promise a demo the run did not execute.

Done when all three files exist, every field is filled, and each Freeze checklist is honestly ticked or marked short.
