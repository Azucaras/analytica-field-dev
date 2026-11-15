import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerRail } from './LayerRail'
import { buildLayerCatalog } from '@/lib/layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import { useMapStore } from '@/lib/map-store'

/**
 * AC-35, the control half: `Latest image` on the two optical rows, its name by character, its
 * pressed state while the scan runs, and the result text the row shows afterwards.
 *
 * The transport replays the recorded HLS L30 coverage of 2026-11-14 one date at a time, which
 * is the shape of the scan: one coverage call of `days=1` per date, newest first.
 */
type FixtureRow = { date: string; http_status: number; bytes: number }

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'artifacts/fixtures/hls-l30-coverage-zoom12-2026-11-14.json'), 'utf8'),
) as { threshold_bytes: number; dates: FixtureRow[] }

const recordedRow = (date: string): FixtureRow => {
  const row = fixture.dates.find((entry) => entry.date === date)
  if (!row) throw new Error(`The fixture holds no row for ${date}`)
  return row
}

type TransportOptions = { stopAt?: string; blank?: boolean; defer?: boolean }

function installTransport(options: TransportOptions = {}) {
  const requested: string[] = []
  let release: (() => void) | null = null
  const gate = options.defer ? new Promise<void>((resolveGate) => { release = resolveGate }) : null

  const fetchStub = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    const date = url.searchParams.get('date') ?? ''
    requested.push(date)
    if (gate) await gate
    if (options.stopAt === date) {
      return { ok: false, status: 503, json: async () => ({ status: 'unavailable', dates_scanned: [date] }) } as Response
    }
    const row = options.blank
      ? { date, http_status: 200, bytes: 400, coverage_ok: false }
      : recordedRow(date)
    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: 'ok',
        layer: 'hls-l30',
        start: date,
        end: date,
        days: 1,
        dates: [{
          date,
          http_status: row.http_status,
          bytes: row.bytes,
          coverage_ok: row.http_status === 200 && row.bytes > fixture.threshold_bytes,
        }],
      }),
    } as Response
  })

  vi.stubGlobal('fetch', fetchStub)
  return { requested, release: () => { release?.() } }
}

const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)
const rowOf = (layerId: string) => document.querySelector(`.layer-entry[data-layer-id="${layerId}"]`) as HTMLElement | null

/** Opens the row's `Layer options` panel, where R-44 puts the scan on an optical row. */
async function openOptions(layerId: string) {
  const row = rowOf(layerId) as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: /^Layer options,/ }))
  return row
}

beforeEach(() => {
  useMapStore.setState({
    catalog,
    on: { 'smap-l3': true },
    opacity: {},
    order: catalog.map((entry) => entry.id),
    pinnedDates: {},
    compare: {},
    tileDecisions: {},
    chosenDate: '2026-11-14',
    axis: RECORDED_LAYERS_RESPONSE.axis,
    composition: 'map',
    layerCatalogFailed: false,
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('R-44 the Latest image control (AC-35)', () => {
  it('is named Latest image, sits on the two optical rows and on no other row', async () => {
    installTransport()
    render(<LayerRail />)

    const l30 = await openOptions('hls-l30')
    const l30Control = within(l30).getByRole('button', { name: 'Latest image' })
    expect(l30Control.getAttribute('aria-label')).toBe('Latest image')
    expect(l30Control.textContent).toBe('Latest image')
    expect(l30Control.getAttribute('aria-pressed')).toBe('false')

    const s30 = await openOptions('hls-s30')
    expect(within(s30).getByRole('button', { name: 'Latest image' })).toBeTruthy()

    // No non-optical row carries the control: it measures tile bytes, and only optical layers
    // have a byte threshold (R-05, R-44).
    const smap = await openOptions('smap-l3')
    expect(within(smap).queryByRole('button', { name: 'Latest image' })).toBeNull()
  })

  it('moves the chosen date to 2026-11-01 and requests that date last', async () => {
    const { requested } = installTransport()
    render(<LayerRail />)
    const row = await openOptions('hls-l30')

    await userEvent.click(within(row).getByRole('button', { name: 'Latest image' }))

    await waitFor(() => expect(useMapStore.getState().chosenDate).toBe('2026-11-01'))
    expect(requested).toHaveLength(14)
    expect(requested[0]).toBe('2026-11-14')
    expect(requested.at(-1)).toBe('2026-11-01')
    expect(requested).not.toContain('2026-10-31')
    // The scan starts at the chosen date itself, after the layer's declared end 2026-11-06.
    expect(requested).toContain('2026-11-06')
  })

  it('keeps the date and shows none_in_lookback when the window holds no imagery', async () => {
    installTransport({ blank: true })
    render(<LayerRail />)
    const row = await openOptions('hls-l30')

    await userEvent.click(within(row).getByRole('button', { name: 'Latest image' }))

    await waitFor(() => expect(row.getAttribute('data-status')).toBe('none_in_lookback'))
    expect(row.textContent).toContain('no observation in lookback')
    expect(row.querySelector('time')).toBeNull()
    expect(useMapStore.getState().chosenDate).toBe('2026-11-14')
  })

  it('keeps the date and shows unavailable when a 503 stops the scan at 2026-11-10', async () => {
    const { requested } = installTransport({ stopAt: '2026-11-10' })
    render(<LayerRail />)
    const row = await openOptions('hls-l30')

    await userEvent.click(within(row).getByRole('button', { name: 'Latest image' }))

    await waitFor(() => expect(row.getAttribute('data-status')).toBe('unavailable'))
    expect(row.textContent).toContain('unavailable')
    expect(useMapStore.getState().chosenDate).toBe('2026-11-14')
    // The 500 is not skipped: the scan stops on it and asks for nothing older.
    expect(requested.at(-1)).toBe('2026-11-10')
    expect(requested).not.toContain('2026-11-09')
  })

  it('reports the scan in flight through aria-pressed and clears it afterwards', async () => {
    const transport = installTransport({ defer: true })
    render(<LayerRail />)
    const row = await openOptions('hls-l30')
    const control = within(row).getByRole('button', { name: 'Latest image' })

    await userEvent.click(control)
    await waitFor(() => expect(control.getAttribute('aria-pressed')).toBe('true'))

    transport.release()
    await waitFor(() => expect(control.getAttribute('aria-pressed')).toBe('false'))
    await waitFor(() => expect(useMapStore.getState().chosenDate).toBe('2026-11-01'))
  })

  it('does not run a second scan while the first is in flight', async () => {
    const transport = installTransport({ defer: true })
    render(<LayerRail />)
    const row = await openOptions('hls-l30')
    const control = within(row).getByRole('button', { name: 'Latest image' })

    await userEvent.click(control)
    await waitFor(() => expect(control.getAttribute('aria-pressed')).toBe('true'))
    await userEvent.click(control)
    transport.release()

    await waitFor(() => expect(useMapStore.getState().chosenDate).toBe('2026-11-01'))
    // One scan from 2026-11-14 back to 2026-11-01, not two overlapping scans.
    expect(vi.mocked(fetch).mock.calls).toHaveLength(14)
  })
})
