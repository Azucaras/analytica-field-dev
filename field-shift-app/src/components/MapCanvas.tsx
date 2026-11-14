import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Map as MapLibre, NavigationControl, setWorkerUrl, type Map as MapLibreMap } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { layerTileTemplate, VECTOR_BASEMAP_STYLE, type LayerCatalogEntry } from '@/lib/layer-catalog'
import {
  chosenDateOf,
  opacityOf,
  useMapStore,
  type CompareState,
  type CompositionPreset,
  type FieldSummary,
} from '@/lib/map-store'
import { probeLayerTile } from '@/lib/tile-guard'
import { t } from '@/strings'

// maplibre-gl derives its worker URL from import.meta.url. Vite's dev pre-bundle moves that module to
// node_modules/.vite/deps, where the worker file does not exist, so the worker 404s ("Worker failed to load")
// and no source ever loads. Pointing at the real file keeps dev and the production build working.
setWorkerUrl(maplibreWorkerUrl)

const COMPARE_SUFFIX = { a: '~compare-a', b: '~compare-b' } as const
export const COMPARE_DECISION_SUFFIX = '~compare-b'

export function rasterLayerId(layerId: string): string {
  return `${layerId}-raster`
}

function sourceIdFor(layerId: string, side?: 'a' | 'b'): string {
  return side ? `${layerId}${COMPARE_SUFFIX[side]}` : layerId
}

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

/** R-16: the raster source takes its `maxzoom` from the registry entry, never a literal. */
type SourceLike = { setTiles?: (tiles: string[]) => void; setSourceProperty?: (callback: (source: unknown) => void) => void }

function readBounds(map: MapLibreMap): { west: number; south: number; east: number; north: number } {
  const bounds = map.getBounds?.()
  if (!bounds) return { west: -180, south: -85, east: 180, north: 85 }
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}

function compareBounds(map: MapLibreMap, divider: number): { a: [number, number, number, number]; b: [number, number, number, number] } {
  const { west, south, east, north } = readBounds(map)
  const split = west + (east - west) * divider
  return {
    a: [west, south, split, north],
    b: [split, south, east, north],
  }
}

/**
 * R-19 and R-17: only a layer that is on owns a source and a layer, so a layer that is off
 * issues no tile request. Opacity is a paint property on `raster-opacity` and never removes
 * or re-adds a source, which is what AC-13 counts.
 */
function ensureRaster(
  map: MapLibreMap,
  entry: LayerCatalogEntry,
  tiles: string,
  side?: 'a' | 'b',
  bounds?: [number, number, number, number],
): boolean {
  const sourceId = sourceIdFor(entry.id, side)
  const layerId = rasterLayerId(entry.id) + (side ? COMPARE_SUFFIX[side] : '')
  const source = map.getSource(sourceId) as SourceLike | undefined
  const created = !source
  if (!source) {
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [tiles],
      tileSize: 256,
      maxzoom: entry.max_zoom,
      ...(bounds ? { bounds } : {}),
      attribution: t('map.attribution'),
    })
  }
  if (!map.getLayer(layerId)) {
    const firstSymbolLayer = map.getStyle().layers?.find((styleLayer) => styleLayer.type === 'symbol')
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': 0 },
    }, firstSymbolLayer?.id)
  }
  return created
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

/**
 * Block 1 R-09 keeps the three composition presets, and block 1 R-10 keeps them from
 * remounting the map. Block 4 R-17 moves the raster itself to its own on/off state and its
 * own opacity, so the preset now only recomposes the labels of the basemap: the raster
 * opacity a user sets is the opacity the map shows, which is what AC-13 reads back.
 */
function applyComposition(map: MapLibreMap, composition: CompositionPreset) {
  const showLabels = composition !== 'satellite'
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol') {
      map.setLayoutProperty(layer.id, 'visibility', showLabels ? 'visible' : 'none')
    }
  }
}

/** R-18: the stack list puts its first item on top, so the list is applied bottom up. */
function applyOrder(map: MapLibreMap, order: string[]) {
  for (let index = order.length - 1; index >= 0; index -= 1) {
    const layerId = rasterLayerId(order[index])
    if (map.getLayer(layerId)) map.moveLayer(layerId)
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
  const catalog = useMapStore((state) => state.catalog)
  const layerOn = useMapStore((state) => state.on)
  const opacity = useMapStore((state) => state.opacity)
  const order = useMapStore((state) => state.order)
  const pinnedDates = useMapStore((state) => state.pinnedDates)
  const compare = useMapStore((state) => state.compare)
  const decisions = useMapStore((state) => state.tileDecisions)
  const chosenDate = useMapStore(chosenDateOf)
  const appliedTilesRef = useRef<Record<string, string>>({})

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
        customAttribution: `${t('map.attribution')} · ${useMapStore.getState().catalog[0]?.resolution ?? ''}`,
      },
    })
    mapRef.current = map
    ;(window as unknown as { __fsMap?: unknown }).__fsMap = map
    map.addControl(new NavigationControl(), 'top-right')
    // Sources and layers are dropped by every setStyle(), so they are (re)added here, idempotently.
    map.on('style.load', () => {
      if (mapRef.current !== map) return
      // A new style drops every source, so the applied tile cache no longer describes the map.
      appliedTilesRef.current = {}
      setMapReady(true)
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
  // snapshot: `fields` and the basemap style arrive in either order.
  useEffect(() => {
    const current = useMapStore.getState().selectedFieldId
    if (current && fields.some((field) => field.id === current)) return
    const first = fields[0]
    if (!first) return
    useMapStore.getState().selectField(first.id)
    didSetInitialFieldRef.current = true
  }, [fields])

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

  // R-23 and R-25: one probe per layer and *effective* date. `effective_date` comes from
  // the `/layers` response, so a chosen date that resolves every layer to the same date
  // issues no request at all (R-20, AC-16), and a pinned layer is never probed again.
  const probedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!mapReady) return
    const controller = new AbortController()
    const state = useMapStore.getState()
    const zoom = mapRef.current ? Math.floor(mapRef.current.getZoom()) : 11
    const center = mapRef.current ? mapRef.current.getCenter() : { lng: -55.27, lat: -11.91 }
    // The proxy refuses z above the layer's max_zoom (R-15), so the probe asks at the
    // layer's own zoom, which is the tile the overzoomed raster source would request.
    const tileAt = (layerZoom: number) => {
      const scale = 2 ** layerZoom
      return {
        z: layerZoom,
        x: Math.min(scale - 1, Math.floor((center.lng + 180) / 360 * scale)),
        y: Math.min(scale - 1, Math.floor((1 - Math.asinh(Math.tan(center.lat * Math.PI / 180)) / Math.PI) / 2 * scale)),
      }
    }
    const targets: Array<{ id: string; date: string | null; key: string; maxZoom: number; resolved: string | null }> = []
    const chosen = chosenDateOf(state)
    for (const entry of state.catalog) {
      if (!state.on[entry.id]) continue
      const pinned = state.pinnedDates[entry.id] ?? null
      // The probe asks for the date the app is reading at: the pin when the layer has one,
      // the chosen date otherwise. That date is also the boundary R-23 compares against, so
      // a failed `/layers` (no effective date at all) still accepts a dated cached tile.
      // The *resolved* date only keys the cache, so a chosen date that resolves every layer
      // to the same date issues no new request (R-20, AC-16).
      targets.push({
        id: entry.id,
        date: pinned ?? chosen,
        key: entry.id,
        maxZoom: entry.max_zoom,
        resolved: pinned ?? entry.effective_date ?? chosen,
      })
      const pair = state.compare[entry.id]
      if (pair) {
        targets.push({
          id: entry.id,
          date: pair.date,
          key: `${entry.id}${COMPARE_DECISION_SUFFIX}`,
          maxZoom: entry.max_zoom,
          resolved: pair.date,
        })
      }
    }
    for (const target of targets) {
      const probeKey = `${target.key}::${target.resolved ?? 'none'}`
      if (probedRef.current.has(probeKey)) continue
      probedRef.current.add(probeKey)
      probeLayerTile(target.id, target.date, tileAt(Math.min(zoom, target.maxZoom)), controller.signal)
        .then((decision) => useMapStore.getState().setTileDecision(target.key, decision))
        .catch((reason: unknown) => {
          // An aborted probe (a newer catalog or date arrived) proves nothing, so the key
          // is released and the next run asks again. Leaving it claimed would lose the
          // decision for good and the layer would never draw.
          if (reason instanceof DOMException && reason.name === 'AbortError') {
            probedRef.current.delete(probeKey)
          }
        })
    }
    return () => controller.abort()
  }, [mapReady, chosenDate, catalog, layerOn, pinnedDates, compare])

  // The single writer of the map style for the raster layers. It only touches the style
  // when the plan changes, so an opacity edit does not re-add a source (AC-13) and an order
  // edit does not remove one (AC-14).
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    const visibleIds = new Set<string>()

    for (const entry of catalog) {
      const isOn = layerOn[entry.id] ?? false
      const decision = decisions[entry.id]
      // R-19: a layer that is off owns no source. R-23: only a tile the guard has cleared
      // may draw, so a refused or not yet settled probe leaves no source behind.
      if (!isOn || decision?.draw !== true) {
        for (const key of [rasterLayerId(entry.id), `${rasterLayerId(entry.id)}${COMPARE_SUFFIX.a}`, `${rasterLayerId(entry.id)}${COMPARE_SUFFIX.b}`]) {
          if (map.getLayer(key)) map.removeLayer(key)
        }
        for (const sourceId of [entry.id, sourceIdFor(entry.id, 'a'), sourceIdFor(entry.id, 'b')]) {
          if (map.getSource(sourceId)) map.removeSource(sourceId)
        }
        delete appliedTilesRef.current[entry.id]
        continue
      }

      visibleIds.add(entry.id)
      const effectiveDate = pinnedDates[entry.id] ?? decision?.date ?? entry.effective_date
      const tiles = layerTileTemplate(entry.id, effectiveDate)
      // R-20: a date that resolves to the same effective date keeps the same URL, so a
      // source is rewritten only when its URL really changed. A fresh source already has
      // the right tiles and is not asked for them twice.
      const applyTiles = (key: string, sourceId: string, url: string, created: boolean) => {
        if (created) {
          appliedTilesRef.current[key] = url
          return
        }
        if (appliedTilesRef.current[key] === url) return
        const source = map.getSource(sourceId) as SourceLike | undefined
        source?.setTiles?.([url])
        appliedTilesRef.current[key] = url
      }
      const baseCreated = ensureRaster(map, entry, tiles)
      const pair = compare[entry.id]
      const baseOpacity = pair ? 0 : opacityOf(useMapStore.getState(), entry.id)
      map.setPaintProperty(rasterLayerId(entry.id), 'raster-opacity', baseOpacity)
      applyTiles(entry.id, entry.id, tiles, baseCreated)

      if (pair) {
        const bounds = compareBounds(map, pair.divider)
        // R-22: side A is the chosen date (its effective date), side B the Compare date.
        const tilesA = layerTileTemplate(entry.id, effectiveDate)
        const tilesB = layerTileTemplate(entry.id, pair.date)
        const createdA = ensureRaster(map, entry, tilesA, 'a', bounds.a)
        const createdB = ensureRaster(map, entry, tilesB, 'b', bounds.b)
        applyTiles(`${entry.id}~a`, sourceIdFor(entry.id, 'a'), tilesA, createdA)
        applyTiles(`${entry.id}~b`, sourceIdFor(entry.id, 'b'), tilesB, createdB)
        map.setPaintProperty(`${rasterLayerId(entry.id)}${COMPARE_SUFFIX.a}`, 'raster-opacity', opacityOf(useMapStore.getState(), entry.id))
        map.setPaintProperty(`${rasterLayerId(entry.id)}${COMPARE_SUFFIX.b}`, 'raster-opacity', opacityOf(useMapStore.getState(), entry.id))
        for (const side of ['a', 'b'] as const) {
          const source = map.getSource(sourceIdFor(entry.id, side)) as (SourceLike & { bounds?: [number, number, number, number] }) | undefined
          const sideBounds = side === 'a' ? bounds.a : bounds.b
          // MapLibre calls the callback with no argument: it is meant to mutate the source
          // itself, which is then reloaded.
          source?.setSourceProperty?.(() => {
            if (source) source.bounds = sideBounds
          })
        }
      } else {
        delete appliedTilesRef.current[`${entry.id}~a`]
        delete appliedTilesRef.current[`${entry.id}~b`]
        for (const side of ['a', 'b'] as const) {
          const layerId = `${rasterLayerId(entry.id)}${COMPARE_SUFFIX[side]}`
          if (map.getLayer(layerId)) map.removeLayer(layerId)
          if (map.getSource(sourceIdFor(entry.id, side))) map.removeSource(sourceIdFor(entry.id, side))
        }
      }
    }

    // R-18: only the layers still on the map take part in the stack order.
    applyOrder(map, order.filter((id) => visibleIds.has(id)))
  }, [mapReady, catalog, layerOn, opacity, order, pinnedDates, compare, decisions])

  return (
    <section className="map-panel" role="region" aria-label={t('map.field_map')}>
      <div ref={containerRef} className="map-canvas" aria-label={t('map.satellite_map_label')} />
      <div className="map-overlay" aria-hidden="true">
        <span className="map-live-dot" />
        <span>{t('map.satellite_layer')}</span>
      </div>
      {children}
      <CompareOverlay chosenDate={chosenDate} />
      <OfflineOverlay />
    </section>
  )
}

/** R-22: the divider and the two side labels, and no numeric delta anywhere (F-34 is block 6). */
function CompareOverlay({ chosenDate }: { chosenDate: string }) {
  const compare = useMapStore((state) => state.compare)
  const catalog = useMapStore((state) => state.catalog)
  const decisions = useMapStore((state) => state.tileDecisions)
  const setCompareDivider = useMapStore((state) => state.setCompareDivider)
  const active = catalog.find((entry) => compare[entry.id] != null)
  if (!active) return null
  const pair = compare[active.id] as CompareState
  const sideA = decisions[active.id]?.date ?? chosenDate
  const sideB = decisions[`${active.id}${COMPARE_DECISION_SUFFIX}`]?.date ?? pair.date ?? ''

  return (
    <div className="compare-overlay">
      <span className="compare-side compare-side-a" data-dynamic-content>
        {t('layers.compare_side', { date: sideA, age: ageText(sideA, chosenDate) })}
      </span>
      <span className="compare-side compare-side-b" data-dynamic-content>
        {/* Both ages are read against the chosen date: one clock for the whole map. */}
        {t('layers.compare_side', { date: sideB, age: ageText(sideB, chosenDate) })}
      </span>
      <input
        aria-label={t('layers.compare_divider')}
        aria-valuenow={Math.round(pair.divider * 100)}
        aria-valuetext={t('layers.compare_divider_value', { value: Math.round(pair.divider * 100) })}
        className="compare-divider"
        max={100}
        min={0}
        onChange={(event) => setCompareDivider(active.id, Number(event.target.value) / 100)}
        onKeyDown={(event) => {
          // AC-38: one step per arrow press, focus stays on the divider, the camera is
          // untouched because nothing here reaches the map.
          const step = (direction: number) => {
            event.preventDefault()
            const current = Math.round(pair.divider * 100)
            setCompareDivider(active.id, Math.min(100, Math.max(0, current + direction)) / 100)
          }
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') step(1)
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') step(-1)
          else if (event.key === 'Home') step(-100)
          else if (event.key === 'End') step(100)
        }}
        step={1}
        style={{ left: `${pair.divider * 100}%` }}
        type="range"
        value={Math.round(pair.divider * 100)}
      />
    </div>
  )
}

/** R-25: the label a cached or reserve tile has to carry, and the layer that has neither. */
function OfflineOverlay() {
  const decisions = useMapStore((state) => state.tileDecisions)
  const catalog = useMapStore((state) => state.catalog)
  const on = useMapStore((state) => state.on)
  const rows = catalog
    .filter((entry) => {
      const decision = decisions[entry.id]
      return Boolean(on[entry.id]) && decision !== undefined
        && (decision.source === 'cache-offline' || decision.source === 'reserve' || decision.offline === 'no_offline_copy')
    })
    .map((entry) => ({
      id: entry.id,
      name: t(entry.labelKey ?? entry.label),
      key: decisions[entry.id]?.source === 'reserve'
        ? 'layers.offline_sample' as const
        : decisions[entry.id]?.offline === 'no_offline_copy'
          ? 'layers.no_offline_copy' as const
          : null,
      date: decisions[entry.id]?.date ?? null,
    }))
  if (rows.length === 0) return null
  return (
    <div className="offline-overlay">
      {rows.map((row) => (
        <p className="offline-row" key={row.id} data-dynamic-content>
          <span>{row.name}</span>
          {row.key ? <span>{t(row.key)}</span> : null}
          {row.date ? <time dateTime={row.date}>{row.date}</time> : null}
        </p>
      ))}
    </div>
  )
}

/** Whole days between an effective date and the date the side is read at. */
export function ageText(effectiveDate: string | null, readAt: string | null): string {
  if (!effectiveDate || !readAt) return ''
  const from = Date.parse(`${effectiveDate.slice(0, 10)}T00:00:00Z`)
  const to = Date.parse(`${readAt.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(from) || Number.isNaN(to)) return ''
  const days = Math.max(0, Math.round((to - from) / 86_400_000))
  if (days === 0) return t('layers.age_zero')
  if (days === 1) return t('layers.age_one')
  return t('layers.age_days', { days })
}
