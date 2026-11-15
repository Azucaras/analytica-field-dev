/**
 * R-22, R-23 and R-19: the selection of a polygon, its two id forms and the feature state
 * call. The command helper builds the `field_id` of R-22, and the URL helpers read and write
 * the one `?polygon=` parameter of R-23.
 *
 * The csbid is a fifteen digit string and is never parsed as a number or trimmed (R-23); the
 * Trazo3 `Id` is an integer. Both rules are in the region adapter, not here.
 */
import type { RegionAdapter } from './regions'

export const POLYGON_PARAM = 'polygon'

/** A Trazo3 id is an integer key; the source holds about 1.4 million fields (M-06, M-16). */
const TRAZO_ID_PATTERN = /^\d{1,12}$/
/** A CSB id is fifteen digits and may carry leading zeros (R-23). */
const CSB_ID_PATTERN = /^\d{15}$/

export type PolygonRawId = string | number

/** R-22: the `field_id` the `select_field` command receives, region prefix and raw id. */
export function commandFieldId(region: RegionAdapter, rawId: PolygonRawId): string {
  return `${region.commandPrefix}:${rawId}`
}

/**
 * The inverse, with the region's own type and shape. Null means the id does not resolve in
 * this region, which is what R-23 clears on.
 */
export function rawIdFromCommandFieldId(region: RegionAdapter, fieldId: string): PolygonRawId | null {
  if (!fieldId.startsWith(`${region.commandPrefix}:`)) return null
  const raw = fieldId.slice(region.commandPrefix.length + 1)
  if (region.idType === 'string') return CSB_ID_PATTERN.test(raw) ? raw : null
  if (!TRAZO_ID_PATTERN.test(raw)) return null
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) ? parsed : null
}

/** R-23: the selection survives a reload and a share of the URL, as a string in both regions. */
export function polygonIdFromSearch(search: string, region: RegionAdapter): PolygonRawId | null {
  const value = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(POLYGON_PARAM)
  if (value === null) return null
  // The parameter carries the raw id. A prefixed form is not what this app writes.
  if (value.includes(':')) return null
  if (region.idType === 'string') return CSB_ID_PATTERN.test(value) ? value : null
  if (!TRAZO_ID_PATTERN.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

/** R-23: at most one `?polygon=`, and the region parameter is left exactly as it was. */
export function searchWithPolygon(search: string, region: RegionAdapter, rawId: PolygonRawId | null): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (rawId === null) params.delete(POLYGON_PARAM)
  else params.set(POLYGON_PARAM, String(rawId))
  void region
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}

/**
 * R-19: the feature state call shape. The id keeps its own type, and `promoteId` of R-04 is
 * what makes the call address one feature. No filter is rebuilt and no `Number()` is applied
 * to a csbid.
 */
export function featureStateCall(
  source: string,
  sourceLayer: string,
  rawId: PolygonRawId,
): { source: string; sourceLayer: string; id: PolygonRawId } {
  return { source, sourceLayer, id: rawId }
}
