import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapCanvas } from './MapCanvas'
import { LayerRail } from './LayerRail'
import { buildLayerCatalog } from '@/lib/layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import { useMapStore } from '@/lib/map-store'
import { MapStub } from '@/test/maplibre-stub'

vi.mock('maplibre-gl', async () => {
  const { MapStub } = await import('@/test/maplibre-stub')
  return { Map: MapStub, NavigationControl: class {}, setWorkerUrl: vi.fn() }
})

const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)

beforeEach(() => {
  MapStub.reset()
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    const layerId = decodeURIComponent(url.pathname.split('/')[2] ?? '')
    const entry = catalog.find((candidate) => candidate.id === layerId)
    // The proxy answers with the effective date of the requested date, so the stub echoes
    // the query the way the recorded transport does.
    const requested = url.searchParams.get('date')
    const effective = requested ?? entry?.effective_date ?? null
    const headers = new Headers()
    if (effective) headers.set('X-Tile-Date', effective)
    return { status: 200, headers, arrayBuffer: async () => new ArrayBuffer(6400) } as unknown as Response
  }))
  useMapStore.setState({
    catalog,
    on: { 'ndvi-8day': true },
    opacity: {},
    order: catalog.map((entry) => entry.id),
    pinnedDates: {},
    compare: {},
    tileDecisions: {},
    chosenDate: '2026-11-12',
    axis: RECORDED_LAYERS_RESPONSE.axis,
    composition: 'satellite',
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderMapAndRail() {
  return render(
    <MapCanvas fields={[]} selectedField={null}>
      <LayerRail />
    </MapCanvas>,
  )
}

async function openCompare(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Layer options, MODIS NDVI, 8 day' }))
  const compare = await screen.findByRole('button', { name: 'Compare, MODIS NDVI, 8 day' })
  await user.click(compare)
  return compare
}

describe('R-22 compare mode (AC-18)', () => {
  it('turns compare on for one tile layer and gives each side its own date label', async () => {
    const user = userEvent.setup()
    renderMapAndRail()
    const compare = await openCompare(user)

    expect(compare.getAttribute('aria-pressed')).toBe('true')
    // Side A is the chosen date, side B defaults to seven days before it.
    await waitFor(() => expect(screen.getByText('2026-11-12, today')).toBeTruthy())
    expect(screen.getByText('2026-11-05, 7 days old')).toBeTruthy()
    expect(useMapStore.getState().compare['ndvi-8day']).toEqual({ date: '2026-11-05', divider: 0.5 })
  })

  it('follows the Compare date input on side B', async () => {
    const user = userEvent.setup()
    renderMapAndRail()
    await openCompare(user)

    const sideB = await screen.findByLabelText('Compare date, MODIS NDVI, 8 day')
    await act(async () => {
      fireEvent.change(sideB, { target: { value: '2026-10-01' } })
    })

    await waitFor(() => expect(useMapStore.getState().compare['ndvi-8day']?.date).toBe('2026-10-01'))
    expect(screen.getByText('2026-10-01, 42 days old')).toBeTruthy()
    // Side B's source follows its own date, not the one it was created with.
    await waitFor(() => expect(MapStub.last().getSource('ndvi-8day~compare-b')?.tiles[0]).toContain('date=2026-10-01'))
    expect(MapStub.last().getSource('ndvi-8day~compare-a')?.tiles[0]).toContain('date=2026-11-12')
  })

  it('moves the divider with the pointer without moving the camera and with no numeric delta', async () => {
    const user = userEvent.setup()
    renderMapAndRail()
    await openCompare(user)

    const map = MapStub.last()
    const centerBefore = map.getCenter()
    const zoomBefore = map.getZoom()
    const divider = await screen.findByLabelText('Compare divider')

    await act(async () => {
      fireEvent.change(divider, { target: { value: '70' } })
    })

    expect(useMapStore.getState().compare['ndvi-8day']?.divider).toBe(0.7)
    expect(map.getCenter()).toEqual(centerBefore)
    expect(map.getZoom()).toBe(zoomBefore)
    expect(map.flyToCalls).toBe(0)
    // F-34's numeric delta is carried to block 6, so nothing on screen prints one.
    expect(document.querySelector('[data-delta]')).toBeNull()
    expect(document.querySelector('.compare-delta')).toBeNull()
  })

  it('draws both sides from two dates of the same layer', async () => {
    const user = userEvent.setup()
    renderMapAndRail()
    await openCompare(user)
    await screen.findByLabelText('Compare divider')

    const map = MapStub.last()
    await waitFor(() => expect(map.getSource('ndvi-8day~compare-a')).toBeTruthy())
    expect(map.getSource('ndvi-8day~compare-b')).toBeTruthy()
    expect(map.getSource('ndvi-8day~compare-a')?.tiles[0]).toContain('date=2026-11-12')
    expect(map.getSource('ndvi-8day~compare-b')?.tiles[0]).toContain('date=2026-11-05')
    // Side A owns the west half and side B the east half of the viewport split.
    expect(map.getSource('ndvi-8day~compare-a')?.bounds).toEqual([-56, -12.5, -55.25, -11.3])
    expect(map.getSource('ndvi-8day~compare-b')?.bounds).toEqual([-55.25, -12.5, -54.5, -11.3])
  })
})

describe('R-22 the divider is a keyboard control (AC-38)', () => {
  it('moves one step per arrow press, keeps focus and leaves the camera alone', async () => {
    const user = userEvent.setup()
    renderMapAndRail()
    await openCompare(user)

    const map = MapStub.last()
    const centerBefore = map.getCenter()
    const zoomBefore = map.getZoom()
    const divider = await screen.findByLabelText('Compare divider') as HTMLInputElement

    expect(divider.getAttribute('aria-valuenow')).toBe('50')
    divider.focus()
    const start = Number(divider.value)
    await user.keyboard('{ArrowRight}')
    expect(Number(divider.value)).toBe(start + 1)
    expect(divider.getAttribute('aria-valuenow')).toBe(String(start + 1))
    expect(document.activeElement).toBe(divider)

    await user.keyboard('{ArrowLeft}')
    expect(Number(divider.value)).toBe(start)
    expect(divider.getAttribute('aria-valuenow')).toBe(String(start))
    expect(document.activeElement).toBe(divider)

    expect(map.getCenter()).toEqual(centerBefore)
    expect(map.getZoom()).toBe(zoomBefore)
  })
})
