import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { SMAP_SCALE_MAX, SmapBar } from './SmapBar'

afterEach(() => {
  cleanup()
})

function renderBar(overrides: Partial<Parameters<typeof SmapBar>[0]> = {}) {
  const props = {
    value: '0.28 m³/m³' as string | null | undefined,
    basis: 'retrieved' as const,
    asOf: '2025-11-10',
    scaleMax: SMAP_SCALE_MAX,
    ...overrides,
  }
  const { container } = render(<SmapBar {...props} />)
  const group = container.querySelector('[role="group"]') as HTMLElement
  const fill = container.querySelector('.smap-fill') as HTMLElement
  return { container, group, fill }
}

describe('SmapBar', () => {
  it('draws a retrieved fixture value as measured and keeps the fixture string as text', () => {
    expect(SMAP_SCALE_MAX).toBe(0.5)

    const { group, fill } = renderBar()

    expect(fill.style.width).toBe('56%')
    expect(fill.getAttribute('data-fill-percent')).toBe('56')
    expect(group.textContent).toContain('SMAP soil moisture')
    expect(group.textContent).toContain('0.28 m³/m³')
    expect(group.textContent).toContain('retrieved')
    expect(group.textContent).toContain('2025-11-10')
    expect(group.textContent).not.toContain('modelled')
    expect(group.textContent).not.toContain('assumes')
  })

  it('treats observed, retrieved and entered as the measured bases', () => {
    for (const basis of ['observed', 'retrieved', 'entered'] as const) {
      const { fill } = renderBar({ basis })
      expect(fill.style.width, basis).toBe('56%')
      cleanup()
    }
  })

  it('scales every fixture value against the same maximum', () => {
    expect(renderBar({ value: '0.19 m³/m³' }).fill.style.width).toBe('38%')
    cleanup()
    expect(renderBar({ value: '0.31 m³/m³' }).fill.style.width).toBe('62%')
  })

  it('names the group with the layer, the value and the basis (accessible names)', () => {
    const { group } = renderBar()

    expect(group.getAttribute('aria-label')).toBe('SMAP soil moisture, 0.28 m³/m³, retrieved')
  })

  it('marks a modelled row, draws 0 px and prints no digit', () => {
    const { group, fill } = renderBar({ basis: 'modelled', value: '0.46' })

    expect(fill.style.width).toBe('0px')
    expect(fill.getAttribute('data-fill-percent')).toBe('0')
    expect(group.textContent).toContain('SMAP soil moisture (modelled)')
    expect(group.textContent).toContain('modelled')
    expect(group.textContent).not.toMatch(/\d/)
    expect(group.textContent).not.toContain('assumes')
    expect(group.getAttribute('aria-label')).toBe('SMAP soil moisture (modelled)')
  })

  it('draws 0 px with the literal label for null, Not entered and a missing row', () => {
    const cases = [
      { name: 'null value', overrides: { value: null, basis: 'retrieved' as const }, literal: 'No observation' },
      { name: 'Not entered value', overrides: { value: 'Not entered', basis: 'entered' as const }, literal: 'Not entered' },
      { name: 'no SMAP row', overrides: { value: undefined, basis: undefined }, literal: 'Not reported for this option' },
    ]

    for (const emptyCase of cases) {
      const { group, fill } = renderBar(emptyCase.overrides)

      expect(fill.style.width, emptyCase.name).toBe('0px')
      expect(fill.getAttribute('data-fill-percent'), emptyCase.name).toBe('0')
      expect(group.textContent, emptyCase.name).toContain(emptyCase.literal)
      expect(group.textContent, emptyCase.name).not.toMatch(/\d/)
      cleanup()
    }
  })

  it('keeps the track mounted and empty in every unmeasured state', () => {
    for (const overrides of [{ value: null }, { value: 'Not entered' }, { value: undefined }, { basis: 'modelled' as const, value: '0.46' }]) {
      const { container } = renderBar(overrides)
      const track = container.querySelector('.smap-track') as HTMLElement

      expect(track).not.toBeNull()
      expect(track.querySelector('.smap-fill')).not.toBeNull()
      cleanup()
    }
  })

  it('names the empty states with the same literal as the visible one', () => {
    expect(renderBar({ value: undefined, basis: undefined }).group.getAttribute('aria-label'))
      .toBe('SMAP soil moisture, Not reported for this option')
    cleanup()
    expect(renderBar({ value: null }).group.getAttribute('aria-label'))
      .toBe('SMAP soil moisture, No observation')
    cleanup()
    expect(renderBar({ basis: 'modelled', value: '0.46' }).group.getAttribute('aria-label'))
      .toBe('SMAP soil moisture (modelled)')
  })
})
