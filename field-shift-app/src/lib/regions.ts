/**
 * R-01 and R-02: one region adapter interface and exactly two entries.
 *
 * Every source specific value of Data contracts Table A is a field here. A requirement
 * never writes one of them as a literal, and a third region would be one more entry plus
 * one more column in the table, not a rewritten requirement set.
 *
 * The zoom bounds are not constants of this module: R-05 makes the United States detail
 * floor a build measurement read from `data/polygons/us-38017.manifest.json`, and AC-03
 * fails a load that mounts a source without that manifest. Brazil's bounds are the measured
 * constants of Table B, which is why they are written here.
 */
import { classTableFor, type ClassTable } from './polygon-class-tables'

export type RegionId = 'us' | 'br'

export const REGION_IDS = ['us', 'br'] as const

/** Table A: the load default is the United States at every width (R-01). */
export const DEFAULT_REGION_ID: RegionId = 'us'

export type RegionTiers = {
  detail: { minzoom: number; maxzoom: number }
  overview: { minzoom: number; maxzoom: number } | null
  interactiveMinzoom: number
}

/** Table A, the class source cell: the United States paints `cdl{Y}`, Brazil one tile property. */
export type ClassSource = 'cdl-year' | 'mbmode24' | 'class_id'

export type RegionAdapter = {
  id: RegionId
  /** Table A: the visible label, the same in both languages. */
  label: string
  defaultView: { center: [number, number]; zoom: number }
  /** Table A: the geometry source and its tier addresses, relative to the app origin. */
  detailFile: string
  overviewFile: string
  /** Table G: the zoom contract file; null for Brazil, which reads no manifest (AC-03). */
  manifestFile: string | null
  sourceLayer: 'trazo'
  /** Table A: the id property, its type and the `select_field` prefix. */
  idProperty: 'csbid' | 'Id'
  idType: 'string' | 'number'
  commandPrefix: 'csb' | 'trazo'
  /** Table A, feature properties read. Nothing outside this list is read (R-04). */
  properties: readonly string[]
  classTable: ClassTable
  classSource: ClassSource
  /** R-13: the release's year range, or null where the class year is not a year of the date. */
  classYearRange: readonly [number, number] | null
  /** Table A: the area property, its unit and the two absence texts of R-25. */
  areaProperty: string
  areaUnit: 'acres' | 'ha'
  /** Row R-25, the Brazil sidecar row carries the area, not the tile. */
  areaFromSidecar: boolean
  basis: 'retrieved' | 'modelled'
  /** Table F: the exact source string, which the region and the attribution both print. */
  sourceString: string
  licence: string
  fixtureIds: readonly string[]
  hosting: 'self-hosted' | 'source-direct'
  /** Table B, Brazil only: the source-direct file of Mode B, which carries no overview level. */
  sourceDirectUrl: string | null
  tileBudget: { detail: number; overview: number; hard: number }
  /** Table B: the Brazil bounds, measured. The United States reads the manifest instead. */
  measuredTiers: RegionTiers | null
}

export const REGION_ADAPTERS: Record<RegionId, RegionAdapter> = {
  us: {
    id: 'us',
    label: 'United States',
    defaultView: { center: [-97.17, 46.93], zoom: 11 },
    detailFile: 'data/polygons/us-38017-detail.pmtiles',
    overviewFile: 'data/polygons/us-38017-overview.pmtiles',
    manifestFile: 'data/polygons/us-38017.manifest.json',
    sourceLayer: 'trazo',
    idProperty: 'csbid',
    idType: 'string',
    commandPrefix: 'csb',
    properties: [
      'csbid',
      'csbacres',
      'cdl2018',
      'cdl2019',
      'cdl2020',
      'cdl2021',
      'cdl2022',
      'cdl2023',
      'cdl2024',
      'cdl2025',
    ],
    classTable: classTableFor('us'),
    classSource: 'cdl-year',
    classYearRange: [2018, 2025],
    areaProperty: 'csbacres',
    areaUnit: 'acres',
    areaFromSidecar: false,
    basis: 'retrieved',
    sourceString:
      'Crop Sequence Boundaries (USDA NASS and ERS), public domain; CDL (USDA NASS), public domain',
    licence: 'CSB and CDL public domain; the Table F string is a courtesy credit',
    fixtureIds: ['381825001868504', '381825001868512', '381825001868517'],
    hosting: 'self-hosted',
    sourceDirectUrl: null,
    tileBudget: { detail: 250_000, overview: 300_000, hard: 1_000_000 },
    measuredTiers: null,
  },
  br: {
    id: 'br',
    label: 'Brazil',
    defaultView: { center: [-55.27, -11.91], zoom: 11 },
    detailFile: 'data/polygons/br-mt-detail.pmtiles',
    overviewFile: 'data/polygons/br-mt-overview.pmtiles',
    manifestFile: null,
    sourceLayer: 'trazo',
    idProperty: 'Id',
    idType: 'number',
    commandPrefix: 'trazo',
    properties: ['Id', 'mbmode24'],
    classTable: classTableFor('br'),
    classSource: 'mbmode24',
    classYearRange: null,
    areaProperty: 'area_ha',
    areaUnit: 'ha',
    areaFromSidecar: true,
    basis: 'modelled',
    sourceString: 'Trazo3 field boundaries, WRI and ASU (Grupp et al. 2026), CC BY 4.0',
    licence: 'Trazo3 CC BY 4.0, attribution to Trazo and WRI; MapBiomas legend for the classes',
    fixtureIds: ['mt-santa-carmem-01', 'mt-santa-carmem-02', 'mt-santa-carmem-03'],
    hosting: 'source-direct',
    sourceDirectUrl:
      'https://data.source.coop/wri-data-lab/trazofields/trazo3-fields/trazo3.pmtiles',
    tileBudget: { detail: 250_000, overview: 300_000, hard: 1_000_000 },
    measuredTiers: {
      detail: { minzoom: 8, maxzoom: 12 },
      overview: { minzoom: 5, maxzoom: 7 },
      interactiveMinzoom: 10,
    },
  },
}

/** R-01: the active region is one store value and the default is the United States. */
export function regionAdapter(regionId: RegionId): RegionAdapter {
  return REGION_ADAPTERS[regionId] ?? REGION_ADAPTERS[DEFAULT_REGION_ID]
}

/**
 * R-01: the region is chosen by `?region=` alone, and an unknown or absent value leaves the
 * United States active. `br` is the only value that selects the secondary region.
 */
export function regionFromSearch(search: string): RegionId {
  const value = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('region')
  return value === 'br' ? 'br' : DEFAULT_REGION_ID
}

/** R-03: `?region=br` is written when Brazil is active and removed for the default. */
export function searchWithRegion(search: string, regionId: RegionId): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (regionId === DEFAULT_REGION_ID) params.delete('region')
  else params.set('region', regionId)
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}

/** Table G: the nine keys a United States manifest carries, and no other. */
export const US_MANIFEST_KEYS = [
  'schema_version',
  'region',
  'clip_box',
  'detail_minzoom',
  'detail_maxzoom',
  'overview_minzoom',
  'overview_maxzoom',
  'interactive_minzoom',
] as const

export type UsManifest = {
  schema_version: '1'
  region: 'us'
  clip_box: string
  detail_minzoom: number
  detail_maxzoom: number
  overview_minzoom: number
  overview_maxzoom: number
  interactive_minzoom: number
}

/** Table G: the pilot box, in west, south, east, north order. */
export const US_PILOT_CLIP_BOX = '-97.20,46.90,-97.14,46.96'

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

/**
 * Table G, read strictly. R-05 forbids a defaulted key, and AC-03 fails a load that mounts
 * a source without a manifest, so every rule is a throw rather than a fallback: a missing
 * key, a key outside the table, a wrong type, a clip box that is not the pilot box, a
 * detail floor above 9, or a derived zoom that does not match its own rule.
 */
export function parseUsManifest(raw: unknown): UsManifest {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('us-38017.manifest.json must be a JSON object')
  }
  const value = raw as Record<string, unknown>
  for (const key of Object.keys(value)) {
    if (!(US_MANIFEST_KEYS as readonly string[]).includes(key)) {
      throw new Error(`us-38017.manifest.json carries a key outside Table G: ${key}`)
    }
  }
  for (const key of US_MANIFEST_KEYS) {
    if (!Object.hasOwn(value, key)) {
      throw new Error(`us-38017.manifest.json is missing the Table G key ${key}`)
    }
  }
  if (value.schema_version !== '1') throw new Error('schema_version must be the string "1"')
  if (value.region !== 'us') throw new Error('region must be "us"')
  if (value.clip_box !== US_PILOT_CLIP_BOX) throw new Error('clip_box must be the pilot box of R-05')
  for (const key of ['detail_minzoom', 'detail_maxzoom', 'overview_minzoom', 'overview_maxzoom', 'interactive_minzoom'] as const) {
    if (!isInteger(value[key])) throw new Error(`${key} must be an integer`)
  }
  const manifest = value as unknown as UsManifest
  if (manifest.detail_maxzoom !== 14) throw new Error('detail_maxzoom must be 14')
  if (manifest.detail_minzoom < 6 || manifest.detail_minzoom > 14) {
    throw new Error('detail_minzoom must be a zoom in 6 to 14')
  }
  // R-05: the build fails above 9, because selection has to work at the default zoom 11.
  if (manifest.detail_minzoom > 9) throw new Error('detail_minzoom must be at most 9')
  if (manifest.overview_minzoom !== manifest.detail_minzoom - 3) {
    throw new Error('overview_minzoom must equal detail_minzoom - 3')
  }
  if (manifest.overview_maxzoom !== manifest.detail_minzoom - 1) {
    throw new Error('overview_maxzoom must equal detail_minzoom - 1')
  }
  if (manifest.interactive_minzoom !== manifest.detail_minzoom + 2) {
    throw new Error('interactive_minzoom must equal detail_minzoom + 2')
  }
  return manifest
}

/**
 * R-05, R-06, R-20: the tier bounds in force for a load. The United States takes all three
 * from the manifest and refuses to invent one; Brazil uses the measured Table B values and
 * reads no manifest at all (AC-03).
 */
export function tiersFor(regionId: RegionId, manifest?: UsManifest | null): RegionTiers {
  if (regionId === 'br') {
    const measured = REGION_ADAPTERS.br.measuredTiers
    if (!measured) throw new Error('Brazil tiers are the measured Table B values')
    return measured
  }
  if (!manifest) {
    throw new Error(
      'the United States detail tier needs data/polygons/us-38017.manifest.json; no zoom bound is invented',
    )
  }
  return {
    detail: { minzoom: manifest.detail_minzoom, maxzoom: manifest.detail_maxzoom },
    overview: { minzoom: manifest.overview_minzoom, maxzoom: manifest.overview_maxzoom },
    interactiveMinzoom: manifest.interactive_minzoom,
  }
}

/** R-07, R-12: the lowest mounted tier is the number the zoom line prints. */
export function lowestMountedZoom(tiers: RegionTiers): number {
  return tiers.overview ? Math.min(tiers.detail.minzoom, tiers.overview.minzoom) : tiers.detail.minzoom
}

export { classTableFor }
export type { ClassTable, ClassRow } from './polygon-class-tables'
