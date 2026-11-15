import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMapStore } from '@/lib/map-store'
import { en } from './strings/en'
import { layersResponse } from '@/test/api-fixtures'
import App from './App'
import { AppDataProvider } from '@/shell/app-data'
import { Shell } from '@/shell/Shell'
import { definePanel } from '@/shell/registry'
import { useShellStore } from '@/shell/shell-store'
import { PANELS } from '@/shell/panels'
import { PANEL_IDS } from '@/shell/panel-ids'
import { Sprout } from 'lucide-react'

function scanVisibleUi(root: ParentNode) {
  const catalogKeys = new Set(Object.keys(en))
  const literalStrings = new Set<string>()
  const missingTranslationKeys = new Set<string>()
  const inspect = (text: string) => {
    if (/^[a-z][a-z0-9_-]*\.[a-zA-Z0-9_.-]+$/.test(text)) {
      if (!catalogKeys.has(text)) missingTranslationKeys.add(text)
      return
    }
    if (/^(?:\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s+km|\d+(?:\.\d+)?\s*[A-Za-z³⁄/%]+(?:\/[A-Za-z³⁄%]+)*|\d{4}[-/]\d{2}(?:[-/]\d{2})?|https?:\/\/\S+|GM|[·/]+|%|\{\}|\d+)$/.test(text)) return
    literalStrings.add(text)
  }

  for (const node of root.querySelectorAll('.fs-shell *')) {
    if (node.closest('[data-dynamic-content]')) continue
    for (const child of node.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE) continue
      const text = child.textContent?.trim()
      if (text) inspect(text)
    }
  }
  for (const node of root.querySelectorAll('.fs-shell [aria-label], .fs-shell [placeholder], .fs-shell [title]')) {
    if (node.closest('[data-dynamic-content]')) continue
    for (const attribute of ['aria-label', 'placeholder', 'title']) {
      const text = node.getAttribute(attribute)?.trim()
      if (text) inspect(text)
    }
  }

  return { literalStrings: [...literalStrings], missingTranslationKeys: [...missingTranslationKeys] }
}

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
    remove = vi.fn()
    getSource = vi.fn(() => null)
    getLayer = vi.fn(() => null)
    getStyle = vi.fn(() => ({ layers: [] }))
    getZoom = vi.fn(() => 11)
    getCenter = vi.fn(() => ({ lng: -55.27, lat: -11.91 }))
    getCanvas = () => ({ style: {} as { cursor?: string } })
    setPaintProperty = vi.fn()
    setLayoutProperty = vi.fn()
    setFeatureState = vi.fn()
    removeFeatureState = vi.fn()
    removeControl = vi.fn()
    queryRenderedFeatures = vi.fn(() => [])
    off = vi.fn()
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

const fields = [
  {
    id: 'mt-santa-carmem-01',
    name: 'Santa Carmem North',
    location: 'Santa Carmem, Mato Grosso',
    coverage: 86,
    center: [-55.27, -11.91] as [number, number],
    boundary: { type: 'Polygon' as const, coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92], [-55.285, -11.9]]] },
  },
  {
    id: 'mt-santa-carmem-03',
    name: 'Santa Carmem South',
    location: 'Santa Carmem, Mato Grosso',
    coverage: 62,
    center: [-55.21, -11.97] as [number, number],
    boundary: { type: 'Polygon' as const, coordinates: [[[-55.225, -11.96], [-55.2, -11.96], [-55.2, -11.98], [-55.225, -11.98], [-55.225, -11.96]]] },
  },
]

const scenarios = {
  field_id: 'mt-santa-carmem-01',
  season: '2025/26',
  state: 'ranked',
  threshold: null,
  scenarios: [
    { id: 'current', name: 'Current sequence', is_current: true, crops: ['Soybean', 'Corn'], why: 'Current farm plan', evidence: 'Three supported seasons', benefit: 'Known operating fit', gap: 'No input-cost data', risk: 'Weather variability', evidence_rows: [{ layer: 'SMAP soil moisture', value: '0.28 m³/m³', basis: 'retrieved' as const, as_of: '2025-11-10', source: 'https://example.com/smap' }] },
    { id: 'rotation-a', name: 'Soybean → Corn', is_current: false, crops: ['Soybean', 'Corn'], why: 'Alternates crop families', evidence: 'SMAP soil moisture', benefit: 'Diversifies rotation', gap: 'Market access unknown', risk: 'Dry-season stress', evidence_rows: [] },
    { id: 'rotation-b', name: 'Soybean → Cotton', is_current: false, crops: ['Soybean', 'Cotton'], why: 'Adds a fiber crop', evidence: 'Three supported seasons', benefit: 'Additional outlet', gap: 'Credit terms unknown', risk: 'Higher input demand', evidence_rows: [] },
  ],
}

function mockApi() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (new URL(url).pathname === '/layers') {
      return { ok: true, status: 200, json: async () => layersResponse() } as Response
    }
    if (url.endsWith('/fields')) {
      return { ok: true, status: 200, json: async () => ({ fields, seasons: ['2023/24', '2024/25', '2025/26'], default_season: '2025/26' }) } as Response
    }
    const fieldId = new URL(url).pathname.split('/')[2]
    const abstained = fieldId === 'mt-santa-carmem-03'
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ...scenarios,
        field_id: fieldId,
        state: abstained ? 'abstained' : 'ranked',
        threshold: abstained ? 'coverage_below_80_percent' : null,
        coverage: abstained ? 62 : 86,
      }),
    } as Response
  }))
}

beforeEach(() => {
  // Block 5 makes the United States the default region (R-01) and lists only the active
  // region's fixtures (R-24, AM-10). These block 1 to 4 cases exercise the Brazil fixtures,
  // so they run with Brazil active, which `?region=` is the only way to choose.
  window.history.replaceState({}, '', '/?region=br')
  useMapStore.setState({ regionId: 'br', selectedFieldId: null, chosenDate: null })
  useShellStore.getState().reset()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  translationTestState.useKeys = false
  window.localStorage.removeItem('fs.locale')
  useMapStore.setState({ selectedFieldId: null, chosenDate: null, regionId: 'us', selectedPolygonId: null })
  window.history.replaceState({}, '', '/')
})


const rail = (id: string) => document.querySelector(`.fs-rail [data-tool="${id}"]`) as HTMLButtonElement
const panel = (id: string) => document.querySelector(`.fs-panel[data-panel="${id}"]`) as HTMLElement | null

async function fieldList() {
  return await screen.findByRole('group', { name: /your fields|map\.your_fields/i })
}

async function pickField(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  const list = await fieldList()
  await user.click(await within(list).findByRole('button', { name }))
}

function stubPhone(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches && query.includes('760px'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

describe('the shell: a rail of panels around the map', () => {
  it('registers every panel id the agent command knows, and no other', () => {
    expect(PANELS.map((entry) => entry.id).sort()).toEqual([...PANEL_IDS].sort())
  })

  it('puts the map in its own cell and each default panel in its slot', async () => {
    mockApi()
    render(<App />)

    expect(await screen.findByRole('region', { name: 'Field map' })).toBeTruthy()
    const slotOf = (id: string) => panel(id)?.closest('[data-slot-name]')?.getAttribute('data-slot-name')
    await waitFor(() => expect(panel('fields')).toBeTruthy())
    expect(slotOf('fields')).toBe('left')
    expect(slotOf('climate')).toBe('left')
    expect(slotOf('polygon')).toBe('left')
    expect(slotOf('layers')).toBe('right')
    expect(slotOf('timeline')).toBe('bottom')
    expect(slotOf('rotations')).toBe('bottom')
    // Closed by default: no frame, and the rail button is not pressed.
    expect(panel('evidence')).toBeNull()
    expect(panel('command')).toBeNull()
    expect(rail('evidence').getAttribute('aria-pressed')).toBe('false')
    // No panel is a floating overlay on the map.
    expect(document.querySelector('.fs-map .fs-panel')).toBeNull()
  })

  it('lists one rail button per panel, in the order of the panel list', async () => {
    mockApi()
    render(<App />)

    await screen.findByRole('region', { name: 'Field map' })
    const ids = [...document.querySelectorAll('.fs-rail [data-tool]')].map((node) => node.getAttribute('data-tool'))
    expect(ids).toEqual([...PANELS].sort((a, b) => a.order - b.order).map((entry) => entry.id))
  })

  it('collapses a panel to its header, closes it, and reopens it from the rail', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await fieldList()
    const header = within(panel('fields') as HTMLElement).getByRole('button', { name: 'Fields', expanded: true })
    await user.click(header)
    expect(panel('fields')?.getAttribute('data-state')).toBe('collapsed')
    expect(screen.queryByRole('group', { name: /your fields/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Close Fields' }))
    expect(panel('fields')).toBeNull()
    expect(rail('fields').getAttribute('aria-pressed')).toBe('false')

    await user.click(rail('fields'))
    expect(await fieldList()).toBeTruthy()
    expect(rail('fields').getAttribute('aria-pressed')).toBe('true')
  })

  it('a panel that throws shows its own message and leaves the others working', async () => {
    mockApi()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Broken = () => { throw new Error('boom') }
    const panels = [
      definePanel({ id: 'broken', titleKey: 'fields.trigger', icon: Sprout, slot: 'left', order: 1, defaultState: 'open', Component: Broken }),
      definePanel({ id: 'fine', titleKey: 'layers.navigation', icon: Sprout, slot: 'right', order: 2, defaultState: 'open', Component: () => <p>still here</p> }),
    ]
    render(
      <AppDataProvider openAnalysis={() => {}}>
        <Shell end={null} map={<div />} panels={panels} start={null} />
      </AppDataProvider>,
    )

    expect((await screen.findByRole('alert')).textContent).toContain('This panel could not be shown.')
    expect(screen.getByText('still here')).toBeTruthy()
  })

  it('on a phone shows a tab bar and opens one panel at a time in a sheet', async () => {
    stubPhone(true)
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('region', { name: 'Field map' })
    expect(document.querySelector('.fs-rail')).toBeNull()
    expect(document.querySelector('.fs-slot')).toBeNull()
    const tabs = document.querySelector('.fs-tabbar') as HTMLElement
    expect(tabs).toBeTruthy()

    await user.click(within(tabs).getByRole('button', { name: 'Layers' }))
    expect(document.querySelector('.fs-sheet')?.getAttribute('data-panel')).toBe('layers')
    await user.click(within(tabs).getByRole('button', { name: 'Fields' }))
    expect(document.querySelector('.fs-sheet')?.getAttribute('data-panel')).toBe('fields')
    expect(document.querySelectorAll('.fs-sheet')).toHaveLength(1)
    await user.click(within(tabs).getByRole('button', { name: 'Fields' }))
    expect(document.querySelector('.fs-sheet')).toBeNull()
  })
})

describe('fields, scenarios and evidence', () => {
  it('scans rendered interface text for untranslated literals when t returns keys', async () => {
    translationTestState.useKeys = true
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await pickField(user, 'map.field.mt-santa-carmem-03')
    await waitFor(() => expect(document.querySelectorAll('.scenario-card[role="option"]')).toHaveLength(3))
    await user.click(rail('command'))
    await user.click(rail('evidence'))
    const { literalStrings, missingTranslationKeys } = scanVisibleUi(document)
    expect(missingTranslationKeys).toEqual([])
    expect(literalStrings).toEqual([])
  })

  it('shows the server abstention threshold for field 03, keeps all cards, and hides ranking markers', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await pickField(user, /Santa Carmem South/)
    await waitFor(() => expect(document.querySelector('.abstention-notice')?.textContent).toContain('Ranking withheld: coverage below 80%.'))
    const list = screen.getByRole('list', { name: 'Rotation scenarios' })
    expect(within(list).getAllByRole('option')).toHaveLength(3)
    expect(within(list).queryByText(/#\s*\d+/)).toBeNull()
    await user.click(rail('evidence'))
    expect(within(screen.getByRole('region', { name: 'Evidence' })).getByRole('row', { name: /SMAP soil moisture/ }).textContent).toContain('retrieved')
  })

  it('does not show an abstention notice for ranked field 01', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await pickField(user, /Santa Carmem North/)
    await screen.findByRole('list', { name: 'Rotation scenarios' })
    expect(document.querySelector('.abstention-notice')).toBeNull()
  })

  it('requests scenarios without a season and keeps the fixture values when the date changes', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await pickField(user, 'Santa Carmem North')
    await screen.findByRole('list', { name: 'Rotation scenarios' })
    const scenarioRequest = 'http://localhost:8000/fields/mt-santa-carmem-01/scenarios'
    expect(vi.mocked(fetch).mock.calls.map(([input]) => String(input))).toContain(scenarioRequest)

    const before = vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes('/scenarios')).length
    fireEvent.change(screen.getByLabelText('Go to date'), { target: { value: '2026-11-12' } })
    expect(await screen.findByText('Fixture data for 2025/26, not for 2026/27')).toBeTruthy()
    expect(screen.getByText('0.28 m³/m³')).toBeTruthy()
    expect(vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes('/scenarios'))).toHaveLength(before)
  })

  it('keeps every panel mounted and retries only the field list after an HTTP error', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (new URL(String(input)).pathname === '/layers') {
        return { ok: true, status: 200, json: async () => layersResponse() } as Response
      }
      if (new URL(String(input)).pathname === '/fields') {
        if (fetchMock.mock.calls.filter(([request]) => new URL(String(request)).pathname === '/fields').length === 1) {
          return { ok: false, status: 500, json: async () => ({}) } as Response
        }
        return { ok: true, status: 200, json: async () => ({ fields, seasons: ['2023/24', '2024/25', '2025/26'], default_season: '2025/26' }) } as Response
      }
      throw new Error(`Unexpected request: ${String(input)}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findAllByText('Backend request failed (HTTP 500). Retry when it is available.')).not.toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Field map' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Layers' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Timeline' })).toBeTruthy()
    expect(document.querySelector('select')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Satellite', pressed: false }))
    expect(screen.getByRole('button', { name: 'Satellite', pressed: true })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('button', { name: /Santa Carmem North/ })).toBeTruthy()
    expect(fetchMock.mock.calls.filter(([input]) => new URL(String(input)).pathname === '/fields')).toHaveLength(2)
  })

  it('renders a translated backend-unreachable reason when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<App />)

    expect(await screen.findAllByText('Backend is unreachable. Check your connection and retry.')).not.toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Field map' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Evidence' })).toBeNull()
  })

  it('mounts Evidence only while Supporting data is open', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await fieldList()
    expect(screen.queryByRole('region', { name: 'Evidence' })).toBeNull()
    await user.click(rail('evidence'))
    expect(await screen.findByRole('region', { name: 'Evidence' })).toBeTruthy()
    await user.click(rail('evidence'))
    expect(screen.queryByRole('region', { name: 'Evidence' })).toBeNull()
  })

  it('prints coverage once, in the rotation panel', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await pickField(user, /Santa Carmem North/)
    await screen.findByText('86% data coverage')
    expect(screen.getAllByText(/% data coverage/)).toHaveLength(1)
  })
})

describe('the command panel', () => {
  it('runs a registered agent command and reports an unregistered name', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await fieldList()
    await user.click(rail('command'))
    expect(screen.getByRole('form', { name: 'Agent command' })).toBeTruthy()
    const commandInput = screen.getByRole('textbox', { name: 'Command name' })
    expect(document.activeElement).toBe(commandInput)
    const argumentsInput = screen.getByRole('textbox', { name: 'JSON arguments' })
    await user.type(commandInput, 'set_composition')
    fireEvent.change(argumentsInput, { target: { value: '{"preset":"satellite"}' } })
    await user.click(screen.getByRole('button', { name: 'Run command' }))
    expect(useMapStore.getState().composition).toBe('satellite')

    await user.clear(commandInput)
    await user.type(commandInput, 'unknown_command')
    await user.click(screen.getByRole('button', { name: 'Run command' }))
    expect(screen.getByRole('alert').textContent).toMatch(/select_field.*set_composition.*open_panel.*apply_filter/)
  })

  it('open_panel from the agent opens the named panel on screen', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await fieldList()
    await user.click(rail('command'))
    await user.type(screen.getByRole('textbox', { name: 'Command name' }), 'open_panel')
    fireEvent.change(screen.getByRole('textbox', { name: 'JSON arguments' }), { target: { value: '{"panel":"evidence"}' } })
    await user.click(screen.getByRole('button', { name: 'Run command' }))
    expect(await screen.findByRole('region', { name: 'Evidence' })).toBeTruthy()
  })
})

describe('the command help', () => {
  it('lists each command and fills the form from its example', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await fieldList()
    await user.click(rail('command'))
    const help = screen.getByRole('region', { name: 'Available commands' })
    expect(within(help).getAllByRole('button')).toHaveLength(4)
    await user.click(within(help).getByRole('button', { name: 'Use the set_composition example' }))
    expect((screen.getByRole('textbox', { name: 'Command name' }) as HTMLInputElement).value).toBe('set_composition')
    expect((screen.getByRole('textbox', { name: 'JSON arguments' }) as HTMLInputElement).value).toBe('{"preset":"satellite"}')
    await user.click(screen.getByRole('button', { name: 'Run command' }))
    expect(useMapStore.getState().composition).toBe('satellite')
  })
})

describe('rotation flip cards', () => {
  it('flips one card to its facts and back without touching the others', async () => {
    mockApi()
    const user = userEvent.setup()
    render(<App />)

    await pickField(user, 'Santa Carmem North')
    await screen.findByRole('list', { name: 'Rotation scenarios' })
    const card = (await screen.findByRole('heading', { name: 'Current sequence' })).closest('.scenario-card') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Charts for Current sequence' }))
    expect(within(card).getAllByRole('term').map((term) => term.textContent)).toEqual(['Why', 'Evidence', 'Benefit', 'Gap', 'Risk'])
    expect(document.querySelectorAll('.scenario-card .flip-overlay[aria-expanded="true"]')).toHaveLength(1)

    await user.click(within(card).getByRole('button', { name: 'Details for Current sequence' }))
    expect(within(card).queryByRole('term')).toBeNull()
  })

  it('names a scenario the catalog does not know by its own crops, never by a raw key', async () => {
    const unknown = {
      ...scenarios,
      scenarios: [{ ...scenarios.scenarios[1], id: 'csb-1-observed-rotation', name: 'Spring Wheat → Sugarbeets', crops: ['Spring Wheat', 'Sugarbeets'], why: 'Seen in 2018 and 2019.' }],
    }
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (new URL(url).pathname === '/layers') return { ok: true, status: 200, json: async () => layersResponse() } as Response
      if (url.endsWith('/fields')) return { ok: true, status: 200, json: async () => ({ fields, seasons: ['2025/26'], default_season: '2025/26' }) } as Response
      return { ok: true, status: 200, json: async () => unknown } as Response
    }))
    const user = userEvent.setup()
    render(<App />)

    const heading = await screen.findByRole('heading', { name: 'Spring wheat → Sugar beets' })
    const card = heading.closest('.scenario-card') as HTMLElement
    expect(card.textContent).not.toMatch(/scenarios\.|common\.crop\./)
    await user.click(within(card).getByRole('button', { name: /^Charts for/ }))
    expect(card.textContent).toContain('Seen in 2018 and 2019.')
  })
})

describe('the timeline panel', () => {
  const dateInput = () => screen.getByLabelText('Go to date') as HTMLInputElement

  it('opens at the axis end by default', async () => {
    mockApi()
    render(<App />)

    await screen.findByRole('region', { name: 'Timeline' })
    await waitFor(() => expect(dateInput().value).toBe('2026-11-14'))
    expect(dateInput().min).toBe('2015-04-01')
    expect(dateInput().max).toBe('2026-11-14')
  })

  it('opens at ?date= and asks /layers for that date', async () => {
    window.history.replaceState({}, '', '/?region=br&date=2026-11-12')
    mockApi()
    render(<App />)

    await screen.findByRole('region', { name: 'Timeline' })
    await waitFor(() => expect(dateInput().value).toBe('2026-11-12'))
    const layerRequests = vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input)))
      .filter((url) => url.pathname === '/layers')
    expect(layerRequests.some((url) => url.searchParams.get('date') === '2026-11-12')).toBe(true)
  })

  it('clamps a query before the axis and says so', async () => {
    window.history.replaceState({}, '', '/?region=br&date=2015-03-01')
    mockApi()
    render(<App />)

    await screen.findByRole('region', { name: 'Timeline' })
    await waitFor(() => expect(dateInput().value).toBe('2015-04-01'))
    expect(screen.getByText('Date limited to 2015-04-01')).toBeTruthy()
  })
})
