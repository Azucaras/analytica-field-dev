import { create } from 'zustand'
import { LAYER_AXIS, LAYER_CATALOG, type LayerCatalog, type LayersAxis } from './layer-catalog'
import type { TileDecision } from './tile-guard'

export type FieldSummary = {
  id: string
  name: string
  location: string
  coverage: number
  center: [number, number]
  boundary: { type: 'Polygon'; coordinates: number[][][] }
}

export type CompositionPreset = 'map' | 'satellite' | 'satellite-with-labels'

/** One compare pair: side B's date and the divider position as a fraction of the map width. */
export type CompareState = { date: string | null; divider: number }

/** The drag handle starts in the middle of the map; it is a design target, not a measure. */
export const COMPARE_DEFAULT_DIVIDER = 0.5

/** R-17: the value `MapCanvas.tsx` line 79 applies today is the start value of a layer turned on. */
export const LAYER_DEFAULT_OPACITY = 0.55

type MapState = {
  selectedFieldId: string | null
  composition: CompositionPreset
  openPanelName: 'scenarios' | 'evidence' | null
  activeFilter: 'all' | 'ranked' | 'abstained' | null
  selectField: (fieldId: string) => void
  setComposition: (composition: CompositionPreset) => void
  openPanel: (panel: 'scenarios' | 'evidence') => void
  applyFilter: (filter: 'all' | 'ranked' | 'abstained') => void

  // Block 4, wave 2. `chosenDate` is null until a date control sets it, and the axis
  // default stands in for it, so this wave never invents a date of its own.
  chosenDate: string | null
  axis: LayersAxis
  catalog: LayerCatalog
  layerCatalogFailed: boolean
  on: Record<string, boolean>
  opacity: Record<string, number>
  order: string[]
  pinnedDates: Record<string, string | null>
  compare: Record<string, CompareState | null>
  tileDecisions: Record<string, TileDecision>
  setChosenDate: (date: string) => void
  setLayersResponse: (payload: { chosen_date: string; axis: LayersAxis; catalog: LayerCatalog }) => void
  setLayerCatalogFailed: (failed: boolean) => void
  setLayerOn: (layerId: string, on: boolean) => void
  setOpacity: (layerId: string, opacity: number) => void
  moveLayer: (layerId: string, direction: 'up' | 'down') => void
  setPinnedDate: (layerId: string, date: string | null) => void
  setCompare: (layerId: string, compare: CompareState | null) => void
  setCompareDate: (layerId: string, date: string | null) => void
  setCompareDivider: (layerId: string, divider: number) => void
  setTileDecision: (layerId: string, decision: TileDecision) => void
}

const DEFAULT_ORDER = LAYER_CATALOG.map((entry) => entry.id)
// Only the block 1 layer starts visible, so R-19 holds at first paint: a layer that is
// off issues no tile request, and the transport sees `smap-l3` alone (AC-15).
const DEFAULT_ON = { 'smap-l3': true }

export const useMapStore = create<MapState>((set) => ({
  selectedFieldId: null,
  composition: 'map',
  openPanelName: null,
  activeFilter: null,
  selectField: (fieldId) => set({ selectedFieldId: fieldId }),
  setComposition: (composition) => set({ composition }),
  openPanel: (openPanelName) => set({ openPanelName }),
  applyFilter: (activeFilter) => set({ activeFilter }),

  chosenDate: null,
  axis: LAYER_AXIS,
  catalog: LAYER_CATALOG,
  layerCatalogFailed: false,
  on: { ...DEFAULT_ON },
  opacity: {},
  order: [...DEFAULT_ORDER],
  pinnedDates: {},
  compare: {},
  tileDecisions: {},

  setChosenDate: (chosenDate) => set({ chosenDate }),

  // A new response replaces the rows but not the user's own state: order, opacity, pins and
  // compare survive it (R-40 keeps them across a resize, and a date change is the same
  // kind of change). A layer the catalog no longer holds is dropped from the order, and a
  // new layer is appended, so the stack list always covers the catalog.
  // `chosenDate` is left alone on purpose: null means "the axis default" (R-28), and
  // writing the response's own date back into the store would refetch the same date.
  setLayersResponse: ({ axis, catalog }) => set((state) => {
    const ids = catalog.map((entry) => entry.id)
    const kept = state.order.filter((id) => ids.includes(id))
    const added = ids.filter((id) => !kept.includes(id))
    return {
      catalog,
      axis,
      layerCatalogFailed: false,
      order: [...kept, ...added],
    }
  }),

  setLayerCatalogFailed: (layerCatalogFailed) => set({ layerCatalogFailed }),

  setLayerOn: (layerId, on) => set((state) => ({
    on: { ...state.on, [layerId]: on },
    // A layer turned on starts at 0.55 unless the user already moved its opacity (R-17).
    opacity: on && !Object.hasOwn(state.opacity, layerId)
      ? { ...state.opacity, [layerId]: LAYER_DEFAULT_OPACITY }
      : state.opacity,
  })),

  setOpacity: (layerId, opacity) => set((state) => ({
    opacity: { ...state.opacity, [layerId]: Math.min(1, Math.max(0, opacity)) },
  })),

  // R-18: the first item is drawn on top. A move swaps the row with its neighbour and
  // nothing else, so the stack keeps every other relative position.
  moveLayer: (layerId, direction) => set((state) => {
    const index = state.order.indexOf(layerId)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= state.order.length) return state
    const order = [...state.order]
    ;[order[index], order[target]] = [order[target], order[index]]
    return { order }
  }),

  setPinnedDate: (layerId, date) => set((state) => ({
    pinnedDates: { ...state.pinnedDates, [layerId]: date },
  })),

  setCompare: (layerId, compare) => set((state) => ({
    compare: { ...state.compare, [layerId]: compare },
  })),

  setCompareDate: (layerId, date) => set((state) => {
    const current = state.compare[layerId] ?? { date: null, divider: COMPARE_DEFAULT_DIVIDER }
    return { compare: { ...state.compare, [layerId]: { ...current, date } } }
  }),

  setCompareDivider: (layerId, divider) => set((state) => {
    const current = state.compare[layerId] ?? { date: null, divider: COMPARE_DEFAULT_DIVIDER }
    const clamped = Math.min(1, Math.max(0, divider))
    return { compare: { ...state.compare, [layerId]: { ...current, divider: clamped } } }
  }),

  setTileDecision: (layerId, decision) => set((state) => ({
    tileDecisions: { ...state.tileDecisions, [layerId]: decision },
  })),
}))

/** The chosen date, or the axis default while no control has set one. */
export function chosenDateOf(state: Pick<MapState, 'chosenDate'>): string {
  return state.chosenDate ?? LAYER_AXIS.default
}

export function opacityOf(state: Pick<MapState, 'opacity'>, layerId: string): number {
  return state.opacity[layerId] ?? LAYER_DEFAULT_OPACITY
}
