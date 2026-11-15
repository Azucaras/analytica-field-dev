import { describe, expect, it } from 'vitest'
import { classIdFrom, legendRows } from './polygon-legend'
import { REGION_ADAPTERS } from './regions'
import { UNMAPPED_CLASS_COLOUR } from './polygon-style'

describe('the legend rows (R-37, AC-30)', () => {
  it('lists only the classes in view, ordered by ascending class id', () => {
    const rows = legendRows([41, 39, 15, 39, 41, 3], REGION_ADAPTERS.br)
    expect(rows.map((row) => row.classId)).toEqual([3, 15, 39, 41])
    expect(rows.map((row) => row.classId)).not.toContain(4)
  })

  it('carries the table name and hex on every swatch', () => {
    const rows = legendRows([39, 15], REGION_ADAPTERS.br)
    expect(rows[0]).toMatchObject({ classId: 15, name: 'Pasture', hex: '#edde8e', unmapped: false })
    expect(rows[1]).toMatchObject({ classId: 39, name: 'Soybean', hex: '#f5b3c8', unmapped: false })
  })

  it('appends the unmapped row once, last, while an unmapped polygon is in view', () => {
    const rows = legendRows([0, 39, null, 999], REGION_ADAPTERS.br)
    expect(rows).toHaveLength(2)
    expect(rows[rows.length - 1]).toMatchObject({
      classId: null,
      name: null,
      nameKey: 'polygon.class_not_mapped',
      hex: UNMAPPED_CLASS_COLOUR,
      unmapped: true,
    })
    expect(rows.filter((row) => row.unmapped)).toHaveLength(1)
  })

  it('returns no row for an empty view, so the region prints its empty text', () => {
    expect(legendRows([], REGION_ADAPTERS.us)).toEqual([])
  })

  it('never prints the whole 255 row table for a handful of classes in view', () => {
    const rows = legendRows([1, 5, 23], REGION_ADAPTERS.us)
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.name)).toEqual(['Corn', 'Soybeans', 'Spring Wheat'])
  })

  it('reads the class id from the tile property, in either region', () => {
    expect(classIdFrom(REGION_ADAPTERS.br, { mbmode24: 39 }, 'mbmode24')).toBe(39)
    expect(classIdFrom(REGION_ADAPTERS.us, { cdl2025: 5 }, 'cdl2025')).toBe(5)
    expect(classIdFrom(REGION_ADAPTERS.us, { cdl2025: 0 }, 'cdl2025')).toBe(0)
    expect(classIdFrom(REGION_ADAPTERS.us, {}, 'cdl2025')).toBeNull()
    expect(classIdFrom(REGION_ADAPTERS.us, { cdl2025: null }, 'cdl2025')).toBeNull()
    expect(classIdFrom(REGION_ADAPTERS.br, { mbmode24: '39' }, 'mbmode24')).toBe(39)
  })
})
