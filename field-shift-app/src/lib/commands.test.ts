import { afterEach, describe, expect, it } from 'vitest'
import { commandInputSchema, listCommands, runCommand } from './commands'
import { useMapStore } from './map-store'

afterEach(() => {
  useMapStore.setState({
    selectedFieldId: null,
    composition: 'map',
    openPanelName: null,
    activeFilter: null,
  })
})

describe('command registry', () => {
  it('runs set_composition and changes the map store', () => {
    runCommand('set_composition', { preset: 'satellite' })

    expect(useMapStore.getState().composition).toBe('satellite')
  })

  it('rejects an unregistered name with status 422 and all valid names', () => {
    expect(() => runCommand('not_a_command', {})).toThrowError(
      expect.objectContaining({ status: 422, validNames: ['select_field', 'set_composition', 'open_panel', 'apply_filter'] }),
    )
  })

  it('lists exactly four fully described commands', () => {
    const commands = listCommands()

    expect(commands).toHaveLength(4)
    expect(commands.map(({ name }) => name)).toEqual([
      'select_field',
      'set_composition',
      'open_panel',
      'apply_filter',
    ])
    for (const command of commands) {
      expect(command.label).toEqual(expect.any(String))
      expect(command.schema).toBeDefined()
      expect(['select_field', 'set_composition', 'open_panel', 'apply_filter']).toContain(command.effect)
      expect(command.idempotent).toEqual(expect.any(Boolean))
      expect(command.guard).toEqual(expect.any(String))
    }
  })

  it('accepts only scenarios and evidence for open_panel', () => {
    runCommand('open_panel', { panel: 'evidence' })
    expect(useMapStore.getState().openPanelName).toBe('evidence')

    runCommand('open_panel', { panel: 'scenarios' })
    expect(useMapStore.getState().openPanelName).toBe('scenarios')
  })

  it('rejects the withdrawn constraints panel with a schema failure', () => {
    useMapStore.setState({ openPanelName: null })

    expect(() => runCommand('open_panel', { panel: 'constraints' })).toThrow()
    expect(useMapStore.getState().openPanelName).toBeNull()

    const openPanel = listCommands().find((command) => command.name === 'open_panel')
    expect(openPanel).toBeDefined()
    const panelSchema = JSON.stringify(commandInputSchema(openPanel!))
    expect(panelSchema).toContain('"scenarios"')
    expect(panelSchema).toContain('"evidence"')
    expect(panelSchema).not.toContain('constraints')
  })
})
