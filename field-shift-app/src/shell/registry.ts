import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { AppData } from './app-data'

/**
 * Where a panel lives on a wide screen. The map always keeps the middle; panels never float
 * over it. On a phone every slot folds into one sheet under the map, one panel at a time.
 */
export type PanelSlot = 'left' | 'right' | 'bottom'

/** `open` shows the body, `collapsed` keeps only the header, `closed` removes the panel. */
export type PanelState = 'open' | 'collapsed' | 'closed'

export type PanelDefinition = {
  /** Stable id, also used in test ids and in the toolbar. */
  id: string
  /** Catalog key of the panel title. */
  titleKey: string
  icon: LucideIcon
  slot: PanelSlot
  /** Lower first inside its slot. */
  order: number
  defaultState: PanelState
  /**
   * Panels that share a group are exclusive: opening one closes the others (the team's block 5.5
   * rule for Rotation outlook, Field numbers, Planting calendar and Field record).
   */
  group?: string
  /** True for a panel that reads the selected field or polygon: its button is disabled, with the reason in its name, until there is one. */
  needsSelection?: boolean
  /** False when the body renders its own landmark of the same name (the timeline); the frame is then a group. */
  landmark?: boolean
  /** False hides the panel and its toolbar button, for features that do not apply to the current data. */
  available?: (data: AppData) => boolean
  /** The panel body. It reads what it needs from `useAppData()` or from the map store. */
  Component: ComponentType
}

/**
 * A panel is added by writing its component and listing it in `panels.tsx`. Nothing else in
 * the shell needs to change: the toolbar button, the slot, the header, the collapse and the
 * phone sheet all come from this definition.
 */
export function definePanel(definition: PanelDefinition): PanelDefinition {
  return definition
}
