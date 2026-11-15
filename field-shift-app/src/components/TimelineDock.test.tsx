import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import recordedSnapshotJson from '../../artifacts/zarc-mt-snapshot.json'
import { TimelineDock } from './TimelineDock'
import { buildLayerCatalog } from '@/lib/layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import { useMapStore } from '@/lib/map-store'
import type { ZarcSnapshot } from '@/lib/season-band'

const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)
const AXIS = RECORDED_LAYERS_RESPONSE.axis
const FIELD = { location: 'Santa Carmem, Mato Grosso', crops: ['Soybean', 'Corn', 'Cotton'] }

const windowOf = (start: string, end: string) => ({ start_date: start, end_date: end })

function snapshot(rows: ZarcSnapshot['rows']): ZarcSnapshot {
  return { rows }
}

const windowsOf = () => [...document.querySelectorAll('[data-season-window]')].map((node) => ({
  crop: node.getAttribute('data-snapshot-crop'),
  fieldCrop: node.getAttribute('data-field-crop'),
  start: node.getAttribute('data-start'),
  end: node.getAttribute('data-end'),
}))

beforeEach(() => {
  useMapStore.setState({
    catalog,
    on: { 'smap-l3': true },
    opacity: {},
    order: catalog.map((entry) => entry.id),
    pinnedDates: {},
    compare: {},
    tileDecisions: {},
    chosenDate: AXIS.default,
    axis: AXIS,
    composition: 'map',
    layerCatalogFailed: false,
  })
})

afterEach(() => {
  cleanup()
  useMapStore.setState({ chosenDate: null })
})

// The dock loads the recorded snapshot on demand; the tests hand it over directly so they stay synchronous.
const RECORDED_SNAPSHOT = recordedSnapshotJson as unknown as ZarcSnapshot

function renderDock(props: Partial<Parameters<typeof TimelineDock>[0]> = {}) {
  return render(<TimelineDock {...FIELD} snapshot={RECORDED_SNAPSHOT} {...props} />)
}

function setDate(date: string) {
  act(() => useMapStore.setState({ chosenDate: date }))
}

describe('R-37 and R-33: the dock controls', () => {
  it('is a region named Timeline with the four R-37 controls', () => {
    renderDock()
    const region = screen.getByRole('region', { name: 'Timeline' })
    expect(within(region).getByLabelText('Go to date')).toBeTruthy()
    expect(within(region).getByRole('button', { name: 'Previous day' })).toBeTruthy()
    expect(within(region).getByRole('slider', { name: 'Timeline date' })).toBeTruthy()
    expect(within(region).getByRole('button', { name: 'Next day' })).toBeTruthy()
  })

  it('shows the chosen date and the primary layer age in the range value text', () => {
    setDate('2026-11-12')
    renderDock()
    const range = screen.getByRole('slider', { name: 'Timeline date' })
    // smap-l3 resolves to 2026-11-11 at chosen 2026-11-12, one day old.
    expect(range.getAttribute('aria-valuetext')).toBe('2026-11-12, 1 day old')
    expect(range.getAttribute('aria-valuemin')).toBe('0')
  })

  it('steps one day with Previous day and Next day', async () => {
    const user = userEvent.setup()
    setDate('2026-11-12')
    renderDock()
    await user.click(screen.getByRole('button', { name: 'Next day' }))
    expect(useMapStore.getState().chosenDate).toBe('2026-11-13')
    await user.click(screen.getByRole('button', { name: 'Previous day' }))
    await user.click(screen.getByRole('button', { name: 'Previous day' }))
    expect(useMapStore.getState().chosenDate).toBe('2026-11-11')
  })

  it('sets the chosen date from the Go to date input', () => {
    renderDock()
    const input = screen.getByLabelText('Go to date') as HTMLInputElement
    expect(input.value).toBe('2026-11-14')
    expect(input.min).toBe('2015-04-01')
    expect(input.max).toBe('2026-11-14')
    fireEvent.change(input, { target: { value: '2026-11-12' } })
    expect(useMapStore.getState().chosenDate).toBe('2026-11-12')
  })

  it('clamps a typed date outside the axis and says which bound it used (AC-23)', () => {
    renderDock()
    const input = screen.getByLabelText('Go to date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2015-03-01' } })
    expect(useMapStore.getState().chosenDate).toBe('2015-04-01')
    expect(screen.getByRole('status').textContent).toBe('Date limited to 2015-04-01')
  })
})

describe('R-38 / AC-31: the range keys move the date and no other key does', () => {
  it('steps one day, thirty days and the bounds', () => {
    setDate('2026-10-01')
    renderDock()
    const range = screen.getByRole('slider', { name: 'Timeline date' })

    fireEvent.keyDown(range, { key: 'ArrowRight' })
    expect(useMapStore.getState().chosenDate).toBe('2026-10-02')
    fireEvent.keyDown(range, { key: 'ArrowLeft' })
    expect(useMapStore.getState().chosenDate).toBe('2026-10-01')
    fireEvent.keyDown(range, { key: 'PageUp' })
    expect(useMapStore.getState().chosenDate).toBe('2026-10-31')
    fireEvent.keyDown(range, { key: 'PageDown' })
    expect(useMapStore.getState().chosenDate).toBe('2026-10-01')
    fireEvent.keyDown(range, { key: 'Home' })
    expect(useMapStore.getState().chosenDate).toBe('2015-04-01')
    fireEvent.keyDown(range, { key: 'End' })
    expect(useMapStore.getState().chosenDate).toBe('2026-11-14')
    fireEvent.keyDown(range, { key: 'a' })
    expect(useMapStore.getState().chosenDate).toBe('2026-11-14')
  })
})

describe('R-32 / AC-26: the season record and its crop class slot', () => {
  it('shows the derived season label and the empty crop class at every date', () => {
    setDate('2026-11-12')
    const { rerender } = renderDock()
    expect(document.querySelector('[data-season-label]')?.textContent).toBe('2026/27')
    expect(screen.getByText('No crop class source')).toBeTruthy()

    act(() => useMapStore.setState({ chosenDate: '2025-06-30' }))
    rerender(<TimelineDock {...FIELD} />)
    expect(document.querySelector('[data-season-label]')?.textContent).toBe('2024/25')
    expect(screen.getByText('No crop class source')).toBeTruthy()

    act(() => useMapStore.setState({ chosenDate: '2025-07-01' }))
    rerender(<TimelineDock {...FIELD} />)
    expect(document.querySelector('[data-season-label]')?.textContent).toBe('2025/26')
  })
})

describe('R-31 / AC-25: the season band of the dock', () => {
  it('draws the four windows of 2026/27 with the snapshot envelope dates', () => {
    setDate('2026-11-12')
    renderDock()
    expect(windowsOf()).toEqual([
      { crop: 'Soja', fieldCrop: 'Soybean', start: '2026-10-01', end: '2027-01-10' },
      { crop: 'Milho 1ª Safra', fieldCrop: 'Corn', start: '2026-10-01', end: '2026-12-31' },
      { crop: 'Milho 2ª Safra', fieldCrop: 'Corn', start: '2027-01-01', end: '2027-03-10' },
      { crop: 'Algodão Herbáceo', fieldCrop: 'Cotton', start: '2026-12-21', end: '2027-02-20' },
    ])
    expect(screen.queryByText(/No planting window data/)).toBeNull()
  })

  it('labels each maize window with its own snapshot crop name', () => {
    setDate('2026-11-12')
    renderDock()
    const labels = [...document.querySelectorAll('[data-season-window]')].map((node) => node.textContent ?? '')
    expect(labels.some((label) => label.includes('Milho 1ª Safra'))).toBe(true)
    expect(labels.some((label) => label.includes('Milho 2ª Safra'))).toBe(true)
  })

  it('draws the 2025/26 windows at 2025-11-10', () => {
    setDate('2025-11-10')
    renderDock()
    expect(windowsOf()).toEqual([
      { crop: 'Soja', fieldCrop: 'Soybean', start: '2025-10-01', end: '2026-01-10' },
      { crop: 'Milho 1ª Safra', fieldCrop: 'Corn', start: '2025-10-11', end: '2025-12-31' },
      { crop: 'Milho 2ª Safra', fieldCrop: 'Corn', start: '2026-01-01', end: '2026-02-28' },
      { crop: 'Algodão Herbáceo', fieldCrop: 'Cotton', start: '2025-12-21', end: '2026-02-20' },
    ])
  })

  it('names the derived season when the snapshot does not hold it', () => {
    setDate('2024-11-01')
    renderDock()
    expect(windowsOf()).toEqual([])
    expect(screen.getByText('No planting window data for 2024/25')).toBeTruthy()
  })

  it('names the municipality when the snapshot file is absent', () => {
    setDate('2026-11-12')
    renderDock({ snapshot: null })
    expect(windowsOf()).toEqual([])
    expect(screen.getByText('No planting window data for this municipality')).toBeTruthy()
  })

  it('names the municipality when the snapshot does not list Santa Carmem', () => {
    setDate('2026-11-12')
    renderDock({
      snapshot: snapshot([{
        crop: 'Soja',
        season: '2026/2027',
        uf: 'MT',
        municipality: 'Sinop',
        management: 'Sequeiro',
        window_risk_20: windowOf('2026-10-01', '2027-01-10'),
      }]),
    })
    expect(windowsOf()).toEqual([])
    expect(screen.getByText('No planting window data for this municipality')).toBeTruthy()
  })

  it('names a crop the snapshot does not hold for the municipality', () => {
    setDate('2026-11-12')
    renderDock({
      snapshot: snapshot([
        { crop: 'Soja', season: '2026/2027', uf: 'MT', municipality: 'Santa Carmem', management: 'Sequeiro', window_risk_20: windowOf('2026-10-01', '2027-01-10') },
        { crop: 'Milho 1ª Safra', season: '2026/2027', uf: 'MT', municipality: 'Santa Carmem', management: 'Sequeiro', window_risk_20: windowOf('2026-10-01', '2026-12-31') },
        { crop: 'Milho 2ª Safra', season: '2026/2027', uf: 'MT', municipality: 'Santa Carmem', management: 'Sequeiro', window_risk_20: windowOf('2027-01-01', '2027-03-10') },
      ]),
    })
    expect(windowsOf().map((window) => window.fieldCrop)).toEqual(['Soybean', 'Corn', 'Corn'])
    expect(screen.getByText('No planting window data for Cotton')).toBeTruthy()
  })
})

describe('R-33 / AC-27: the primary track sits in the dock', () => {
  it('draws the primary layer track over the axis and leaves the 2026-11-02 gap unmarked', () => {
    setDate('2026-11-14')
    renderDock()
    const track = screen.getByRole('img', { name: 'SMAP soil moisture availability' })
    const spans = [...track.querySelectorAll('[data-track-span]')].map((node) => ({
      start: node.getAttribute('data-start'),
      end: node.getAttribute('data-end'),
    }))
    expect(spans.length).toBeGreaterThan(0)
    expect(spans.some((span) => span.start! <= '2026-11-02' && '2026-11-02' <= span.end!)).toBe(false)
    expect(spans.some((span) => span.start! <= '2026-11-01' && '2026-11-01' <= span.end!)).toBe(true)
  })
})
