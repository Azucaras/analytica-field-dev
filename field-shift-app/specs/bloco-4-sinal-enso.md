# Block 4: ENSO signal and real climate evidence

Approved 2026-11-14 ("Aprovado, implemente"). Built and checked the same day.

## Why

The app compared rotations with no climate context, while NOAA had an El Nino Advisory out for 2026. In Brazil
that El Nino splits the country: more rain in the South, less in the North and MATOPIBA. Every number on screen
also came from a hand-written example file dated 2025.

## Decisions

| Question | Answer |
|---|---|
| Where | Santa Carmem keeps its fields; two synthetic fields are added in Tupanciretã (RS) and Luís Eduardo Magalhães (BA) to show the contrast |
| How the data arrives | The pipeline writes dated JSON into `backend/fixtures/climate/`; the backend only reads it |
| IBGE PAM yield label | A new basis, `reported`, for official statistics |
| Process | A short spec, then code |

## What was built

- `field-shift-pipeline/`, the Field Phase pipeline, with Santa Carmem (IBGE 5107248) added.
- `GET /climate/enso` and `GET /fields/{id}/climate`. A missing file answers 503 and the rest keeps working.
- Fields 04 and 05: synthetic rectangles at the IBGE centroid, no rotation cards, coverage not measured, so they
  always abstain.
- On the map screen: an ENSO chip, a rain line (since the season started, normal, strong El Nino years) and a
  climate table in the evidence panel with "small sample" and "assumed crop season" flags.
- Rules for the basis of each row: RONI, ONI and PAM are `reported`; NASA POWER is `modelled`; a derived number
  takes the weaker basis of its inputs.

## Changed during the build

At 360 px the ENSO chip overlapped the top bar, so below 641 px it moves to the top of the rotation panel.

## Checked

Pipeline, backend and front-end tests, type check and build passed. In the browser at 1440x900 and 360x640 the
chip and the rain line were visible, nothing overlapped, and the map centre stayed clear. Screenshots were not
saved.
