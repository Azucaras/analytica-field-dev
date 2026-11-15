# CHECKPOINT BLOCK 4: layer registry and daily timeline

Verifier: tech-lead (review gate). Nothing under `src/`, `backend/`, `specs/` or the fixtures was edited by this run. The
only writes are the text artifacts named below and this checkpoint. No screenshot and no PNG was produced or committed;
the evidence is the rectangle tables and the text logs.

Environment: the gate tree is a local worktree at `gate/block4-gate`, commit `5238d19`, built from `main` (`441d4de`,
which carries the block 4 spec revision 8 and the block 5 spec) plus `origin/block4/wave4-dock-home` (`6e9b5fe`) plus
`origin/block4/patch-band-source` (`84eddd6`). The merge produced exactly one conflict, on the `SeasonBand` element of
`src/components/TimelineDock.tsx`; it was resolved the way the patch card states: wave 4's file, with
`season={season}` changed to `date={chosenDate}`. Waves 1, 2 and 3 are ancestors of wave 4, so the tree holds all four.

App under test: `vite` dev server on `http://127.0.0.1:5274` against the gate backend on `http://127.0.0.1:8010`
(`/health` returned `{"status":"ok"}`), driven in the harness Chromium over CDP with
`Emulation.setDeviceMetricsOverride` at 1440x900, 780x900 and 360x640, `devicePixelRatio` 1. A second rig (a stand-in
upstream answering 503, a backend on 8011 with an empty tile cache, a vite server on 5275) was used for AC-20.

## Spec measured, and the freeze check

The file on disk is `specs/bloco-4-camadas-e-timeline.md`, **revision 8**, 681 lines, raw sha256
`dd1aa5a067fe1d8c908454132a5c77d75c6d272ee99a6e26828891ef695ea51c` (commit `b3bff60`, on `main`). This card's body
quotes revision 4; the orchestrator's comments moved the frozen text to revisions 5, 6 and 7, and revision 8 is what the
tree carries. **The gate measured revision 8.** The differences that matter to the rows below: R-31/AC-25 are source
agnostic and add the case (f) empty text; the 360x640 toggle is the first control inside the `Timeline` region (option A
on finding F1); AC-19 names vitest for the front half and keeps the backend unittest for R-25.

Freeze check, the command exactly as the spec writes it (GNU sed, no `/g`), run from `field-shift-app/`:

```text
$ sed 's/`[0-9a-f]\{64\}`/`PENDING`/' specs/bloco-4-camadas-e-timeline.md | sha256sum
f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e  -
```

The freeze record's sha256 row holds `f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e`. **The digest
reproduces.** The raw sha256 of the frozen bytes is the value above the PENDING substitution, so it cannot equal the
recorded digest by construction; the comparison the spec names is the `sed` one, and it holds.

## Block verdict

**The block fails. 41 of 44 active criteria pass; 3 fail.**

| Criterion | Verdict | What failed |
|---|---|---|
| AC-33 | FAIL as measured | At 780x900 after a viewport change from 1440x900 the `Timeline controls` toggle is not in the DOM, so the two presses the criterion requires cannot be made. The cause is that this Chromium delivers no resize and no media-query change on a CDP viewport override; the same page loaded fresh at 780x900 does mount the toggle. Measurement limit, not a proven product defect, but the criterion is not satisfied as measured. |
| AC-34 | FAIL | R-43's basemap adapter does not exist: no adapter interface, no EOX Sentinel-2 cloudless layer, no `VITE_GOOGLE_MAPS_API_KEY` reference, no AC-34 test and no network log of the test run. The tree keeps one unconditional vector basemap (`VECTOR_BASEMAP_STYLE = https://tiles.openfreemap.org/styles/liberty`). |
| AC-35 | FAIL | R-44's `Latest image` control does not exist in any branch (`git grep` over every local and remote ref: 0 hits), there is no AC-35 test, and the named artifact `AC-35-latest-1440.png` is absent. The coverage route that R-44 itself calls a different scan exists and its test passes, which does not satisfy the criterion. |

Everything else the block promised is there and measured: the 13-layer registry and tile contract, the effective-date
walk with its declared-end bound and its two exemptions, the cache key, the rail with its five fields and 44 px
controls, the daily timeline, the season band (Brazil source and the source-agnostic empty state), the two toggles, the
rotation collapse, the motion rule, the zero-intersection rule in all measured states, and finding F1 resolved to 0.00 px2
at 360x640.

## Criterion table

Every row names the artifact under `field-shift-app/artifacts/` that proves it and the command that produced it.
`browser` means the harness Chromium over CDP at the named width; `vitest` is `npx vitest run`; `unittest` is
`cd backend && .venv/bin/python -m unittest -v`; `curl` is against the gate backend on :8010.

| AC | Covers | Method | Verdict | Measured | Artifact | Command |
|---|---|---|---|---|---|---|
| AC-01 | R-01, R-03 | tests | PASS | 13 registry entries with the Table A to C fields; every `gibs_id` in the identifier file; file 1330 lines; `smap-soil-moisture` resolves to `smap-l3` (curl 200 with `x-tile-date: 2026-11-11`); ECOSTRESS, LPRM AMSR2 and NDH absent | AC-01-registry.txt | unittest |
| AC-02 | R-02 | tests | PASS | each upstream URL carries its registry matrix; the three recorded answers reproduce (400, 200 52372 B, 400) | AC-02-matrix.txt | unittest |
| AC-03 | R-04 | tests + browser | PASS | 1440x900 at 2026-11-12, grace-mascon row: "GRACE water storage, stale ... Last observation 2022-07-01 stale", no `on date`; the test asserts the same at 2026-11-14 | AC-03-grace-row.txt | browser + vitest |
| AC-04 | R-05, R-06 | tests | PASS | worked example at 2026-11-12: imerg-daily 2026-11-12 age 0 `on_date`; smap-l3 2026-11-11 age 1 `earlier`; ndvi-8day 2026-11-12 age 0; no request for 2026-11-12 reaches smap-l3 | AC-04-worked-example.txt | unittest |
| AC-05 | R-06 | tests + browser | PASS | smap-l3 at 2026-11-12: "2026-11-11 1 day old earlier observation No observation"; at 2026-11-11: "today on date", no marker | AC-05-marker.txt | browser + vitest |
| AC-06 | R-07 | tests | PASS | all candidates 404 -> `none_in_lookback`, no body | AC-06-none-in-lookback.txt | unittest |
| AC-07 | R-08 | tests | PASS | ndvi-monthly at 2026-11-14 -> 2026-10-01 (44 days, 62-day lookback); no request outside [time_start, declared_end]; no shared five-day loop | AC-07-monthly-walk.txt | unittest |
| AC-08 | R-09 | tests | PASS | 30 minute grid tokens, date-only token refused without a request, 2026-11-14 resolves to 2026-11-14T12:30:00Z, nothing after 12:30Z | AC-08-imerg-tokens.txt | unittest |
| AC-09 | R-10, R-11 | tests | PASS | 503 -> one request, `unavailable`; 400 and 404 step; 418 stops; unknown id 404 with no transport call | AC-09-status-walk.txt | unittest |
| AC-10 | R-12, R-13 | tests | PASS | one upstream fetch for two identical requests; `X-Tile-Date` present on the cache hit; two dates two cache files; `?date=2026-11-12` -> `2026-11-11` | AC-10-cache-date.txt | unittest |
| AC-11 | R-14 | cli + tests | PASS | `/layers?date=2026-11-12` is an object with `chosen_date`, `axis`, `layers`; coverage on grace-mascon 400 and on smap-l3 400 | AC-11-layers-cli.txt | curl + unittest |
| AC-12 | R-15, R-16 | tests + cli | PASS | z 9 above max_zoom 6 -> 400 with no upstream request; every raster source `maxzoom` = registry value; `MapCanvas.tsx` grep `maxzoom` returns lines 52 and 96 only, no literal 6 | AC-12-maxzoom.txt | unittest + vitest + curl |
| AC-13 | R-17 | browser 1440x900 | PASS | 0.55 at first paint; control 0.3 -> `getPaintProperty` 0.3; sources 6 before and after; addSource 0, removeSource 0; a layer turned on starts at 0.55 | AC-13-opacity-1440.txt | browser |
| AC-14 | R-18 | browser 1440x900 | PASS | smap-l3 index in `getStyle().layers` 115 -> 114 after one press on Move down; raster order swapped; sources 7 before and after; removeSource 0 | AC-14-order-1440.txt | browser |
| AC-15 | R-19 | tests | PASS | only the layer that is on issues tile requests | AC-15-off-layers.txt | vitest |
| AC-16 | R-20 | tests | PASS | 2026-11-12 -> 2026-11-13 requests only the layers whose effective date changed; a pinned layer issues none | AC-16-date-change.txt | vitest |
| AC-18 | R-22 | browser 1440x900 | PASS | sides "2026-11-12, today" and "2026-10-29, 14 days old" after the input; divider 44x900 at x 698, valuenow 50 -> 100 by pointer drag; camera lng -55.27, lat -11.91, z 11 unchanged; no delta element | AC-18-compare-1440.txt | browser |
| AC-19 | R-23, R-25 | tests | PASS | future-dated `X-Tile-Date` rejected; zero-byte 200 not drawn; under 5xx no cached entry dated after the chosen date is served, the newest on-or-before is | AC-19-tile-guard.txt | vitest + unittest |
| AC-20 | R-24, R-25 | browser 1440x900, upstream forced 503 | PASS | 13 rows keep their status text and no date; map shows "SMAP soil moisture offline sample, date unknown" from the reserve; a layer with neither reads "IMERG precipitation, daily no offline copy" | AC-20-degraded-1440.txt | browser + stand-in 503 upstream |
| AC-21 | R-26 | browser 1440x900 | PASS | 13 rows; collapsed row carries name, basis, resolution, effective date and age; 13 of 13 triggers 44.00x44.00; expanded controls 251x44, 44x44, 44x44, 251x44, 251x44 with the R-26 names; the track 251x5 sits in the row | AC-21-rail-1440.txt | browser |
| AC-22 | R-27, R-41 | tests | PASS | no element named Season and no season select; strip is label, avatar, `Command`, `Supporting data` in that order | AC-22-strip.txt | vitest |
| AC-23 | R-28 | tests + browser | PASS | axis 2015-04-01 to 2026-11-14; default 2026-11-14; `?date=2026-11-12` opens there; 2015-03-01 clamps to 2015-04-01 with "Date limited to 2015-04-01" | AC-23-axis-1440.txt | browser + vitest |
| AC-24 | R-29, R-30 | tests | PASS | 2014/15, 2024/25, 2025/26, 2026/27 for the four pinned dates; panel prints "Fixture data for 2025/26, not for 2026/27"; Field 01 SMAP stays 0.28 | AC-24-season.txt | vitest + browser |
| AC-25 | R-31 | tests | PASS | four windows of 2026/2027 at 2026-11-12 with the envelope dates; the 2025/2026 set at 2025-11-10; "No planting window data for 2024/25" at 2024-11-01; "No planting window source for this region" with no source | AC-25-band.txt | vitest |
| AC-26 | R-32 | tests + browser | PASS | label 2024/25 -> 2025/26 across the 1 July boundary; crop class "No crop class source" at 2015-04-01, 2025-06-30, 2025-07-01, 2026-11-11 and 2026-11-12 | AC-26-crop-class.txt | vitest + browser |
| AC-27 | R-33, R-34 | tests | PASS | 18 Sentinel-2 marks, 6 under 20 percent cloud; no smap-l3 mark on 2026-11-02; no ndvi-8day mark before 2025-02-12; the track sits in the expanded hls rows, not the dock | AC-27-tracks.txt | vitest |
| AC-28 | R-34 | tests | PASS | ndvi-8day `none_in_lookback` at 2025-01-15; smap-l3 resolves to 2015-04-01 on the first axis day | AC-28-first-axis-day.txt | vitest |
| AC-29 | R-35, R-36, R-47 | browser, three widths, both states | PASS | 1440 expanded dock 22.00,457.81 984.00x92.00, bottom 549.81 = panel top 557.81 - 8.00, top clears 450 by 7.81; 1440 collapsed panel bottom 733.00 = 741.00 - 8.00; 780 first paint dock 22.00,641.00 373.00x92.00 bottom 733.00, toggle 22.00,589.00 44x44; 780 panel expanded dock y 450.00 to 542.00; 360 band 8.00,224.00 288.00x92.00; all intersections 0.00 px2; F1 state 0.00 px2 against the right edge column 8.00,328.00 288.00x104.00 | AC-29-dock-rects.txt | browser |
| AC-30 | R-37, R-42 | tests + browser | PASS | region `Timeline`; `Go to date` 98x44, `Previous day` 44x44, `Timeline date` 862x44 (element box), `Next day` 44x44 at 1440; at 360 after the press the toggle is the fifth control, 44x44 at x 8.00 to 52.00, y 224.50 to 268.50, first in the date row | AC-30-hit-1440.txt | browser + vitest |
| AC-31 | R-38 | tests | PASS | arrows one day, PageUp/PageDown 30 days, Home/End the bounds, a letter leaves the date unchanged | AC-31-range-keys.txt | vitest |
| AC-32 | R-39 | browser, reduced motion | PASS | every measured node 0s|0s at 1440 and at 360 in both dock states; date 2026-11-12 before and after 3.2 s; the timer spy records 2 timers, both from the Vite dev server, none writing the date | AC-32-reduced-motion.txt | browser |
| AC-33 | R-40 | browser, three widths | **FAIL** | date, pin, compare and the collapsed panel survive 1440 -> 780; at 780 the `Timeline controls` toggle is not in the DOM after that change (`querySelectorAll("[data-timeline-toggle]").length` 0), so the required press cannot be made; the 360 step is not reached | AC-33-resize-states.txt | browser |
| AC-34 | R-43 | tests | **FAIL** | adapters 0, EOX references 0, `VITE_GOOGLE_MAPS_API_KEY` references 0, AC-34 tests 0, network log absent; one unconditional OpenFreeMap vector style | AC-34-basemap.txt | grep + vitest |
| AC-35 | R-44 | tests + browser 1440x900 | **FAIL** | controls named `Latest image` 0 in every branch, AC-35 tests 0, artifact absent; the coverage route exists and its test passes but R-44 names it a different scan | AC-35-latest-image.txt | git grep + grep + vitest |
| AC-36 | R-37, R-45 | browser 1440x900 + tests | PASS | Tab order Go to date -> Previous day -> Timeline date -> Next day, all tabIndex 0; Enter and Space step the date and keep focus; a typed 2026-11-05 sets it; 2015-03-01 clamps with the message | AC-36-keys-1440.txt | browser + vitest |
| AC-37 | R-26 | browser 1440x900 + tests | PASS | Enter/Space toggle `aria-expanded` and keep focus; Tab reaches the opacity range, both move buttons, the pin and compare; arrows step the paint 0.55 -> 0.6 -> 0.5; Move up changes the stack and keeps focus; pin sets `aria-pressed` and the word `pinned` follows it | AC-37-row-keys-1440.txt | browser + vitest |
| AC-38 | R-22 | browser 1440x900 + tests | PASS | divider 50 -> 51 -> 52 -> 51 by arrow keys, focus stays, camera unchanged | AC-38-divider-keys-1440.txt | browser + vitest |
| AC-39 | R-46 | browser 360x640, 780x900 | PASS | 360 first paint: aria-expanded false, toggle 288x44 at y 224, no region; after the press: region 288x92 at y 224 to 316 and the toggle 44x44 inside at x 8, y 224.50, the same with the panel in either state; 780 first paint: aria-expanded true, region 373x92 at y 641 to 733; after one press the collapsed toggle 373x44 at y 689 to 733; after a second, the dock back at 92 px | AC-39-toggle.txt | browser |
| AC-40 | R-47 | browser, three widths, both states | PASS | attribution 1440 1260.16,776.00 171.84x20.00; 780 600.16,776.00; 360 180.16,418.20 171.84x13.80; intersection with the dock and with the toggle 0.00 px2 at every width and state | AC-40-attribution.txt | browser |
| AC-41 | R-05 optical | tests | PASS | hls-l30 at 2026-11-14 walks from 2026-11-06, ignores every body of 5,000 bytes or less, resolves to 2026-11-01, age 13, `earlier`; no request after 2026-11-06 or before 2026-10-15 | AC-41-optical-walk.txt | unittest |
| AC-42 | R-48 | browser, three widths + tests | PASS | native button, 44x44 at every width (1440 x 169.14 y 578.31; 780 y 563.31; 360 x 155.14 y 460.50); name follows `aria-expanded`; Enter and Space flip it and keep focus; Tab reaches it | AC-42-collapse-toggle.txt | browser + vitest |
| AC-43 | R-49, R-50 | browser, three widths | PASS | collapsed: cards 0, list false, focusable card controls 0, panel height 143.00 at every width, bottom 884.00 / 632.00; expanded: card tops 699.81, 684.81 and 582.00 and panel tops 557.81, 542.81 and 440.00, all equal to the block 3 checkpoints; front faces only; height clause 143.00 against a 141.00 measured header block, 2.00 px, at the tolerance edge (142.00 recorded, 1.00 px) | AC-43-rotation-heights.txt | browser |
| AC-44 | R-51, R-52 | browser, reload and viewport change | PASS | load defaults expanded / collapsed / collapsed; a collapse at 1440 followed by 360 stays collapsed; an expand at 360 followed by 1440 stays expanded; the 780 load state expanded by a press stays expanded at 1440; a reload returns the 1440 default; 0 local and 0 session storage keys, URL unchanged | AC-44-collapse-state.txt | browser |
| AC-45 | R-53, R-54 | tests | PASS | a block 4 press leaves every card face and fixture value alone; wave 4 imports no other panel state | AC-45-imports.txt | vitest |

## The three failures, in the form the next card can act on

**AC-33 (R-40), measured at 780x900 after a viewport change from 1440x900.** The gate set 2026-11-12, pinned smap-l3,
turned compare on for ndvi-8day and collapsed the rotation panel at 1440x900. All four survive the change to 780x900. The
step that fails is the press: `document.querySelectorAll('[data-timeline-toggle]').length` is 0 while the region `Timeline`
is mounted, so there is nothing to press. The same page, loaded fresh at 780x900, renders the toggle at 22.00,589.00
44x44. Cause, measured: CDP `Emulation.setDeviceMetricsOverride` changes the CSS viewport but this Chromium delivers
neither a `resize` event nor a `media-query change` to the page (a probe listener registered before two changes recorded
nothing), so `useMediaMatch` in `src/lib/viewport.ts` keeps the first-paint value and `showToggle={compactViewport}` stays
false. `window.matchMedia('(max-width: 1020px)').matches` reads true at 780 while the React state still holds the 1440
value, which is the whole of the discrepancy. This is a measurement limit of the harness, not a proven product defect:
the jsdom test `R-40, R-51, R-52, AC-33: a resize keeps the chosen date and ...` passes, but AC-33 names computer use, so
that test is not the named evidence. **Required to close it: a run on a browser that delivers a real viewport resize**
(a real window, or a harness that fires `resize` and media-query change events), repeating the four steps.

**AC-34 (R-43).** The basemap adapter interface does not exist. `grep -rni "google" src/ backend/` finds no adapter and
no `VITE_GOOGLE_MAPS_API_KEY`; `grep -rni "eox|basemap" src/lib src/components` finds two doc comments in
`MapCanvas.tsx` and nothing else; the only basemap is `VECTOR_BASEMAP_STYLE = https://tiles.openfreemap.org/styles/liberty`
in `src/lib/layer-catalog.ts` line 107, used unconditionally. The verbose vitest log has no AC-34 test, and the artifact
the criterion names (the network log of the test run) does not exist. **Required to close it:** a basemap registry with an
EOX Sentinel-2 cloudless 2024 adapter as the default, a Google adapter that is inert without the key, a test that records
zero requests to a Google host with the key absent, and the log as the artifact.

**AC-35 (R-44).** The `Latest image` control does not exist. `git grep -il "latest image"` over every local and remote
ref returns nothing, `grep -rn "AC-35"` over `src/` and `backend/` returns nothing, and the browser at 1440x900 has no
control with that name or text. The coverage route `GET /layers/{id}/coverage` exists, answers 400 for non-optical layers
and 503 on a stop, and its backend test passes, but R-44 calls that route a different scan. **Required to close it:** the
control on the optical rows, the backwards scan from the chosen date with the 5,000 byte stop, the `none_in_lookback` and
`unavailable` branches, a vitest test on the recorded HLS fixture, and the browser artifact the criterion names.

## Regression: block 1 to 3 criteria this file does not amend

The regression is run in three layers, and the third layer is the one that can fail silently, so its limits are stated.

**Layer 1, the suites.** `npx vitest run` 21 files / 203 tests passed, and `python -m unittest -v` 25 tests OK, on the
gate tree. Both include the block 1 to 3 suites: `App.test.tsx` (the block 3 wave 1, 2, 3 sections and the block 3
keyboard matrix), `SmapBar`, `EvidencePanel`, `CropHistoryBars`, `RotationFlipCard`, `ScenarioCards`, `commands`,
`layer-catalog`, and the block 1 backend command and layer tests. The patch card records the baseline at `b0ab039` as
19 files / 182 tests; the gate did not check out `b0ab039` to re-count it, so that number is quoted, not measured here.
The gate tree runs 21 files / 203 tests: the new files are the wave 4 `viewport` helpers, `SeasonBand` and
`window-source` tests plus the App block 4 sections.

**Layer 2, the block 3 boxes the layout contract carries (CHECKPOINT-CONSTRAINTS-REMOVAL.md C4e, C4f, C5c, C5e).**
Measured by the gate in the browser:

| Box | Recorded | Measured 1440x900 | Measured 780x900 | Measured 360x640 | Delta |
|---|---|---|---|---|---|
| Rotation panel, expanded | 22,557.81,1006,884 / 22,542.81,395,884 / 8,440,352,632 | 22.00,557.81 984.00x326.19, right 1006.00, bottom 884.00 | 22.00,542.81 373.00x341.19, right 395.00, bottom 884.00 | 8.00,440.00 344.00x192.00, right 352.00, bottom 632.00 | 0.00 |
| Card tops | 699.81 / 684.81 / 582 | 699.81 | 684.81 | 582.00 | 0.00 |
| Navigation control | 1395,406.5,1424,493.5 / 735,... / 315,... | 1395.00,406.50 29.00x87.00 | 735.00,406.50 29.00x87.00 | 315.00,276.50 29.00x87.00 | 0.00 |
| Abstention notice (Field 03) | 1018,60,1418,124.5 | 1018.00,60.00 400.00x64.50 | capped as block 3 records | first box of the left stack | 0.00 |
| Layer rail anchor | right 1420, bottom 888 / right 760 / right 296, bottom 632 | 1070.00,768.00 350.00x120.00 | 526.00,768.00 234.00x120.00 | 36.81,546.00 259.19x86.00 | right and bottom 0.00; the height is content, see below |

The rail grew upward (top 768.00 against the 806.00 the block 3 checkpoint recorded, and 546.00 against 550.00 at 360)
because it now holds the 13 R-26 rows with internal scroll: `.layer-rail` sits exactly at its `max-height` rule, 118 px at
1440 and 780 and 84 px at 360, with 1074 / 1163 / 1094 px of rows scrolling inside 118 / 118 / 84. Block 3 fixes the rail's
right edge, bottom edge, width and `max-height`, not its height, and AC-18's 360 clause (right edge 296 within 2 px) reads
296.00. The anchor's bottom (888.00 / 632.00) and right (1420.00 / 760.00 / 296.00) are unchanged.

**Layer 3, the amended clauses (AM-14 to AM-21).** Measured, in the states the notes require:

- AM-14, AM-15, AM-18: the top right strip is `FIELD INTELLIGENCE`, `GM`, `COMMAND`, `SUPPORTING DATA` and nothing else;
  no Season control, no Season select, no `combobox` named Season.
- AM-16, AM-17: nothing named Season exists, so the retired Season reachability and listbox clauses have no subject; the
  dock takes its place in the intersection list and measures 0.00 px2 against the navigation control at all three widths.
- AM-19, AM-21: the `region` `Timeline` pair resolves at 1440x900 and at 780x900 at first paint (region mounted in both),
  and at 360x640 only after the press (unmounted at first paint, mounted after). The `list` `Rotation scenarios` pair is in
  the DOM at 1440x900 at first paint, absent at 780x900 and 360x640 at first paint, and present after the rotation toggle
  is pressed at those widths. A pair that does not resolve is a fail under block 3 AC-21, and each one resolves in the
  state AM-19 and AM-21 name.
- AM-20: the block 3 card measurements at 780x900 and 360x640 were taken after the gate expanded the rotation panel with
  its toggle: card tops 684.81 and 582.00, panel tops 542.81 and 440.00. The same condition was applied to the browser
  readings of block 3 AC-07 to AC-13 and AC-21: the three cards render with one front face each at every width (1 front,
  0 back per card), the coverage pill reads `86% data coverage`, and the rail rows carry the five fields.
- Block 3 AC-23 and block 2 R-12 (360 no-scroll): `document.documentElement.scrollWidth` 360 against `clientWidth` 360 in
  all four 360x640 states.
- Block 3 AC-18 and AC-25 (zero intersection): navigation control against the layer rail 0.00 px2 at all three widths;
  dock and toggle against the navigation control, the layer rail, the fields stack, the notice, the top strip, the
  rotation toggle and the attribution 0.00 px2 in the ten states of the rectangle table.

**What this regression did not do.** It did not re-measure every block 3 browser criterion in full: block 3 AC-07 to AC-13
were checked for the card faces, the visible value and the row structure, not re-derived number by number against the
block 3 falsifiers; AC-09's fill percent, AC-16's clear-centre samples, AC-26 and AC-30's 360 panel transitions, and block
1 and block 2's browser criteria were not re-run. Their test halves are green in the suites above, and the boxes they read
are in the table, but the pixel-level re-derivation was not repeated. This is a gap in the regression, recorded rather
than smoothed over, and it does not change the block verdict, which already fails on AC-33, AC-34 and AC-35.

## Execution evidence, run by the gate on this tree

```text
$ npx tsc -b --noEmit
tsc exit=0

$ npx vitest run
 Test Files  21 passed (21)
      Tests  203 passed (203)
   Duration  5.13s

$ npm run build
✓ built in 627ms
wall 4060 ms (date +%s%N around the command)

$ cd backend && .venv/bin/python -m unittest -v
Ran 25 tests in 0.099s
OK

$ wc -l artifacts/gibs-identifiers-2026-11-14.txt
1330 artifacts/gibs-identifiers-2026-11-14.txt
```

Full logs: `artifacts/gate-bloc4-build-suite.txt` (tsc and vitest), `artifacts/gate-bloc4-vitest-verbose.txt` (203 test
lines), `artifacts/gate-bloc4-backend-unittest.txt` (25 tests), `artifacts/gate-bloc4-cli.txt` (the curl checks). The
chunk-size warning in the build output is pre-existing and is not a failure.

## Limitations of this measurement

- The browser is the harness Chromium with CDP viewport emulation, not the user's profile, and not a phone at 360.
- **No resize and no media-query change event is delivered under `Emulation.setDeviceMetricsOverride` in this harness.**
  This is measured (a probe listener recorded nothing across two changes) and it is the cause of the AC-33 failure. It
  also means the panel-state clauses of AC-44 are proven through React state persistence, not through a browser resize
  event.
- The AC-20 cached-tile branch is not exercised: the gate backend ran with an empty tile cache on purpose, so the
  measured paths are the reserve (`offline sample, date unknown`) and `no offline copy`. The cached branch is covered by
  the backend unittest.
- 44 by 44 px sizes, every rectangle and every gap are browser measurements. jsdom has no layout, so the test files are
  not proof of the pixels.
- No screenshot was inspected: the card forbids images in the repository, so the evidence is the rectangle tables. No
  visual judgement of colour, typography or clipping is claimed.
- The gate rewrote the `AC-*` text artifacts it measured at the paths the spec names (AC-13, 14, 18, 20, 21, 23, 25, 29,
  30, 33, 36 to 40, 42 to 44); the wave workers' versions of those files stay in their own branch trees and attachments.
- Revision 8 is not a revision the card body names. The gate measured what is on disk at `main`, which is revision 8, and
  says so rather than judging revision 4's text.

## Decision

**Request changes.** The block does not pass its own exit criteria: AC-33 is not verified as measured, and AC-34 and
AC-35 are not implemented. 41 of 44 criteria pass with their named artifacts.

The pull requests are left exactly as the user will find them: #4 `block4/wave4-dock-home`, #5 `block4/patch-band-source`,
#2 and #3 still open, #1 merged. Nothing was merged, pushed or deployed by this gate. The gate tree exists only as the
local branch `gate/block4-gate` in the worktree named above.
