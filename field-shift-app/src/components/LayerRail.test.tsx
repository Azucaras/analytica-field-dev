import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerRail } from './LayerRail'
import { MapCanvas } from './MapCanvas'
import { useMapStore } from '@/lib/map-store'

const mapOptions: Array<{ attributionControl?: { compact?: boolean }; center?: [number, number]; zoom?: number }> = []

const mapInstances: Array<{
  addControl: ReturnType<typeof vi.fn>
  addSource: ReturnType<typeof vi.fn>
  addLayer: ReturnType<typeof vi.fn>
  flyTo: ReturnType<typeof vi.fn>
  emit: (event: string) => void
  listeners: Record<string, Array<() => void>>
  on: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  setPaintProperty: ReturnType<typeof vi.fn>
  setLayoutProperty: ReturnType<typeof vi.fn>
  getCenter: Mock<() => { lng: number; lat: number }>
  getZoom: Mock<() => number>
  getSource: ReturnType<typeof vi.fn>
  getLayer: ReturnType<typeof vi.fn>
  getStyle: ReturnType<typeof vi.fn>
  sources: Set<string>
  layers: Set<string>
  attributionControl?: { compact?: boolean; customAttribution?: string }
}> = []

vi.mock('maplibre-gl', () => ({
  Map: class {
    addControl = vi.fn()
    addSource = vi.fn((id: string) => this.sources.add(id))
    addLayer = vi.fn((layer: { id: string }) => this.layers.add(layer.id))
    flyTo = vi.fn()
    listeners: Record<string, Array<() => void>> = {}
    on = vi.fn((event: string, listener: () => void) => {
      ;(this.listeners[event] ??= []).push(listener)
      if (event === 'load' || event === 'style.load') listener()
    })
    emit = (event: string) => this.listeners[event]?.forEach((listener) => listener())
    remove = vi.fn()
    setPaintProperty = vi.fn()
    setLayoutProperty = vi.fn()
    getCenter = vi.fn(() => ({ lng: -55.27, lat: -11.91 }))
    getZoom = vi.fn(() => 8)
    sources = new Set<string>()
    layers = new Set<string>()
    getSource = vi.fn((id: string) => this.sources.has(id) ? { id } : undefined)
    getLayer = vi.fn((id: string) => this.layers.has(id) ? { id } : undefined)
    getStyle = vi.fn(() => ({ layers: [...this.layers].map((id) => ({ id, type: id === 'place-label' ? 'symbol' : 'raster' })) }))

    constructor(options: { attributionControl?: { compact?: boolean; customAttribution?: string }; style?: { sources?: Record<string, unknown>; layers?: Array<{ id: string }> } | string }) {
      mapOptions.push(options)
      Object.keys(typeof options.style === 'object' ? options.style.sources ?? {} : {}).forEach((id) => this.sources.add(id))
      const styleLayers = typeof options.style === 'object' ? options.style.layers ?? [] : []
      styleLayers.forEach(({ id }) => this.layers.add(id))
      this.layers.add('place-label')
      mapInstances.push(this)
    }
  },
  NavigationControl: class {},
  setWorkerUrl: vi.fn(),
}))

const fields = []

const layerMetadata = [{ id: 'smap', label: 'SMAP soil moisture', basis: 'retrieved', resolution: '9 km', as_of: '2026-11-08' }]

beforeEach(() => {
  mapInstances.length = 0
  mapOptions.length = 0
  useMapStore.setState({ selectedFieldId: null, composition: 'map' })
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => layerMetadata,
  }) as unknown as Response))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('LayerRail composition presets', () => {
  it('opens at field scale centred on the first field, with a visible boundary', () => {
    const firstField = {
      id: 'field-01',
      name: 'Field 01',
      location: 'Test',
      coverage: 86,
      center: [-55.27, -11.91] as [number, number],
      boundary: { type: 'Polygon' as const, coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92], [-55.285, -11.9]]] },
    }
    render(<MapCanvas fields={[firstField]} selectedField={null} />)

    expect(mapOptions[0]?.center).toEqual(firstField.center)
    expect(mapOptions[0]?.zoom).toBeGreaterThanOrEqual(11)
    expect(mapInstances[0]?.addSource).toHaveBeenCalledWith('boundary-field-01', expect.objectContaining({ data: firstField.boundary }))
    expect(mapInstances[0]?.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'boundary-field-01',
      type: 'line',
      paint: expect.objectContaining({ 'line-width': 2 }),
    }))
  })

  it('adds raster and boundary layers on style.load, not load, and stays idempotent across style reloads', () => {
    const field = {
      id: 'field-01',
      name: 'Field 01',
      location: 'Test',
      coverage: 86,
      center: [-55.27, -11.91] as [number, number],
      boundary: { type: 'Polygon' as const, coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.9]]] },
    }
    render(<MapCanvas fields={[field]} selectedField={null} />)
    const map = mapInstances[0]

    expect(map.listeners['style.load']).toHaveLength(1)
    expect(map.addSource).toHaveBeenCalledTimes(2)
    expect(map.addLayer).toHaveBeenCalledTimes(2)

    // A preset change or setStyle() re-fires style.load: nothing may be added twice.
    map.emit('style.load')
    map.emit('style.load')
    expect(map.addSource).toHaveBeenCalledTimes(2)
    expect(map.addLayer).toHaveBeenCalledTimes(2)

    // After setStyle() drops every source and layer, the next style.load restores them.
    map.sources.clear()
    map.layers.clear()
    map.layers.add('place-label')
    map.emit('style.load')
    expect(map.addSource).toHaveBeenCalledTimes(4)
    expect(map.addLayer).toHaveBeenCalledTimes(4)
  })

  it('initializes MapLibre with an always-visible non-compact attribution control', () => {
    render(<MapCanvas fields={fields} selectedField={null} />)

    expect(mapOptions[0]?.attributionControl).toEqual({
      compact: false,
      customAttribution: 'NASA GIBS · SMAP L4 · 9 km',
    })
  })

  it('offers exactly the three named presets', () => {
    render(<LayerRail />)

    const rail = screen.getByRole('navigation', { name: 'Layers' })
    expect(within(rail).getAllByRole('button')).toHaveLength(3)
    expect(within(rail).getByRole('button', { name: 'Map' })).toBeTruthy()
    expect(within(rail).getByRole('button', { name: 'Satellite' })).toBeTruthy()
    expect(within(rail).getByRole('button', { name: 'Satellite with labels' })).toBeTruthy()
  })

  it('shows basis, resolution, and as-of date for each layer entry', async () => {
    render(<LayerRail />)

    const rail = screen.getByRole('navigation', { name: 'Layers' })
    const entries = await within(rail).findAllByRole('listitem')
    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      expect(within(entry).getByText('retrieved')).toBeTruthy()
      expect(within(entry).getByText('9 km')).toBeTruthy()
      expect(within(entry).getByText('2026-11-08')).toBeTruthy()
    }
  })

  it('reads the date and metadata from the layers endpoint', async () => {
    const fetchedLayers = [{ ...layerMetadata[0], as_of: '2026-11-06' }]
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => fetchedLayers,
    }) as unknown as Response))
    render(<LayerRail />)

    expect(await screen.findByText('2026-11-06')).toBeTruthy()
    expect(screen.queryByText('2026-11-08')).toBeNull()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('http://localhost:8000/layers', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('changes raster and label opacity without remounting the map or moving its camera', async () => {
    const user = userEvent.setup()
    render(
      <MapCanvas fields={fields} selectedField={null}>
        <LayerRail />
      </MapCanvas>,
    )

    const map = mapInstances[0]
    expect(map).toBeTruthy()
    const centerBefore = map.getCenter()
    const zoomBefore = map.getZoom()

    await user.click(screen.getByRole('button', { name: 'Satellite' }))
    expect(useMapStore.getState().composition).toBe('satellite')
    expect(map.setPaintProperty).toHaveBeenCalledWith('smap-soil-moisture', 'raster-opacity', 0.55)
    expect(map.setLayoutProperty).toHaveBeenCalledWith('place-label', 'visibility', 'none')

    await user.click(screen.getByRole('button', { name: 'Satellite with labels' }))
    expect(useMapStore.getState().composition).toBe('satellite-with-labels')
    expect(map.setPaintProperty).toHaveBeenCalledWith('smap-soil-moisture', 'raster-opacity', 0.55)
    expect(map.setLayoutProperty).toHaveBeenCalledWith('place-label', 'visibility', 'visible')
    await user.click(screen.getByRole('button', { name: 'Map' }))
    expect(useMapStore.getState().composition).toBe('map')
    expect(map.setPaintProperty).toHaveBeenCalledWith('smap-soil-moisture', 'raster-opacity', 0)
    expect(map.setLayoutProperty).toHaveBeenCalledWith('place-label', 'visibility', 'visible')

    expect(mapInstances).toHaveLength(1)
    expect(map.getSource).toHaveBeenCalledWith('smap')
    expect(map.getLayer).toHaveBeenCalledWith('smap-soil-moisture')
    expect(map.addSource).toHaveBeenCalledTimes(1)
    expect(map.addLayer).toHaveBeenCalledTimes(1)
    expect(map.remove).not.toHaveBeenCalled()
    expect(map.flyTo).not.toHaveBeenCalled()
    expect(map.getCenter()).toEqual(centerBefore)
    expect(map.getZoom()).toBe(zoomBefore)
  })
})
