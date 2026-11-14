export type LayerBasis = 'observed' | 'retrieved' | 'modelled' | 'entered'

export type LayerMetadata = {
  id: string
  label: string
  basis: LayerBasis
  resolution: string
  as_of: string
}

export type RasterLayer = Omit<LayerMetadata, 'as_of'> & {
  tiles: string[]
  tileSize: number
  attribution: string
}

export const LAYER_CATALOG = [
  {
    id: 'smap',
    label: 'SMAP soil moisture',
    basis: 'retrieved',
    resolution: '9 km',
    tiles: [`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/tiles/smap-soil-moisture/{z}/{x}/{y}`],
    tileSize: 256,
    attribution: 'NASA GIBS SMAP',
  },
] as const satisfies readonly RasterLayer[]

export const VECTOR_BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
