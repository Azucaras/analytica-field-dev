import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildLayerCatalog,
  layerTileTemplate,
  markCatalogUnavailable,
  LAYER_CATALOG,
  VECTOR_BASEMAP_STYLE,
  type LayersResponse,
} from './layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from './recorded-layers-response'
import { en } from '@/strings/en'

/** The recorded response on disk, read so the module copy cannot drift from the evidence. */
const recordedOnDisk = JSON.parse(
  readFileSync(resolve(process.cwd(), 'artifacts/fixtures/layers-response-2026-11-12.json'), 'utf8'),
) as LayersResponse

describe('layer catalog', () => {
  it('uses the keyless OpenFreeMap Liberty vector basemap, not the zoom-capped MapLibre demo tiles', () => {
    expect(VECTOR_BASEMAP_STYLE).toBe('https://tiles.openfreemap.org/styles/liberty')
    expect(VECTOR_BASEMAP_STYLE).not.toContain('demotiles')
  })

  it('reads the same bytes as the recorded /layers evidence', () => {
    expect(RECORDED_LAYERS_RESPONSE).toEqual(recordedOnDisk)
  })

  it('is generated from the /layers response, in the order the response fixes (13 entries)', () => {
    const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)
    expect(catalog).toHaveLength(13)
    expect(catalog.map((entry) => entry.id)).toEqual(recordedOnDisk.layers.map((layer) => layer.id))
    expect(catalog.map((entry) => entry.id)).toEqual([
      'smap-l3', 'smap-l4-surface', 'smap-l4-root', 'imerg-daily', 'imerg-30min',
      'ndvi-8day', 'evi-8day', 'ndvi-monthly', 'lst-terra', 'lst-aqua',
      'hls-l30', 'hls-s30', 'grace-mascon',
    ])
  })

  it('takes every display label from the string catalog with the exact spec text', () => {
    const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)
    const expected: Record<string, string> = {
      'smap-l3': 'SMAP soil moisture',
      'smap-l4-surface': 'SMAP L4 surface soil moisture',
      'smap-l4-root': 'SMAP L4 root-zone soil moisture',
      'imerg-daily': 'IMERG precipitation, daily',
      'imerg-30min': 'IMERG precipitation, 30 minutes',
      'ndvi-8day': 'MODIS NDVI, 8 day',
      'evi-8day': 'MODIS EVI, 8 day',
      'ndvi-monthly': 'MODIS NDVI, monthly',
      'lst-terra': 'MODIS land surface temperature, Terra',
      'lst-aqua': 'MODIS land surface temperature, Aqua',
      'hls-l30': 'HLS Landsat reflectance, 30 m',
      'hls-s30': 'HLS Sentinel-2 reflectance, 30 m',
      'grace-mascon': 'GRACE water storage, stale',
    }
    for (const entry of catalog) {
      expect(entry.labelKey).toBe(`layers.name.${entry.id}`)
      expect(en[entry.labelKey!]).toBe(expected[entry.id])
      expect(expected[entry.id]).toBe(entry.label)
    }
  })

  it('carries the fields the rail reads, and no hand-written tile list', () => {
    const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)
    for (const entry of catalog) {
      expect(entry).toEqual(expect.objectContaining({
        id: expect.any(String),
        label: expect.any(String),
        basis: expect.any(String),
        resolution: expect.any(String),
        max_zoom: expect.any(Number),
        optical: expect.any(Boolean),
        status: expect.any(String),
      }))
      expect('tiles' in entry).toBe(false)
      expect(layerTileTemplate(entry.id, '2026-11-12')).toContain(`/tiles/${entry.id}/{z}/{x}/{y}?date=2026-11-12`)
    }
  })

  it('keeps every row without a date or an age while /layers has not answered (R-24)', () => {
    for (const entry of LAYER_CATALOG) {
      expect(entry.status).toBe('unavailable')
      expect(entry.effective_date).toBeNull()
      expect(entry.age_days).toBeNull()
    }
    expect(markCatalogUnavailable(buildLayerCatalog(RECORDED_LAYERS_RESPONSE)).map((entry) => entry.status))
      .toEqual(Array.from({ length: 13 }, () => 'unavailable'))
  })
})
