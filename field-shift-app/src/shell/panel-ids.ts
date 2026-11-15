/**
 * The ids of the registered panels. The agent command `open_panel` lists them in its schema,
 * and a test checks that `panels.tsx` registers exactly these. A new panel adds its id here too.
 */
export const PANEL_IDS = ['fields', 'climate', 'polygon', 'layers', 'evidence', 'command', 'timeline', 'rotations'] as const

export type PanelId = (typeof PANEL_IDS)[number]
