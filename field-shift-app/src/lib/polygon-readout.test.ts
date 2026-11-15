import { afterEach, describe, expect, it, vi } from 'vitest'
import { REGION_ADAPTERS } from './regions'
import { BASEMAP_ADAPTERS, EOX_SHORT_CREDIT } from './basemap-adapters'
import {
  attributionCreditName,
  collapseAttributionControl,
  fetchPolygonArea,
  nameAttributionToggle,
  provenanceLine,
  rawFeatureFrom,
  readoutRows,
} from './polygon-readout'
import { en } from '@/strings/en'

const us = REGION_ADAPTERS.us
const br = REGION_ADAPTERS.br

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Table F strings (R-48, AC-40)', () => {
  it('carries the exact 67 and 91 character source strings and the 53 character EOX credit', () => {
    expect(br.sourceString).toBe('Trazo3 field boundaries, WRI and ASU (Grupp et al. 2026), CC BY 4.0')
    expect(br.sourceString).toHaveLength(67)
    expect(us.sourceString).toBe(
      'Crop Sequence Boundaries (USDA NASS and ERS), public domain; CDL (USDA NASS), public domain',
    )
    expect(us.sourceString).toHaveLength(91)
    expect(EOX_SHORT_CREDIT).toBe('EOxCloudless by EOX IT Services GmbH, CC BY-NC-SA 4.0')
    expect(EOX_SHORT_CREDIT).toHaveLength(53)
  })
})

describe('R-25 readout rows, United States (AC-21)', () => {
  const properties = { csbid: '381825001868504', csbacres: 153.18667449, cdl2025: 5 }

  it('prints exactly five rows in the order Class, Area, Basis, Class year, Source', () => {
    const { rows } = readoutRows({
      region: us,
      selected: true,
      raw: rawFeatureFrom(us, properties, 'cdl2025'),
      date: '2026-11-12',
      classSource: 'cdl-year',
      sidecar: { status: 'idle' },
    })
    expect(rows.map((row) => row.key)).toEqual(['class', 'area', 'basis', 'class_year', 'source'])
    expect(rows.map((row) => row.label)).toEqual(['Class', 'Area', 'Basis', 'Class year', 'Source'])
  })

  it('prints Soybeans, 153.2 acres, retrieved, CDL 2025 and the Table F string', () => {
    const { rows } = readoutRows({
      region: us,
      selected: true,
      raw: rawFeatureFrom(us, properties, 'cdl2025'),
      date: '2026-11-12',
      classSource: 'cdl-year',
      sidecar: { status: 'idle' },
    })
    expect(rows.map((row) => row.value)).toEqual([
      'Soybeans',
      '153.2 acres',
      'retrieved',
      'CDL 2025',
      us.sourceString,
    ])
  })

  it('prints Area not available when csbacres is absent, and never computes an area', () => {
    const { rows } = readoutRows({
      region: us,
      selected: true,
      raw: rawFeatureFrom(us, { csbid: '381825001868504', cdl2025: 5 }, 'cdl2025'),
      date: '2026-11-12',
      classSource: 'cdl-year',
      sidecar: { status: 'idle' },
    })
    expect(rows[1].value).toBe('Area not available')
  })

  it('paints and names the clamped year: 2019 date reads cdl2019, 2017 reads cdl2018', () => {
    const at2019 = readoutRows({
      region: us,
      selected: true,
      raw: rawFeatureFrom(us, { ...properties, cdl2019: 1 }, 'cdl2019'),
      date: '2019-06-01',
      classSource: 'cdl-year',
      sidecar: { status: 'idle' },
    })
    expect(at2019.rows[0].value).toBe('Corn')
    expect(at2019.rows[3].value).toBe('CDL 2019')
    const at2017 = readoutRows({
      region: us,
      selected: true,
      raw: rawFeatureFrom(us, { ...properties, cdl2018: 1 }, 'cdl2018'),
      date: '2017-01-01',
      classSource: 'cdl-year',
      sidecar: { status: 'idle' },
    })
    expect(at2017.rows[3].value).toBe('CDL 2018')
  })

  it('prints No CDL class for {Y} when cdl{Y} is absent or null (R-21)', () => {
    for (const cdl of [{}, { cdl2025: null }]) {
      const { rows } = readoutRows({
        region: us,
        selected: true,
        raw: rawFeatureFrom(us, { csbid: '381825001868504', csbacres: 10, ...cdl }, 'cdl2025'),
        date: '2026-11-12',
        classSource: 'cdl-year',
        sidecar: { status: 'idle' },
      })
      expect(rows[0].value).toBe('No CDL class for 2025')
    }
  })

  it('prints class not mapped for code 0 and for a code the table does not hold (R-21)', () => {
    for (const code of [0, 999]) {
      const { rows } = readoutRows({
        region: us,
        selected: true,
        raw: rawFeatureFrom(us, { csbid: '381825001868504', csbacres: 10, cdl2025: code }, 'cdl2025'),
        date: '2026-11-12',
        classSource: 'cdl-year',
        sidecar: { status: 'idle' },
      })
      expect(rows[0].value).toBe('class not mapped')
    }
  })

  it('prints empty Class and Area cells with no selection; the region rows stay', () => {
    const { rows } = readoutRows({
      region: us,
      selected: false,
      raw: null,
      date: '2026-11-12',
      classSource: 'cdl-year',
      sidecar: { status: 'idle' },
    })
    expect(rows.map((row) => row.key)).toEqual(['class', 'area', 'basis', 'class_year', 'source'])
    expect(rows[0].value).toBe('')
    expect(rows[1].value).toBe('')
    expect(rows[2].value).toBe('retrieved')
  })
})

describe('R-25 readout rows, Brazil (AC-21, R-18)', () => {
  it('prints Soybean, 22.4 ha, modelled, the mbMode year and the Trazo3 string from the sidecar area', () => {
    const { rows } = readoutRows({
      region: br,
      selected: true,
      raw: rawFeatureFrom(br, { Id: 4437031, mbmode24: 39 }, 'mbmode24'),
      date: '2026-11-12',
      classSource: 'mbmode24',
      sidecar: { status: 'found', areaHa: 22.4 },
    })
    expect(rows.map((row) => row.value)).toEqual([
      'Soybean',
      '22.4 ha',
      'modelled',
      'mbMode 2024, collection not verified',
      br.sourceString,
    ])
  })

  it('prints Area not in the class table when the sidecar row is absent, and keeps the tile class name', () => {
    const { rows } = readoutRows({
      region: br,
      selected: true,
      raw: rawFeatureFrom(br, { Id: 4437031, mbmode24: 39 }, 'mbmode24'),
      date: '2026-11-12',
      classSource: 'mbmode24',
      sidecar: { status: 'absent' },
    })
    expect(rows[0].value).toBe('Soybean')
    expect(rows[1].value).toBe('Area not in the class table')
    expect(rows[3].value).toBe('mbMode 2024, collection not verified')
  })

  it('never takes the area from the tile: a tile area property is ignored (R-25, M-01)', () => {
    const raw = rawFeatureFrom(br, { Id: 4437031, mbmode24: 39, area_ha: 999 }, 'mbmode24')
    expect(raw.area).toBeNull()
  })

  it('prints class not mapped for a null or absent Brazil class (R-21)', () => {
    for (const properties of [{ Id: 1 }, { Id: 1, mbmode24: null }, { Id: 1, mbmode24: 0 }]) {
      const { rows } = readoutRows({
        region: br,
        selected: true,
        raw: rawFeatureFrom(br, properties, 'mbmode24'),
        date: '2026-11-12',
        classSource: 'mbmode24',
        sidecar: { status: 'idle' },
      })
      expect(rows[0].value).toBe('class not mapped')
    }
  })

  it('reads the Collection 11 year only in a join load (R-18)', () => {
    const { rows } = readoutRows({
      region: br,
      selected: true,
      raw: rawFeatureFrom(br, { Id: 1, class_id: 39 }, 'class_id'),
      date: '2026-11-12',
      classSource: 'class_id',
      sidecar: { status: 'idle' },
    })
    expect(rows[3].value).toBe('MapBiomas Collection 11, 2025')
  })
})

describe('R-38 provenance line', () => {
  it('prints the CDL line with the painted year for the United States', () => {
    expect(provenanceLine(us, '2026-11-12', 'cdl-year')).toBe(
      'CDL 2025, Crop Sequence Boundaries 2025 release, retrieved',
    )
  })

  it('prints the Trazo3 mbMode line for the mbmode24 load and the Collection 11 line only for a join', () => {
    expect(provenanceLine(br, '2026-11-12', 'mbmode24')).toBe(
      'Trazo3 mbMode, 2024, collection not verified, modelled',
    )
    expect(provenanceLine(br, '2026-11-12', 'class_id')).toBe('MapBiomas Collection 11, 2025, modelled')
  })

  it('falls back to the shipped mbmode24 line when no load has reported a class source (R-38, R-18)', () => {
    expect(provenanceLine(br, '2026-11-12', null)).toBe('Trazo3 mbMode, 2024, collection not verified, modelled')
  })
})

describe('R-33 and OD-04: the compact control names both short credits', () => {
  it('composes the accessible name from the EOX short credit and the region source string', () => {
    const adapter = BASEMAP_ADAPTERS[0]
    const name = attributionCreditName(adapter, us)
    expect(name).toContain(EOX_SHORT_CREDIT)
    expect(name).toContain(us.sourceString)
  })

  it('writes the name onto the compact attribution button of the map container', () => {
    const container = document.createElement('div')
    container.innerHTML = '<button class="maplibregl-ctrl-attrib-button" aria-label="Toggle attribution"></button>'
    nameAttributionToggle(container, 'EOX credit · source')
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('EOX credit · source')
  })

  it('does nothing when the compact button is not mounted', () => {
    const container = document.createElement('div')
    expect(() => nameAttributionToggle(container, 'x')).not.toThrow()
  })

  it('collapses a compact control that starts expanded, and leaves the press to MapLibre (AC-27)', () => {
    const container = document.createElement('div')
    container.innerHTML = '<details class="maplibregl-ctrl maplibregl-ctrl-attrib maplibregl-compact maplibregl-compact-show" open></details>'
    expect(collapseAttributionControl(container)).toBe(true)
    const control = container.querySelector('details') as HTMLElement
    expect(control.classList.contains('maplibregl-compact-show')).toBe(false)
    expect(control.hasAttribute('open')).toBe(false)
    expect(control.classList.contains('maplibregl-compact')).toBe(true)
  })

  it('reports false when no compact control is mounted', () => {
    expect(collapseAttributionControl(document.createElement('div'))).toBe(false)
  })
})

describe('Brazil sidecar area (R-25, Table D)', () => {
  it('reads area_ha from the sidecar row', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 4437031, area_ha: 22.4 }), { status: 200 }))
    await expect(fetchPolygonArea(br, 4437031, { fetch: fetchImpl as unknown as typeof fetch, apiBase: 'http://api' }))
      .resolves.toEqual({ status: 'found', areaHa: 22.4 })
    expect(fetchImpl).toHaveBeenCalledWith('http://api/polygons/br/4437031')
  })

  it('reports absent on 404 and error on any other failure', async () => {
    const notFound = vi.fn(async () => new Response('', { status: 404 }))
    await expect(fetchPolygonArea(br, 1, { fetch: notFound as unknown as typeof fetch, apiBase: 'http://api' }))
      .resolves.toEqual({ status: 'absent' })
    const broken = vi.fn(async () => new Response('', { status: 500 }))
    await expect(fetchPolygonArea(br, 1, { fetch: broken as unknown as typeof fetch, apiBase: 'http://api' }))
      .resolves.toEqual({ status: 'error' })
    const offline = vi.fn(async () => {
      throw new TypeError('network')
    })
    await expect(fetchPolygonArea(br, 1, { fetch: offline as unknown as typeof fetch, apiBase: 'http://api' }))
      .resolves.toEqual({ status: 'error' })
  })

  it('is never requested for a United States polygon (Table D)', async () => {
    const fetchImpl = vi.fn()
    await expect(fetchPolygonArea(us, '381825001868504', { fetch: fetchImpl as unknown as typeof fetch, apiBase: 'http://api' }))
      .resolves.toEqual({ status: 'idle' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('the catalog keys the readout reads', () => {
  it('has every label the five rows and the provenance use', () => {
    for (const key of [
      'polygon.rows.class',
      'polygon.rows.area',
      'polygon.rows.basis',
      'polygon.rows.class_year',
      'polygon.rows.source',
      'polygon.area_not_in_class_table',
      'polygon.area_not_available',
    ] as const) {
      expect(en[key]).toBeTruthy()
    }
  })
})
