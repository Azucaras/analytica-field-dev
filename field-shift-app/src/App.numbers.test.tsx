import { readFileSync } from 'node:fs'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useMapStore } from '@/lib/map-store'
import { layersResponse } from '@/test/api-fixtures'
import { MapStub } from '@/test/maplibre-stub'
import { recordedNumbersPayload } from '@/test/numbers-recorded'
import { ptBR } from '@/strings/pt-BR'

vi.mock('maplibre-gl', async () => {
  const { MapStub: Stub } = await import('@/test/maplibre-stub')
  return {
    Map: Stub,
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

const brazilFields = [
  {
    id: 'mt-santa-carmem-01',
    name: 'Santa Carmem North',
    location: 'Santa Carmem, Mato Grosso',
    coverage: 86,
    center: [-55.27, -11.91],
    boundary: { type: 'Polygon', coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92], [-55.285, -11.9]]] },
  },
]

function installFetch() {
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push(`${init?.method ?? 'GET'} ${url}`)
    const parsed = new URL(url, 'http://localhost/')
    if (parsed.pathname === '/layers') {
      return { ok: true, status: 200, json: async () => layersResponse() } as unknown as Response
    }
    if (parsed.pathname === '/polygons/mode') {
      return { ok: true, status: 200, json: async () => ({ region: 'br', mode: 'source-direct', classProperty: 'mbmode24' }) } as unknown as Response
    }
    if (parsed.pathname.endsWith('/numbers')) {
      return { ok: true, status: 200, json: async () => recordedNumbersPayload() } as unknown as Response
    }
    if (parsed.pathname.endsWith('/fields')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ fields: brazilFields, seasons: ['2025/26'], default_season: '2025/26' }),
      } as unknown as Response
    }
    if (parsed.pathname.includes('/fields/')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ field_id: 'mt-santa-carmem-01', season: '2025/26', state: 'ranked', threshold: null, coverage: 86, scenarios: [] }),
      } as unknown as Response
    }
    return { ok: false, status: 404, json: async () => null } as unknown as Response
  }))
  return calls
}

beforeEach(() => {
  MapStub.reset()
  useMapStore.setState({
    regionId: 'us',
    selectedFieldId: null,
    selectedPolygonId: null,
    polygonMode: null,
    polygonClass: null,
    polygonClassYear: null,
    polygonRing: null,
    chosenDate: null,
    numbersOpen: false,
    numbersLastRead: {},
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
  useMapStore.setState({ regionId: 'us', selectedFieldId: null, selectedPolygonId: null, polygonClass: null, numbersOpen: false })
})

describe('the Field numbers surface in the app (R-01, R-02, AC-01, AC-02)', () => {
  it('opens from ?numbers=1 on load, adds the open class and mounts one region', async () => {
    window.history.replaceState({}, '', '/?region=br&numbers=1')
    installFetch()
    const { container } = render(<App />)
    await waitFor(() => expect(useMapStore.getState().numbersOpen).toBe(true))
    expect(container.querySelector('main')?.classList.contains('is-numbers-open')).toBe(true)
    expect(screen.getAllByRole('region', { name: 'Field numbers' })).toHaveLength(1)
    expect(window.location.search).toBe('?region=br&numbers=1')
  })

  it('opens from the Field numbers button and keeps every other parameter byte for byte', async () => {
    const search = '?region=br&date=2026-11-12&basemap=eox-s2cloudless-2024'
    window.history.replaceState({}, '', `/${search}`)
    installFetch()
    render(<App />)
    await waitFor(() => expect(useMapStore.getState().regionId).toBe('br'))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Field numbers' }))
    expect(useMapStore.getState().numbersOpen).toBe(true)
    expect(window.location.search).toBe(`${search}&numbers=1`)
    expect(screen.getByRole('region', { name: 'Field numbers' })).toBeTruthy()
  })

  it('closes with Back to map, removes only numbers and returns focus to the button', async () => {
    const search = '?region=br&date=2026-11-12'
    window.history.replaceState({}, '', `/${search}&numbers=1`)
    installFetch()
    const { container } = render(<App />)
    await waitFor(() => expect(useMapStore.getState().numbersOpen).toBe(true))
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Back to map' }))
    expect(useMapStore.getState().numbersOpen).toBe(false)
    expect(window.location.search).toBe(search)
    expect(screen.queryByRole('region', { name: 'Field numbers' })).toBeNull()
    expect(container.querySelector('main')?.classList.contains('is-numbers-open')).toBe(false)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Field numbers' }))
  })

  it('resizes the map once on close and restores the camera it had before opening (R-02)', async () => {
    window.history.replaceState({}, '', '/?region=br')
    installFetch()
    render(<App />)
    await waitFor(() => expect(useMapStore.getState().regionId).toBe('br'))
    await waitFor(() => expect(MapStub.instances.length).toBeGreaterThan(0))
    const map = MapStub.last()
    map.center = { lng: -55.27, lat: -11.91 }
    map.zoom = 11.5
    map.bearing = 0
    map.pitch = 0
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Field numbers' }))
    await user.click(screen.getByRole('button', { name: 'Back to map' }))
    expect(map.resizeCalls).toBe(1)
    expect(map.getCenter()).toEqual({ lng: -55.27, lat: -11.91 })
    expect(map.getZoom()).toBe(11.5)
    expect(map.getBearing()).toBe(0)
    expect(map.getPitch()).toBe(0)
  })

  it('does not mount the numbers region while the map screen is shown (R-01)', async () => {
    window.history.replaceState({}, '', '/?region=br')
    installFetch()
    render(<App />)
    await waitFor(() => expect(useMapStore.getState().regionId).toBe('br'))
    expect(screen.queryByRole('region', { name: 'Field numbers' })).toBeNull()
  })
})

describe('the module boundaries and the catalogue (R-01, R-11, AC-01, AC-10)', () => {
  it('imports none of the four right edge modules from the numbers surface', () => {
    for (const file of ['src/components/NumbersView.tsx', 'src/components/NumbersToggle.tsx', 'src/lib/numbers.ts', 'src/lib/numbers-api.ts']) {
      const source = readFileSync(`${process.cwd()}/${file}`, 'utf8')
      for (const forbidden of ['CommandToggle', 'SupportingDataToggle', 'EvidencePanel', 'AgentBar']) {
        expect(source).not.toMatch(new RegExp(`from ['"][^'"]*${forbidden}['"]`))
      }
    }
  })

  it('keeps the pt-BR catalogue empty (R-11)', () => {
    expect(Object.keys(ptBR)).toEqual([])
  })

  it('does not add a raster source or a numbers layer to the map style (R-14, AC-13)', async () => {
    window.history.replaceState({}, '', '/?region=br&numbers=1')
    installFetch()
    render(<App />)
    await waitFor(() => expect(useMapStore.getState().numbersOpen).toBe(true))
    const map = MapStub.last()
    const ids = [...map.sources.keys(), ...map.layers.map((layer) => layer.id)]
    expect(ids.filter((id) => id.startsWith('numbers'))).toEqual([])
  })
})
