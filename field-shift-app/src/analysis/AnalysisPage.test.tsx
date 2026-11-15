import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { useLocaleStore } from '@/strings/locale-store'
import AnalysisPage from './AnalysisPage'

/** The analysis route renders the Field Phase sections from the real export. */

vi.mock('maplibre-gl', () => ({
  Map: class {
    addControl = vi.fn()
    addSource = vi.fn()
    addLayer = vi.fn()
    on = vi.fn()
    once = vi.fn()
    getSource = vi.fn()
    setFilter = vi.fn()
    setPaintProperty = vi.fn()
    fitBounds = vi.fn()
    flyTo = vi.fn()
    remove = vi.fn()
    isStyleLoaded = () => false
    getCanvas = () => ({ style: {} })
  },
  NavigationControl: class {},
  setWorkerUrl: vi.fn(),
}))

const EXPORT = resolve(__dirname, '../../backend/fixtures/fieldphase/data/v1')

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname.replace(/^\/fieldphase\/data\/v1\//, '')
    try {
      const body = JSON.parse(readFileSync(resolve(EXPORT, path), 'utf-8'))
      return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response
    } catch {
      return { ok: false, status: 503, statusText: 'Missing', json: async () => ({}) } as Response
    }
  }))
  useLocaleStore.getState().setLocale('pt-BR')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  useLocaleStore.getState().setLocale('en')
})

function renderAt(code: number, onClose = vi.fn()) {
  render(<AnalysisPage code={code} onSelectCode={vi.fn()} onClose={onClose} />)
  return onClose
}

describe('analysis page', () => {
  it('renders ENSO, rotations with three priorities and a table control for Tupancireta', async () => {
    const onClose = renderAt(4322202)
    expect(await screen.findByRole('heading', { level: 2, name: 'El Niño agora' })).toBeTruthy()
    const rotations = await screen.findByRole('region', { name: /Rotações recomendadas/ })
    await waitFor(() => expect(within(rotations).getAllByText('#1').length).toBeGreaterThan(0))
    for (const priority of ['Proteger o solo', 'Conservar água', 'Estabilidade de renda']) {
      expect(within(rotations).getAllByText(priority).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByRole('button', { name: /tabela/i }).length).toBeGreaterThan(0)
    const back = screen.getByRole('button', { name: 'Voltar ao mapa de talhões' })
    expect(document.activeElement).toBe(back)
    back.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('says why Santa Carmem has no rotations instead of asking to run the scoring', async () => {
    renderAt(5107248)
    const rotations = await screen.findByRole('region', { name: /Rotações recomendadas/ })
    expect(within(rotations).getByText(/fica sem notas/)).toBeTruthy()
    expect(within(rotations).queryByText('#1')).toBeNull()
  })
})
