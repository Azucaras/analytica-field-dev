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

## What this replaces

The position rules of blocks 2 to 5 (R-35, R-36, R-40, R-41, R-46, R-48, R-49 and the anchor tables) no longer
apply. Their tests were replaced by tests of the grid, the registry, the phone sheet and the error boundary in
`src/App.test.tsx`. Behaviour rules that do not depend on position (abstention, no season in the scenario
request, retry after an HTTP error, the timeline date rules, the catalog-only text rule) keep their tests.

## Not done

- The panel open state is not remembered across reloads.
- The removed per-width rules of the timeline toggle are still props of `TimelineDock`, unused by the app.
- SMAP stays a 9 km product; a field-scale moisture or vegetation layer is a separate piece of work.
