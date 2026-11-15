# Block 5 repair: evidence for the eight gate failures (2026-11-15)

Branch `block5/repair-gate`, base `main` at `c4ae5db`. Browser runs on the Vite dev server (port 5183) and the FastAPI backend (port 8011), with the products staged under `public/data/polygons/` (untracked, excluded from git). The gate's failures are the eight criteria of checkpoint t_ce04f6dd: AC-05, AC-06, AC-09, AC-17, AC-22, AC-28, AC-29, AC-41. AC-17 is not changed in code beyond a comment (R-21 is followed; the spec is not amended).

## AC-05 and AC-09: no zoom line when no tier paints (R-12)

US tier files moved out of the app origin; manifest kept (so the scene carries tiers).

| State | Before (c4ae5db) | After (this branch) |
|---|---|---|
| zoom 11, default view | `Polygon build not available`, `Polygons from zoom 3` | `Polygon build not available` only |
| zoom 3 | `Polygon build not available`, `Polygons from zoom 3`, `Select from zoom 8` | `Polygon build not available` only |

Unit tests: `PolygonPanel.test.tsx`, "no tier available after a source error prints no zoom line" (AC-05 at zoom 3, AC-09 at zoom 11, and the regression with the source answering).

## AC-22 and AC-41: polygon selected, rotation panel and season chip

Measured after the fix (`?region=us&polygon=381825001868504`, rotation panel expanded with its own toggle):

- Panel text: `No scenarios available` (the card title) and `No rotation scenarios are available for this field.` (`empty.no_rotation_scenarios`).
- `Select a field to view rotation scenarios.`: absent.
- `2025/26 season`: absent in the panel and in the page body.
- Coverage pill: absent.
- Resource requests: `/fields` (the list) and `/polygons/mode?region=us`; no `/fields/<id>/scenarios`.

Before, as measured by the gate (checkpoint P6): `No scenarios available`, `Select a field to view rotation scenarios.`, and the season chip `2025/26 season`. The red tests failed on the same strings before the fix.

## AC-28: basemap layer order (R-36)

Style layer indices of `map.getStyle().layers` (the style's own layers are the `openmaptiles` source; the same numbers hold for US and Brazil):

| Layer | Before (c4ae5db), every preset | After, every preset |
|---|---|---|
| `basemap-raster` | 61 | 86 |
| `polygon-overview-fill`, `polygon-overview-line`, `polygon-fill`, `polygon-line` | 62 to 65 | 87 to 90 |
| `road_one_way_arrow`, `road_one_way_arrow_opposite` (symbols) | 66, 67 | 91, 92 |
| style fill and line layers above the basemap | 24 of 83 (bridge lines 68 to 87, `building` 88, boundary lines 90 to 92) | 0 of 83 |
| style symbol layers below the basemap | 0 of 25 | 0 of 25 |
| polygon layers below the basemap | 0 | 0 |
| `boundary_disputed` (last style fill or line) | 92 | 85 |

Presets measured after the fix, US V1 and Brazil V1: Satellite, Satellite with labels, Map. Exactly one `basemap-raster` layer after the preset changes. Visibility measured on US V1 (basemap, road arrow, city label): Satellite `visible`, `none`, `none`; Satellite with labels `visible`, `visible`, `visible`; Map `none`, `visible`, `visible`. That matches R-34.

Non-style fill and line layers still above the basemap after the fix: `boundary-381825001868504`, `boundary-381825001868512`, `boundary-381825001868517` (indices 116 to 118, the fixture outlines). AC-28 literally covers every non-polygon fill or line; the gate's note read "the style's own" as the scope, and this branch follows that note. The tech-lead should confirm the scope.

Why the change was needed: the basemap sat at 61 under the style's bridge and boundary lines. Moving it above them puts the style's road-arrow symbols under the imagery, so the arrows are raised above the basemap in their own order. Only the basemap insertion and those two symbols move. Test: `MapCanvas.block5.test.tsx`, "places the basemap above the style own fill and line layers ... (AC-28)".

## AC-29: basemap failure text (R-35)

With the EOX host blocked at the network layer before load (`Network.setBlockedURLs`, `https://tiles.maps.eox.at/*`) and Satellite selected, on US V1 and on Brazil V1:

- The map `error` event arrives with `sourceId: "basemap"`, `tile` set, message `AJAXError: Failed to fetch (0): https://tiles.maps.eox.at/...`.
- The Polygon region prints `Basemap unavailable`.
- The vector style (120 layers) and both polygon layers stay on the map.

The gate recorded no text (P22), with its own caveat that the blocked request was not confirmed. The path was already reachable. No code change was needed. The new test drives the path directly: `map.emit('error', {sourceId: 'basemap', ...})` sets the failure, and an error from another source does not.

Network-level proof is still owed. The block was set through CDP and the map logged `Failed to fetch` for the EOX tile URLs, but the `Network.loadingFailed` event with its `blockedReason` was not captured as an artifact.

## AC-06: the US walk record includes zoom 14

- `scripts/build-polygons.sh` measure call: added `--view "W14:-97.17:46.93:14:1440:900"` (the walk was D, D+1, D+3 only in the builder).
- Re-measured the built detail archive (sha256 `ca97c31c...`, unchanged) with the builder's arguments plus W14, then `polygon_build.py evidence` into a scratch artifacts dir.
- New record: `artifacts/fixtures/polygon-tiles-us-2026-11-15.json`. Walk keys 6, 7, 9, 14. The 2026-11-14 record is kept as it was.
- Every 2026-11-14 walk address (6, 7, 9) is identical in the new record. The zoom 14 walk is the V2 camera: 35 addresses, 24 present, max 1,745 bytes, equal to `us-38017.tiles.json` `max_tile_bytes.14`.
- V1 stays 132 features, equal to `view_feature_counts.V1`.
- `scripts/test_walk_record.py`: 3 tests, OK. It reads the newest `polygon-tiles-us-*.json` and checks the keys are D, D+1, D+3 and 14 with D from the manifest.

## Gates (final tree, commit of this file's branch head)

| Gate | Command | Result |
|---|---|---|
| Type check | `npx tsc -b --noEmit` | exit 0 |
| Unit and component | `npx vitest run` | 34 files, 360 tests passed (349 on c4ae5db, plus 11 new) |
| Backend | `python3 -m unittest discover -s backend -p "test_*.py"` | 34 tests OK |
| Walk record | `python3 scripts/test_walk_record.py` | 3 tests OK |
| Build | `npm run build` | exit 0, built in 713 ms |

Red before the fix: the new tests fail on c4ae5db's code and pass after (commit `c3019b8` holds the red tests; the fixes follow in four commits).

Install: `npm ci` ran once in the fresh clone (no `node_modules` existed), which installed `pmtiles` 4.5.0 from the lockfile. `npm ci` reported 19 vulnerabilities (2 low, 8 moderate, 9 high); this branch does not change dependencies.

## Not verified or not done

- The network-level proof of AC-29 (see above).
- AC-17: the code follows R-21 and carries a comment. The spec is not amended; the tech-lead's card owns that.
- The card asked that a selected polygon "must show that polygon's scenarios". R-26 and AC-22 say the opposite (no scenario request, the empty text). This branch follows the spec, so the polygon shows the empty text and no scenarios.
- A partial source failure (one tier erroring while the other works) now suppresses the zoom and select lines, because any polygon source error sets the failure line. R-11 and R-12 read that way; no state in the app hits it today, because the two US files come from one build.
