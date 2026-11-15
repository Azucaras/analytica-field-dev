/**
 * The recorded payload of `POST /fields/mt-santa-carmem-01/numbers` for the chosen date
 * 2026-11-12, built from the recorded POWER responses in `artifacts/block6/` and from the
 * oracles of Data contracts Table H (O-06 soil, O-07 and O-08 SIDRA).
 *
 * This is a FIXTURE, not a live answer. Wave 1 (`POST /fields/{field_id}/numbers`) is not on
 * `main` at this card, so the surface is built and tested against this recorded payload. Every
 * value that a recorded source does not hold is written as `null` with a gap row, never filled.
 *
 * Recorded on 2026-11-15 (UTC) for the POWER responses; the SIDRA and SoilGrids values are the
 * oracles of Table H, read on 2026-11-14 and carried with their own dates.
 */
import windowResponse from '../../artifacts/block6/power-window-2026-10-01-2026-11-11.json'
import type { DailyPoint, GapRow, NumbersPayload, ProvenanceRow, WindowInfo } from '@/lib/numbers'

export const RECORDED_FIELD_ID = 'mt-santa-carmem-01'
export const RECORDED_DATE = '2026-11-12'
export const POWER_FETCHED_AT = '2026-11-15T03:07:37Z'
export const POWER_URL =
  'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN,FROST_DAYS,GWETROOT,EVLAND&community=AG&longitude=-55.27&latitude=-11.91&start=20261001&end=20261111&format=JSON'

type Parameter = 'PRECTOTCORR' | 'T2M_MAX' | 'T2M_MIN' | 'FROST_DAYS' | 'GWETROOT' | 'EVLAND'
type WindowResponse = { properties: { parameter: Record<Parameter, Record<string, number>> } }

const FILL = -999
const parameters = (windowResponse as WindowResponse).properties.parameter
const isoDate = (compact: string) => `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
const compactDates = Object.keys(parameters.PRECTOTCORR).sort()

function series(param: Parameter): DailyPoint[] {
  return compactDates.map((date) => {
    const value = parameters[param][date]
    return { date: isoDate(date), value: typeof value === 'number' && value !== FILL ? value : null }
  })
}

const rainSeries = series('PRECTOTCORR')
const tmaxSeries = series('T2M_MAX')
const tminSeries = series('T2M_MIN')

/** Table H, O-01 and O-02: the unrounded window aggregates, recomputed from the recorded file. */
const RAIN_TOTAL = 171.93
const DRY_SPELL = 7
const GDD10 = 836.46
const FROST = 0
const TMIN_MIN = 21.77
const GWETROOT_MEAN = 0.4898
/** Table H, O-03 and O-05: the normals and the hot day counts, recomputed from the recorded file. */
const RAIN_MEDIAN = 224.86
const RAIN_MIN = 88.87
const RAIN_MAX = 389.71
const RANK = 7
const OF_YEARS = 35
const PERCENTILE = 20
const HOT_DAYS = 28
const HOT_DAYS_MEDIAN = 17
/** The water balance: `out` and `remaining` are the first recorded pair (see recompute-oracles.mjs). */
const OUT_SUM = 124.82
const IN_SUM = RAIN_TOTAL

const WINDOW: WindowInfo = {
  start: '2026-10-01',
  end: '2026-11-11',
  days: 42,
  valid_days: rainSeries.filter((p) => p.value !== null).length,
  dropped_days: 0,
}

const CELL = 'about 0.5 degree cell'
const SIDRA_URL =
  'https://servicodados.ibge.gov.br/api/v3/agregados/1612/periodos/2021-2025/variaveis/109?localidades=N6%5B5107248%5D&classificacao=81%5B2713%5D'
const SOILGRIDS_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query'

function row(
  metric: string,
  label: string,
  value: number | string | null,
  unit: string,
  basis: ProvenanceRow['basis'],
  route: ProvenanceRow['route'],
  resolution: string,
  source: string,
  asOf: string | null,
  fetchedAt: string | null,
): ProvenanceRow {
  return { metric, label, value, unit, basis, as_of: asOf, source, resolution, route, fetched_at: fetchedAt }
}

const SOIL_DEPTHS = [
  { depth: '0_5' as const, clay: 225, sand: 635, ph: 50 / 10, soc: 222 / 10 },
  { depth: '5_15' as const, clay: 223, sand: 639, ph: 51 / 10, soc: 162 / 10 },
  { depth: '15_30' as const, clay: 265, sand: 601, ph: 51 / 10, soc: 91 / 10 },
]
const SOIL_AS_OF = '2026-11-14'
const SOIL_FETCHED_AT = '2026-11-14T18:12:04Z'
const MUNI_AS_OF = '2025-12-31'
const MUNI_FETCHED_AT = '2026-11-14T18:12:09Z'

export function recordedNumbersPayload(): NumbersPayload {
  const climateSource = POWER_URL
  const provenance: ProvenanceRow[] = [
    row('rain_total', 'numbers.rain_total', RAIN_TOTAL, 'mm', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('dry_spell_days', 'numbers.dry_spell_days', DRY_SPELL, 'days', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('gdd10', 'numbers.gdd10', GDD10, 'C day', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('frost_days', 'numbers.frost_days', FROST, 'days', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('tmin_min', 'numbers.tmin_min', TMIN_MIN, 'C', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('gwetroot_mean', 'numbers.gwetroot_mean', GWETROOT_MEAN, '1', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('rain_median', 'numbers.rain_median', RAIN_MEDIAN, 'mm', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('rain_min', 'numbers.rain_min', RAIN_MIN, 'mm', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('rain_max', 'numbers.rain_max', RAIN_MAX, 'mm', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('rain_rank', 'numbers.rain_rank', RANK, 'years', 'modelled', 'derived', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('rain_percentile', 'numbers.rain_percentile', PERCENTILE, 'percent', 'modelled', 'derived', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('hot_days', 'numbers.hot_days', HOT_DAYS, 'days', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('hot_days_median', 'numbers.hot_days_median', HOT_DAYS_MEDIAN, 'days', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('rain_day', 'numbers.rain_day', `${WINDOW.valid_days} points`, 'mm', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('tmax_day', 'numbers.tmax_day', `${tmaxSeries.filter((p) => p.value !== null).length} points`, 'C', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('tmin_day', 'numbers.tmin_day', `${tminSeries.filter((p) => p.value !== null).length} points`, 'C', 'modelled', 'api', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('wb_in', 'numbers.wb_in', IN_SUM, 'mm', 'modelled', 'derived', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('wb_out', 'numbers.wb_out', OUT_SUM, 'mm', 'modelled', 'derived', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('wb_remaining', 'numbers.wb_remaining', IN_SUM - OUT_SUM, 'mm', 'modelled', 'derived', CELL, climateSource, WINDOW.end, POWER_FETCHED_AT),
    row('ndvi_scene_count', 'numbers.ndvi_scene_count', 18, 'scenes', 'retrieved', 'api', 'not applicable', 'https://earth-search.aws.element84.com/v1/search', '2026-11-14', null),
    row('ndvi_clear_count', 'numbers.ndvi_clear_count', 6, 'scenes', 'retrieved', 'api', 'not applicable', 'https://earth-search.aws.element84.com/v1/search', '2026-11-14', null),
    ...SOIL_DEPTHS.flatMap((d) => [
      row(`soil.clay.${d.depth}`, 'numbers.soil_clay', d.clay, 'g/kg', 'modelled', 'api', '250 m static model', SOILGRIDS_URL, SOIL_AS_OF, SOIL_FETCHED_AT),
      row(`soil.sand.${d.depth}`, 'numbers.soil_sand', d.sand, 'g/kg', 'modelled', 'api', '250 m static model', SOILGRIDS_URL, SOIL_AS_OF, SOIL_FETCHED_AT),
      row(`soil.ph.${d.depth}`, 'numbers.soil_ph', d.ph, 'pH', 'modelled', 'api', '250 m static model', SOILGRIDS_URL, SOIL_AS_OF, SOIL_FETCHED_AT),
      row(`soil.soc.${d.depth}`, 'numbers.soil_soc', d.soc, 'g/kg', 'modelled', 'api', '250 m static model', SOILGRIDS_URL, SOIL_AS_OF, SOIL_FETCHED_AT),
    ]),
    row('municipality_soy_ha', 'numbers.municipality_soy_ha', 130000, 'ha', 'retrieved', 'api', 'the municipality', SIDRA_URL, MUNI_AS_OF, MUNI_FETCHED_AT),
    row('state_soy_ha', 'numbers.state_soy_ha', 12788611, 'ha', 'retrieved', 'api', 'the state', 'https://servicodados.ibge.gov.br/api/v3/agregados/1612/periodos/2021-2025/variaveis/109?localidades=N3%5B51%5D&classificacao=81%5B2713%5D', MUNI_AS_OF, MUNI_FETCHED_AT),
    row('polygon_share', 'numbers.polygon_share', null, 'percent', 'modelled', 'derived', 'not applicable', SIDRA_URL, MUNI_AS_OF, MUNI_FETCHED_AT),
  ]

  const gaps: GapRow[] = [
    {
      section: 'smap',
      cause: 'palette tiles were not recorded for this fixture',
      source: '/tiles/SMAP_L3_Passive_Enhanced_Day_Soil_Moisture (block 4 tile proxy)',
      status: 'not recorded',
      date: '2026-11-15',
      remediation: 'record a tile replay through the block 4 proxy',
    },
    {
      section: 'ndvi',
      cause: 'scene assets were not read for this fixture',
      source: 'Earth Search sentinel-2-l2a, B04 B08 SCL cloud optimised GeoTIFF',
      status: 'not recorded',
      date: '2026-11-15',
      remediation: 'CO-B6-03 and OD-01: the zonal reader is not approved',
    },
    {
      section: 'rotation',
      cause: 'no MapBiomas Collection 11 row for this polygon',
      source: 'polygon_mapbiomas sidecar (POLYGON_MAPBIOMAS_DB)',
      status: 'no row',
      date: '2026-11-15',
      remediation: 'CO-B6-01: the sidecar extract for Mato Grosso',
    },
    {
      section: 'municipality',
      cause: 'the polygon area is not in the request, so the share cannot be computed',
      source: 'request area_ha',
      status: 'null',
      date: '2026-11-15',
      remediation: 'none recorded: fixture fields carry no area (M-16)',
    },
    {
      section: 'fragment',
      cause: 'the feature carries no area_ha, so the fragment test cannot run',
      source: 'request area_ha',
      status: 'is_fragment null',
      date: '2026-11-15',
      remediation: 'R-50 needs the polygon own area',
    },
  ]

  return {
    schema_version: '1',
    field_id: RECORDED_FIELD_ID,
    region: 'br',
    query: {
      ring: [[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92]],
      centroid: [-55.27, -11.91],
      area_ha: null,
      date: RECORDED_DATE,
      window: WINDOW,
    },
    sections: {
      climate: {
        state: 'ok',
        basis: 'modelled',
        resolution: CELL,
        source: climateSource,
        as_of: WINDOW.end,
        fetched_at: POWER_FETCHED_AT,
        cached: false,
        series: { rain: rainSeries, tmax: tmaxSeries, tmin: tminSeries },
        aggregates: {
          rain_total: RAIN_TOTAL,
          dry_spell_days: DRY_SPELL,
          gdd10: GDD10,
          frost_days: FROST,
          tmin_min: TMIN_MIN,
          gwetroot_mean: GWETROOT_MEAN,
        },
        normals: {
          rain_median: RAIN_MEDIAN,
          rain_min: RAIN_MIN,
          rain_max: RAIN_MAX,
          rank: RANK,
          of_years: OF_YEARS,
          percentile: PERCENTILE,
          hot_days: HOT_DAYS,
          hot_days_median: HOT_DAYS_MEDIAN,
        },
        aggregate_valid: {},
        normals_reason: null,
      },
      water_balance: {
        state: 'ok',
        in: IN_SUM,
        out: OUT_SUM,
        remaining: IN_SUM - OUT_SUM,
        formula: 'remaining = in - out',
        window: WINDOW,
        statement: 'This balance is an estimate built from modelled fluxes. It is not a measurement.',
        missing: null,
        basis: 'modelled',
        source: climateSource,
        as_of: WINDOW.end,
        resolution: CELL,
        fetched_at: POWER_FETCHED_AT,
      },
      smap: {
        state: 'unavailable',
        days: [],
        resolution: '9 km posting over a 36 km radiometer footprint (surface); 9 km (root zone)',
        shared_cell: 'about 8,100 ha per cell; about 88 of 900 polygons share one value',
        disclosure: 'palette, not a physical unit',
        source: '/tiles/{layer}/{z}/{x}/{y}?date= (block 4 tile proxy)',
        as_of: null,
        reason: 'palette tiles were not recorded for this fixture',
      },
      ndvi: {
        state: 'abstained',
        scenes: [],
        scene_count: 18,
        clear_count: 6,
        best_valid_fraction: null,
        assets: ['B04', 'B08', 'SCL'],
        source: 'https://earth-search.aws.element84.com/v1/search',
        as_of: '2026-11-14',
        reason: 'scene assets were not read for this fixture',
      },
      soil: {
        state: 'ok',
        depths: SOIL_DEPTHS.map((d) => ({
          depth: d.depth,
          clay_g_kg: d.clay,
          sand_g_kg: d.sand,
          ph: d.ph,
          soc_g_kg: d.soc,
        })),
        missing: [],
        model_note: 'Static 250 m model, not a map. Sampled at the centroid.',
        source: SOILGRIDS_URL,
        as_of: SOIL_AS_OF,
      },
      rotation: {
        state: 'abstained',
        first_crop: [],
        second_crop: [],
        collection: 'MapBiomas Collection 11',
        collection_year: 2025,
        sidecar: 'polygon_mapbiomas',
        basis: 'modelled',
        source: 'polygon_mapbiomas sidecar',
        as_of: null,
        reason: 'no MapBiomas Collection 11 row for this polygon',
      },
      municipality: {
        state: 'ok',
        municipality: { code: '5107248', name: 'Santa Carmem (MT)', year: 2025, soy_ha: 130000 },
        state_row: { code: '51', name: 'Mato Grosso', year: 2025, soy_ha: 12788611, label: 'state total, not this field' },
        share: null,
        source: SIDRA_URL,
        as_of: MUNI_AS_OF,
        reason: 'the polygon area is not in the request',
      },
    },
    provenance,
    gaps,
  }
}
