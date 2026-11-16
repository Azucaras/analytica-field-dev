import { CalendarCheck, CalendarDays, ChartColumn, CloudRain, Database, Hexagon, Layers, PencilLine, Repeat, Sprout, Terminal } from 'lucide-react'
import { FieldListPanel } from '@/panels/FieldListPanel'
import { ClimatePanel } from '@/panels/ClimatePanel'
import { RotationPanel } from '@/panels/RotationPanel'
import { CommandPanel, EvidenceDataPanel, LayersPanel, PolygonInfoPanel, TimelinePanel } from '@/panels/simple-panels'
import { CalendarPanel, FieldRecordPanel, NumbersPanel } from '@/panels/team-panels'
import { definePanel, type PanelDefinition } from './registry'
import { registerPanelGroups } from './shell-store'

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
    defaultState: 'open',
    // The team's B6: the readout exists only while a polygon is selected.
    available: (data) => data.selectedPolygonChip !== null,
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
    landmark: false,
    icon: CalendarDays,
    slot: 'bottom',
    order: 10,
    defaultState: 'open',
    Component: TimelinePanel,
  }),
  // The team's four analysis panels (block 5.5): one open at a time, under the map.
  definePanel({
    id: 'rotations',
    titleKey: 'map.rotation_outlook',
    icon: Repeat,
    slot: 'bottom',
    order: 20,
    // The team's B4 and D3: no analysis panel opens by itself; the group picker offers all four.
    defaultState: 'closed',
    group: 'analysis',
    needsSelection: true,
    Component: RotationPanel,
  }),
  definePanel({
    id: 'numbers',
    titleKey: 'numbers.open',
    icon: ChartColumn,
    slot: 'bottom',
    order: 30,
    defaultState: 'closed',
    group: 'analysis',
    needsSelection: true,
    Component: NumbersPanel,
  }),
  definePanel({
    id: 'decision',
    titleKey: 'calendar.open',
    icon: CalendarCheck,
    slot: 'bottom',
    order: 40,
    defaultState: 'closed',
    group: 'analysis',
    Component: CalendarPanel,
  }),
  definePanel({
    id: 'record',
    titleKey: 'record.open',
    icon: PencilLine,
    slot: 'bottom',
    order: 50,
    defaultState: 'closed',
    group: 'analysis',
    Component: FieldRecordPanel,
  }),
]

registerPanelGroups(PANELS)
