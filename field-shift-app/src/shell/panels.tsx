import { CalendarDays, CloudRain, Database, Hexagon, Layers, Repeat, Sprout, Terminal } from 'lucide-react'
import { FieldListPanel } from '@/panels/FieldListPanel'
import { ClimatePanel } from '@/panels/ClimatePanel'
import { RotationPanel } from '@/panels/RotationPanel'
import { CommandPanel, EvidenceDataPanel, LayersPanel, PolygonInfoPanel, TimelinePanel } from '@/panels/simple-panels'
import { definePanel, type PanelDefinition } from './registry'

/**
 * Every panel of the field map. To add a feature, write its component in `src/panels/` and
 * add one entry here; the shell builds its toolbar button, its place on screen and its phone tab.
 */
export const PANELS: readonly PanelDefinition[] = [
  definePanel({
    id: 'fields',
    titleKey: 'fields.trigger',
    icon: Sprout,
    slot: 'left',
    order: 10,
    defaultState: 'open',
    Component: FieldListPanel,
  }),
  definePanel({
    id: 'climate',
    titleKey: 'panels.climate',
    icon: CloudRain,
    slot: 'left',
    order: 20,
    defaultState: 'open',
    Component: ClimatePanel,
  }),
  definePanel({
    id: 'polygon',
    titleKey: 'polygon.selected_polygon',
    icon: Hexagon,
    slot: 'left',
    order: 30,
    defaultState: 'collapsed',
    Component: PolygonInfoPanel,
  }),
  definePanel({
    id: 'layers',
    titleKey: 'layers.navigation',
    icon: Layers,
    slot: 'right',
    order: 10,
    defaultState: 'open',
    Component: LayersPanel,
  }),
  definePanel({
    id: 'evidence',
    titleKey: 'evidence.supporting_data',
    icon: Database,
    slot: 'right',
    order: 20,
    defaultState: 'closed',
    Component: EvidenceDataPanel,
  }),
  definePanel({
    id: 'command',
    titleKey: 'agent.command',
    icon: Terminal,
    slot: 'right',
    order: 30,
    defaultState: 'closed',
    Component: CommandPanel,
  }),
  definePanel({
    id: 'timeline',
    titleKey: 'timeline.region',
    icon: CalendarDays,
    slot: 'bottom',
    order: 10,
    defaultState: 'open',
    Component: TimelinePanel,
  }),
  definePanel({
    id: 'rotations',
    titleKey: 'scenarios.title',
    icon: Repeat,
    slot: 'bottom',
    order: 20,
    defaultState: 'open',
    Component: RotationPanel,
  }),
]
