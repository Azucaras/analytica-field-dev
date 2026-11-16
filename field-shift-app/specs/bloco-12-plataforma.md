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
- Picking a field fits the map to the field outline (up to zoom 14, with a quarter of the map as padding so the
  neighbouring crop polygons stay in view) instead of a fixed zoom 11, at which a 150 m Cass County field was a
  dot. The field selected automatically on load keeps the region's own view. Fields have a fill, and the
  selected one a brighter outline.
- Raster layers were moved to the very top of the map style, above the crop polygons and the place labels, so
  SMAP (on by default) covered the crop classes. Rasters and the water mask now stop under the polygon layers.
- Coarse layers (1 km or larger) are drawn with hard pixel edges, and a map note gives the pixel size and warns
  when a pixel is larger than a field.
- The compare divider was a 44 px range input floating on the map. It is now a full-height line with a drag
  handle; the range input stays for the keyboard.
- The timeline printed the raw layer status `unavailable`.
- Panel text is mostly 10 to 13 px, up from 7 to 9 px.

## Layer loading and the sea

- `/layers` resolved its 13 layers one after another, each walking dates against GIBS over a new HTTPS
  connection: about 10 s for every new date. The layers are now resolved in parallel over one pooled client
  (1.3 to 3.8 s cold, measured on 2026-11-15), and a date GIBS answered 400 or 404 for is not asked again for
  other tiles of the same layer.
- A failed walk (connection error or 5xx) was cached for 24 hours, so one bad answer left a layer
  `unavailable` for the day. Failures are no longer cached, and a 5xx is asked once more. This changes AC-09
  of block 4: a 5xx now costs two requests at the same URL before the walk stops.
- Dated tiles carry `Cache-Control: public, max-age=3600`.
- Land-only products (SMAP, MODIS NDVI and EVI, MODIS land surface temperature) are marked `surface: "land"` in
  the registry. The map draws the basemap's water polygons above them, so a kilometre pixel on the coast no
  longer spills over the sea; rain and reflectance stay above the mask.
- MODIS NDVI monthly is MOD13A3, a 1 km product (GIBS layer metadata); the registry said 250 m.
- SMAP L3 soil moisture (a swath product) and the two HLS reflectance layers (single scenes) covered only
  patches of the map on any one date. They stay in the registry with `shown: False`, so their tiles and the
  block 4 evidence still resolve, but `/layers` and the offline catalog leave them out. The layer on at load
  is now SMAP L4 surface soil moisture, the gap-free modelled version.

## Efficiency pass

Measured with `vite build` on 2026-11-15:

| | Before | After |
|---|---|---|
| Main JavaScript chunk | 2,082 KB (468 KB gzip) | 1,601 KB (449 KB gzip) |
| npm packages installed | | 316 fewer |

- The recorded STAC response of the Sentinel-2 track (377 KB) is its own chunk, fetched only when that track is
  drawn; with the HLS layers retired the app never fetches it.
- The ZARC snapshot (249 KB) is its own chunk, fetched once after the first paint. Tests hand it over directly.
- `translationKeyFor` used to scan the whole string catalog on every call; it reads a map built once.
- `deck.gl`, `@deck.gl/react`, `react-router` and `cn` were dependencies nothing imported.
- The backend parses each climate file and the pilot field list once per file version (keyed on the
  modification time) instead of on every request.
- The CSS (231 KB, 35 KB gzip) is mostly MapLibre's own stylesheet and the Tailwind base; limiting Tailwind's
  source scan to `src/` saved 2 KB, so it was left as it was.

## Merge with the team's main at df8b238 (blocks 5.5, 6 and 7)

The team rebuilt the map screen into panels in parallel (block 5.5, `PLANO-TELA-UNICA-E-PAINEIS.md`). The
merge keeps this block's grid and registry and brings the team's panels and rules into it:

- `Field numbers`, `Planting calendar` and `Field record` are registry entries (`src/panels/team-panels.tsx`)
  in the bottom slot, with `Rotation outlook`. The four form the exclusive group `analysis`: one open at a
  time, whatever opens it (rail, picker or the agent's `open_panel`).
- B4 and D3: no analysis panel opens by itself. While none is open, the bottom slot shows a picker with the
  four buttons. `Rotation outlook` and `Field numbers` need a selection (B5): their buttons are disabled,
  with the reason in their accessible name, until a field or polygon is selected.
- B6: `Selected polygon` exists only while a polygon is selected.
- Block 6 AC-02, the map keeps its rectangle: the bottom slot has a fixed height, so opening, closing or
  collapsing a panel there never resizes the map, and on a phone the panel sheet slides over the map
  instead of shrinking it. Closing every panel of a side column still widens the map; that is the user
  asking for more map.
- Block 6 R-11, as merged: new strings still come from `en.ts` through `t()`, and because the merged app
  opens in Portuguese, `pt-BR.ts` carries every key (the team's 271 new strings were translated). The
  test that kept `pt-BR.ts` empty now checks that every numbers key is translated.
- Panel frames are named regions like the team's panel host; header buttons read `Collapse X` and
  `Expand X`; rail buttons carry `aria-expanded` and `aria-disabled`; closing a panel returns the focus to
  its rail button.
- Fixed while merging: the MapBiomas sidecar path printed with backslashes on Windows; closing `Field
  record` while drawing left the map adding hidden vertices; images stay under the lowest mounted polygon
  layer (the team's `imageryAnchor`, widened to the overview tier).
- `PanelHost`, `PanelToggle` and the four toggle components of the team are no longer mounted and can be
  removed in a later change.

## What this replaces

The position rules of blocks 2 to 5 (R-35, R-36, R-40, R-41, R-46, R-48, R-49 and the anchor tables) no longer
apply. Their tests were replaced by tests of the grid, the registry, the phone sheet and the error boundary in
`src/App.test.tsx`. Behaviour rules that do not depend on position (abstention, no season in the scenario
request, retry after an HTTP error, the timeline date rules, the catalog-only text rule) keep their tests.

## Not done

- The panel open state is not remembered across reloads.
- The removed per-width rules of the timeline toggle are still props of `TimelineDock`, unused by the app.
- SMAP stays a 9 km product; a field-scale moisture or vegetation layer is a separate piece of work.
