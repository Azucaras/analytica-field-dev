# CHECKPOINT: Constraints removal, per-row basis labels, geometry and no regressions

Verifier: tech-lead (review gate). No application source, fixture, test or spec line was changed by this run. I did write `STATE.md` and this file, which the card names as deliverables. The app ran at `http://localhost:5173` (Vite, pid 858833) with the API at `:8000` (uvicorn, pid 855894, `/health` returned `{"status":"ok"}`), in the harness Chromium driven over CDP with viewport emulation at 1440x900, 780x900 and 360x640. Every browser number below was read from a tab that reported `document.visibilityState === "visible"` after `Page.bringToFront`.

## Limits of this gate, read first

These are the things I did **not** prove, in the order they matter.

1. **I did not look at the pixels.** `vision_analyze` failed with `403 model_not_granted` for the configured model alias, so no screenshot was inspected visually. The PNGs named below are the geometry-backed captures of the states whose numbers the table reports; they are evidence of what the DOM measured, not of how the frame looked to a human. Colour, typography, anti-aliasing and visual clipping were not judged by eye.
2. **There is no version control.** `git status` fails with `fatal: not a git repository`, so I cannot show what the change diff did, cannot diff the tree before and after, and cannot prove that something outside my measured set did not change. Scope evidence is the implementation card's file list plus file mtimes (section "Tree state"). A file edited with its mtime preserved would not be caught.
3. **The "before" counts are the handoff's, not mine.** I measured only the current tree: 11 test files and 95 tests. The 12 files / 93 tests baseline and the RED run of 10 failures come from `t_ef77623d` and could not be re-run, because no pre-change tree exists anywhere on this machine.
4. **"First paint for each field" is literally true for one field only.** The map auto-selects Field 01 on load, so only Field 01's number is a zero-interaction first paint reading. Fields 02 and 03 were reached the way a user reaches them: expand the Fields panel, press the chip. Field 02 and 03 are therefore "first paint of that field's content", not "first paint of the page".
5. **Two of the four SMAP states cannot come from the fixture.** No SMAP row in `backend/fixtures/field-scenarios.json` is `modelled`, `null` or `Not entered`; every SMAP row is `basis: "retrieved"` with 0.28, 0.31 or 0.19. The modelled, null and `Not entered` states are proven by injected-row tests, which is exactly the method block 3 AC-13 prescribes. They are not browser-measured and I do not present them as such.
6. **One epistemic marker has no browser artifact at all.** `Rotation suitability` is `basis: "modelled"` only in the `soy-cotton` scenario, and `src/App.tsx` line 115 renders the evidence panel from `scenarios.find(is_current)` only, so a modelled row never reaches the panel in the running app. Block 1 AC-15 knows this and names an injected-row test as the method instead of new fixture data, which is what row C2c uses.
7. **Chromium only.** No Firefox, no Safari, no real mobile browser, no touch emulation, no `prefers-reduced-motion` re-check in this run. No performance or load measurement.
8. **Block 2 was not measured.** `specs/bloco-2-hud-sobreposto.md` still lists the withdrawn form pair in R-11 and line 39; that is follow-up card `t_b3d2e16c`, not this gate.
9. **One handoff finding does not reproduce.** `t_ef77623d` reported that the collapsible Fields panel never expands and created `t_60978c58` for it. On a visible tab with a real CDP press the panel expands to 93 px at 1440 and 99 px at 360 (see C5b). The 11 px reading in that handoff is the first frame of the 200 ms height transition, and a background tab, where `requestAnimationFrame` is throttled, freezes exactly there. The orchestrator should re-scope or close `t_60978c58` rather than dispatch a repair.

## Specs measured, hashed before and after

Both files were stat-ed and hashed at 14:29 and again at 14:36, unchanged. No write under `specs/` during the gate.

| Spec | Revision | Lines | Bytes | sha256 (raw) | Last write | Frozen digest (PENDING substituted) |
|---|---|---|---|---|---|---|
| `specs/bloco-1-mapa-de-composicao.md` | 2 | 176 | 21945 | `4fe0d2b7298ef25f4e3b946a96bc7977085886d2ef9c3f260c28d18a15a0648f` | 2026-11-14 14:10:23 | `299dfe8f9b5d939a1a4a6c969c9bdbc3505d2e400481a4d646cab6793e2246db` |
| `specs/bloco-3-game-hud.md` | 7 | 450 | 107685 | `29a9d7efc2f182e0391faf00507232ad6631de6b93486224a0a7efd6c49b892d` | 2026-11-14 14:09:07 | `b384e88556e7e8b15c96b424c6f778b4fb3d874b5def987a502da83b1df88452` |

Both frozen digests reproduce with the `sed` command each file documents at its freeze record, run by me at 14:36. Counts read from the documents: block 1 revision 2 carries 25 requirements and 28 criteria; block 3 revision 7 carries 42 requirements and 33 criteria. Nothing here is measured against the pre-amendment block 3 revision 6.

## Tree state

Implementation card `t_ef77623d` is complete (run 10, started 2026-11-14 14:11:50, ended 14:28:28). Newest source writes: `src/App.test.tsx` 14:17:57, `backend/test_commands.py` 14:17:29, `src/index.css` 14:17:29, `backend/main.py` 14:16:41, `src/App.tsx` 14:16:27, `src/components/SmapBar.tsx` 14:16:07. `find src backend specs -newermt '2026-11-14 14:28:28'` returns nothing (excluding `__pycache__`, `.venv` and `.tile-cache`). So the tree I measured was last written 10 minutes 31 seconds before the implementation run ended and has not been touched since. The gate's own `npm run build` rewrote `dist/` at 14:37, which is build output and not source.

## Block verdict

**The change passes. All six criteria of this gate pass, with the artifacts named per row and the limits above. No criterion FAILs.**

The whole point of the change holds three ways at three widths: no `Constraints` form, no control with that accessible name, and no wiring for it in `src` or `backend`. The epistemic fix is visible at first paint: the SMAP row prints `0.28 m³/m³` with a 56.00 percent fill before any interaction, and the three fixture values draw three different fills instead of one label over an empty track.

## Criterion table

| # | Criterion | Verdict | Measured | Artifact |
|---|---|---|---|---|
| C1a | No form or `constraints` node in the DOM at 1440, 780, 360 | PASS | `document.querySelectorAll('form').length` 0 at all three widths; `[class*=constraint], [id*=constraint], [data-testid*=constraint]` 0; `document.body.innerText.includes('Constraints')` false; 180 element nodes per width | `CR-02-firstpaint-1440.png`, `CR-07-360-firstpaint.png`, `CR-06-780-firstpaint.png` |
| C1b | No accessible name `Constraints` at 1440, 780, 360 | PASS | CDP `Accessibility.getFullAXTree`: 276 / 276 / 275 nodes; 0 nodes whose name or role contains `constraint`; 0 `form` roles. Remaining button names: COMMAND, FIELDS, SUPPORTING DATA, Field 01, Map, Satellite, Satellite with labels, Zoom in, Zoom out, the north reset, and the three `Charts for ...` flip controls | AX dumps described here, same three screenshots |
| C1c | Grep over `src` and `backend` excluding `.venv` | PASS | `grep -rn "ConstraintForm\|constraints" src backend --exclude-dir=.venv --exclude-dir=__pycache__` returns 10 hits: 3 absence assertions in `App.test.tsx` (214, 215, 738), 3 in `commands.test.ts` (54, 57, 65), 2 in `strings/index.test.ts` (36, 37), 2 in `backend/test_commands.py` (104, 105). No component, import, state, CSS rule or enum value | terminal transcript, reproduced in this file |
| C2a | First paint, no interaction: Field 01 SMAP number and non-zero fill | PASS | Group text `SMAP soil moisture 0.28 m³/m³ retrieved 2025-11-10`; aria `SMAP soil moisture, 0.28 m³/m³, retrieved`; `data-state="drawn"`, `data-basis="retrieved"`; track 288.00 x 6.00 px; fill 161.27 px = 56.00 percent; `data-fill-percent` 56 | `CR-02-firstpaint-1440.png` |
| C2b | Field 02 and Field 03 SMAP number and non-zero fill | PASS | Field 02 `0.31 m³/m³`, fill 178.55 of 288 px = 62.00 percent; Field 03 `0.19 m³/m³`, fill 109.44 of 288 px = 38.00 percent, reached by expanding Fields and pressing the chip with a real CDP press | `CR-04-field02-via-chip-1440.png`, `CR-04-field03-via-chip-1440.png` |
| C2c | `modelled` row carries the marker the amended spec names | PASS (tests) | SMAP modelled: fill `0px`, `data-fill-percent` 0, text contains `SMAP soil moisture (modelled)` and the `modelled` badge, no digit in the group, aria equals the visible label (`SmapBar.test.tsx`, "marks a modelled row, draws 0 px and prints no digit (R-17, AC-13)"). Evidence panel modelled row: `EvidencePanel.test.tsx` line 23 injects a modelled row and line 80 "shows an allowed basis label on every evidence row" asserts the `modelled` badge | vitest verbose output; see limit 6 for why the browser cannot show it |
| C2d | Missing row and `Not entered` row render the empty track and literal label | PASS | Missing: Soybean to Cotton card at first paint, text `SMAP soil moisture Not reported for this option`, aria `SMAP soil moisture, Not reported for this option`, fill 0 px of a 288 x 6 px track, `data-basis="none"`, no badge, no date. `Not entered`: test-only, 0 px, literal `Not entered`, track mounted (`SmapBar.test.tsx`, "draws 0 px with the literal label for null, Not entered and a missing row") | `CR-02-firstpaint-1440.png` for the missing row; vitest verbose output for `Not entered` |
| C3 | AC-13 four SMAP states | PASS | (1) retrieved: 56.00 / 62.00 / 38.00 percent with number, badge and date, browser. (2) modelled: 0 px, label plus badge, no digit, test. (3) no row: 0 px, track rendered, literal, no badge and no date, browser. (4) null prints `No observation` and `Not entered` prints `Not entered`, both 0 px with the track rendered, test. Two of the four are test-only because the fixture carries no such SMAP row; AC-13 names that method | `CR-02-firstpaint-1440.png`, `CR-03-field03-1440.png`, vitest verbose output |
| C4a | 1440: no dead band from the removed panel, clear centre intact | PASS | `.left-stack` has 1 child, fields anchor 0,72,320,116 (panel surface 22,72,298,116); 0 absolute or fixed non-map elements intersect the withdrawn rect 22,264,318,444; next left box is the rotation panel at top 557.81, so no reserved void; 6 of 6 clear-centre samples resolve to `CANVAS.maplibregl-canvas`; fields panel right edge 298 against the rectangle start 432 is 134 px clear | `CR-02-firstpaint-1440.png` |
| C4b | 780: no dead band, clear centre intact, notice capped | PASS | Fields anchor 0,72,202.8,116, right edge 202.8 against the rectangle start 234 is 31.2 px clear; 6 of 6 centre samples resolve to the canvas at first paint and again with the Field 03 notice mounted; notice 407,60,758,124.5 is 64.5 px tall (cap 112) with its bottom at 124.5, above 180 | `CR-06-780-firstpaint.png`, `CR-14-780-field03-notice.png` |
| C4c | 360: left column is the fields panel plus the notice | PASS | Field 03: notice 8,58,296,109.19 (51.19 px) and fields 8,117.19,296,161.19, gap exactly 8.00 px, 2 stack children, no second box; field 01: 1 child, fields 8,58,296,102; maximum right edge in the stack 296; intersection with the navigation control 0 px2; document scrollWidth 360 = clientWidth 360 | `CR-07-360-firstpaint.png`, `CR-08-360-field03-notice.png` |
| C4d | Layer rail rects match the block 3 checkpoint | PASS | 1440 1070,806,1420,888; 780 526,806,760,888; 360 36.81,550,296,632. The 1440 and 780 readings are taken after the tile row (`... retrieved 9 km 2026-11-11`) renders; before it the panel is 28.5 px shorter, which is content, not the removal | three screenshots, same states |
| C4e | Rotation panel right edge and box match | PASS | 1440 22,557.81,1006,884 (right 1006, bottom 884); 780 22,542.81,395,884 (right 395); 360 8,440,352,632 (bottom 632) | `CR-02`, `CR-06`, `CR-07` |
| C4f | Navigation control centre right with right inset 16 | PASS | 1440 1395,406.5,1424,493.5; 780 735,406.5,764,493.5; 360 315,276.5,344,363.5; right inset 16.00 at all three widths; 3 buttons (zoom in, zoom out, compass) at all three | `CR-02`, `CR-06`, `CR-07` |
| C5a | Command toggle does not regress | PASS | Real CDP press on `Command`: form mounts with `aria-label="Agent command"`, `aria-controls="agent-command-form"` resolves, `aria-expanded="true"`, focus in the `Command name` box, column 1018,60,1418,163.5; second press unmounts the form, `aria-expanded="false"`, focus returns to the button | `CR-11-1440-command-open.png` |
| C5b | Collapsible Fields panel does not regress | PASS | Real CDP press on `Fields`: `aria-expanded="true"`, panel height 11 px on the first frame then 93.00 px with `data-starting-style` gone, 3 chips. At 360 with the notice: fields box 8,117.19,296,216.19, that is 99.00 px expanded (44 header + 11 gap + 44 chip row), chip row 288.00 px wide, `scrollWidth` 288 = `clientWidth` 288, `flex-wrap: nowrap`, 3 chips, notice unmoved at 8,58,296,109.19. See limit 9 for the contradicting handoff | `CR-05-fields-expand-1440.png`, `CR-09-360-fields-expanded.png` |
| C5c | One-row rotation cards, flip by card, hover cue | PASS | 1440: 3 cards 310 px wide, tops all 699.81, `grid-auto-flow: column`; 780: 240 px, tops 684.81; 360: 240 px, tops 582, row `scrollWidth` 740 against `clientWidth` 295 and no second row. Hover: card background 251,252,248 to 246,249,241. Press on the card body: face `front` to `back`, name `Charts for Current sequence` to `Details for Current sequence`, `aria-expanded` true, 1 face in the DOM, 5 `dt`, 0 SMAP groups, `scrollTop` 0, row `scrollLeft` 0, rotation bottom 884; pressing again returns to the front | `CR-12-1440-card-hover.png`, `CR-13-1440-card-back.png` |
| C5d | Single coverage readout | PASS | 1 `.field-coverage-pill` with `86% data coverage` at Field 01; 0 `.coverage-chip`; 0 occurrences of `COVERAGE` in the rendered body text | `CR-02-firstpaint-1440.png` |
| C5e | Abstention notice does not regress | PASS | Field 03: 1440 notice 1018,60,1418,124.5 with `Ranking withheld: coverage below 80%.`; 780 notice 407,60,758,124.5, 64.5 px tall, bottom 124.5 above 180; clear centre 6 of 6 canvas with the notice mounted | `CR-03-field03-1440.png`, `CR-14-780-field03-notice.png` |
| C5f | Keyboard contract | PASS | On the `Fields` trigger: `keyDown` Enter opens (aria-expanded true, 93 px), Space closes, `a` does not toggle, focus stays on the trigger. On `Command`: Enter opens and moves focus into the `Command name` box. The named AC-32 matrix test exists and passes | terminal keyboard transcript; vitest verbose output |
| C5g | 360 one panel at a time | PASS | At 360 a press on `Command` mounts it alone at 8,328,296,432; a press on `Supporting data` unmounts `Command` and mounts `Evidence` in the same box; rotation top 440 keeps the 8 px gap | `CR-10-360-one-panel.png` |
| C6a | Live backend rejects a `constraints` panel | PASS | `GET /commands` returns 4 entries with `open_panel.input_schema.properties.panel.enum == ["scenarios","evidence"]`; `POST /commands/open_panel {"panel":"constraints"}` returns 422 `{"detail":"Invalid value for panel"}`; `{"panel":"evidence"}` returns 200 | curl transcript, reproduced in this file |
| C6b | Frontend schema rejects it, with a test | PASS | `commands.test.ts` "rejects the withdrawn constraints panel with a schema failure (AM-08)" asserts `runCommand('open_panel', {panel:'constraints'})` throws, the store stays `null`, and the serialized `open_panel` schema contains `"scenarios"` and `"evidence"` and not `"constraints"` | vitest verbose output |
| C6c | Backend suite proves both sides | PASS | 8 tests OK, including `test_open_panel_rejects_the_withdrawn_constraints_panel` and `test_open_panel_schema_offers_only_scenarios_and_evidence` | unittest verbose output |

## Execution evidence, run by me on this tree

```text
$ npx tsc -b --noEmit
tsc exit=0

$ npx vitest run
 Test Files  11 passed (11)
      Tests  95 passed (95)
   Start at  14:30:17
   Duration  3.11s

$ npm run build
dist/assets/index-C5jDn_Pw.js  1,560.25 kB | gzip 445.53 kB
(!) Some chunks are larger than 500 kB after minification.
✓ built in 787ms
build_exit=0

$ backend/.venv/bin/python -m unittest -v test_commands
Ran 8 tests in 0.030s
OK

$ npx vitest run src/components/SmapBar.test.tsx src/components/EvidencePanel.test.tsx src/lib/commands.test.ts --reporter=verbose
 Test Files  3 passed (3)
      Tests  20 passed (20)
```

The chunk size warning is pre-existing and is not a failure. The 20 targeted tests are the ones the C2c, C2d, C3 and C6b rows cite.

## Findings outside this gate's criteria

These do not change the verdict. They are recorded so the orchestrator can route them.

1. **`t_60978c58` rests on a measurement artefact.** The Fields panel expands: 93.00 px at 1440 and 99.00 px at 360 on a visible tab, `data-starting-style` cleared, chips mounted, chip row one line. The handoff's 11 px is what the panel measures during the first frame of its 200 ms height transition; in a background tab `requestAnimationFrame` is throttled, so that frame is where it stays. `t_ef77623d` itself reports "3 s of polling every 150 ms" with no mention of bringing the tab to the front. Recommend closing or re-scoping that card instead of dispatching a repair, and adding the `Page.bringToFront` step to the harness recipe.
2. **The card face grew, so the card top moved.** At 1440 the face measures 110.00 px and the card 169.19 px, against 91.50 px in the block 3 checkpoint; the card top is 699.81 against the checkpoint's 718.31, one row, equal tops, inside the unchanged 557.81 to 884 panel. The cause is the amended readout itself: `.smap-readout` now prints the value, the basis badge and the date as text (14.5 px tall), which R-14 and AM-12 require. No amended criterion fixes the card top, so this is a checkpoint delta, not a failure. Any downstream document quoting 718.31 or 91.5 as current numbers is stale.
3. **At 360 the SMAP readout is rendered but not visible without the panel scroll.** Readout top 657.19 against the rotation panel's visible bottom 632. The number is in the first paint DOM and the group aria carries it; the 30vh panel clips it, exactly as the pre-change checkpoint's 582 card top and 632 panel bottom imply.
4. **`Rotation suitability` cannot reach the evidence panel.** `src/App.tsx` line 115 reads the current scenario, and the fixture marks `Rotation suitability` modelled only on `soy-cotton`. The modelled evidence row is test-only, as block 1 AC-15 states.

## Verification checklist

- [x] Spec hashes, sizes, line counts and mtimes recorded at 14:29 and re-hashed unchanged at 14:36.
- [x] Implementation card complete, no source or spec write after its run ended.
- [x] tsc, vitest, build and the backend suite run with real output pasted.
- [x] Every criterion has a verdict, a measured number and a named artifact.
- [x] Browser measurer confirmed a visible tab before reading animation state.
- [x] No source file was edited by this gate.
- [x] Every FAIL named: there is none.
