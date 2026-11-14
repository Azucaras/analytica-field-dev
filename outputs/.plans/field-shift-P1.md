# P1 brief: section plans for S1, S2, S3

You are drafting frozen section plans for a deep research report. You write plans, not prose.

## What the report is

A cited research report on the NASA Space Apps 2026 challenge "Field Shift: Adapting Farms with NASA Data". The audience is a small team building a decision-support app: interactive map, agent assistance through text-to-SQL, voice commands, game-derived interaction. Geography is Brazil and the USA. Language is English.

The report's spine: the challenge invites satellite-derived rotation advice, the sensors have hard physical limits, the farmers' real constraints sit mostly outside the satellite, and the app has to be usable by someone with no remote-sensing training. Every section serves that spine.

## Source packs to read first

- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/nasa-data/T1.md`
- `/run/media/carloshnp/D/Programming/analytica-field-dev/research/sources/T2.md`

S1 draws on both plus the challenge text, quoted in `/run/media/carloshnp/D/Programming/analytica-field-dev/outputs/.plans/field-shift.md`. S2 draws on T1. S3 draws on T2.

## Output contract

Write exactly three files: `plans/S1.md`, `plans/S2.md`, `plans/S3.md`, under `/run/media/carloshnp/D/Programming/analytica-field-dev/`. Follow the template exactly, reproduced here.

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

Field meanings: `question` the subsection answers; `reader` who it is written for and what they already know; `entry` the concrete thing the reader arrives with; `point` the single claim; `chain` the causal or numeric steps that carry the point; `principle` the general rule the instance proves; `instance` the specific case, product or field carrying it; `limit` where the point stops holding; `budget` words; `boundary` what the neighbouring subsection owns so the two do not overlap; `source` pack headings or line ranges that feed it; `file` under `outputs/sections/subsections/`.

Every field gets filled. No placeholders.

## Subsections, use these titles verbatim

S1 The challenge, read closely
- S1.1 What the Objectives section actually asks for, clause by clause
- S1.2 How the challenge is judged, and what that rewards
- S1.3 Where the tool must defer to the farmer and the agronomist

S2 What the satellite record can and cannot say
- S2.1 SMAP soil moisture: a 36 km footprint reading the top 5 cm
- S2.2 ECOSTRESS evapotranspiration, stress index and land surface temperature
- S2.3 GPM IMERG rainfall, and the halt in the Final product
- S2.4 HLS, Landsat and MODIS optical: revisit, cloud, and what a vegetation index omits
- S2.5 GRACE, SRTM, GEDI and POWER: trend, terrain, biomass and climate envelope

S3 The non-NASA half of the data problem
- S3.1 US soil survey: gSSURGO and gNATSGO at map-unit scale
- S3.2 Brazilian soil and land cover: PronaSolos, IBGE, SICAR, MapBiomas
- S3.3 Crop and management layers: CDL, CroplandCROS, ZARC, NASS
- S3.4 Licence, privacy and the join problem down to 30 m

## Budgets

Sections are 1,200 to 1,500 words for S1, 3,000 to 3,600 for S2, 2,000 to 2,400 for S3. Allocate per entry so the sum sits inside the band; give S2 the heavy entries because it carries the report's evidence core.

## Style the plans must assume

Writer prose rules, so the entries are shaped for them: one idea per sentence with the subject named, no em or en dashes, no filler openers, mechanism over impression, technical terms explained at first use, numbers with units and a date. Every figure carries a basis label: `measured`, `computed`, `documented` or `recalled`.

## Rules

- An entry must be answerable from the packs. If the pack lacks it, say so in Open questions rather than inventing.
- No section may promise a demo the run did not execute.
- S2 entries must preserve the gap between posting resolution and real information, and the difference between an observation and a model state.
- S3 must not imply Brazilian soil coverage at US survey quality.

Done when all three files exist, every field is filled, and each Freeze checklist is honestly ticked or marked short.
