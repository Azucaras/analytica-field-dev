# Block 5: the Field Phase analysis

Asked for on 2026-11-14: "I want you to apply all the features down below, using this project as a basis".
Built and checked the same day.

## Decisions

| Question | Answer |
|---|---|
| Where the features go | Into this repository, using `nasa_chall_train` (commit `4d1d7b4`) as the source |
| How they enter the app | As an analysis view for the field's municipality, opened from the map screen |
| Language | Portuguese by default everywhere, with an English switch |
| Meteomatics | The user runs the download with their own account; the account name is never saved |

## What was built

- The Field Phase pipeline additions: Meteomatics, Planetary Computer (NDVI, land cover, elevation), SoilGrids,
  FAO-56 ET0 and daily soil water, and the rotation scores. Santa Carmem is not scored because no candidate
  rotations or crop calendar exist for its region.
- `GET /fieldphase/data/v1/{file}.json` serves the exported analysis files read-only.
- The `fieldphase` kit, moved to React 19, as a full-screen sheet on the same page. The **Análise** button and the
  **Análise completa** button in the rotation panel open it; Escape or "Voltar ao mapa" close it. The address
  becomes `#analise/<code>`. If the sheet fails, only the sheet closes.
- `pt-BR.ts` has every key, and a test fails if one is missing.

## Changed during the build

- The page said "run build_scoring" for Santa Carmem, which was wrong. The data now says why there are no rotations.
- The forecast section disappeared when there was no forecast. It now says the forecast was not downloaded.
- At 360 px the Portuguese headings pushed the rain line out of the panel. The heading was tightened.
- The analysis was first a second address (`/analise/<code>`). The user found two addresses confusing, so it became
  a sheet on the same page; the old address still works.

## Checked

Tests, type check and build passed. In the browser the sheet showed all eight sections for Luís Eduardo Magalhães,
the forecast panels after the user's Meteomatics run, and no console errors.
