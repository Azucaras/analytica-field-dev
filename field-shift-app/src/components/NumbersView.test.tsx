import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NumbersView } from './NumbersView'
import { useMapStore, type FieldSummary } from '@/lib/map-store'
import { recordedNumbersPayload, RECORDED_FIELD_ID } from '@/test/numbers-recorded'
import type { NumbersPayload } from '@/lib/numbers'

const field: FieldSummary = {
  id: 'mt-santa-carmem-01',
  name: 'Santa Carmem North',
  location: 'Santa Carmem, Mato Grosso',
  coverage: 86,
  center: [-55.27, -11.91],
  boundary: {
    type: 'Polygon',
    coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92], [-55.285, -11.9]]],
  },
}

const CARD_NAMES = [
  'Climate',
  'Water balance',
  'Soil moisture, SMAP',
  'Vegetation, NDVI',
  'Soil',
  'Rotation history',
  'Municipal context',
]

/** Every element of the surface that carries a printed number's metric id (R-07). */
function printedMetrics(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-metric]')).map((node) => node.dataset.metric ?? '')
}

function stubNumbersFetch(payload: NumbersPayload | (() => Promise<Response>)) {
  const bodies: Array<Record<string, unknown>> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/numbers') && init?.method === 'POST') {
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>)
      if (typeof payload === 'function') return payload()
      return { ok: true, status: 200, json: async () => payload } as unknown as Response
    }
    return { ok: false, status: 404, json: async () => null } as unknown as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, bodies }
}

beforeEach(() => {
  window.history.replaceState({}, '', '/?numbers=1')
  useMapStore.setState({
    regionId: 'br',
    selectedFieldId: field.id,
    selectedPolygonId: null,
    polygonRaw: null,
    polygonMode: null,
    polygonRing: null,
    chosenDate: '2026-11-12',
    numbersLastRead: {},
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  useMapStore.setState({ selectedFieldId: null, numbersLastRead: {} })
})

describe('the Field numbers region (R-01, R-03, R-05, AC-01, AC-03, AC-04)', () => {
  it('mounts exactly one region named Field numbers with a level two heading of that text', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    const regions = screen.getAllByRole('region', { name: 'Field numbers' })
    expect(regions).toHaveLength(1)
    expect(within(regions[0]).getByRole('heading', { level: 2, name: 'Field numbers' })).toBeTruthy()
    await screen.findByText('Climate')
  })

  it('prints the raw field id in the header with no basis label, and the window with the climate basis', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const header = container.querySelector('.numbers-header') as HTMLElement
    expect(header).not.toBeNull()
    const idNode = within(header).getByText(RECORDED_FIELD_ID)
    // The id is an identifier and carries no basis chip (R-03).
    expect(idNode.querySelector('[data-basis]')).toBeNull()
    expect(idNode.closest('[data-basis]')).toBeNull()
    expect(within(header).getByText('2026-10-01 to 2026-11-11')).toBeTruthy()
    expect(within(header).getByText('2026-11-12')).toBeTruthy()
    expect(within(header).getByText('entered')).toBeTruthy()
  })

  it('prints the empty state and no section, number or gap row when no field is selected (AC-03)', () => {
    stubNumbersFetch(recordedNumbersPayload())
    useMapStore.setState({ selectedFieldId: null })
    render(<NumbersView selectedField={null} onClose={vi.fn()} />)
    expect(screen.getByText('No field selected')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back to map' })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
    expect(printedMetrics()).toEqual([])
    expect(screen.queryByText('Gap register')).toBeNull()
  })

  it('moves focus to Back to map on open and closes on Enter and on Space (R-05, AC-04)', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    const onClose = vi.fn()
    render(<NumbersView selectedField={field} onClose={onClose} />)
    const back = screen.getByRole('button', { name: 'Back to map' })
    expect(document.activeElement).toBe(back)
    const user = userEvent.setup()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('the seven data cards (R-13, R-12, AC-12)', () => {
  it('prints the seven card headings in the frozen order, each with a source line carrying source, as_of and basis', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const headings = Array.from(document.querySelectorAll('[data-card] > h3')).map((node) => node.textContent)
    expect(headings).toEqual(CARD_NAMES)
    const sourceLines = Array.from(document.querySelectorAll<HTMLElement>('[data-source-line]'))
    expect(sourceLines).toHaveLength(7)
    for (const line of sourceLines) {
      expect(line.textContent).toMatch(/Source: /)
      // R-13: the as_of is a date, or the words `not read` where the section holds no read date.
      expect(line.textContent).toMatch(/As of (\d{4}-\d{2}-\d{2}|not read)/)
      expect(line.textContent).toMatch(/Basis: (modelled|retrieved|entered|observed)/)
    }
  })

  it('abstains with the spec text on NDVI and rotation instead of a placeholder value (R-12, R-29, R-36)', async () => {
    const payload = recordedNumbersPayload()
    stubNumbersFetch(payload)
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const rotation = container.querySelector('[data-card="rotation"]') as HTMLElement
    expect(within(rotation).getByText('no MapBiomas Collection 11 row for this polygon')).toBeTruthy()
    // The scene count is the payload's own, because the abstention text names what was read.
    expect(
      screen.getByText(new RegExp(`NDVI not plotted: ${payload.sections.ndvi.scene_count} scenes below 20 percent cloud`)),
    ).toBeTruthy()
  })
})

describe('climate, water balance, SMAP and NDVI (R-16 to R-30)', () => {
  it('prints the chart with one point per valid day for rain, T2M_MAX and T2M_MIN (R-21, AC-20)', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    for (const family of ['rain_day', 'tmax_day', 'tmin_day']) {
      const group = container.querySelector(`[data-metric="${family}"]`)
      expect(group).not.toBeNull()
      expect(group?.querySelectorAll('circle')).toHaveLength(42)
    }
  })

  it('draws no line across a day without a value (R-21)', async () => {
    const payload = recordedNumbersPayload()
    const tmax = payload.sections.climate.series.tmax_day.map((point, index) => (index === 20 ? { ...point, value: null } : point))
    const tmin = payload.sections.climate.series.tmin_day.map((point, index) => (index === 20 ? { ...point, value: null } : point))
    stubNumbersFetch({
      ...payload,
      sections: { ...payload.sections, climate: { ...payload.sections.climate, series: { ...payload.sections.climate.series, tmax_day: tmax, tmin_day: tmin } } },
    })
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const tmaxGroup = container.querySelector('[data-metric="tmax_day"]')
    expect(tmaxGroup?.querySelectorAll('circle')).toHaveLength(41)
    // A run of 20 valid days before day 20 has 19 segments, and a run of 21 after it has 20: 39 in total.
    const segments = tmaxGroup?.querySelectorAll('path[data-segment]') ?? []
    expect(segments).toHaveLength(39)
    for (const segment of Array.from(segments)) {
      const d = segment.getAttribute('d') ?? ''
      expect(d.startsWith('M')).toBe(true)
    }
  })

  it('prints exactly three millimetre numbers in the water balance, with the EVLAND statement beside out (R-22, R-24, AC-21, AC-23)', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const card = container.querySelector('[data-card="water"]') as HTMLElement
    expect(card).not.toBeNull()
    const values = Array.from(card.querySelectorAll<HTMLElement>('[data-metric]')).map((node) => node.textContent?.replace(/\s*mm$/, ''))
    expect(values).toEqual(['171.9', '124.8', '47.1'])
    expect(within(card).getByText('remaining = in - out')).toBeTruthy()
    expect(within(card).getByText('out, POWER EVLAND, land surface evaporation')).toBeTruthy()
    expect(within(card).getByText('This is not a crop water demand. No reference evapotranspiration is used.')).toBeTruthy()
    expect(within(card).getByText(/estimate built from modelled fluxes/)).toBeTruthy()
  })

  it('abstains the whole balance when a window day lacks EVLAND (R-23, AC-22)', async () => {
    const payload = recordedNumbersPayload()
    stubNumbersFetch({
      ...payload,
      sections: {
        ...payload.sections,
        water_balance: {
          ...payload.sections.water_balance,
          state: 'abstained',
          in: null,
          out: null,
          remaining: null,
          missing: { parameter: 'EVLAND', days: 1 },
        },
      },
    })
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const card = container.querySelector('[data-card="water"]') as HTMLElement
    expect(within(card).getByText(/EVLAND is missing on 1 window days/)).toBeTruthy()
    expect(card.querySelectorAll('[data-metric]')).toHaveLength(3)
    expect(Array.from(card.querySelectorAll('[data-metric]')).every((node) => node.textContent === 'not computed')).toBe(true)
  })

  it('prints the SMAP disclosure and no physical unit, and the NDVI counts (R-25, R-30, AC-24, AC-29)', async () => {
    const payload = recordedNumbersPayload()
    stubNumbersFetch(payload)
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const smap = container.querySelector('[data-card="smap"]') as HTMLElement
    expect(within(smap).getByText('palette, not a physical unit', { exact: false })).toBeTruthy()
    expect(within(smap).getByText(/0 to 100 percent/)).toBeTruthy()
    expect(within(smap).getByText(/8,100 ha/)).toBeTruthy()
    expect(within(smap).getByText(/about 88 of the 900 polygons/)).toBeTruthy()
    expect(smap.textContent).not.toMatch(/m3\/m3|m³\/m³|volumetric|wetness index/i)
    const ndvi = container.querySelector('[data-card="ndvi"]') as HTMLElement
    const counts = payload.sections.ndvi
    expect(within(ndvi).getByText(String(counts.scene_count))).toBeTruthy()
    expect(within(ndvi).getByText(String(counts.clear_count))).toBeTruthy()
    expect(ndvi.textContent).toMatch(/Sentinel-2 L2A, collection sentinel-2-l2a, assets B04, B08 and SCL/)
    expect(ndvi.textContent).not.toMatch(/MODIS/)
  })
})

describe('provenance, gap register and the disclosure (R-07, R-08, R-41, R-42, R-44, AC-06, AC-41)', () => {
  it('prints each printed metric id once, only ids the payload carries, and records the rows AC-06 still finds unprinted', async () => {
    const payload = recordedNumbersPayload()
    stubNumbersFetch(payload)
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const printed = printedMetrics()
    expect(new Set(printed).size).toBe(printed.length)
    const carried = payload.provenance.map((row) => row.metric)
    // The surface invents no metric id: every id it prints is a row of the payload.
    expect(printed.filter((metric) => !carried.includes(metric))).toEqual([])
    // AC-06 is still open and this is where it is visible: on the recorded payload eight rows carry a
    // value or an abstention the surface prints without their metric id. The list is pinned so the
    // day one of them starts printing, this test changes with it. The gate recorded the same eight.
    const unprinted = carried.filter((metric) => !printed.includes(metric)).sort()
    expect(unprinted).toEqual([
      'area',
      'municipality_soy_ha',
      'ndvi_mean',
      'ndvi_valid_fraction',
      'ring_area',
      'smap_rootzone',
      'smap_surface',
      'state_soy_ha',
    ])
    for (const row of payload.provenance) {
      for (const key of ['metric', 'label', 'value', 'unit', 'basis', 'as_of', 'source', 'resolution', 'route', 'fetched_at'] as const) {
        expect(Object.hasOwn(row, key)).toBe(true)
      }
    }
  })

  it('renders each provenance row in the table with its basis label (R-08, AC-07)', async () => {
    const payload = recordedNumbersPayload()
    stubNumbersFetch(payload)
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-provenance-metric]'))
    expect(rows).toHaveLength(payload.provenance.length)
    for (const rowNode of rows) {
      const metric = rowNode.dataset.provenanceMetric
      const row = payload.provenance.find((entry) => entry.metric === metric)
      const chip = rowNode.querySelector<HTMLElement>('[data-basis]')
      expect(chip?.dataset.basis).toBe(row?.basis)
      if (row?.basis === 'modelled') expect(chip?.textContent).toBe('modelled')
    }
  })

  it('prints one gap row per payload gap, in the payload order, each once (R-41, R-42, AC-41)', async () => {
    const payload = recordedNumbersPayload()
    stubNumbersFetch(payload)
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-gap-index]'))
    expect(rows).toHaveLength(payload.gaps.length)
    rows.forEach((node, index) => {
      expect(node.dataset.gapIndex).toBe(String(index))
      expect(node.textContent).toContain(payload.gaps[index].cause)
      expect(node.textContent).toContain(payload.gaps[index].section)
    })
  })

  it('prints the empty text and no row when the payload has no gap (R-41)', async () => {
    const payload = { ...recordedNumbersPayload(), gaps: [] }
    stubNumbersFetch(payload)
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    expect(container.querySelectorAll('[data-gap-index]')).toHaveLength(0)
    expect(screen.getByText('No gaps. Every number of this field has its source.')).toBeTruthy()
  })

  it('prints the palette disclosure beside the SMAP route 1 values (R-44, AC-43)', async () => {
    stubNumbersFetch(recordedNumbersPayload())
    const { container } = render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const smap = container.querySelector('[data-card="smap"]') as HTMLElement
    expect(within(smap).getByText(/palette of the served image, not the physical unit/)).toBeTruthy()
  })
})

describe('the request and the states (R-45, R-06, R-48, AC-05, AC-47)', () => {
  it('sends the Table B body for a fixture field: its ring, centroid, a null area and the chosen date', async () => {
    const { bodies } = stubNumbersFetch(recordedNumbersPayload())
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toEqual({
      ring: field.boundary.coordinates[0],
      centroid: [-55.27, -11.91],
      area_ha: null,
      date: '2026-11-12',
    })
  })

  it('keeps the open state, the field, the payload and the window through a real resize, with no new request (R-06, AC-05)', async () => {
    const { fetchMock } = stubNumbersFetch(recordedNumbersPayload())
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const before = document.querySelector('[data-numbers-view]')?.textContent
    const region = screen.getByRole('region', { name: 'Field numbers' })
    // jsdom has no layout, so the offset is a plain property here; the browser run measures the real one.
    Object.defineProperty(region, 'scrollTop', { configurable: true, writable: true, value: 120 })
    for (const width of [780, 360, 1440]) {
      act(() => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
        window.dispatchEvent(new Event('resize'))
      })
      expect(screen.getByRole('region', { name: 'Field numbers' })).toBe(region)
      expect(document.querySelector('[data-numbers-view]')?.textContent).toBe(before)
      expect(screen.getByRole('heading', { level: 2, name: 'Field numbers' })).toBeTruthy()
      expect(region.scrollTop).toBe(120)
    }
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('answers a network failure with the last read values marked, and never a fixture value (R-48, AC-47)', async () => {
    const payload = recordedNumbersPayload()
    useMapStore.setState({ numbersLastRead: { [`${field.id}|2026-11-12`]: payload } })
    stubNumbersFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    expect(await screen.findByText('last read 2026-11-15')).toBeTruthy()
    expect(screen.getByText('Numbers service unreachable. Check your connection and retry.')).toBeTruthy()
    expect(screen.getAllByText('171.9').length).toBeGreaterThan(0)
  })

  it('prints the offline text and no value when nothing is held (R-48)', async () => {
    stubNumbersFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    expect(await screen.findByText('No value held for this field and window.')).toBeTruthy()
    expect(printedMetrics()).toEqual([])
  })

  it('prints the HTTP status on a non 200 answer (R-46)', async () => {
    stubNumbersFetch(() => Promise.resolve({ ok: false, status: 422, json: async () => null } as unknown as Response))
    render(<NumbersView selectedField={field} onClose={vi.fn()} />)
    expect(await screen.findByText('Numbers request failed (HTTP 422). Retry when the service is available.')).toBeTruthy()
  })
})

describe('a selected polygon (R-03, R-49, Table B, AC-50)', () => {
  const usRing: [number, number][] = [[-97.2, 46.9], [-97.19, 46.9], [-97.19, 46.91], [-97.2, 46.91], [-97.2, 46.9]]

  it('prints the raw id, the block 5 class and area with the retrieved label, and sends the outline with an interior point', async () => {
    const { bodies } = stubNumbersFetch(recordedNumbersPayload())
    useMapStore.setState({
      regionId: 'us',
      selectedFieldId: null,
      selectedPolygonId: '381825001868504',
      polygonRaw: { classValue: 5, area: 153.18667449 },
      polygonRing: usRing,
      chosenDate: '2026-11-12',
    })
    const { container } = render(<NumbersView selectedField={null} onClose={vi.fn()} />)
    await screen.findByText('Climate')
    const header = container.querySelector('.numbers-header') as HTMLElement
    expect(within(header).getByText('csb:381825001868504')).toBeTruthy()
    expect(within(header).getByText('Soybeans')).toBeTruthy()
    expect(within(header).getByText('153.2 acres')).toBeTruthy()
    const retrieved = within(header).getAllByText('retrieved')
    expect(retrieved).toHaveLength(2)
    expect(bodies).toHaveLength(1)
    expect(bodies[0].ring).toEqual(usRing)
    expect(bodies[0].area_ha).toBeNull()
    expect(bodies[0].date).toBe('2026-11-12')
    const [cx, cy] = bodies[0].centroid as [number, number]
    expect(cx).toBeCloseTo(-97.195, 6)
    expect(cy).toBeCloseTo(46.905, 6)
  })

  it('abstains with the outline text and sends no request when the map has not rendered the outline', async () => {
    const { fetchMock } = stubNumbersFetch(recordedNumbersPayload())
    useMapStore.setState({ regionId: 'us', selectedFieldId: null, selectedPolygonId: '381825001868504', polygonRing: null })
    render(<NumbersView selectedField={null} onClose={vi.fn()} />)
    expect(screen.getByText('Polygon outline not read yet. Select the polygon on the map.')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
