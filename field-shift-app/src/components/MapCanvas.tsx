import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Map as MapLibre, NavigationControl, setWorkerUrl, type Map as MapLibreMap } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LAYER_CATALOG, VECTOR_BASEMAP_STYLE } from '@/lib/layer-catalog'
import { useMapStore, type CompositionPreset, type FieldSummary } from '@/lib/map-store'
import { t } from '@/strings'

// maplibre-gl derives its worker URL from import.meta.url. Vite's dev pre-bundle moves that module to
// node_modules/.vite/deps, where the worker file does not exist, so the worker 404s ("Worker failed to load")
// and no source ever loads. Pointing at the real file keeps dev and the production build working.
setWorkerUrl(maplibreWorkerUrl)

type MapCanvasProps = {
  fields: FieldSummary[]
  selectedField: FieldSummary | null
  onTileChange?: (tile: { z: number; x: number; y: number }) => void
  children?: ReactNode
}

function emitViewportTile(map: MapLibreMap, onTileChange?: MapCanvasProps['onTileChange']) {
  if (!onTileChange) return
  const zoom = Math.max(0, Math.min(30, Math.floor(map.getZoom())))
  const center = map.getCenter()
  const scale = 2 ** zoom
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, center.lat))
  const latitudeRadians = latitude * Math.PI / 180
  const x = Math.floor((center.lng + 180) / 360 * scale)
  const y = Math.floor((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale)
  onTileChange({ z: zoom, x: Math.min(scale - 1, Math.max(0, x)), y: Math.min(scale - 1, Math.max(0, y)) })
}

function ensureRasterLayers(map: MapLibreMap) {
  for (const layer of LAYER_CATALOG) {
    if (!map.getSource(layer.id)) {
      map.addSource(layer.id, {
        type: 'raster',
        tiles: [...layer.tiles],
        tileSize: layer.tileSize,
        maxzoom: 6,
        attribution: layer.attribution,
      })
    }
    const mapLayerId = `${layer.id}-soil-moisture`
    if (!map.getLayer(mapLayerId)) {
      const firstSymbolLayer = map.getStyle().layers?.find((styleLayer) => styleLayer.type === 'symbol')
      map.addLayer({
        id: mapLayerId,
        type: 'raster',
        source: layer.id,
        paint: { 'raster-opacity': 0 },
      }, firstSymbolLayer?.id)
    }
  }
}

function ensureFieldBoundaries(map: MapLibreMap, fields: FieldSummary[]) {
  for (const field of fields) {
    const id = `boundary-${field.id}`
    if (!map.getSource(id)) {
      map.addSource(id, { type: 'geojson', data: field.boundary })
    }
    if (!map.getLayer(id)) {
      map.addLayer({
        id,
        type: 'line',
        source: id,
        paint: { 'line-color': '#d5e86c', 'line-width': 2 },
      })
    }
  }
}

function applyComposition(map: MapLibreMap, composition: CompositionPreset) {
  const satelliteVisible = composition !== 'map'
  for (const layer of LAYER_CATALOG) {
    const mapLayerId = `${layer.id}-soil-moisture`
    if (map.getLayer(mapLayerId)) {
      map.setPaintProperty(mapLayerId, 'raster-opacity', satelliteVisible ? 0.55 : 0)
    }
  }

  const showLabels = composition !== 'satellite'
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol') {
      map.setLayoutProperty(layer.id, 'visibility', showLabels ? 'visible' : 'none')
    }
  }
}

export function MapCanvas({ fields, selectedField, onTileChange, children }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const fieldsRef = useRef(fields)
  // `style.load` is a promise, not a render value: effects keyed on map readiness need
  // it as state, because the previous `mapLoadedRef` snapshot was read once and never
  // re-read, so an effect that ran before the style loaded never ran again.
  const [mapReady, setMapReady] = useState(false)
  const didSetInitialFieldRef = useRef(false)
  const composition = useMapStore((state) => state.composition)

  fieldsRef.current = fields

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new MapLibre({
      container: containerRef.current,
      style: VECTOR_BASEMAP_STYLE,
      center: fieldsRef.current[0]?.center ?? [-55.27, -11.91],
      zoom: 11,
      attributionControl: {
        compact: false,
        customAttribution: `${t('map.attribution')} · ${LAYER_CATALOG[0].resolution}`,
      },
    })
    mapRef.current = map
    ;(window as unknown as { __fsMap?: unknown }).__fsMap = map
    map.addControl(new NavigationControl(), 'top-right')
    // Sources and layers are dropped by every setStyle(), so they are (re)added here, idempotently.
    map.on('style.load', () => {
      if (mapRef.current !== map) return
      setMapReady(true)
      ensureRasterLayers(map)
      ensureFieldBoundaries(map, fieldsRef.current)
      applyComposition(map, useMapStore.getState().composition)
    })
    map.on('load', () => {
      emitViewportTile(map, onTileChange)
      map.on('moveend', () => emitViewportTile(map, onTileChange))
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Selection is app state, not a map concern. One rule runs whenever the list changes:
  // if nothing in the list is selected, select the first field. Both sides of the race
  // are covered because the rule is keyed on `fields` alone, not on a map readiness
  // snapshot: `fields` and the basemap style arrive in either order. The previous pair
  // of one-shot paths could both miss (the effect skipped while the style had not
  // loaded, the `load` handler skipped while the list was empty) and nothing retried,
  // which left the HUD empty forever when the remote style was slow.
  useEffect(() => {
    const current = useMapStore.getState().selectedFieldId
    if (current && fields.some((field) => field.id === current)) return
    const first = fields[0]
    if (!first) return
    useMapStore.getState().selectField(first.id)
    didSetInitialFieldRef.current = true
  }, [fields])

  // Boundaries need the map, so they are re-applied when either side changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    ensureFieldBoundaries(mapRef.current, fields)
  }, [fields, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedField || !didSetInitialFieldRef.current) return
    mapRef.current.flyTo({ center: selectedField.center, zoom: 11, duration: 500 })
  }, [selectedField, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    applyComposition(mapRef.current, composition)
  }, [composition, mapReady])

  return (
    <section className="map-panel" role="region" aria-label={t('map.field_map')}>
      <div ref={containerRef} className="map-canvas" aria-label={t('map.satellite_map_label')} />
      <div className="map-overlay" aria-hidden="true">
        <span className="map-live-dot" />
        <span>{t('map.satellite_layer')}</span>
      </div>
      {children}
    </section>
  )
}
