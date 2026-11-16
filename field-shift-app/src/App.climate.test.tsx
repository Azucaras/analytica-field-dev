import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useShellStore } from '@/shell/shell-store'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMapStore } from '@/lib/map-store'
import { climateFixture } from '@/test/climate-fixtures'
import { en } from './strings/en'
import App from './App'

/** Climate features measured on the whole screen: failure isolation, pilot fields, the string scan. */

const translationTestState = vi.hoisted(() => ({ useKeys: false }))

vi.mock('@/strings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/strings')>()
  return {
    ...actual,
    t: (key: string, vars?: Record<string, string | number>) =>
      translationTestState.useKeys ? key : actual.t(key, vars),
  }
})

vi.mock('maplibre-gl', () => ({
  Map: class {
    addControl = vi.fn()
    addSource = vi.fn()
    addLayer = vi.fn()
    flyTo = vi.fn()
    fitBounds = vi.fn()
    on = vi.fn()
    once = vi.fn()
    off = vi.fn()
    remove = vi.fn()
    getSource = vi.fn(() => null)
    getLayer = vi.fn(() => null)
    getStyle = vi.fn(() => ({ layers: [] }))
    getZoom = vi.fn(() => 11)
    getCenter = vi.fn(() => ({ lng: -55.27, lat: -11.91 }))
    getCanvas = () => ({ style: {} as { cursor?: string } })
    isStyleLoaded = () => false
    setFilter = vi.fn()
    setPaintProperty = vi.fn()
    setLayoutProperty = vi.fn()
    setFeatureState = vi.fn()
    removeFeatureState = vi.fn()
    removeControl = vi.fn()
    queryRenderedFeatures = vi.fn(() => [])
  },
  NavigationControl: class {},
  AttributionControl: class {
    options: unknown
    constructor(options?: unknown) { this.options = options }
    onAdd() { return {} }
    onRemove() {}
  },
  addProtocol: vi.fn(),
  setWorkerUrl: vi.fn(),
}))

type PilotFields = { fields: Array<Record<string, unknown>> }
const pilot = climateFixture<PilotFields>('pilot-fields.json').fields.map(({ scenarios: _scenarios, ...field }) => field)
const santaCarmem = {
  id: 'mt-santa-carmem-01',
  name: 'Field 01',
  location: 'Santa Carmem, Mato Grosso',
  municipality_code: 5107248,
  synthetic: false,
  coverage: 86,
  center: [-55.27, -11.91],
  boundary: { type: 'Polygon', coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92], [-55.285, -11.9]]] },
}
const fields = [santaCarmem, ...pilot]
const climateByCode: Record<number, string> = {
  5107248: 'municipality-5107248.json',
  4322202: 'municipality-4322202.json',
  2919553: 'municipality-2919553.json',
}

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response
}

const FIELDPHASE_EXPORT = resolve(__dirname, '../backend/fixtures/fieldphase/data/v1')

function mockApi({ ensoFails = false, climateFails = false } = {}) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname
    if (path.startsWith('/fieldphase/data/v1/')) {
      return ok(JSON.parse(readFileSync(resolve(FIELDPHASE_EXPORT, path.slice('/fieldphase/data/v1/'.length)), 'utf-8')))
    }
    if (path === '/layers') return ok([{ id: 'smap', label: 'SMAP soil moisture', basis: 'retrieved', resolution: '9 km', as_of: '2026-11-08' }])
    if (path === '/fields') return ok({ fields, seasons: ['2023/24', '2024/25', '2025/26'], default_season: '2025/26' })
    if (path === '/climate/enso') {
      if (ensoFails) return { ok: false, status: 503, json: async () => ({}) } as Response
      return ok(climateFixture('enso.json'))
    }
    const [, , fieldId, resource] = path.split('/')
    const field = fields.find((entry) => entry.id === fieldId) as Record<string, unknown> | undefined
    if (resource === 'climate') {
      if (climateFails) throw new TypeError('Failed to fetch')
      return ok({ field_id: fieldId, state: 'available', ...climateFixture<Record<string, unknown>>(climateByCode[field?.municipality_code as number]) })
    }
    const coverage = field?.coverage as number | null
    return ok({
      field_id: fieldId,
      season: '2025/26',
      state: coverage === null ? 'abstained' : 'ranked',
      threshold: coverage === null ? 'coverage_not_measured' : null,
      coverage,
      scenarios: [],
    })
  }))
}

beforeEach(() => {
  useShellStore.getState().reset()
  // These tests read the rotation cards; on the merged screen no analysis panel opens by itself.
  useShellStore.getState().setState('rotations', 'open')
  // The app opens on the United States; these cases use the Brazilian fields, so Brazil is active.
  window.history.replaceState({}, '', '/?region=br')
  useMapStore.setState({ regionId: 'br', selectedFieldId: null })
})

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
  translationTestState.useKeys = false
  useMapStore.setState({ selectedFieldId: null })
})

async function selectField(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const list = await screen.findByRole('group', { name: /your fields/i })
  await user.click(await within(list).findByRole('button', { name }))
}

describe('climate, pilot fields and the analysis sheet on the whole screen', () => {
  it('a pilot field prints coverage not measured, the abstention, the empty cards and the synthetic label', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)
    await selectField(user, /Field 04/)

    expect(await screen.findByText('Ranking withheld: coverage not measured.')).toBeTruthy()
    const panel = document.querySelector('.fs-panel[data-panel="rotations"]') as HTMLElement
    expect(within(panel).getByText('Coverage not measured')).toBeTruthy()
    expect(await within(panel).findByText('No rotation scenarios are available for this field.')).toBeTruthy()
    expect(panel.textContent).not.toContain('%')
    expect(document.querySelector('.fs-field-tag')?.textContent).toBe('synthetic field')
    // The climate line for the pilot municipality is on screen, in its own panel, with its own name.
    const climatePanel = document.querySelector('.fs-panel[data-panel="climate"]') as HTMLElement
    expect(await within(climatePanel).findByRole('region', { name: /Climate signal, Tupanciret/ })).toBeTruthy()
  })

  it('a failing ENSO endpoint shows the literal and leaves the field list working', async () => {
    mockApi({ ensoFails: true })
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByText('ENSO unavailable')).toBeTruthy()
    await selectField(user, /Field 01/)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(await screen.findByText('86% data coverage')).toBeTruthy()
  })

  it('a failing climate request prints one literal and nothing else changes', async () => {
    mockApi({ climateFails: true })
    const user = userEvent.setup()
    render(<App />)
    await selectField(user, /Field 01/)
    expect(await screen.findByText('Climate signal unavailable')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('every new visible string and accessible name comes from the catalog', async () => {
    mockApi()
    translationTestState.useKeys = true
    useMapStore.setState({ selectedFieldId: 'mt-santa-carmem-01' })
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(document.querySelector('section.climate-signal')).toBeTruthy())
    await waitFor(() => expect(document.querySelector('.enso-chip[role="group"]')).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'evidence.supporting_data' }))
    await waitFor(() => expect(document.querySelector('.climate-evidence')).toBeTruthy())

    const catalogKeys = new Set(Object.keys(en))
    const unknown: string[] = []
    const literals: string[] = []
    const inspect = (text: string) => {
      if (/^[a-z][a-z0-9_-]*\.[a-zA-Z0-9_.-]+$/.test(text)) {
        if (!catalogKeys.has(text)) unknown.push(text)
        return
      }
      if (/^(?:\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s*[A-Za-z³⁄/%]+|\d{4}[-/]\d{2}(?:[-/]\d{2})?|https?:\/\/\S+|GM|[·/]+|\d+)$/.test(text)) return
      literals.push(text)
    }
    for (const node of document.querySelectorAll('.climate-signal *, .climate-evidence *, .enso-chip *, .fs-field-tag')) {
      if (node.closest('[data-dynamic-content]')) continue
      for (const child of node.childNodes) {
        if (child.nodeType !== Node.TEXT_NODE) continue
        const text = child.textContent?.trim()
        if (text) inspect(text)
      }
    }
    for (const node of document.querySelectorAll('.climate-signal [aria-label], .climate-signal[aria-label], .climate-evidence[aria-label], .enso-chip[aria-label]')) {
      const text = node.getAttribute('aria-label')?.trim()
      if (text) inspect(text)
    }
    expect(unknown).toEqual([])
    expect(literals).toEqual([])
  })

  it('the selected field opens the analysis sheet for its municipality on this page', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)
    await selectField(user, /Field 01/)
    await user.click(await screen.findByRole('button', { name: 'Full analysis' }))
    expect(window.location.hash).toBe('#analise/5107248')
    expect(await screen.findByRole('dialog', { name: 'Municipal analysis' }, { timeout: 15000 })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Analysis' }).getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Municipal analysis' })).toBeNull())
    expect(window.location.hash).toBe('')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Analysis' }))
  }, 30_000)

  it('the HUD opens in Portuguese and the switch turns it to English', async () => {
    localStorage.removeItem('fs.locale')
    const { useLocaleStore } = await import('@/strings/locale-store')
    useLocaleStore.setState({ locale: 'pt-BR' })
    mockApi()
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findAllByRole('button', { name: 'Talhões' })).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Dados de apoio' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(await screen.findAllByRole('button', { name: 'Fields' })).not.toHaveLength(0)
    expect(localStorage.getItem('fs.locale')).toBe('en')
    useLocaleStore.setState({ locale: 'en' })
  })
})
