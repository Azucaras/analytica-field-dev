import { create } from 'zustand'
import type { PanelDefinition, PanelState } from './registry'

type ShellStore = {
  /** Only panels the user changed are stored; the rest follow their definition's default. */
  states: Record<string, PanelState>
  /** The panel shown in the phone sheet, or null when the sheet is folded away. */
  mobileActive: string | null
  setState: (id: string, state: PanelState) => void
  setMobileActive: (id: string | null) => void
  reset: () => void
}

// Panel id to its exclusive group, filled once by the panel list.
const groupOf = new Map<string, string>()

export function registerPanelGroups(panels: readonly PanelDefinition[]) {
  for (const panel of panels) if (panel.group) groupOf.set(panel.id, panel.group)
}

export const useShellStore = create<ShellStore>((set) => ({
  states: {},
  mobileActive: null,
  setState: (id, state) => set((current) => {
    const next = { ...current.states, [id]: state }
    // Opening a panel of a group closes the rest of its group, whatever opened it (rail, header, agent).
    const group = groupOf.get(id)
    if (state === 'open' && group) {
      for (const [other, otherGroup] of groupOf) if (other !== id && otherGroup === group) next[other] = 'closed'
    }
    return { states: next }
  }),
  setMobileActive: (id) => set({ mobileActive: id }),
  reset: () => set({ states: {}, mobileActive: null }),
}))

export function panelStateOf(states: Record<string, PanelState>, panel: PanelDefinition): PanelState {
  return states[panel.id] ?? panel.defaultState
}

/** Toolbar press: a closed panel opens, any other state closes it. */
export function togglePanel(panel: PanelDefinition) {
  const { states, setState } = useShellStore.getState()
  setState(panel.id, panelStateOf(states, panel) === 'closed' ? 'open' : 'closed')
}

/** Header press: open and collapsed swap; the panel stays in its slot. */
export function toggleCollapsed(panel: PanelDefinition) {
  const { states, setState } = useShellStore.getState()
  setState(panel.id, panelStateOf(states, panel) === 'open' ? 'collapsed' : 'open')
}

/** Opens a panel from code, for example the climate panel after a field is picked. */
export function openPanel(id: string) {
  useShellStore.getState().setState(id, 'open')
}
