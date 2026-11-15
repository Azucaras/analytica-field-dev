# CHECKPOINT BLOCK 4: layer registry and daily timeline

Verifier: tech-lead (review gate), **second run**. Nothing under `src/`, `backend/`, `specs/` or the fixtures was
edited by this run. The only writes are the text artifacts named below and this checkpoint. No screenshot and no PNG
was produced or committed; the evidence is the rectangle tables and the text logs.

Environment: the gate tree is a local worktree at `gate/block4-gate2`, commit `a071c80`. It is the first gate's tree
(`gate/block4-gate`, `82b3b90`: `main` `441d4de` + waves 1 to 4 + the band patch) plus the block 4 repair branch
`block4/repair-basemap-latest` (`5f46897` the HLS L30 coverage fixture, `f6c5e7e` the basemap adapter, `911ad55` the
`Latest image` scan and its control; PR #6), plus `main` `0129f0b` merged in. Waves 1, 2 and 3 are ancestors of wave 4,
so the tree holds all four. The repair's own diff against `82b3b90` is 12 files, +1172 / -3 lines: the two new modules,
their three test files, `LayerRail.tsx`, `map-store.ts`, `strings/en.ts`, `index.css` (4 lines) and the fixture.

The app content measured here is the merged content: `git diff --stat a071c80 origin/main -- field-shift-app/src
field-shift-app/backend field-shift-app/package.json field-shift-app/artifacts` is **empty**, so every source file,
the backend and every artifact this checkpoint names are byte-identical on `origin/main` `48cbdd3` (block 4 spec
revision 8 included). The only difference between the measured tree and `origin/main` is the two spec files added after
the block 4 merge (block 6 revision 2 and block 7 revision 1), which change no application code.

App under test: `vite` dev server on `http://127.0.0.1:5276` from this worktree against the gate backend on
`http://127.0.0.1:8010` (`/health` `{"status":"ok"}`), driven in `/usr/sbin/chromium` `--headless=new` with **a real
window**, resized through CDP `Browser.setWindowBounds` (`window height = inner height + chrome`). No
`Emulation.setDeviceMetricsOverride` was used anywhere in this run: that override is what left the first gate unable to
deliver a `resize` event, and the whole point of this run is the real window. A second rig (a stand-in upstream
answering 503, a backend on 8011 with an empty tile cache, a vite server on 5275) was used for AC-20 in run 1 only; this
run did not repeat it.

## Spec measured, and the freeze check

The file on disk is `specs/bloco-4-camadas-e-timeline.md`, **revision 8**, 681 lines, raw sha256
`dd1aa5a067fe1d8c908454132a5c77d75c6d272ee99a6e26828891ef695ea51c` (commit `b3bff60`, on `main`). This card's body
quotes revision 4; the orchestrator's comments moved the frozen text to revisions 5, 6 and 7, and revision 8 is what the
tree carries. **The gate measured revision 8, unchanged since the first run.**

Freeze check, re-derived in this run with the command exactly as the spec writes it (GNU sed, no `/g`), from
`field-shift-app/`:

```text
$ sed 's/`[0-9a-f]\{64\}`/`PENDING`/' specs/bloco-4-camadas-e-timeline.md | sha256sum
f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e  -
```

The freeze record's sha256 row holds `f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e`. **The digest
reproduces.** The raw sha256 of the frozen bytes is the value above the PENDING substitution, so it cannot equal the
recorded digest by construction; the comparison the spec names is the `sed` one, and it holds.

Re-derived again at the end of the run, after every measurement: `f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e`
and raw sha256 `dd1aa5a067fe1d8c908454132a5c77d75c6d272ee99a6e26828891ef695ea51c`, both unchanged. No file under
`src/`, `backend/` or `specs/` has an mtime after 21:40 local, when this run began measuring (`find src backend specs
-newermt "2026-11-14 21:40"` returns nothing outside `__pycache__`). The target did not move.

## Limits of this run, before the verdict

Read these first; the verdict below depends on them.

- **Thirteen browser halves and part of a fourteenth are inherited, not re-derived.** AC-03, AC-05, AC-13, AC-14,
  AC-18, AC-20, AC-23, AC-24, AC-26, AC-32, AC-36, AC-37 and AC-38 keep run 1's browser readings on `82b3b90`, and so
  do AC-44's remaining directions. In particular AC-13's `getPaintProperty` reading, AC-14's layer index, AC-18's
  divider drag, AC-20's degraded rig, AC-32's reduced-motion rig and the keyboard walks of AC-36 to AC-38 were not
  re-run. Their test halves ran green in this run's 223-test suite. The checkpoint marks each one `carried` in the
  Run 2 column.
- **No image was inspected.** The card forbids images in the repository, so no screenshot was taken or looked at, and
  no judgement of colour, typography or clipping is claimed. The evidence is rectangles, attributes and text logs.
- **One browser engine, one window.** `/usr/sbin/chromium` `--headless=new` with a real window resized through CDP,
  `devicePixelRatio` 1. Not the user's display, not a phone at 360, not a touch or keyboard path in the AC-33 chain
  (its presses are CDP mouse clicks and its date is set through the input's value event).
- **AC-35's `unavailable` branch is mock-only.** No live upstream 500 exists on 2026-11-14, as the spec itself records,
  so that branch rests on the mock transport and on the backend 503 test. AC-20's cached-tile branch is likewise not
  exercised in the browser; the backend suite covers it.
- **The repair's two new modules are measured, not rendered.** R-43 makes the basemap adapter a boundary in block 4, so
  there is no EOX tile request to observe; the criterion is the selection rule and the absence of a Google request,
  both measured.

## Block verdict

**The block passes. 44 of 44 active criteria pass; 0 fail.** Approve, with the two carried-over browser readings named
in the table below. The three failures of the first run are closed: AC-33 is now measured with a real window resize,
and AC-34 and AC-35 are implemented on PR #6 and measured as the spec writes them.

## What changed since the first run: three rows, and why

| Row | Run 1 | Run 2 | Why it changed |
|---|---|---|---|
| AC-33 | failed as measured | **PASS** | The first gate resized with `Emulation.setDeviceMetricsOverride`; this Chromium delivered no `resize` and no media-query change under that override, so `useMediaMatch` kept the 1440 bucket at 780x900 and the `Timeline controls` toggle never mounted (count 0), which made the two required presses impossible. This run resizes the **window** through `Browser.setWindowBounds`, the page receives 2 `resize` and 3 `mq-change` events, the toggle mounts at 780x900, both presses happen, and the expanded state survives the resize to 360x640. No product change was needed; the first run's failure was the harness, as it said. |
| AC-34 | failed, not implemented | **PASS** | PR #6 adds `src/lib/basemap-adapters.ts`: an adapter boundary with the EOX Sentinel-2 cloudless 2024 adapter as the default and the Google adapter selectable only with `VITE_GOOGLE_MAPS_API_KEY`, plus `src/lib/basemap-adapters.test.ts` (7 tests), which writes the network log the criterion names. Measured here: 7 tests pass, the log reproduces byte-identically, 0 Google-host requests in the test run and 0 on a live 1440x900 load. |
| AC-35 | failed, not implemented | **PASS** | PR #6 adds `src/lib/latest-image.ts`, `src/components/LatestImage.test.tsx`, the control in `LayerRail.tsx` on the two optical rows, and the `hls-l30-coverage-zoom12-2026-11-14.json` fixture the criterion names (absent from every branch in run 1, which is why the criterion could not pass). Measured here: 13 tests pass; live at 1440x900 the control scans 2026-11-14 to 2026-11-01 in 14 coverage calls and lands on 2026-11-01. |

No other row changed verdict. Two rows keep their verdict but carry corrected or refreshed text, and they are named so
the change is visible: **AC-21** now records the sixth control the repair adds to the optical rows (all its controls
still measure at least 44 px), and **AC-30** corrects run 1's wording "the toggle is the fifth control" to the measured
fact: at 360x640 the toggle is the **first** control of the region, before `Go to date`, which is what revision 8's
option A requires and what run 1's own numbers (x 8 to 52, first in the date row) showed. Neither is a criterion change.

## Criterion table

Every row names the artifact under `field-shift-app/artifacts/` that proves it and the command that produced it.
`browser` means the harness Chromium over CDP at the named width; `vitest` is `npx vitest run`; `unittest` is
`cd backend && python3 -m unittest`; `curl` is against the gate backend on :8010. The **Run 2** column says what this
run actually did: `measured` (new measurement on `a071c80`), `re-measured` (the same numbers re-read on `a071c80`),
`carried` (a browser reading from run 1 that this run did not re-derive; its test half was re-run).

| AC | Covers | Method | Verdict | Measured | Artifact | Command | Run 2 |
|---|---|---|---|---|---|---|---|
| AC-01 | R-01, R-03 | tests | PASS | 13 registry entries with the Table A to C fields; every `gibs_id` in the identifier file; file 1330 lines; `smap-soil-moisture` resolves to `smap-l3`; ECOSTRESS, LPRM AMSR2 and NDH absent | AC-01-registry.txt | unittest | tests re-run |
| AC-02 | R-02 | tests | PASS | each upstream URL carries its registry matrix; the three recorded answers reproduce (400, 200 52372 B, 400) | AC-02-matrix.txt | unittest | tests re-run |
| AC-03 | R-04 | tests + browser | PASS | 1440x900 at 2026-11-12, grace-mascon row: "GRACE water storage, stale ... Last observation 2022-07-01 stale", no `on date`; the test asserts the same at 2026-11-14 | AC-03-grace-row.txt | browser + vitest | carried; tests green |
| AC-04 | R-05, R-06 | tests | PASS | worked example at 2026-11-12: imerg-daily 2026-11-12 age 0 `on_date`; smap-l3 2026-11-11 age 1 `earlier`; ndvi-8day 2026-11-12 age 0; no request for 2026-11-12 reaches smap-l3 | AC-04-worked-example.txt | unittest | tests re-run |
| AC-05 | R-06 | tests + browser | PASS | smap-l3 at 2026-11-12: "2026-11-11 1 day old earlier observation No observation"; at 2026-11-11: "today on date", no marker | AC-05-marker.txt | browser + vitest | carried; tests green |
| AC-06 | R-07 | tests | PASS | all candidates 404 -> `none_in_lookback`, no body | AC-06-none-in-lookback.txt | unittest | tests re-run |
| AC-07 | R-08 | tests | PASS | ndvi-monthly at 2026-11-14 -> 2026-10-01 (44 days, 62-day lookback); no request outside [time_start, declared_end]; no shared five-day loop | AC-07-monthly-walk.txt | unittest | tests re-run |
| AC-08 | R-09 | tests | PASS | 30 minute grid tokens, date-only token refused without a request, 2026-11-14 resolves to 2026-11-14T12:30:00Z, nothing after 12:30Z | AC-08-imerg-tokens.txt | unittest | tests re-run |
| AC-09 | R-10, R-11 | tests | PASS | 503 -> one request, `unavailable`; 400 and 404 step; 418 stops; unknown id 404 with no transport call | AC-09-status-walk.txt | unittest | tests re-run |
| AC-10 | R-12, R-13 | tests | PASS | one upstream fetch for two identical requests; `X-Tile-Date` present on the cache hit; two dates two cache files; `?date=2026-11-12` -> `2026-11-11` | AC-10-cache-date.txt | unittest | tests re-run |
| AC-11 | R-14 | cli + tests | PASS | `/layers?date=2026-11-12` is an object with `chosen_date`, `axis`, `layers`; coverage on grace-mascon 400 and on smap-l3 400 | AC-11-layers-cli.txt | curl + unittest | tests re-run; `/layers` re-read live |
| AC-12 | R-15, R-16 | tests + cli | PASS | z 9 above max_zoom 6 -> 400 with no upstream request; every raster source `maxzoom` = registry value; no literal 6 in `MapCanvas.tsx` | AC-12-maxzoom.txt | unittest + vitest + curl | tests re-run |
| AC-13 | R-17 | browser 1440x900 | PASS | 0.55 at first paint; control 0.3 -> `getPaintProperty` 0.3; sources 6 before and after; addSource 0, removeSource 0; a layer turned on starts at 0.55 | AC-13-opacity-1440.txt | browser | carried (browser paint not re-derived); vitest green |
| AC-14 | R-18 | browser 1440x900 | PASS | smap-l3 index in `getStyle().layers` 115 -> 114 after one press on Move down; raster order swapped; sources 7 before and after; removeSource 0 | AC-14-order-1440.txt | browser | carried; vitest green |
| AC-15 | R-19 | tests | PASS | only the layer that is on issues tile requests | AC-15-off-layers.txt | vitest | tests re-run |
| AC-16 | R-20 | tests | PASS | 2026-11-12 -> 2026-11-13 requests only the layers whose effective date changed; a pinned layer issues none | AC-16-date-change.txt | vitest | tests re-run |
| AC-18 | R-22 | browser 1440x900 | PASS | sides "2026-11-12, today" and "2026-10-29, 14 days old" after the input; divider 44x900 at x 698, valuenow 50 -> 100 by pointer drag; camera lng -55.27, lat -11.91, z 11 unchanged; no delta element | AC-18-compare-1440.txt | browser | carried; vitest green |
| AC-19 | R-23, R-25 | tests | PASS | future-dated `X-Tile-Date` rejected; zero-byte 200 not drawn; under 5xx no cached entry dated after the chosen date is served, the newest on-or-before is | AC-19-tile-guard.txt | vitest + unittest | tests re-run |
| AC-20 | R-24, R-25 | browser 1440x900, upstream forced 503 | PASS | 13 rows keep their status text and no date; map shows "SMAP soil moisture offline sample, date unknown" from the reserve; a layer with neither reads "IMERG precipitation, daily no offline copy" | AC-20-degraded-1440.txt | browser + stand-in 503 upstream | carried (the 503 rig was not re-run in run 2); tests green |
| AC-21 | R-26 | browser 1440x900 | PASS | 13 rows (`smap-l3` .. `grace-mascon`); collapsed row carries name, basis, resolution, effective date and age; 13 of 13 triggers 44.00x44.00; `.layer-rail` max-height 118 px with 1074 px of rows scrolling inside; expanded `hls-l30` controls 251x44 (opacity), 44x44 (move up), 44x44 (move down), 251x44 (pin), 251x44 (compare), 251x44 (`Latest image`), every one at least 44 px tall | AC-21-rail-1440.txt + gate2-sweep-rects.txt | browser | re-measured |
| AC-22 | R-27, R-41 | tests | PASS | no element named Season and no season select; strip is label, avatar, `Command`, `Supporting data` in that order | AC-22-strip.txt | vitest | tests re-run |
| AC-23 | R-28 | tests + browser | PASS | axis 2015-04-01 to 2026-11-14; default 2026-11-14; `?date=2026-11-12` opens there; 2015-03-01 clamps to 2015-04-01 with "Date limited to 2015-04-01" | AC-23-axis-1440.txt | browser + vitest | carried; tests green |
| AC-24 | R-29, R-30 | tests + browser | PASS | 2014/15, 2024/25, 2025/26, 2026/27 for the four pinned dates; panel prints "Fixture data for 2025/26, not for 2026/27"; Field 01 SMAP stays 0.28 | AC-24-season.txt | vitest + browser | carried; tests green |
| AC-25 | R-31 | tests | PASS | four windows of 2026/2027 at 2026-11-12 with the envelope dates; the 2025/2026 set at 2025-11-10; "No planting window data for 2024/25" at 2024-11-01; "No planting window source for this region" with no source | AC-25-band.txt | vitest | tests re-run |
| AC-26 | R-32 | tests + browser | PASS | label 2024/25 -> 2025/26 across the 1 July boundary; crop class "No crop class source" at 2015-04-01, 2025-06-30, 2025-07-01, 2026-11-11 and 2026-11-12 | AC-26-crop-class.txt | vitest + browser | carried; tests green |
| AC-27 | R-33, R-34 | tests | PASS | 18 Sentinel-2 marks, 6 under 20 percent cloud; no smap-l3 mark on 2026-11-02; no ndvi-8day mark before 2025-02-12; the track sits in the expanded hls rows, not the dock | AC-27-tracks.txt | vitest | tests re-run |
| AC-28 | R-34 | tests | PASS | ndvi-8day `none_in_lookback` at 2025-01-15; smap-l3 resolves to 2015-04-01 on the first axis day | AC-28-first-axis-day.txt | vitest | tests re-run |
| AC-29 | R-35, R-36, R-47 | browser, three widths, both states | PASS | 15 states measured. 1440 expanded dock 22.00,457.81 984.00x92.00, bottom 549.81 = panel top 557.81 - 8.00, top clears 450 by 7.81; 1440 collapsed panel bottom 733.00 = 741.00 - 8.00; 780 first paint dock 22.00,641.00 373.00x92.00 bottom 733.00, toggle 22.00,589.00 44x44; 780 panel expanded dock y 450.00 to 542.00, toggle y 398.00 to 442.00; 360 band 8.00,224.00 288.00x92.00 with the toggle inside at 8.00,224.50 44x44; all intersections 0.00 px2 in every state, including the Field 03 notice state and the F1 state | AC-29-dock-rects.txt + gate2-sweep-rects.txt | browser | re-measured |
| AC-30 | R-37, R-42 | tests + browser | PASS | region `Timeline` at 1440: `Go to date` 98x44 at 31.00,458.81, `Previous day` 44x44, `Timeline date` 862x44, `Next day` 44x44; at 360 after the press the region's first control is `Timeline controls` 44x44 at 8.00,224.50, then `Go to date` 106x44 at 60.00,225.00, `Previous day` 44x44, `Timeline date` 166x44, `Next day` 44x44 | AC-30-hit-1440.txt + gate2-sweep-rects.txt | browser + vitest | re-measured |
| AC-31 | R-38 | tests | PASS | arrows one day, PageUp/PageDown 30 days, Home/End the bounds, a letter leaves the date unchanged | AC-31-range-keys.txt | vitest | tests re-run |
| AC-32 | R-39 | browser, reduced motion | PASS | every measured node 0s|0s at 1440 and at 360 in both dock states; date 2026-11-12 before and after 3.2 s; the timer spy records 2 timers, both from the Vite dev server, none writing the date | AC-32-reduced-motion.txt | browser | carried (reduced-motion rig not re-run); tests green |
| AC-33 | R-40 | browser, three widths, real window resize | **PASS** | The chain, measured: 1440x900 set 2026-11-12, pinned `SMAP soil moisture`, compare on for `MODIS NDVI, 8 day` (side B 2026-11-05), panel collapsed by its toggle; resize to 780x900 keeps the date, the pin, compare, its side B date and the collapsed panel, and mounts `Timeline controls` (1 node, aria-expanded true, 22.00,589.00 44x44); first press -> aria-expanded false and the region unmounted, second press -> true and the region mounted 22.00,641.00 373.00x92.00; resize to 360x640 keeps all five and leaves the dock expanded (toggle aria-expanded true, 8.00,224.50 44x44, inside the region, first in its date row) with the region mounted at 8.00,224.00 288.00x92.00. The page received 2 `resize` and 3 `mq-change` events | AC-33-states.txt + AC-33-resize-events.txt | browser (real window) | **measured** |
| AC-34 | R-43 | tests | **PASS** | adapters `['eox-s2cloudless-2024', 'google-satellite']`; default with no key `eox-s2cloudless-2024`; EOX tiles `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg`; attribution 111 chars and short credit 53 chars by character; 0 requests issued by the registry and 0 to a Google host in the test run; live 1440x900 load 89 requests, hosts 127.0.0.1 and tiles.openfreemap.org, **0 Google**; 7 tests pass | AC-34-network.txt + AC-34-basemap.txt + gate2-vitest-verbose.txt | vitest + browser network log | **measured** |
| AC-35 | R-44 | tests + browser 1440x900 | **PASS** | control `Latest image` 251.00x44.00 at x 1124.00, y 805.50 on `hls-l30`; on both optical rows (`hls-l30`, `hls-s30`) and no other; live scan 2026-11-14 -> 2026-11-01 in 14 coverage calls, every call HTTP 200, no date older than 2026-11-01 requested, first call after the declared end 2026-11-06; date lands on 2026-11-01, range text `2026-11-01, today`, row `on_date`; `aria-pressed` false -> true -> false; 13 tests pass over the recorded fixture, including `none_in_lookback` and the mock 500/503 `unavailable` branch; backend test `test_r_44_coverage_records_every_date_of_the_window_and_answers_503_on_a_stop` passes | AC-35-latest-image.txt + AC-35-latest-1440.txt + artifacts/fixtures/hls-l30-coverage-zoom12-2026-11-14.json | vitest + browser | **measured** |
| AC-36 | R-37, R-45 | browser 1440x900 + tests | PASS | Tab order Go to date -> Previous day -> Timeline date -> Next day, all tabIndex 0; Enter and Space step the date and keep focus; a typed 2026-11-05 sets it; 2015-03-01 clamps with the message | AC-36-keys-1440.txt | browser + vitest | carried; tests green |
| AC-37 | R-26 | browser 1440x900 + tests | PASS | Enter/Space toggle `aria-expanded` and keep focus; Tab reaches the opacity range, both move buttons, the pin and compare; arrows step the paint 0.55 -> 0.6 -> 0.5; Move up changes the stack and keeps focus; pin sets `aria-pressed` and the word `pinned` follows it | AC-37-row-keys-1440.txt | browser + vitest | carried; tests green |
| AC-38 | R-22 | browser 1440x900 + tests | PASS | divider 50 -> 51 -> 52 -> 51 by arrow keys, focus stays, camera unchanged | AC-38-divider-keys-1440.txt | browser + vitest | carried; tests green |
| AC-39 | R-46 | browser 360x640, 780x900 | PASS | 360 first paint: aria-expanded false, toggle 288x44 at y 224, no region; after the press: region 288x92 at y 224 to 316 and the toggle 44x44 inside at x 8, y 224.50, the same with the panel in either state; 780 first paint: aria-expanded true, region 373x92 at y 641 to 733; after one press the collapsed toggle 373x44 at y 689 to 733; after a second, the dock back at 92 px | AC-39-toggle.txt + gate2-sweep-rects.txt | browser | re-measured |
| AC-40 | R-47 | browser, three widths, both states | PASS | attribution recorded at every width and state; intersection with the dock and with the toggle 0.00 px2 in all 15 states. Rectangles: 1440 496.20x20.00 right 1432.00, 780 496.20x20.00 right 772.00, 360 0.00,404.41 352.00x27.59 (block 3 CO-02's box). The first run recorded a narrower control at the same right edges; the difference and its cause are recorded in gate2-sweep-rects.txt and none of it changes an intersection | AC-40-attribution.txt + gate2-sweep-rects.txt | browser | re-measured |
| AC-41 | R-05 optical | tests | PASS | hls-l30 at 2026-11-14 walks from 2026-11-06, ignores every body of 5,000 bytes or less, resolves to 2026-11-01, age 13, `earlier`; no request after 2026-11-06 or before 2026-10-15 | AC-41-optical-walk.txt | unittest | tests re-run |
| AC-42 | R-48 | browser, three widths + tests | PASS | native button, 44x44 at every width (1440 x 169.14 y 578.31 expanded / y 761.50 collapsed; 780 y 563.31 / y 761.50; 360 x 155.14 y 460.50 expanded / y 509.50 collapsed); name follows `aria-expanded`; Enter and Space flip it and keep focus (test half) | AC-42-collapse-toggle.txt + gate2-sweep-rects.txt | browser + vitest | geometry re-measured; keys from run 1 + tests |
| AC-43 | R-49, R-50 | browser, three widths | PASS | collapsed: cards 0, list false, focusable card controls 0, panel height 143.00 at every width, bottom 884.00 / 884.00 / 632.00; expanded: card tops 699.81, 684.81 and 582.00 and panel tops 557.81, 542.81 and 440.00, all equal to the block 3 checkpoints; front faces only; height clause 143.00 against a 141.00 measured header block, 2.00 px, at the tolerance edge (142.00 recorded, 1.00 px) | AC-43-rotation-heights.txt + gate2-sweep-rects.txt | browser | re-measured |
| AC-44 | R-51, R-52 | browser, reload and viewport change | PASS | load defaults expanded / collapsed / collapsed at 1440 / 780 / 360 (re-measured: a fresh load at each width); a collapse at 1440 followed by a resize to 780 and to 360 stays collapsed; an expand by a press at 780 followed by 360 stays expanded (both re-measured in the AC-33 chain); run 1's remaining directions (an expand at 360 followed by 1440, a reload returning the 1440 default, 0 local and 0 session storage keys, URL unchanged) are carried | AC-44-collapse-state.txt + AC-33-states.txt | browser | partly re-measured; rest carried |
| AC-45 | R-53, R-54 | tests | PASS | a block 4 press leaves every card face and fixture value alone; wave 4 imports no other panel state | AC-45-imports.txt | vitest | tests re-run |

## The three former failures, in the form the next reader can check

**AC-33 (R-40), now PASS with a real window resize.** The first run's failure was the harness, and it said so: under
`Emulation.setDeviceMetricsOverride` this Chromium delivered no `resize` and no media-query change, so
`useMediaMatch` in `src/lib/viewport.ts` kept the 1440 first-paint bucket at 780x900 and `showToggle` stayed false.
This run replaces the override with `Browser.setWindowBounds` on the window, and the event log proves the page
received the changes: `resize` at 780x900 (t 6497 ms) and at 360x640 (t 9927 ms), `mq-change` for
`(max-width: 1020px)` at 780 and for `(max-width: 640px)` and `(max-height: 700px)` at 360. With the events arriving,
the whole chain holds, clause by clause, and the artifact records each state's date, pin, compare, compare date, panel
state and dock rect. No product change was required for this criterion.

**AC-34 (R-43), now PASS.** The adapter boundary exists (`src/lib/basemap-adapters.ts`, sha256
`10a84e467a82baf689735f58abffc11e857cbcbf3cd3f7bf079ff6418371d293`), the EOX adapter is the default with the key
absent, the Google adapter is specified but inert without the key, and the test writes `AC-34-network.txt` with 0
requests and 0 Google hosts. The gate re-ran the file twice and the artifact's sha256 was
`b65e50144dd764d776892bdfc8877db9f2b2ae508140ae24080f74ccdb40c9ba` both times. Independent of the stub, a live
1440x900 load issued 89 requests to 127.0.0.1 and tiles.openfreemap.org and none to a Google host. Read R-43 as a
boundary and not a rendering: block 4 renders no basemap, and the visible basemap is still block 3's vector style
(F-29 and CO-B4-05 move the rendering to block 5).

**AC-35 (R-44), now PASS.** The control exists on the two optical rows, and the live scan reproduces the spec's
numbers: 14 coverage calls from 2026-11-14 back to 2026-11-01, stopping at the first date above 5,000 bytes, with no
request older than 2026-11-01 and the first request after the declared end 2026-11-06. The tests cover the three
outcomes (`found` at 2026-11-01, `none_in_lookback`, `unavailable` on a mock 500/503 at 2026-11-10), and the backend
test covers the coverage route's own 503. The fixture the criterion names is in the tree with sha256
`1cdef4234ae82ecc66a0f37207ab5905fd0ad4166668d58cd3b409d68d461b61`.

## Regression: block 1 to 3 criteria this file does not amend

The regression is run in three layers, and the third is the one that can fail silently, so its limits are stated.

**Layer 1, the suites.** On `a071c80`: `npx tsc -b --noEmit` exit 0; `npx vitest run` **24 files, 223 tests passed**
(the first run's tree had 21 files / 203 tests; the repair adds 3 files and 20 tests: `basemap-adapters.test.ts` 7,
`latest-image.test.ts` 7, `LatestImage.test.tsx` 6); `python3 -m unittest` **25 tests OK**; `npm run build` exit 0,
built in 876 ms, wall 4666 ms. Both suites include the block 1 to 3 files (`App.test.tsx`, `SmapBar`, `EvidencePanel`,
`CropHistoryBars`, `RotationFlipCard`, `ScenarioCards`, `commands`, `layer-catalog`, the backend command and layer
tests), and they are green.

**Layer 2, the block 3 boxes the layout contract carries (CHECKPOINT-CONSTRAINTS-REMOVAL.md C4e, C4f, C5c, C5e).**
Re-measured in this run on `a071c80`, in 15 states:

| Box | Recorded | Measured 1440x900 | Measured 780x900 | Measured 360x640 | Delta |
|---|---|---|---|---|---|
| Rotation panel, expanded | 22,557.81,1006,884 / 22,542.81,395,884 / 8,440,352,632 | 22.00,557.81 984.00x326.19, right 1006.00, bottom 884.00 | 22.00,542.81 373.00x341.19, right 395.00, bottom 884.00 | 8.00,440.00 344.00x192.00, right 352.00, bottom 632.00 | 0.00 |
| Card tops | 699.81 / 684.81 / 582 | 699.81 | 684.81 | 582.00 | 0.00 |
| Navigation control | 1395,406.5,1424,493.5 / 735,... / 315,... | 1395.00,406.50 29.00x87.00 | 735.00,406.50 29.00x87.00 | 315.00,276.50 29.00x87.00 | 0.00 |
| Abstention notice (Field 03) | 1018,60,1418,124.5 | 1018.00,60.00 400.00x64.50 | capped as block 3 records | first box of the left stack | 0.00 |
| Layer rail anchor | right 1420, bottom 888 / right 760 / right 296, bottom 632 | 1070.00,768.00 350.00x120.00 | 526.00,768.00 234.00x120.00 | 36.81,546.00 259.19x86.00 | right and bottom 0.00; the height is content, see below |

The rail still grows upward (top 768.00 against the block 3 checkpoint's 806.00, and 546.00 against 550.00 at 360)
because it holds the 13 R-26 rows with internal scroll: `.layer-rail` sits exactly at its `max-height`, 118 px at 1440
and 780 and 84 px at 360, with 1074 px of rows scrolling inside 118 px at 1440 (the same 1074 px run 1 recorded).
Block 3 fixes the rail's right edge, bottom edge, width and `max-height`, not its height, and the anchor's bottom
(888.00 / 632.00) and right (1420.00 / 760.00 / 296.00) are unchanged. The repair adds the `Latest image` control only
to the two expanded optical rows; the collapsed rows' height and the rail's box are untouched.

**Layer 3, the amended clauses (AM-14 to AM-21).** Re-measured in the states the notes require:

- AM-14, AM-15, AM-18: the top right strip is `FIELD INTELLIGENCE`, `GM`, `COMMAND`, `SUPPORTING DATA` and nothing
  else; no Season control, no Season select, no `combobox` named Season.
- AM-16, AM-17: nothing named Season exists; the dock takes its place in the intersection list and measures 0.00 px2
  against the navigation control at all three widths.
- AM-19, AM-21: the `region` `Timeline` pair resolves at 1440x900 and at 780x900 at first paint (region mounted in
  both) and at 360x640 only after the press (unmounted at first paint, mounted after). The `list` `Rotation scenarios`
  pair is in the DOM at 1440x900 at first paint, absent at 780x900 and 360x640 at first paint, and present after the
  rotation toggle is pressed at those widths. Each pair resolves in the state AM-19 and AM-21 name.
- AM-20: the block 3 card measurements at 780x900 and 360x640 were taken after the gate expanded the rotation panel
  with its toggle: card tops 684.81 and 582.00, panel tops 542.81 and 440.00.
- Block 3 AC-23 and block 2 R-12 (360 no-scroll): `document.documentElement.scrollWidth` 360 against `clientWidth`
  360 in all five 360x640 states.
- Block 3 AC-18 and AC-25 (zero intersection): navigation control against the layer rail 0.00 px2 at all three
  widths; dock and toggle against the navigation control, the layer rail, the fields stack, the notice, the top strip,
  the rotation toggle and the attribution 0.00 px2 in the 15 states of `gate2-sweep-rects.txt`.

**No regression.** No criterion that passed in the first run fails in this one. The suites gained tests and stay
green, and the boxes above did not move. One reading differs and is named rather than smoothed: the attribution
control's width. At 1440x900 and 780x900 this run measures `.maplibregl-ctrl-attrib` at 496.20x20.00 px against run
1's 171.84x20.00 px, with the same right edge (1432.00 / 772.00), and at 360 it measures block 3 CO-02's box
(0.00,404.41 352.00x27.59) where run 1 recorded the text box inside it. The cause measured here is the attribution
text the map style supplies: this run reads `NASA GIBS · SMAP L4 · 9 km | OpenFreeMap © OpenMapTiles Data from
OpenStreetMap` steadily at +0.5 s, +2 s, +5 s and +8 s, so it is a steady state in this run and not a race. Nothing in
block 4 renders, styles or measures the attribution (block 3 CO-02 unchanged; the repair's `index.css` diff touches no
attribution rule), and the intersection AC-40 asserts is 0.00 px2 in every state either way.

**What this regression did not do.** It did not re-derive every block 3 browser criterion number by number. AC-09's
fill percent, AC-16's clear-centre samples, AC-26 and AC-30's 360 panel transitions, the block 1 and 2 browser
criteria, block 3 AC-07 to AC-13's card values, AC-13's `getPaintProperty` reading, AC-20's degraded rig (its stand-in
503 upstream was not restarted) and AC-32's reduced-motion rig were not re-run in this pass; their test halves are
green in the suites above and the boxes they read are in the table. Run 1's records for them stay in the tree
unchanged. That is a gap in the regression, recorded rather than smoothed over; it does not change a verdict, since no
tree file that renders those behaviours changed except `LayerRail.tsx` and the 4-line `index.css` addition, and both
were measured above.

## Execution evidence, run by the gate on this tree

```text
$ sed 's/`[0-9a-f]\{64\}`/`PENDING`/' specs/bloco-4-camadas-e-timeline.md | sha256sum
f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e  -

$ npx tsc -b --noEmit
tsc exit=0

$ npx vitest run --reporter=verbose
 Test Files  24 passed (24)
      Tests  223 passed (223)

$ npm run build
✓ built in 876ms
wall 4666 ms (date +%s%3N around the command)

$ cd backend && python3 -m unittest discover -s . -p "test*.py"
Ran 25 tests in 0.123s
OK

$ npx vitest run src/lib/basemap-adapters.test.ts
 Test Files  1 passed (1)
      Tests  7 passed (7)

$ npx vitest run src/lib/latest-image.test.ts src/components/LatestImage.test.tsx
 Test Files  2 passed (2)
      Tests  13 passed (13)
```

Full logs: `artifacts/gate2-build.txt` (the `npm run build` log, which runs `tsc -b` first), `artifacts/gate2-vitest-verbose.txt`
(223 test lines), `artifacts/gate2-backend-unittest.txt` (25 tests), `artifacts/gate2-sweep-rects.txt` (the 15-state
rectangle table), `artifacts/AC-33-resize-events.txt` (the event log), plus the per-criterion files. The chunk-size
warning in the build output is pre-existing and is not a failure.

## Limitations of this measurement

- The browser is the harness Chromium with a real window resized through CDP, not the user's profile and not a phone
  at 360. The window's chrome is compensated so that `innerWidth` / `innerHeight` are exactly 1440x900, 780x900 and
  360x640; `devicePixelRatio` is 1 and `visibilityState` is `visible`.
- The AC-33 chain's presses are CDP mouse clicks on the toggle, and the date is set through the input's own value
  event, not through the native date picker. No keyboard-only or touch path is claimed here; AC-36 and AC-37 carry
  the keyboard half from run 1 and from the tests.
- The `carried` rows above are run 1's browser readings. They were not re-derived in this pass, and this file says so
  row by row rather than presenting them as new.
- AC-20's cached-tile branch is still not exercised: the gate backend ran with an empty tile cache on purpose, so the
  measured paths are the reserve and `no offline copy`; the cached branch rests on the backend unittest.
- 44 by 44 px sizes, every rectangle and every gap are browser measurements. jsdom has no layout, so the test files
  are not proof of the pixels.
- No screenshot was inspected: the card forbids images in the repository, so the evidence is the rectangle tables. No
  visual judgement of colour, typography or clipping is claimed.
- The spec's PNG artifacts for AC-33 (`AC-33-resize-360.png`) and AC-35 (`AC-35-latest-1440.png`) are replaced by the
  text artifacts this file names, under the card rule that bans images from the repository. A pass is not claimed on a
  missing artifact: the text artifacts exist and carry the same run.
- The gate rewrote the `AC-*` text artifacts it measured (AC-33, AC-34, AC-35) and added the `gate2-*` logs and
  `AC-33-resize-events.txt`; the wave and repair workers' versions of those files stay in their own branch trees.

## Decision

**Approve.** 44 of 44 active criteria pass with their named artifacts, the three first-run failures are closed with
measurements, the suites are green with 20 more tests than the first run, and no previously passing criterion
regresses. The block is done and block 5 can build on it.

The pull requests were left untouched by this gate. Their state, read from `gh` at the end of this run: **all six are
merged by the user** (carloshnp), #1 to #5 between 00:06 and 00:08 UTC on 2026-11-15 and #6 at 00:21:43 UTC on
2026-11-15 (merge commit `8528016`), so `origin/main` already carries the tree this checkpoint measured. Nothing was
merged, pushed or deployed by this gate: the commit `ead3230` that holds these artifacts exists only on the local
branch `gate/block4-gate2` in the worktree named above, and the two PR merges are the user's, not the gate's.
