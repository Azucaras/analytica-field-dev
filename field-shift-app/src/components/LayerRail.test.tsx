import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerRail } from './LayerRail'
import { buildLayerCatalog, markCatalogUnavailable } from '@/lib/layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import { useMapStore } from '@/lib/map-store'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)

beforeEach(() => {
  useMapStore.setState({
    catalog,
    on: { 'smap-l3': true },
    opacity: {},
    order: catalog.map((entry) => entry.id),
    pinnedDates: {},
    compare: {},
    tileDecisions: {},
    chosenDate: '2026-11-12',
    axis: RECORDED_LAYERS_RESPONSE.axis,
    composition: 'map',
    layerCatalogFailed: false,
  })
})

afterEach(() => cleanup())

const rowOf = (layerId: string) => document.querySelector(`.layer-entry[data-layer-id="${layerId}"]`) as HTMLElement | null

describe('block 1 presets and the block 3 Layers pair', () => {
  it('offers exactly the three named presets inside the navigation landmark named Layers', async () => {
    render(<LayerRail />)

    const rail = screen.getByRole('navigation', { name: 'Layers' })
    const presets = within(rail.querySelector('.layer-presets') as HTMLElement).getAllByRole('button')
    expect(presets.map((button) => button.textContent)).toEqual(['Map', 'Satellite', 'Satellite with labels'])
    expect(within(rail).getAllByRole('listitem')).toHaveLength(13)
  })
})

describe('R-26 the collapsed row (AC-21, front half)', () => {
  it('shows the name, the basis, the resolution, the effective date, the age and the status', () => {
    render(<LayerRail />)
    const row = rowOf('smap-l3') as HTMLElement
    expect(row).toBeTruthy()

    const text = row.textContent ?? ''
    expect(text).toContain('SMAP soil moisture')
    expect(text).toContain('retrieved')
    expect(text).toContain('9 km')
    expect(text).toContain('2026-11-11')
    expect(text).toContain('1 day old')
    expect(text).toContain('earlier observation')
  })

  it('shows the stale layer with its last observation and no current date', () => {
    render(<LayerRail />)
    const row = rowOf('grace-mascon') as HTMLElement
    const text = row.textContent ?? ''
    expect(text).toContain('GRACE water storage, stale')
    expect(text).toContain('Last observation 2022-07-01')
    expect(text).toContain('stale')
    expect(text).not.toContain('on date')
  })

  it('shows the no-observation marker only when the effective date differs from the chosen date', () => {
    render(<LayerRail />)
    // smap-l3 resolves to 2026-11-11 at chosen 2026-11-12, so the marker shows.
    expect(within(rowOf('smap-l3') as HTMLElement).getByText('No observation')).toBeTruthy()
    // imerg-daily resolves to the chosen date itself, so it does not.
    expect(within(rowOf('imerg-daily') as HTMLElement).queryByText('No observation')).toBeNull()
  })

  it('keeps every row with its status text and no date while /layers has not answered (R-24, AC-20)', () => {
    useMapStore.setState({ catalog: markCatalogUnavailable(catalog), layerCatalogFailed: true })
    render(<LayerRail />)

    expect(document.querySelectorAll('.layer-entry')).toHaveLength(13)
    expect(screen.getByText('Layer catalog unavailable')).toBeTruthy()
    for (const row of document.querySelectorAll('.layer-entry')) {
      expect(row.getAttribute('data-status')).toBe('unavailable')
      expect(row.textContent).toContain('unavailable')
      expect(row.querySelector('time')).toBeNull()
      expect(row.textContent).not.toMatch(/\d+ days? old/)
    }
    expect(screen.getByRole('navigation', { name: 'Layers' })).toBeTruthy()
  })
})

describe('R-26 the expanded row (AC-21, front half)', () => {
  it('carries the opacity, move, pin, track and compare controls with the R-26 names, in that order', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)

    const trigger = within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Layer options, SMAP soil moisture' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    const row = rowOf('smap-l3') as HTMLElement
    const options = row.querySelector('.layer-options') as HTMLElement
    const controls = [...options.querySelectorAll('input, button')]
      .map((control) => control.getAttribute('aria-label'))
    expect(controls).toEqual([
      'Opacity, SMAP soil moisture',
      'Move SMAP soil moisture up',
      'Move SMAP soil moisture down',
      'Pin date, SMAP soil moisture',
      'Compare, SMAP soil moisture',
    ])
    expect(within(options).getByRole('img', { name: 'SMAP soil moisture availability' })).toBeTruthy()
    expect(within(row).getByRole('button', { name: 'Show SMAP soil moisture' })).toBeTruthy()
  })

  it('offers no compare control on a layer that is not a tile layer', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    await user.click(within(rowOf('grace-mascon') as HTMLElement).getByRole('button', { name: 'Layer options, GRACE water storage, stale' }))
    expect(within(rowOf('grace-mascon') as HTMLElement).queryByRole('button', { name: /^Compare,/ })).toBeNull()
  })

  it('declares at least 44 by 44 px on the row trigger and on every expanded control', () => {
    // jsdom computes no layout, so the declared box is asserted from the stylesheet that
    // the browser measurement of AC-21 reads. The browser measurement itself is the gate's.
    const declared = (selector: string) => {
      const rule = stylesheet.split('\n').find((line) => line.trim().startsWith(selector))
      expect(rule, `no rule for ${selector}`).toBeTruthy()
      expect(rule).toContain('min-width: 44px')
      expect(rule).toContain('min-height: 44px')
    }
    declared('.layer-entry-trigger')
    declared('.layer-move button, .layer-pin, .layer-compare')
    expect(stylesheet).toContain('.layer-control input[type="range"] { min-width: 44px; min-height: 44px; }')
    expect(stylesheet).toContain('.layer-control input[type="date"] { min-height: 44px; }')
    expect(stylesheet).toContain('.layer-entry-switch { margin-left: auto; min-width: 44px; min-height: 44px;')
  })
})

describe('R-26 keyboard and state (AC-37)', () => {
  it('toggles the row with Enter and with Space, keeps focus and reaches every control by Tab', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    const trigger = within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Layer options, SMAP soil moisture' })

    trigger.focus()
    await user.keyboard('{Enter}')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(trigger)

    // Tab order inside the expanded row, from the trigger onwards.
    const reached: string[] = []
    for (let step = 0; step < 6; step += 1) {
      await user.tab()
      const active = document.activeElement as HTMLElement
      reached.push(active.getAttribute('aria-label') ?? active.tagName.toLowerCase())
    }
    expect(reached).toContain('Opacity, SMAP soil moisture')
    expect(reached).toContain('Move SMAP soil moisture up')
    expect(reached).toContain('Move SMAP soil moisture down')
    expect(reached).toContain('Pin date, SMAP soil moisture')
    expect(reached).toContain('Compare, SMAP soil moisture')

    trigger.focus()
    await user.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('steps the opacity by 0.05 per arrow key', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    await user.click(within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Layer options, SMAP soil moisture' }))
    const opacity = within(rowOf('smap-l3') as HTMLElement).getByLabelText('Opacity, SMAP soil moisture') as HTMLInputElement

    opacity.focus()
    await user.keyboard('{ArrowRight}')
    expect(useMapStore.getState().opacity['smap-l3']).toBeCloseTo(0.6, 5)
    await user.keyboard('{ArrowLeft}')
    expect(useMapStore.getState().opacity['smap-l3']).toBeCloseTo(0.55, 5)
    await user.keyboard('{End}')
    expect(useMapStore.getState().opacity['smap-l3']).toBe(1)
    await user.keyboard('{Home}')
    expect(useMapStore.getState().opacity['smap-l3']).toBe(0)
    expect(document.activeElement).toBe(opacity)
  })

  it('moves the row with Enter on Move up and keeps focus on that button', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    const before = [...useMapStore.getState().order]
    await user.click(within(rowOf('smap-l4-surface') as HTMLElement).getByRole('button', { name: 'Layer options, SMAP L4 surface soil moisture' }))
    const moveUp = within(rowOf('smap-l4-surface') as HTMLElement).getByRole('button', { name: 'Move SMAP L4 surface soil moisture up' })

    moveUp.focus()
    await user.keyboard('{Enter}')

    expect(useMapStore.getState().order.slice(0, 2)).toEqual(['smap-l4-surface', 'smap-l3'])
    expect(useMapStore.getState().order).toHaveLength(before.length)
    expect(document.activeElement).toBe(moveUp)
    // R-18: the rows on screen follow the stack list, so the moved row is the first one.
    expect([...document.querySelectorAll('.layer-entry')].slice(0, 2).map((row) => row.getAttribute('data-layer-id')))
      .toEqual(['smap-l4-surface', 'smap-l3'])
  })

  it('toggles the pin with Enter and Space and shows the word pinned only while pressed', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    await user.click(within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Layer options, SMAP soil moisture' }))
    const pin = within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Pin date, SMAP soil moisture' })

    expect(pin.getAttribute('aria-pressed')).toBe('false')
    expect(rowOf('smap-l3')?.textContent).not.toContain('pinned')

    pin.focus()
    await user.keyboard('{Enter}')
    expect(pin.getAttribute('aria-pressed')).toBe('true')
    expect(useMapStore.getState().pinnedDates['smap-l3']).toBe('2026-11-11')
    expect(rowOf('smap-l3')?.textContent).toContain('pinned')

    await user.keyboard(' ')
    expect(pin.getAttribute('aria-pressed')).toBe('false')
    expect(rowOf('smap-l3')?.textContent).not.toContain('pinned')
    expect(document.activeElement).toBe(pin)
  })

  it('turns compare on and off from the row with the state on the toggle (R-22)', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    await user.click(within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Layer options, SMAP soil moisture' }))
    const compare = within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Compare, SMAP soil moisture' })

    await user.click(compare)
    expect(compare.getAttribute('aria-pressed')).toBe('true')
    expect(useMapStore.getState().compare['smap-l3']).toEqual({ date: '2026-11-05', divider: 0.5 })
    expect(within(rowOf('smap-l3') as HTMLElement).getByLabelText('Compare date, SMAP soil moisture')).toBeTruthy()

    await user.click(compare)
    expect(compare.getAttribute('aria-pressed')).toBe('false')
    expect(useMapStore.getState().compare['smap-l3']).toBeNull()
  })

  it('turns a layer off and on from the row switch (R-19)', async () => {
    const user = userEvent.setup()
    render(<LayerRail />)
    const toggle = within(rowOf('smap-l3') as HTMLElement).getByRole('button', { name: 'Show SMAP soil moisture' })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')

    await user.click(toggle)
    expect(useMapStore.getState().on['smap-l3']).toBe(false)
    await user.click(toggle)
    expect(useMapStore.getState().on['smap-l3']).toBe(true)
  })
})
