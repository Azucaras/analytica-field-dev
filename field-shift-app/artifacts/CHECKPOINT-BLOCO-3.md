# CHECKPOINT BLOCK 3: Game UX HUD

Verifier: tech-lead (review gate). No application code, fixture or spec line was changed by this run. The app ran at http://localhost:5173 with the API at :8000 (`/health` returned `{"status":"ok"}`), in the harness Chromium driven over CDP with viewport emulation at 1440x900, 780x900 and 360x640. No Playwright, no downloaded browser, no touch emulation.

Spec measured: `specs/bloco-3-game-hud.md`, 426 lines, 102090 bytes, sha256 `9b9de232878da4fb811ed5738b16fe30bbcf97ddf8cebdecb54b94dc6bb68d51`, last write 2026-11-14 12:41:00. Read at 13:10, re-hashed unchanged at 13:21. Exit criteria are AC-01 to AC-33, which is what this checkpoint judges. The gate card body says 28 ACs; the spec governs, and it carries 33.

## Block verdict

**The block passes. 33 of 33 criteria pass, each with the artifact the spec names.**

This run is a full re-measurement after the fix card `t_05b5a106` (developer), not a spot check. All six criteria that failed the 12:58 gate were measured again on the current tree and now pass:

- AC-10: crop bar tracks 218.00 and 218.00 px at 1440 (310 px card) and 148.00 and 148.00 px at 780 and 360 (240 px card), spread 0.00 in all three groups at all widths. The label column is a fixed 64 px.
- AC-11: front names are `Charts for Current sequence`, `Charts for Soybean → Corn cover` and `Charts for Soybean → Cotton`; the back name is `Details for Current sequence`. The face on screen matches the name.
- AC-15: with Field 03, the notice mounted and both panels open, the right edge column bottom is exactly y 393 at 1440 and at 780, against 393 plus or minus 2. The notice is 64.5 px tall at both widths, command top is 132.5 = notice bottom 124.5 + 8, and the panel to panel gap is 8 px.
- AC-26 and AC-30: from 1440 with both panels open and `Supporting data` opened last, a resize to 360 leaves only the evidence panel mounted (`Command` unmounted, `aria-expanded` false and true), focus stays on the `Supporting data` button, and the map centre and zoom do not change. At 360 the press time rule also holds: opening `Supporting data` closes `Command` and mounts in the same 8,328,296,432 box.
- AC-32: a test now exists and passes. It lists all four controls with `tagName` BUTTON, `tabIndex` 0, not disabled, state after Enter, after Space, after a second Enter and after a letter key, plus the focused element after each press and whether the controlled region is mounted.

## What the six fixes measured

| Was | Required by | Now measured |
|---|---|---|
| AC-10 tracks 248.08 and 263.48 px | equal within 1 px | 218/218 at 1440, 148/148 at 780 and 360, spread 0.00 |
| AC-11 front named `Details for ...` | R-18, AC-11 | front `Charts for ...`, back `Details for ...`, browser measured |
| AC-15 column bottom 397 | 393 plus or minus 2 | 393 at 1440 and 780 with the notice and both panels open |
| AC-26, AC-30 kept both panels on resize | last opened only, focus unchanged | evidence only, command unmounted, focus on Supporting data, camera unchanged |
| AC-32 no keyboard test | named test artifact | `block 3 gate: keyboard contract of the four controls (AC-32)` passes and prints the matrix |
| AC-09, AC-12, AC-13, AC-18, AC-20 traps | re-measure, a handoff can fake them | all re-measured below, all pass |

## Verdict table

| AC | Verdict | Measured | Artifact |
|---|---|---|---|
| AC-01 | PASS | 1440x900 first paint: button named `Command` present, `aria-expanded` false; the only form in the DOM is `Constraints`, no form `Agent command` | AC-01-1440.png |
| AC-02 | PASS | Test: closed `aria-controls` null and `aria-expanded` false; open mounts the form, `aria-controls` equals the form id; close unmounts and both attributes return | vitest output |
| AC-03 | PASS | Test: focus lands on the `Command name` box on open, returns to the `Command` button on close, a typed draft survives close and reopen | vitest output |
| AC-04 | PASS | Test: `CollapsiblePanel` from `@/components/ui/collapsible` wraps the row; trigger is a `button` named `Fields` with `aria-controls` `fields-chip-row`; false to true to false | vitest output |
| AC-05 | PASS | Collapsed header buttons are `[Fields, Field 01]`, chip text has no percent; expanded `#fields-chip-row` holds 3 buttons, 0 with a percent | AC-05-collapsed-1440.png |
| AC-06 | PASS | Test: `selectedFieldId` stays `mt-santa-carmem-01`, `/scenarios` call count is unchanged across collapse, expand and a chip press | vitest output |
| AC-07 | PASS | 3 cards, `aria-expanded` false on all; each front has 1 `h3`, 1 current badge, 2 visual groups, 0 fact labels, 1 face; back has 5 facts, 0 visuals, heading and badge still 1 each | vitest output, browser |
| AC-08 | PASS | Water `known`: group name `SMAP soil moisture, 0.28 m³/m³, retrieved`, text `0.28 m³/m³`, `retrieved`, `2025-11-10`. Water `unknown`: `SMAP soil moisture (assumes)`, no digit in the SMAP group, crop group still prints `2025-06-30` | AC-08-1440.png |
| AC-09 | PASS | Fill 161.27 px of a 288.00 px track = 55.995 percent (56 within 2 px), track 6 px tall, `data-fill-percent` 56 | AC-09-1440.png |
| AC-10 | PASS | Tracks 218/218 at 1440 and 148/148 at 780 and 360 in all three groups, spread 0.00; labels `Soybean`/`Corn` and `Soybean`/`Cotton` in order; no numeric bar label; `2025-06-30` is the only numeric text; group names `Crop history, Soybean then Corn, entered` and no-basis forms without basis | AC-10-1440.png, AC-10-780.png, AC-10-360.png |
| AC-11 | PASS | Native `button` overlay, empty text, names `Charts for {own h3}` front and `Details for {own h3}` back, `aria-controls` id occurs once, focus stays, scrollTop 0 and row scrollLeft 0, 1 face. Hover background 251,252,248 to 246,249,241; `:focus-within` the same; no visible `Details` or `Charts` text on screen | AC-11-hover-1440.png, AC-11-back-1440.png, AC-11-back-360.png |
| AC-12 | PASS | Computed `transition-duration` 0s at default motion and with `prefers-reduced-motion: reduce`; 30 of 30 sampled frames held exactly 1 face per card | AC-12-1440.png |
| AC-13 | PASS | Assumed: fill 0 px, track 6 px, label and name `SMAP soil moisture (assumes)`, no digit. Not reported (no SMAP row, water known): fill 0 px, track 6 px, label and name `Not reported for this option`. Null value and `Not entered` proven by SmapBar tests with 0 px fill, mounted track and matching names | AC-13-1440.png, AC-13-assumed-1440.png |
| AC-14 | PASS | No `region` named `Evidence` at first paint; `Supporting data` is a native button, `aria-expanded` false, `aria-controls` absent when closed; background `rgba(0, 0, 0, 0)`, border 0 px, box shadow none, colour `rgb(37, 55, 42)`; DOM order Command, Supporting data, Season; open mounts `Evidence` with 5 column headers | AC-14-1440.png |
| AC-15 | PASS | 1440: notice 400x64.5 at 1018,60, command 1018,132.5 to 1418,234.55, evidence 1018,242.55 to 1418,393, gaps 8 and 8, column bottom 393. 780: notice 351x64.5 at 407,60 (limit 112, bottom 124.5 above 180), command top 132.5, evidence gap 8, column bottom 393. No panel intersects the notice | AC-15-both-open-1440.png, AC-15-notice-1440.png, AC-15-both-open-780.png, AC-15-notice-780.png |
| AC-16 | PASS | 6 of 6 clear centre samples resolve to `CANVAS.maplibregl-canvas` at 1440 and at 780 with the notice mounted; the map centre point resolves to the canvas with both panels open at both widths | AC-16-1440.png, AC-16-780.png |
| AC-17 | PASS | Nav control 1395,406.5,1424,493.5 / 735,406.5,764,493.5 / 315,276.5,344,363.5; vertical centres 450, 450, 320 (exact 50 percent); right inset 16 at every width; zoom in, zoom out and compass buttons present | AC-17-1440.png, AC-17-780.png, AC-17-360.png |
| AC-18 | PASS | Eyebrow `PLAN WITH EVIDENCE` and heading `Rotation outlook`; nav intersections 0 px2 at 1440 and 780 against Season, top strip, field strip, notice, constraints, right column, rotation and rail; rotation right edge 1006 and 395, bottom 884 at both desktop widths; 360 box 8,440,352,632 with bottom 632; rail right edge 296; Season listbox opens at all widths, at 360 after the strip scrolls to 69 of 69 | AC-17-1440.png, AC-17-780.png, AC-17-360.png |
| AC-19 | PASS | 0 `.coverage-chip` elements, `COVERAGE` absent from the rendered text at 1440 | AC-19-1440.png |
| AC-20 | PASS | Pill `86% data coverage` for Field 01, `91% data coverage` for Field 02 and `62% data coverage` for Field 03; no field chip contains a percent; notice `Ranking withheld: coverage below 80%.`; body text matches at Field 03 are the pill and the 80 percent threshold only, `86%` occurs once at Field 01 and `91%` occurs once at Field 02 | AC-20-abstained-1440.png |
| AC-21 | PASS | Test: the five unconditional pairs resolve (`region Field map`, `navigation Layers`, `list Rotation scenarios`, `form Constraints`, `combobox Season`); `Evidence` and `Agent command` absent while closed, resolve while their toggle is open, absent again when it closes | vitest output |
| AC-22 | PASS | Computed z order: command 70, control strip 60, rotation 50, notice 40, evidence 30, layer rail 20, chips 10; nav container inside the map panel and outside every overlay | AC-22-1440.png, vitest output |
| AC-23 | PASS | Document scrollWidth 360 = clientWidth 360; strip scroll container 278 of 209 with `overflow-x: auto` and `nowrap`, 59 px tall, single 44 px chip row, no second row | AC-23-360.png |
| AC-24 | PASS | All 10 pairs among notice, fields, constraints, rotation and the right column intersect 0 px2; all top edges 58 to 440 are inside the 640 px viewport; each box centre, measured one box at a time, resolves to itself or a descendant | AC-24-360.png |
| AC-25 | PASS | Command vs rotation, evidence vs rotation and constraints vs rotation all 0 px2 at 1440, 780 and 360 | browser measured |
| AC-26 | PASS | Drag in the clear centre moved centre -55.2100,-11.9700 to -55.2448,-11.9530 at zoom 11.000; a real press on the control strip toggled `Command`; 1440 to 780 kept centre, zoom, both panel states and focus. 1440 with both open to 360 left the last opened panel only, focus on `Supporting data`, centre and zoom unchanged | AC-26-360.png, AC-26-resize-360.png |
| AC-27 | PASS | Literal scan test with `t` returning keys reports `missingTranslationKeys []` and `literalStrings []` after opening Fields, Command and Supporting data; new keys resolve through `src/strings/en.ts`, which holds 159 keys | vitest output |
| AC-28 | PASS | Test with HTTP 500 on `/fields` and `/scenarios`: Fields, Supporting data and Command stay operable, expanding reveals the alert text and the Retry button, Supporting data shows its empty state, Command mounts its form | vitest output |
| AC-29 | PASS | Four states (notice shown and hidden, fields collapsed and expanded): fields 44 or 99, constraints 96 in all four, gaps 8 and 8, expanding shifts constraints down 55, the 44 px chip row stays on one line with `nowrap` and no second row, first constraint select hit testable at its centre in all four, no box passes x 296, no nav intersection. The `#fields-chip-row` wrapper measures 55 px because it includes the 11 px gap above the row; the row defined by the layout note is 44 px and the 11 px is the gap, not part of the row | AC-29-collapsed-360.png, AC-29-expanded-360.png, AC-29-notice-360.png |
| AC-30 | PASS | 360 with `Command` open: form 8,328 to 296,432, 104 px tall, 8 px above the rotation panel top 440, `overflow-y: auto` with scrollHeight 117 over clientHeight 102. A real press on `Supporting data` closes `Command` and mounts evidence in the same box with focus on the button. From 1440 with both open, the resize keeps the panel opened last only. Column x right 296, clear of nav | AC-30-360.png, AC-30-resize-360.png |
| AC-31 | PASS | 1440: Command 85.09x44, Supporting data 130.14x44, Fields 44.94x44, flip 288x91.5 equal to the face box. 360: 44x44, 44x44, 53.13x44, flip 218x91.5 equal to the face box. A flip leaves scrollTop 0, row scrollLeft 0 and the rotation panel bottom at 884 at 1440 and 632 at 360, in both directions | AC-31-1440.png, AC-31-360.png |
| AC-32 | PASS | Test matrix for Fields, Command, Supporting data and the flip control: all `BUTTON`, `tabIndex` 0, not disabled, no `tabindex="-1"`, after Enter true, after Space false, after second Enter true, after `a` unchanged, region mounted and unmounted with the state, focus policies as R-04 and R-41 require | vitest output |
| AC-33 | PASS | 1440: three 310 px cards, tops all 718.31, computed tracks 310/310/310, `grid-auto-flow: column`, row scrollWidth 950 = clientWidth 950, all inside 22 to 1006. 360: three 240 px cards, tops all 582, row scrollWidth 740 over clientWidth 295, fixture order, no second row | AC-33-row-1440.png, AC-33-row-360.png |

## Execution evidence

Run by the verifier on the tree as it stands, before any browser step:

```text
$ npx tsc -b --noEmit
tsc exit=0

$ npx vitest run
 RUN  v5.1.0 /run/media/carloshnp/D/Programming/analytica-field-dev/field-shift-app
 Test Files  12 passed (12)
      Tests  93 passed (93)
   Start at  13:10:59
   Duration  4.65s (environment 48%, tests 32%, import 10%, setup 8%, transform 2%, worker 1%)
vitest exit=0

$ npm run build
dist/assets/index-CzfmuG4N.js  1,571.77 kB │ gzip: 449.45 kB
(!) Some chunks are larger than 500 kB after minification.
✓ built in 726ms
build exit=0
```

A second run at 13:20 with `--reporter=verbose` also exited 0 with 12 files and 93 tests, and printed the AC-32 matrix, four rows: Fields, Command, Supporting data and the flip control, each `"tagName": "BUTTON"`, `"tabIndex": 0`, `"disabled": false`, `"afterEnter": "true"`, `"afterSpace": "false"`, `"afterSecondEnter": "true"`, `"afterLetter": "true"`. The chunk size warning is pre-existing and is not a failure.

Browser harness: 40 AC named PNGs were captured in this run, between 13:12 and 13:22. Each artifact in the table was captured in the state whose numbers the row reports. The tab was brought to front and reported `visible` before motion and hover sampling.

Block 2 desktop anchors re-measured at 1440x900: brand 22,18,126.86,46.5; top strip top 0 right 1440; fields panel 22,72,298,116; constraints panel 22,264,318,444; layer rail 1070,806,1420,888. All identical to the block 2 checkpoint. The `.left-stack` wrapper did not move a desktop anchor.

## Requirement outside the AC text that does not pass: R-02 primary fill

This is the one finding this gate records against a closed block. R-02 says the `Command` button SHALL render as the strip's primary action with `background-color #f2f6ea`, a 1 px `#dfe8d1` border, a 6 px radius and the label colour `#465d32`, and that it is the only filled control in the strip. Measured on the running build at 1440: computed `background-color rgba(0, 0, 0, 0)`, `border-top-width 0px`, `border-radius 9px`, `color rgb(37, 55, 42)`, which is the `.top-chip` label colour, not the pinned `#465d32`, and no background fill at all. So `Command` and `Supporting data` are visually the same secondary chip.

No acceptance criterion falsifies this. AC-14 measures `Supporting data` against the R-02 values and its own falsifier list does not include a measurement of `Command`, and the spec's own covers list for R-02 names AC-02, AC-31 and AC-32, none of which read a colour. This is a specification coverage gap, not an AC failure: the block closes on AC-01 to AC-33, and R-02 is recorded here and in `STATE.md` as an open item.

Exact change for the implementer: add the R-02 declarations to the command toggle, for example `.command-toggle { background: #f2f6ea; border: 1px solid #dfe8d1; border-radius: 6px; color: #465d32; }` with the 44 px hit area preserved. Exact change for the spec owner, if the design should stay as it is: add a `Command` background and colour measurement to AC-14, so a future gate cannot pass a build with no primary fill. The gate does not choose between the two and does not edit either file.

## New defects and notes outside the AC text

- Touch flip cue: none. A tap on a card flips it, but no cue appears before the first tap, because hover does not exist on touch and `:focus-within` only shows after the tap. This is stated in R-18 and C-05 and is not scored.
- At 360, with the top strip scrolled to its end to reach Season as AC-18 requires, the `Command` and `Supporting data` buttons move outside the strip's left edge and stop being hit testable until the strip is scrolled back. This is ordinary horizontal overflow, not a swallowed press; at scroll 0 both buttons hit test and toggle, which is what AC-26 and AC-30 measure. Recorded so it is not mistaken for a defect.
- Gate card drift: the card body names 28 ACs, the spec carries 33 (AC-01 to AC-33), and the card asks for an `en.ts`/`pt-BR.ts` mirror that R-37 deliberately does not have. The checkpoint judges the spec.

## Carry-over and spec drift

| Item | State | Measurement |
|---|---|---|
| CO-01, layer rail 100 percent covered at 360 | still open, as the spec states | Rotation panel 8,440,352,632 against rail 36.81,550,296,632; intersection 21253.58 px2 equals the rail area, and the rail centre resolves to `LI.scenario-card` |
| CO-02, attribution at mid screen at 360 | still open, as the spec states | Attribution 0,404.41,352,432, top at 63.2 percent of the 640 px height |
| CO-03 to CO-09 | not re-audited, not silently fixed | The files that produce them are untouched; the evidence panel still measures 400 px at 1440 and 351 at 780; fixture dates still 15 rows `2025-11-10` and 3 rows `2025-06-30` |
| Endpoints and fixtures | unchanged | `backend/fixtures/field-scenarios.json` last written 2026-11-10 23:30; no backend source file modified after 2026-11-13; the only writes under `backend/` are runtime `.tile-cache` PNGs |
| String catalog | matches R-37, not the gate card | `pt-BR.ts` is a one line empty map by design, `en.ts` holds 159 keys; the literal scan test is green |
| Spec file | unmodified | sha256 `9b9de232878da4fb811ed5738b16fe30bbcf97ddf8cebdecb54b94dc6bb68d51` at 13:10 and at 13:21, no write during the gate |
| Gate writes | artifacts and this checkpoint only | No source, test, fixture or spec file was modified by this run |

## Limitations of the measurement

- The browser is the harness Chromium, not the user's profile, with CDP viewport emulation at 1440x900, 780x900 and 360x640, `devicePixelRatio` 1, no touch. Mobile layout is width emulation, not a phone.
- After each viewport change I waited for MapLibre to resize its canvas before sampling. An early 780 sample taken 1.2 s after the resize returned `DIV` instead of the canvas because the canvas had not yet taken the new size; the table reports the re-sample after the canvas measured 780x900. This is a harness timing artefact, not a product defect.
- Hover was measured with a real CDP mouse move after dismissing a Base UI select popup that an earlier Season test had left open. The popup blocked hit testing while open, so the first hover probe saw no `:hover`. With the popup dismissed, `:hover` matched the card and the background changed. AC-11 is judged on the clean probe.
- jsdom has no layout. AC-10, AC-15, AC-16, AC-17, AC-18, AC-23, AC-24, AC-25, AC-29, AC-30, AC-31 and AC-33 are judged from browser geometry; their test files are green but are not proof of the pixels.
- AC-12 face counts were sampled in the DOM, one count per card per animation frame. The criterion also names the accessibility tree; I did not dump the accessibility tree on every frame, and I relied on exactly one face being mounted, which is what the tree exposes. This is a real, small gap in the method and is recorded rather than smoothed over.
- AC-02, AC-03, AC-04, AC-06, AC-07, AC-21, AC-27, AC-28 and AC-32 are judged from the test source and the run output. AC-13's null and `Not entered` states are judged the same way, because the fixture has no such SMAP row; the assumed and not reported states were measured in the browser.
- Screenshots were captured from the live page through CDP and are named by AC. The vision provider returned 403 in this session as well, so I did not visually inspect the PNGs; each was captured in the state whose numbers the table reports, and identical states produce byte identical files.
- No network throttling, no CPU throttling and no screen reader traversal were used. Accessible names were read from `aria-label`, `role` and DOM structure, not from an accessibility tree dump.
- The 1440 to 360 transition was measured with `Supporting data` opened last by a real mouse click, so focus was on that button before the resize, which is the path the criterion describes. If focus were inside the panel that the transition unmounts, the browser would move focus to the body; that edge is outside the measured path and is not claimed as passing.

## Decision

Block 3 is closed on its acceptance criteria: AC-01 to AC-33 pass, each with the named artifact. Six defects from the previous gate are fixed and re-measured.

One requirement, R-02's primary fill on `Command`, is not implemented and is not falsified by any criterion. It is recorded as an open item for the spec owner and the implementer, with the exact change above, and it does not change the AC verdict of this gate. No code, test, fixture or spec line was changed by this run.
