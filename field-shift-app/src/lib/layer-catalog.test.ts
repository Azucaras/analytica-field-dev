import { describe, expect, it } from 'vitest'
import { LAYER_CATALOG, VECTOR_BASEMAP_STYLE } from './layer-catalog'

describe('layer catalog', () => {
  it('uses the keyless OpenFreeMap Liberty vector basemap, not the zoom-capped MapLibre demo tiles', () => {
    expect(VECTOR_BASEMAP_STYLE).toBe('https://tiles.openfreemap.org/styles/liberty')
    expect(VECTOR_BASEMAP_STYLE).not.toContain('demotiles')
  })

  it('keeps the raster layers apart from the basemap style', () => {
    for (const layer of LAYER_CATALOG) expect(layer.tiles[0]).toContain('/tiles/')
  })
})
