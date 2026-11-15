# Field Shift app

The React and MapLibre front end and the FastAPI backend of Field Shift. How to run it is in the repository
README; this file is about how the screen is built and how to add to it.

## The screen

The screen is a grid with five cells:

| Cell | What goes there |
|---|---|
| Top bar | Brand, ENSO state, the analysis button, the language switch |
| Rail | One button per panel, on the left edge |
| Left and right columns | Panels with `slot: 'left'` or `slot: 'right'` |
| Under the map | Panels with `slot: 'bottom'` |
| Map | The map only. No panel is drawn over it |

A column with no open panel takes no width, so the map grows. Below 760 px the rail and the columns go away: the
map takes the screen, a tab bar lists the panels, and one panel at a time opens in a sheet under the map.

Each panel has a header that collapses it and a button that closes it, and the rail reopens it. A panel that
throws an error shows its own message; the map and the other panels keep working.

## Adding a panel

1. Write the component in `src/panels/`. It reads shared data with `useAppData()` (fields, the selected field,
   scenarios, ENSO, climate) and map state with `useMapStore`.
2. Add one entry to `src/shell/panels.tsx`:

   ```tsx
   definePanel({
     id: 'soil',
     titleKey: 'panels.soil',      // add the text to src/strings/en.ts and pt-BR.ts
     icon: Shovel,                 // any lucide-react icon
     slot: 'right',
     order: 40,                    // position inside its slot and on the rail
     defaultState: 'collapsed',    // 'open', 'collapsed' or 'closed'
     Component: SoilPanel,
   })
   ```

3. Add the id to `src/shell/panel-ids.ts`, so the agent command `open_panel` can open it. A test fails if the
   two lists differ.

Nothing else changes: the rail button, the place on screen, the header, the phone tab and the error boundary come
from the entry. `available: (data) => boolean` hides a panel when it does not apply, for example a panel that
only makes sense for one region.

## Where things are

| Path | What it is |
|---|---|
| `src/shell/` | The grid (`Shell.tsx`), the panel list (`panels.tsx`), panel state (`shell-store.ts`), shared data (`app-data.tsx`) |
| `src/panels/` | Panel bodies that combine data and components |
| `src/components/` | Map, layer list, timeline, scenario cards, evidence table and the other building blocks |
| `src/lib/` | Map store, layer catalog, regions, polygons, agent commands |
| `src/fieldphase/`, `src/analysis/` | The full analysis sheet (`Análise`) |
| `src/strings/` | Every visible text, in English and Portuguese |
| `backend/` | FastAPI server and the dated fixtures it serves |

## Map layers

Layers come from `GET /layers` and are listed in the layer panel. A layer whose pixel is 1 km or larger (SMAP is
9 km) is drawn with hard pixel edges, and a note on the map says the pixel size and warns when one pixel is
larger than a field at the current zoom. SMAP cannot show detail inside a field; a field-scale layer needs a
finer product, such as HLS at 30 m.

## Tests

```sh
npx tsc -b --noEmit && npx vitest run && npm run build
```
