import { create } from 'zustand'

export type FieldSummary = {
  id: string
  name: string
  location: string
  coverage: number
  center: [number, number]
  boundary: { type: 'Polygon'; coordinates: number[][][] }
}

export type CompositionPreset = 'map' | 'satellite' | 'satellite-with-labels'

type MapState = {
  selectedFieldId: string | null
  composition: CompositionPreset
  openPanelName: 'scenarios' | 'evidence' | null
  activeFilter: 'all' | 'ranked' | 'abstained' | null
  selectField: (fieldId: string) => void
  setComposition: (composition: CompositionPreset) => void
  openPanel: (panel: 'scenarios' | 'evidence') => void
  applyFilter: (filter: 'all' | 'ranked' | 'abstained') => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedFieldId: null,
  composition: 'map',
  openPanelName: null,
  activeFilter: null,
  selectField: (fieldId) => set({ selectedFieldId: fieldId }),
  setComposition: (composition) => set({ composition }),
  openPanel: (openPanelName) => set({ openPanelName }),
  applyFilter: (activeFilter) => set({ activeFilter }),
}))
