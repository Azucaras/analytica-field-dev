import { describe, expect, it } from 'vitest'
import {
  POLYGON_FILL_OPACITY,
  POLYGON_FILL_OPACITY_HOVER,
  POLYGON_FILL_OPACITY_SELECTED,
  POLYGON_INTERACTIVE_MIN_ZOOM,
  POLYGON_LINE_COLOUR,
  POLYGON_LINE_OPACITY,
  POLYGON_LINE_WIDTH_SELECTED,
  POLYGON_LINE_WIDTH_ZOOM10,
  POLYGON_LINE_WIDTH_ZOOM14,
  UNMAPPED_CLASS_COLOUR,
  classColourExpression,
  classDisplay,
  classPropertyFor,
  fillOpacityExpression,
  lineWidthExpression,
  paintedClassYear,
  unmappedClassColour,
} from './polygon-style'
import { REGION_ADAPTERS, classTableFor } from './regions'

describe('paint constants (AC-11, R-14)', () => {
  it('pins every constant to the value R-14 declares', () => {
    expect(POLYGON_FILL_OPACITY).toBe(0.4)
    expect(POLYGON_FILL_OPACITY_HOVER).toBe(0.55)
    expect(POLYGON_FILL_OPACITY_SELECTED).toBe(0.6)
    expect(POLYGON_LINE_COLOUR).toBe('#ffffff')
    expect(POLYGON_LINE_OPACITY).toBe(0.75)
    expect(POLYGON_LINE_WIDTH_ZOOM10).toBe(0.5)
    expect(POLYGON_LINE_WIDTH_ZOOM14).toBe(1.5)
    expect(POLYGON_LINE_WIDTH_SELECTED).toBe(3)
    expect(UNMAPPED_CLASS_COLOUR).toBe('#8a8f98')
    expect(unmappedClassColour()).toBe(UNMAPPED_CLASS_COLOUR)
  })

  it('keeps the default fill inside the 0.35 to 0.5 band and below the selected value', () => {
    expect(POLYGON_FILL_OPACITY).toBeGreaterThanOrEqual(0.35)
    expect(POLYGON_FILL_OPACITY).toBeLessThanOrEqual(0.5)
    expect(POLYGON_FILL_OPACITY_SELECTED).toBeGreaterThan(POLYGON_FILL_OPACITY_HOVER)
    expect(POLYGON_FILL_OPACITY_HOVER).toBeGreaterThan(POLYGON_FILL_OPACITY)
  })

  it('raises the fill on hover and on selection through the feature state', () => {
    const expression = fillOpacityExpression() as unknown[]
    expect(expression[0]).toBe('case')
    expect(JSON.stringify(expression)).toContain('"selected"')
    expect(JSON.stringify(expression)).toContain('"hover"')
    expect(JSON.stringify(expression)).toContain(String(POLYGON_FILL_OPACITY_SELECTED))
    expect(JSON.stringify(expression)).toContain(String(POLYGON_FILL_OPACITY_HOVER))
    expect(JSON.stringify(expression)).toContain(String(POLYGON_FILL_OPACITY))
  })

  it('carries the selected outline width inside the zoom ramp, where MapLibre accepts a zoom input', () => {
    const expression = lineWidthExpression() as unknown[]
    // The zoom expression may only be the input of a top-level interpolate (MapLibre rule),
    // so the ramp is the outer expression and the selected width is an output value.
    expect(expression[0]).toBe('interpolate')
    expect(expression[2]).toEqual(['zoom'])
    expect(JSON.stringify(expression)).toContain(String(POLYGON_LINE_WIDTH_SELECTED))
    expect(JSON.stringify(expression)).toContain(String(POLYGON_LINE_WIDTH_ZOOM10))
    expect(JSON.stringify(expression)).toContain(String(POLYGON_LINE_WIDTH_ZOOM14))
    expect(JSON.stringify(expression)).toContain('"selected"')
  })
})

describe('the class colour expression (R-15)', () => {
  it('pairs every Brazil row in id order and falls back to the unmapped colour', () => {
    const expression = classColourExpression('mbmode24', classTableFor('br').rows) as unknown[]
    expect(expression[0]).toBe('match')
    expect(expression[1]).toEqual(['coalesce', ['to-number', ['get', 'mbmode24']], -1])
    const pairs = expression.slice(2, -1)
    expect(pairs).toHaveLength(28)
    expect(pairs[0]).toBe(3)
    expect(pairs[1]).toBe('#1f8d49')
    expect(pairs[20]).toBe(46)
    expect(pairs[21]).toBe('#d68fe2')
    expect(expression[expression.length - 1]).toBe(UNMAPPED_CLASS_COLOUR)
    for (const row of classTableFor('br').rows) {
      expect(pairs).toContain(row.hex)
    }
  })

  it('pairs the United States table with its own hexes and no literal outside it', () => {
    const expression = classColourExpression('cdl2025', classTableFor('us').rows) as unknown[]
    const pairs = expression.slice(2, -1) as unknown[]
    expect(pairs).toHaveLength(510)
    expect(pairs[0]).toBe(1)
    expect(pairs[1]).toBe('#ffd300')
    const table = classTableFor('us').rows
    const hexes = pairs.filter((value) => typeof value === 'string')
    expect(new Set(hexes)).toEqual(new Set(table.map((row) => row.hex)))
    // Every pair is the table's own value and hex, in id order.
    for (let index = 0; index < table.length; index += 1) {
      expect(pairs[index * 2]).toBe(table[index].value)
      expect(pairs[index * 2 + 1]).toBe(table[index].hex)
    }
  })

  it('maps code 0 to the unmapped colour because no table holds it', () => {
    for (const rows of [classTableFor('us').rows, classTableFor('br').rows]) {
      expect(rows.some((row) => row.value === 0)).toBe(false)
    }
  })
})

describe('the class property and the painted year (R-13, AC-10)', () => {
  it('clamps the United States year to 2018 to 2025', () => {
    const us = REGION_ADAPTERS.us
    expect(classPropertyFor(us, '2019-06-01')).toBe('cdl2019')
    expect(classPropertyFor(us, '2026-11-12')).toBe('cdl2025')
    expect(classPropertyFor(us, '2017-01-01')).toBe('cdl2018')
    expect(paintedClassYear(us, '2019-06-01')).toBe(2019)
    expect(paintedClassYear(us, '2026-11-12')).toBe(2025)
    expect(paintedClassYear(us, '2017-01-01')).toBe(2018)
  })

  it('never paints a property outside cdl2018 to cdl2025', () => {
    const us = REGION_ADAPTERS.us
    for (const date of ['1990-01-01', '2050-12-31', '2018-01-01', '2025-12-31']) {
      expect(classPropertyFor(us, date)).toMatch(/^cdl20(1[89]|2[0-5])$/)
    }
  })

  it('paints the one class source the load reports in Brazil', () => {
    expect(classPropertyFor(REGION_ADAPTERS.br, '2026-11-12', 'mbmode24')).toBe('mbmode24')
    expect(classPropertyFor(REGION_ADAPTERS.br, '2019-06-01', 'mbmode24')).toBe('mbmode24')
    expect(() => classPropertyFor(REGION_ADAPTERS.br, '2026-11-12')).toThrow(/class source/)
    expect(paintedClassYear(REGION_ADAPTERS.br, '2026-11-12', 'mbmode24')).toBe(2024)
  })

  it('refuses to mix two class properties in one load', () => {
    expect(() => classPropertyFor(REGION_ADAPTERS.br, '2026-11-12', 'class_id')).not.toThrow()
    expect(classPropertyFor(REGION_ADAPTERS.br, '2026-11-12', 'class_id')).toBe('class_id')
    expect(paintedClassYear(REGION_ADAPTERS.br, '2026-11-12', 'class_id')).toBe(2025)
  })
})

describe('class display and the unmapped state (R-21, AC-17)', () => {
  it('resolves a table row to its name and hex', () => {
    expect(classDisplay(REGION_ADAPTERS.br, 39)).toEqual({ classId: 39, name: 'Soybean', hex: '#f5b3c8', unmapped: false })
    expect(classDisplay(REGION_ADAPTERS.us, 5)).toEqual({ classId: 5, name: 'Soybeans', hex: '#267000', unmapped: false })
  })

  it('falls back to the unmapped colour for 0, null, an absent value and an id the table lacks', () => {
    for (const value of [0, null, undefined, 999]) {
      const display = classDisplay(REGION_ADAPTERS.br, value)
      expect(display.hex).toBe(UNMAPPED_CLASS_COLOUR)
      expect(display.unmapped).toBe(true)
      expect(display.name).toBeNull()
    }
    expect(classDisplay(REGION_ADAPTERS.us, 0).name).toBeNull()
  })

  it('treats a row whose name the RAT leaves null as unmapped and never guesses a name', () => {
    const table = classTableFor('us')
    const unnamed = table.rows.find((row) => row.name === null)
    expect(unnamed).toBeDefined()
    const display = classDisplay(REGION_ADAPTERS.us, unnamed?.value ?? -1)
    expect(display.unmapped).toBe(true)
    expect(display.name).toBeNull()
    expect(display.hex).toBe(UNMAPPED_CLASS_COLOUR)
  })

  it('never borrows a class from the other region', () => {
    // 39 is Soybean in Brazil and a different code in the United States table.
    expect(classDisplay(REGION_ADAPTERS.br, 39).name).toBe('Soybean')
    expect(classDisplay(REGION_ADAPTERS.us, 39).name).not.toBe('Soybean')
  })
})

describe('the interactive zoom (R-20, AC-16)', () => {
  it('is the detail floor plus two, read from the region contract', () => {
    expect(POLYGON_INTERACTIVE_MIN_ZOOM(8)).toBe(10)
    expect(POLYGON_INTERACTIVE_MIN_ZOOM(6)).toBe(8)
    expect(POLYGON_INTERACTIVE_MIN_ZOOM(9)).toBe(11)
  })
})
