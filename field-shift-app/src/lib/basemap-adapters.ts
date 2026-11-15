/**
 * R-43: the basemap is an adapter boundary in the registry.
 *
 * Block 4 renders no basemap change (block 5 F-29 renders it), so this module issues no
 * request at all: it holds the two adapter entries the spec's Table E fixes, the attribution
 * strings of Table F, and the one selection rule of R-43. The Google adapter is never
 * active without `VITE_GOOGLE_MAPS_API_KEY`, and nothing here reads a key from anywhere else.
 *
 * Field names follow R-29 of the block 5 spec, which is the requirement that renders this
 * boundary: `id`, `label`, `tiles`, `tileSize`, `minzoom`, `maxzoom`, `attribution` (a list
 * of `{text, url}`), `requiresKey`, `cache` and `selectable()`. Block 4 adds only the
 * licence and the visible short credit, because R-43 asks for the licence wording as well.
 */

/** The `?basemap=` values of the two adapters (Table E). */
export type BasemapAdapterId = 'eox-s2cloudless-2024' | 'google-satellite'

/** One entry of R-29's `attribution` list: the text and the URL it carries. */
export type BasemapAttributionEntry = { text: string; url: string }

/** The build-time environment the selection rule reads. Only one name is ever read from it. */
export type BasemapEnvironment = Record<string, unknown>

export type BasemapAdapter = {
  id: BasemapAdapterId
  label: string
  tiles: string
  tileSize: number
  minzoom: number
  maxzoom: number
  /**
   * R-29's link list: each entry is one anchor of the credit, with the text that anchor
   * carries and the URL it points at. The EOX licence needs both of its two URLs.
   */
  attribution: readonly BasemapAttributionEntry[]
  /**
   * Table F, by character. For EOX this is the 111 character string quoted from the
   * licence page, and it is the plain text a renderer shows when it shows the credit
   * without links. For Google Table F records "the Google logo and the Google
   * attribution, rendered by the adapter", so this field names the adapter only.
   */
  attributionText: string
  /** Table F's visible short credit. */
  shortCredit: string
  /** Table E's licence cell, by character. */
  licence: string
  /** R-31: the session route of the Google adapter; null for EOX, which needs no session. */
  sessionUrl: string | null
  requiresKey: boolean
  cache: 'allowed' | 'forbidden'
  /** R-43: the adapter is selectable only when its own requirement is met. */
  selectable: (environment?: BasemapEnvironment) => boolean
}

/** Table E: the EOX tile template, exactly as written. No key and no credential. */
export const EOX_TILES =
  'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg'

/** Table E: the Google tile template, exactly as written. */
export const GOOGLE_TILES =
  'https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session={session}&key={key}'

/** R-31: the session route, called once per page load when the Google adapter is active. */
export const GOOGLE_SESSION_URL = 'https://tile.googleapis.com/v1/createSession?key={key}'

/** Table F, 111 characters, quoted from the EOX licence page on 2026-11-14 (M-09). */
export const EOX_ATTRIBUTION_TEXT =
  'EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024)'

/** Table F, 53 characters. The visible short credit of the same licence. */
export const EOX_SHORT_CREDIT = 'EOxCloudless by EOX IT Services GmbH, CC BY-NC-SA 4.0'

/** Table F: the Google row carries no string of this app, only the logo and the credit. */
export const GOOGLE_ATTRIBUTION_TEXT = 'Google'

/** R-43 reads this name and no other, so a key placed anywhere else cannot activate Google. */
export function googleMapsApiKey(environment: BasemapEnvironment = import.meta.env): string | null {
  const key = environment.VITE_GOOGLE_MAPS_API_KEY
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * R-43: the default adapter is the EOX Sentinel-2 cloudless 2024 layer. The Google adapter
 * is selected only when `VITE_GOOGLE_MAPS_API_KEY` is present, so a build without the key
 * cannot reach a Google host by any path this module offers.
 */
export const BASEMAP_ADAPTERS: readonly BasemapAdapter[] = [
  {
    id: 'eox-s2cloudless-2024',
    label: 'EOX Sentinel-2 cloudless 2024',
    tiles: EOX_TILES,
    tileSize: 256,
    minzoom: 5,
    maxzoom: 14,
    attribution: [
      { text: 'EOxCloudless', url: 'https://cloudless.eox.at' },
      { text: 'EOX IT Services GmbH', url: 'https://eox.at' },
    ],
    attributionText: EOX_ATTRIBUTION_TEXT,
    shortCredit: EOX_SHORT_CREDIT,
    licence: 'CC BY-NC-SA 4.0 for 2018 to 2025',
    sessionUrl: null,
    requiresKey: false,
    cache: 'allowed',
    selectable: () => true,
  },
  {
    id: 'google-satellite',
    label: 'Google satellite',
    tiles: GOOGLE_TILES,
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    attribution: [{ text: GOOGLE_ATTRIBUTION_TEXT, url: 'https://www.google.com/' }],
    attributionText: GOOGLE_ATTRIBUTION_TEXT,
    shortCredit: GOOGLE_ATTRIBUTION_TEXT,
    licence: 'Google Maps Platform terms, billing required',
    sessionUrl: GOOGLE_SESSION_URL,
    requiresKey: true,
    cache: 'forbidden',
    selectable: (environment) => googleMapsApiKey(environment) !== null,
  },
]

export const DEFAULT_BASEMAP_ADAPTER: BasemapAdapter = BASEMAP_ADAPTERS[0]

/**
 * R-43: the active adapter. The EOX adapter is the default, not a fallback: the key is the
 * only input, and with the key absent the answer is EOX before any request could be made.
 */
export function activeBasemapAdapter(environment: BasemapEnvironment = import.meta.env): BasemapAdapter {
  const google = BASEMAP_ADAPTERS.find((adapter) => adapter.id === 'google-satellite')
  if (google && google.selectable(environment)) return google
  return DEFAULT_BASEMAP_ADAPTER
}
