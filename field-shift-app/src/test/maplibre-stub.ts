/**
 * A MapLibre stub for the block 4 criteria, which read the map back the way the browser
 * does: `getPaintProperty` for AC-13, `getStyle().layers` for AC-14, the source and layer
 * counts for both, `getCenter` and `getZoom` for the compare camera rule (AC-18), and the
 * source `setTiles` calls for the effective date rule (AC-16).
 */
export type StubSource = {
  id: string
  tiles: string[]
  bounds?: [number, number, number, number]
  setTiles: (tiles: string[]) => void
  /** MapLibre calls this with no argument; the callback mutates the source. */
  setSourceProperty: (callback: () => void) => void
}

export type StubLayer = {
  id: string
  type: 'raster' | 'line' | 'symbol'
  source?: string
  paint?: Record<string, unknown>
}

export class MapStub {
  static instances: MapStub[] = []

  sources = new Map<string, StubSource>()
  layers: StubLayer[] = [{ id: 'place-label', type: 'symbol' }]
  addSourceCalls = 0
  removeSourceCalls = 0
  addLayerCalls = 0
  removeLayerCalls = 0
  moveLayerCalls: string[] = []
  listeners: Record<string, Array<() => void>> = {}
  center = { lng: -55.27, lat: -11.91 }
  zoom = 11
  flyToCalls = 0
  options: Record<string, unknown>

  constructor(options: Record<string, unknown>) {
    this.options = options
    MapStub.instances.push(this)
  }

  addControl() {}
  remove() {}

  addSource(id: string, spec: { tiles?: string[]; bounds?: [number, number, number, number] }) {
    this.addSourceCalls += 1
    const source: StubSource = {
      id,
      tiles: [...(spec.tiles ?? [])],
      bounds: spec.bounds,
      setTiles: (tiles: string[]) => { source.tiles = [...tiles] },
      // MapLibre calls this callback with no argument and then reloads the source, so the
      // callback mutates the source itself. The stub is faithful to that, not generous:
      // a callback written against an argument would throw here as it does in the browser.
      setSourceProperty: (callback: () => void) => { callback() },
    }
    this.sources.set(id, source)
  }

  removeSource(id: string) {
    this.removeSourceCalls += 1
    this.sources.delete(id)
  }

  getSource(id: string) {
    return this.sources.get(id)
  }

  addLayer(layer: StubLayer, beforeId?: string) {
    this.addLayerCalls += 1
    const index = beforeId ? this.layers.findIndex((entry) => entry.id === beforeId) : -1
    if (index >= 0) this.layers.splice(index, 0, layer)
    else this.layers.push(layer)
  }

  removeLayer(id: string) {
    this.removeLayerCalls += 1
    this.layers = this.layers.filter((layer) => layer.id !== id)
  }

  getLayer(id: string) {
    return this.layers.find((layer) => layer.id === id)
  }

  /** Without a `beforeId`, MapLibre moves the layer to the top of the stack. */
  moveLayer(id: string) {
    this.moveLayerCalls.push(id)
    const layer = this.layers.find((entry) => entry.id === id)
    if (!layer) return
    this.layers = this.layers.filter((entry) => entry.id !== id)
    this.layers.push(layer)
  }

  getStyle() {
    return { layers: this.layers.map((layer) => ({ ...layer })) }
  }

  setPaintProperty(id: string, property: string, value: unknown) {
    const layer = this.layers.find((entry) => entry.id === id)
    if (layer) layer.paint = { ...layer.paint, [property]: value }
  }

  getPaintProperty(id: string, property: string) {
    return this.layers.find((entry) => entry.id === id)?.paint?.[property]
  }

  setLayoutProperty() {}

  getZoom() {
    return this.zoom
  }

  getCenter() {
    return { ...this.center }
  }

  getBounds() {
    return {
      getWest: () => -56,
      getSouth: () => -12.5,
      getEast: () => -54.5,
      getNorth: () => -11.3,
    }
  }

  flyTo() {
    this.flyToCalls += 1
  }

  on(event: string, callback: () => void) {
    ;(this.listeners[event] ??= []).push(callback)
    if (event === 'style.load') callback()
  }

  emit(event: string) {
    for (const callback of this.listeners[event] ?? []) callback()
  }

  static reset() {
    MapStub.instances = []
  }

  static last(): MapStub {
    return MapStub.instances[MapStub.instances.length - 1]
  }
}
