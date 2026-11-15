import { describe, expect, it } from 'vitest'
import {
  familyOf,
  formatMetric,
  interiorPoint,
  isMeasuredBasis,
  numbersOpenFromSearch,
  outerRingOf,
  roundHalfUp,
  searchWithNumbers,
} from './numbers'

describe('Table A formatting (R-18 decimals, round half up)', () => {
  it('rounds half up to the decimals of the family', () => {
    expect(roundHalfUp(2.45, 1)).toBe(2.5)
    expect(roundHalfUp(0.125, 2)).toBe(0.13)
    expect(roundHalfUp(171.93, 1)).toBe(171.9)
  })

  it('prints the Table A decimals and groups thousands in en-US', () => {
    expect(formatMetric('rain_total', 171.93)).toBe('171.9')
    expect(formatMetric('gdd10', 836.46)).toBe('836')
    expect(formatMetric('gwetroot_mean', 0.4898)).toBe('0.49')
    expect(formatMetric('soil.ph.0_5', 5)).toBe('5.0')
    expect(formatMetric('soil.clay.0_5', 225)).toBe('225')
    expect(formatMetric('municipality_soy_ha', 130000)).toBe('130,000')
    expect(formatMetric('polygon_share', 0.01723)).toBe('0.0172')
  })

  it('prints nothing for a null or a non-finite value', () => {
    expect(formatMetric('rain_total', null)).toBe('')
    expect(formatMetric('rain_total', Number.NaN)).toBe('')
  })

  it('maps a metric id to its family, so a per day or per depth id keeps its family', () => {
    expect(familyOf('soil.clay.0_5')).toBe('soil.clay')
    expect(familyOf('smap_surface.2026-10-01')).toBe('smap_surface')
    expect(familyOf('ndvi_mean.2026-10-07')).toBe('ndvi_mean')
    expect(familyOf('rain_total')).toBe('rain_total')
  })
})

describe('basis presentation (R-08)', () => {
  it('presents observed, retrieved and entered as measured, and modelled never', () => {
    expect(isMeasuredBasis('observed')).toBe(true)
    expect(isMeasuredBasis('retrieved')).toBe(true)
    expect(isMeasuredBasis('entered')).toBe(true)
    expect(isMeasuredBasis('modelled')).toBe(false)
  })
})

describe('the ?numbers=1 parameter (R-01, AC-01)', () => {
  it('reads the open state only from the exact parameter', () => {
    expect(numbersOpenFromSearch('?numbers=1')).toBe(true)
    expect(numbersOpenFromSearch('?date=2026-11-12&numbers=1')).toBe(true)
    expect(numbersOpenFromSearch('?numbers=10')).toBe(false)
    expect(numbersOpenFromSearch('?numbers=0')).toBe(false)
    expect(numbersOpenFromSearch('')).toBe(false)
  })

  it('opens by appending the parameter and keeps every other segment byte for byte', () => {
    const search = '?date=2026-11-12&region=br&polygon=381825001868504&basemap=eox%20s2'
    expect(searchWithNumbers(search, true)).toBe(`${search}&numbers=1`)
  })

  it('closes by removing only the numbers parameter', () => {
    expect(searchWithNumbers('?numbers=1&date=2026-11-12&region=br', false)).toBe('?date=2026-11-12&region=br')
    expect(searchWithNumbers('?date=2026-11-12&numbers=1', false)).toBe('?date=2026-11-12')
    expect(searchWithNumbers('?numbers=1', false)).toBe('')
  })

  it('leaves the search alone when closing a search that does not carry the parameter', () => {
    expect(searchWithNumbers('?date=2026-11-12', false)).toBe('?date=2026-11-12')
    expect(searchWithNumbers('', false)).toBe('')
  })

  it('opens an empty search to the parameter alone', () => {
    expect(searchWithNumbers('', true)).toBe('?numbers=1')
  })
})

describe('the request centroid and the outline (Table B)', () => {
  it('returns the area centroid of a convex ring when it lies inside', () => {
    const square: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    expect(interiorPoint(square)).toEqual([1, 1])
  })

  it('returns a point inside a concave ring whose area centroid falls outside it', () => {
    // A square with a notch cut from its left side: the area centroid lies in the notch.
    const notched: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 9], [9, 9], [9, 1], [0, 1], [0, 0]]
    expect(interiorPoint(notched)).toEqual([9.5, 5])
  })

  it('returns null for a ring with fewer than three distinct points', () => {
    expect(interiorPoint([[0, 0], [1, 1]])).toBeNull()
  })

  it('reads the outer ring of a polygon and the first part of a multipolygon, and nothing else', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 0]]
    expect(outerRingOf({ type: 'Polygon', coordinates: [ring] })).toEqual(ring)
    expect(outerRingOf({ type: 'MultiPolygon', coordinates: [[ring], [[[5, 5], [6, 5], [6, 6], [5, 5]]]] })).toEqual(ring)
    expect(outerRingOf({ type: 'Point', coordinates: [0, 0] })).toBeNull()
    expect(outerRingOf({ type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] })).toBeNull()
    expect(outerRingOf(null)).toBeNull()
  })
})
