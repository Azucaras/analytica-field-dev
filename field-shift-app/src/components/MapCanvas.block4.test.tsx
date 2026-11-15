import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MapCanvas } from './MapCanvas'
import { buildLayerCatalog, markCatalogUnavailable } from '@/lib/layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import { useMapStore, LAYER_DEFAULT_OPACITY } from '@/lib/map-store'
import { MapStub } from '@/test/maplibre-stub'

vi.mock('maplibre-gl', async () => {
  const { MapStub } = await import('@/test/maplibre-stub')
  return {
    Map: MapStub,
    NavigationControl: class {},
    AttributionControl: class {
      options: unknown
      constructor(options?: unknown) { this.options = options }
      onAdd() { return {} }
      onRemove() {}
    },
    addProtocol: vi.fn(),
    setWorkerUrl: vi.fn(),
  }
})

type TileAnswer = {
  httpStatus?: number
  bytes?: number
  date?: string | null
  source?: string | null
  status?: string | null
}

/** Every tile request the map layer stack makes, in order, so counting per layer is exact. */
let tileRequests: string[] = []
let answers: Record<string, TileAnswer> = {}

function installFetch() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const path = new URL(url).pathname
    // Block 5 reads `/polygons/mode` once per load. This suite counts tile requests only, so
    // the mode read is answered (absent build) and is not recorded among the tiles.
    if (path === '/polygons/mode') {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => null,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as Response
    }
    const match = path.match(/^\/tiles\/([^/]+)\//)
    const layerId = match ? decodeURIComponent(match[1]) : ''
    if (match) tileRequests.push(url)
    const answer = answers[layerId] ?? {}
    const headers = new Headers()
    if (answer.date !== null && answer.date !== undefined) headers.set('X-Tile-Date', answer.date)
    if (answer.source) headers.set('X-Tile-Source', answer.source)
    if (answer.status) headers.set('X-Tile-Status', answer.status)
    return {
      status: answer.httpStatus ?? 200,
      headers,
      arrayBuffer: async () => new ArrayBuffer(answer.bytes ?? 6400),
    } as unknown as Response
  }))
}

const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)

function resetStore(overrides: Partial<ReturnType<typeof useMapStore.getState>> = {}) {
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
    composition: 'satellite',
    ...overrides,
  })
}

async function mountMap() {
  render(<MapCanvas fields={[]} selectedField={null} />)
  return MapStub.last()
}

/** Waits until the guard has cleared the layer and the raster source exists. */
async function waitForLayer(map: MapStub, layerId: string) {
  await waitFor(() => expect(map.getSource(layerId)).toBeTruthy())
}

beforeEach(() => {
  MapStub.reset()
  tileRequests = []
  answers = Object.fromEntries(catalog.map((entry) => [entry.id, { date: entry.effective_date }]))
  installFetch()
  resetStore()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('block 1 R-10 composition presets still recompose without remounting', () => {
  it('keeps one map, one source set and the camera when the preset changes', async () => {
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')
    const centerBefore = map.getCenter()
    const zoomBefore = map.getZoom()
    const sourcesBefore = map.addSourceCalls

    act(() => useMapStore.getState().setComposition('satellite-with-labels'))
    act(() => useMapStore.getState().setComposition('map'))

    expect(MapStub.instances).toHaveLength(1)
    expect(map.addSourceCalls).toBe(sourcesBefore)
    expect(map.getCenter()).toEqual(centerBefore)
    expect(map.getZoom()).toBe(zoomBefore)
    expect(map.flyToCalls).toBe(0)
  })
})

describe('R-17 opacity (AC-13)', () => {
  it('starts a layer that is on at 0.55 and moves the paint property without touching a source', async () => {
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')

    expect(map.getPaintProperty('smap-l3-raster', 'raster-opacity')).toBe(LAYER_DEFAULT_OPACITY)
    const sourcesBefore = map.addSourceCalls
    const removalsBefore = map.removeSourceCalls

    act(() => useMapStore.getState().setOpacity('smap-l3', 0.3))

    await waitFor(() => expect(map.getPaintProperty('smap-l3-raster', 'raster-opacity')).toBe(0.3))
    expect(map.addSourceCalls).toBe(sourcesBefore)
    expect(map.removeSourceCalls).toBe(removalsBefore)
  })

  it('starts a layer the user turns on at 0.55', async () => {
    resetStore({ on: {}, compare: {} })
    const map = await mountMap()
    expect(map.getSource('smap-l3')).toBeUndefined()

    act(() => useMapStore.getState().setLayerOn('ndvi-8day', true))
    await waitForLayer(map, 'ndvi-8day')
    expect(map.getPaintProperty('ndvi-8day-raster', 'raster-opacity')).toBe(LAYER_DEFAULT_OPACITY)
  })
})

describe('R-18 order (AC-14)', () => {
  it('moves a row one place down through moveLayer and keeps every source', async () => {
    // Two adjacent rows on, which is the state in which a one place move changes the
    // index in `getStyle().layers`: moving a row past a row that is off cannot change
    // what the style draws, because that row draws nothing.
    resetStore({ on: { 'smap-l3': true, 'smap-l4-surface': true } })
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')
    await waitForLayer(map, 'smap-l4-surface')

    const indexOf = () => map.getStyle().layers.findIndex((layer) => layer.id === 'smap-l3-raster')
    const before = indexOf()
    expect(before).toBeGreaterThanOrEqual(0)
    const sourcesBefore = map.addSourceCalls
    const removalsBefore = map.removeSourceCalls

    act(() => useMapStore.getState().moveLayer('smap-l3', 'down'))

    await waitFor(() => expect(indexOf()).not.toBe(before))
    expect(map.addSourceCalls).toBe(sourcesBefore)
    expect(map.removeSourceCalls).toBe(removalsBefore)
    expect(map.moveLayerCalls).toContain('smap-l3-raster')
    // The stack list is what the rail shows, and its first item is the one drawn on top.
    expect(useMapStore.getState().order.slice(0, 2)).toEqual(['smap-l4-surface', 'smap-l3'])
  })

  it('keeps the order across a composition preset change (R-18)', async () => {
    resetStore({ on: { 'smap-l3': true, 'smap-l4-surface': true } })
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')

    act(() => useMapStore.getState().moveLayer('smap-l3', 'down'))
    const order = [...useMapStore.getState().order]

    act(() => useMapStore.getState().setComposition('satellite-with-labels'))
    expect(useMapStore.getState().order).toEqual(order)
  })
})

describe('R-19 a layer that is off issues no tile request (AC-15)', () => {
  it('counts tile requests for the layer that is on and no other', async () => {
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')

    const requested = [...new Set(tileRequests.map((url) => new URL(url).pathname.split('/')[2]))]
    expect(requested).toEqual(['smap-l3'])
    expect(map.getSource('imerg-daily')).toBeUndefined()
    expect(map.getSource('grace-mascon')).toBeUndefined()
  })
})

describe('R-20 a date change re-resolves only what changed (AC-16)', () => {
  it('requests only the layer whose effective date changed, and nothing for a pinned layer', async () => {
    resetStore({
      on: { 'smap-l3': true, 'imerg-daily': true, 'ndvi-8day': true },
      pinnedDates: { 'ndvi-8day': '2026-10-01' },
    })
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')

    const countFor = (layerId: string) => tileRequests.filter((url) => url.includes(`/tiles/${layerId}/`)).length
    const before = {
      smap: countFor('smap-l3'),
      imerg: countFor('imerg-daily'),
      ndvi: countFor('ndvi-8day'),
    }
    // The pinned layer was probed once, for its own date, and never for the chosen one.
    expect(before.ndvi).toBe(1)
    expect(tileRequests.filter((url) => url.includes('/tiles/ndvi-8day/'))[0]).toContain('date=2026-10-01')

    // 2026-11-13: smap-l3 still resolves to 2026-11-11, imerg-daily to 2026-11-13.
    await act(async () => {
      useMapStore.getState().setChosenDate('2026-11-13')
      useMapStore.getState().setLayersResponse({
        chosen_date: '2026-11-13',
        axis: RECORDED_LAYERS_RESPONSE.axis,
        catalog: catalog.map((entry) => entry.id === 'imerg-daily'
          ? { ...entry, status: 'on_date' as const, effective_date: '2026-11-13', age_days: 0 }
          : entry),
      })
    })

    await waitFor(() => expect(countFor('imerg-daily')).toBeGreaterThan(before.imerg))
    expect(countFor('smap-l3')).toBe(before.smap)
    expect(countFor('ndvi-8day')).toBe(before.ndvi)
  })

  it('keeps a pinned layer on its own date', async () => {
    resetStore({ on: { 'smap-l3': true }, pinnedDates: { 'smap-l3': '2026-11-02' } })
    answers = { 'smap-l3': { date: '2026-11-02', bytes: 6400 } }
    const map = await mountMap()
    await waitForLayer(map, 'smap-l3')
    expect(map.getSource('smap-l3')?.tiles[0]).toContain('date=2026-11-02')
  })
})

describe('R-23 the app refuses a tile the proxy should not have served (AC-19)', () => {
  it('rejects a tile whose X-Tile-Date is later than the chosen date', async () => {
    answers = { 'smap-l3': { date: '2026-11-13', bytes: 6400 } }
    const map = await mountMap()

    await waitFor(() => expect(useMapStore.getState().tileDecisions['smap-l3']?.status).toBe('none_in_lookback'))
    expect(map.getSource('smap-l3')).toBeUndefined()
    expect(map.getLayer('smap-l3-raster')).toBeUndefined()
  })

  it('does not draw a 200 with a zero byte body and reports unavailable', async () => {
    answers = { 'smap-l3': { date: '2026-11-11', bytes: 0 } }
    const map = await mountMap()

    await waitFor(() => expect(useMapStore.getState().tileDecisions['smap-l3']?.status).toBe('unavailable'))
    expect(map.getSource('smap-l3')).toBeUndefined()
  })
})

describe('R-25 the degraded mode the map shows (AC-20)', () => {
  it('draws the cached tile dated on or before the chosen date and labels the row with its date', async () => {
    answers = { 'smap-l3': { date: '2026-11-09', bytes: 9999, source: 'cache-offline' } }
    const map = await mountMap()

    await waitForLayer(map, 'smap-l3')
    expect(map.getSource('smap-l3')?.tiles[0]).toContain('date=2026-11-09')
    expect(screen.getByText('2026-11-09')).toBeTruthy()
  })

  it('labels the reserve as an offline sample with no date, never as current', async () => {
    answers = { 'smap-l3': { bytes: 9999, source: 'reserve' } }
    const map = await mountMap()

    await waitFor(() => expect(screen.getByText('offline sample, date unknown')).toBeTruthy())
    expect(map.getSource('smap-l3')).toBeTruthy()
    expect(screen.queryByText('on date')).toBeNull()
  })

  it('shows no offline copy when the layer has neither a cache entry nor a reserve', async () => {
    answers = { 'smap-l3': { httpStatus: 404, bytes: 0, status: 'no_offline_copy' } }
    const map = await mountMap()

    await waitFor(() => expect(screen.getByText('no offline copy')).toBeTruthy())
    expect(map.getSource('smap-l3')).toBeUndefined()
  })

  it('still accepts a dated cached tile when /layers has failed and no effective date is known', async () => {
    // R-24 leaves the rows without a date; the guard must then compare against the chosen
    // date, not against the missing effective date, or every dated tile would be refused.
    resetStore({ catalog: markCatalogUnavailable(catalog), layerCatalogFailed: true })
    answers = { 'smap-l3': { date: '2026-11-11', bytes: 9999, source: 'cache-offline' } }
    const map = await mountMap()

    await waitForLayer(map, 'smap-l3')
    expect(map.getSource('smap-l3')?.tiles[0]).toContain('date=2026-11-11')
    expect(screen.getByText('2026-11-11')).toBeTruthy()
  })
})
