import { afterEach, describe, expect, it } from 'vitest'
import { t } from './index'
import { en } from './en'
import { ptBR } from './pt-BR'

afterEach(() => {
  localStorage.removeItem('fs.locale')
})

describe('t', () => {
  it('uses Portuguese when no locale is stored', () => {
    localStorage.removeItem('fs.locale')
    expect(t('map.field_map')).toBe('Mapa de talhões')
  })

  it('uses English once the switch stores it', () => {
    localStorage.setItem('fs.locale', 'en')
    expect(t('map.field_map')).toBe('Field map')
  })

  it('carries a Portuguese value with the same placeholders for every English key', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]).sort()
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(typeof ptBR[key], key).toBe('string')
      expect(placeholders(ptBR[key]), key).toEqual(placeholders(en[key]))
    }
    expect(Object.keys(ptBR).sort()).toEqual(Object.keys(en).sort())
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

  it('keeps the modelled marker and drops the withdrawn constraint keys', () => {
    expect(t('evidence.layer_modelled', { layer: 'SMAP soil moisture' })).toBe('SMAP soil moisture (modelled)')
    expect('evidence.layer_assumes' in en).toBe(false)
    expect('evidence.assumes' in en).toBe(false)
    expect(Object.keys(en).filter((key) => key.startsWith('constraints.'))).toEqual([])
    expect('constraints.form_label' in en).toBe(false)
  })
})
