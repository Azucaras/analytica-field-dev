import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REGION_ID,
  REGION_ADAPTERS,
  classTableFor,
  lowestMountedZoom,
  parseUsManifest,
  regionFromSearch,
  tiersFor,
} from './regions'

const manifest = {
  schema_version: '1',
  region: 'us',
  clip_box: '-97.20,46.90,-97.14,46.96',
  detail_minzoom: 6,
  detail_maxzoom: 14,
  overview_minzoom: 3,
  overview_maxzoom: 5,
  interactive_minzoom: 8,
}

describe('region adapter (AC-01, R-01, R-02)', () => {
  it('holds exactly the two regions of Table A with their labels', () => {
    expect(Object.keys(REGION_ADAPTERS).sort()).toEqual(['br', 'us'])
    expect(REGION_ADAPTERS.us.label).toBe('United States')
    expect(REGION_ADAPTERS.br.label).toBe('Brazil')
  })

  it('defaults to the United States and reads the region from ?region= alone', () => {
    expect(DEFAULT_REGION_ID).toBe('us')
    expect(regionFromSearch('')).toBe('us')
    expect(regionFromSearch('?region=br')).toBe('br')
    expect(regionFromSearch('?region=us')).toBe('us')
    // An unknown value leaves us active (R-01).
    expect(regionFromSearch('?region=fr')).toBe('us')
    expect(regionFromSearch('?region=')).toBe('us')
  })

  it('carries every source specific value of Table A in the adapter', () => {
    const us = REGION_ADAPTERS.us
    expect(us.defaultView.center).toEqual([-97.17, 46.93])
    expect(us.defaultView.zoom).toBe(11)
    expect(us.detailFile).toBe('data/polygons/us-38017-detail.pmtiles')
    expect(us.overviewFile).toBe('data/polygons/us-38017-overview.pmtiles')
    expect(us.manifestFile).toBe('data/polygons/us-38017.manifest.json')
    expect(us.sourceLayer).toBe('trazo')
    expect(us.idProperty).toBe('csbid')
    expect(us.idType).toBe('string')
    expect(us.commandPrefix).toBe('csb')
    expect(us.areaProperty).toBe('csbacres')
    expect(us.areaUnit).toBe('acres')
    expect(us.basis).toBe('retrieved')
    expect(us.hosting).toBe('self-hosted')
    expect(us.fixtureIds).toEqual(['381825001868504', '381825001868512', '381825001868517'])
    expect(us.sourceString).toBe(
      'Crop Sequence Boundaries (USDA NASS and ERS), public domain; CDL (USDA NASS), public domain',
    )
    expect(us.sourceString.length).toBe(91)
    expect(us.tileBudget).toEqual({ detail: 250_000, overview: 300_000, hard: 1_000_000 })

    const br = REGION_ADAPTERS.br
    expect(br.defaultView.center).toEqual([-55.27, -11.91])
    expect(br.defaultView.zoom).toBe(11)
    expect(br.detailFile).toBe('data/polygons/br-mt-detail.pmtiles')
    expect(br.overviewFile).toBe('data/polygons/br-mt-overview.pmtiles')
    expect(br.manifestFile).toBeNull()
    expect(br.idProperty).toBe('Id')
    expect(br.idType).toBe('number')
    expect(br.commandPrefix).toBe('trazo')
    expect(br.areaProperty).toBe('area_ha')
    expect(br.areaUnit).toBe('ha')
    expect(br.basis).toBe('modelled')
    expect(br.hosting).toBe('source-direct')
    expect(br.fixtureIds).toEqual(['mt-santa-carmem-01', 'mt-santa-carmem-02', 'mt-santa-carmem-03'])
    expect(br.sourceString).toBe('Trazo3 field boundaries, WRI and ASU (Grupp et al. 2026), CC BY 4.0')
    expect(br.sourceString.length).toBe(67)
  })

  it('reads the properties of Table A only', () => {
    expect(REGION_ADAPTERS.us.properties).toEqual([
      'csbid', 'csbacres', 'cdl2018', 'cdl2019', 'cdl2020', 'cdl2021',
      'cdl2022', 'cdl2023', 'cdl2024', 'cdl2025',
    ])
    expect(REGION_ADAPTERS.br.properties).toEqual(['Id', 'mbmode24'])
  })

  it('rejects a property the table forbids', () => {
    const forbidden = ['rgb', 'csbyears', 'inside_x', 'inside_y', 'orig_fid', 'SHAPE__Area',
      'hansen_covered_area', 'hansen_loss_area', 'mode_year', 'mbcov_area_2024']
    for (const property of forbidden) {
      expect(REGION_ADAPTERS.us.properties).not.toContain(property)
      expect(REGION_ADAPTERS.br.properties).not.toContain(property)
    }
  })
})

describe('class tables (R-16, R-17)', () => {
  it('carries the fourteen Brazil rows with the documented Coffee correction', () => {
    const table = classTableFor('br')
    expect(table.rows).toHaveLength(14)
    expect(table.rows.map((row) => row.value)).toEqual([3, 4, 9, 15, 20, 21, 35, 39, 40, 41, 46, 47, 48, 62])
    expect(table.rows.find((row) => row.value === 46)?.name).toBe('Coffee')
    expect(table.rows.find((row) => row.value === 46)?.hex).toBe('#d68fe2')
    expect(table.rows.find((row) => row.value === 62)?.name).toBe('Cotton (beta)')
    expect(table.rows.find((row) => row.value === 41)?.name).toBe('Other Temporary Crops')
    expect(table.rows.find((row) => row.value === 39)?.hex).toBe('#f5b3c8')
    expect(table.source.sha256).toBe('603239c5de7cca95799c788ab553a73ec3fc16477f681f63bb5af191d2f54dbe')
  })

  it('carries the 255 United States rows from values 1 to 255 with code 0 excluded', () => {
    const table = classTableFor('us')
    expect(table.rows).toHaveLength(255)
    expect(table.rows[0].value).toBe(1)
    expect(table.rows[254].value).toBe(255)
    expect(table.rows.some((row) => row.value === 0)).toBe(false)
    const byValue = new Map(table.rows.map((row) => [row.value, row]))
    expect(byValue.get(1)).toMatchObject({ name: 'Corn', hex: '#ffd300' })
    expect(byValue.get(5)).toMatchObject({ name: 'Soybeans', hex: '#267000' })
    expect(byValue.get(6)).toMatchObject({ name: 'Sunflower', hex: '#ffff00' })
    expect(byValue.get(176)).toMatchObject({ name: 'Grassland/Pasture', hex: '#e8ffbf' })
    expect(byValue.get(123)?.name).toBe('Developed/Med Intensity')
    expect(table.source.sha256).toBe('8b5cec2ff965a2d1f7f1205111b3a0fbe3cce5ed82cb0ef6a446ae304fe0b699')
  })
})

describe('the manifest contract (AC-03, R-05, Table G)', () => {
  it('accepts the recorded manifest and derives the three zoom values', () => {
    const parsed = parseUsManifest(manifest)
    expect(parsed.detail_minzoom).toBe(6)
    expect(parsed.detail_maxzoom).toBe(14)
    expect(parsed.overview_minzoom).toBe(3)
    expect(parsed.overview_maxzoom).toBe(5)
    expect(parsed.interactive_minzoom).toBe(8)
  })

  it('fails on a missing key, a key outside Table G, or a broken rule', () => {
    const { clip_box: _clip, ...missing } = manifest
    expect(() => parseUsManifest(missing)).toThrow(/clip_box/)
    expect(() => parseUsManifest({ ...manifest, extra: 1 })).toThrow(/extra/)
    expect(() => parseUsManifest({ ...manifest, schema_version: 1 })).toThrow(/schema_version/)
    expect(() => parseUsManifest({ ...manifest, region: 'br' })).toThrow(/region/)
    expect(() => parseUsManifest({ ...manifest, clip_box: '-97.2,46.9,-97.1,46.96' })).toThrow(/clip_box/)
    expect(() => parseUsManifest({ ...manifest, detail_maxzoom: 13 })).toThrow(/detail_maxzoom/)
    expect(() => parseUsManifest({ ...manifest, overview_minzoom: 2 })).toThrow(/overview_minzoom/)
    expect(() => parseUsManifest({ ...manifest, overview_maxzoom: 6 })).toThrow(/overview_maxzoom/)
    expect(() => parseUsManifest({ ...manifest, interactive_minzoom: 9 })).toThrow(/interactive_minzoom/)
    expect(() => parseUsManifest({ ...manifest, detail_minzoom: 10, overview_minzoom: 7, overview_maxzoom: 9, interactive_minzoom: 12 }))
      .toThrow(/detail_minzoom/)
    expect(() => parseUsManifest(null)).toThrow()
  })

  it('takes the United States bounds from the manifest and Brazil from Table B', () => {
    const us = tiersFor('us', parseUsManifest(manifest))
    expect(us).toEqual({
      detail: { minzoom: 6, maxzoom: 14 },
      overview: { minzoom: 3, maxzoom: 5 },
      interactiveMinzoom: 8,
    })
    const br = tiersFor('br')
    expect(br).toEqual({
      detail: { minzoom: 8, maxzoom: 12 },
      overview: { minzoom: 5, maxzoom: 7 },
      interactiveMinzoom: 10,
    })
    expect(lowestMountedZoom(us)).toBe(3)
    expect(lowestMountedZoom(br)).toBe(5)
    expect(lowestMountedZoom({ ...br, overview: null })).toBe(8)
  })

  it('refuses to build United States tiers without a manifest', () => {
    expect(() => tiersFor('us')).toThrow(/manifest/)
  })
})
