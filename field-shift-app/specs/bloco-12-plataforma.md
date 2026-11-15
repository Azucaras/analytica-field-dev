# Block 12: a screen that takes new panels

Status: implemented on 2026-11-15, branch `integracao-exp_vass`.

## Why

Every panel of blocks 2 to 11 placed itself on the map with fixed coordinates: 27 absolute or fixed position
rules, a measured top edge for the timeline, z-index tables and width-specific exceptions. Each new feature had to
find free pixels, so panels covered each other and the map, and fonts had shrunk to 7 to 9 px to fit. The same
problems were present on the team's `main` before the Field Phase work was merged in.

## What changes

- The screen is a CSS grid: top bar, a rail of panel buttons, a left column, the map, a right column, and a
  drawer under the map. Panels never overlap the map or each other.
- Every panel is one entry in `src/shell/panels.tsx` (id, title, icon, slot, order, default state, component).
  The rail, the header with collapse and close, the phone tab and an error boundary come from that entry.
- Panel state lives in `src/shell/shell-store.ts`. Shared data lives in one provider, `src/shell/app-data.tsx`.
- Below 760 px the panels open one at a time in a sheet under the map, picked from a tab bar.
- The agent command `open_panel` accepts any registered panel id (`scenarios` stays as the older name of
  `rotations`).

## Fixed on the way

- Scenario names and crops of the Cass County fields printed raw catalog keys. A scenario the catalog does not
  know is now named by its crops, and its facts use the fixture's own sentences.
- Picking a field fits the map to the field outline (up to zoom 15) instead of a fixed zoom 11, at which a
  150 m Cass County field was a dot. Fields have a fill, and the selected one a brighter outline.
- Coarse layers (1 km or larger) are drawn with hard pixel edges, and a map note gives the pixel size and warns
  when a pixel is larger than a field.
- The compare divider was a 44 px range input floating on the map. It is now a full-height line with a drag
  handle; the range input stays for the keyboard.
- The timeline printed the raw layer status `unavailable`.
- Panel text is mostly 10 to 13 px, up from 7 to 9 px.

## What this replaces

The position rules of blocks 2 to 5 (R-35, R-36, R-40, R-41, R-46, R-48, R-49 and the anchor tables) no longer
apply. Their tests were replaced by tests of the grid, the registry, the phone sheet and the error boundary in
`src/App.test.tsx`. Behaviour rules that do not depend on position (abstention, no season in the scenario
request, retry after an HTTP error, the timeline date rules, the catalog-only text rule) keep their tests.

## Not done

- The panel open state is not remembered across reloads.
- The removed per-width rules of the timeline toggle are still props of `TimelineDock`, unused by the app.
- SMAP stays a 9 km product; a field-scale moisture or vegetation layer is a separate piece of work.
