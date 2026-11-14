import { afterEach, describe, expect, it } from 'vitest'
import { t } from './index'
import { en } from './en'

afterEach(() => {
  localStorage.removeItem('fs.locale')
})

describe('t', () => {
  it('uses English when no locale is stored', () => {
    localStorage.removeItem('fs.locale')
    expect(t('map.field_map')).toBe('Field map')
  })

  it('uses an optional pt-BR translation when present and falls back to English otherwise', () => {
    localStorage.setItem('fs.locale', 'pt-BR')
    expect(t('map.field_map')).toBe('Field map')
  })

  it('interpolates named variables in English strings', () => {
    expect(t('notice.ranking_withheld_period', { threshold: t('notice.coverage_below_80_percent') })).toBe(
      'Ranking withheld: coverage below 80%.',
    )
  })

  it('keeps the field coverage readout in a single catalog key', () => {
    expect('map.coverage_label' in en).toBe(false)
    expect('notice.not_enough_valid_area' in en).toBe(false)
    expect(t('map.data_coverage', { coverage: 62 })).toBe('62% data coverage')
  })

  it('keeps the modelled marker and drops the withdrawn constraint keys (AM-02, AM-12)', () => {
    expect(t('evidence.layer_modelled', { layer: 'SMAP soil moisture' })).toBe('SMAP soil moisture (modelled)')
    expect('evidence.layer_assumes' in en).toBe(false)
    expect('evidence.assumes' in en).toBe(false)
    expect(Object.keys(en).filter((key) => key.startsWith('constraints.'))).toEqual([])
    expect('constraints.form_label' in en).toBe(false)
  })
})
