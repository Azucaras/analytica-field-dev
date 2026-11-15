import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { EvidencePanel, type EvidenceRow } from './EvidencePanel'
import { fieldClimateSchema } from '@/lib/climate'
import { climateFixture } from '@/test/climate-fixtures'

const rows: EvidenceRow[] = [
  {
    layer: 'Soil moisture',
    value: '0.42',
    basis: 'observed',
    as_of: '2025-06-15',
    source: 'https://example.com/soil-moisture',
  },
  {
    layer: 'Rainfall',
    value: null,
    basis: 'retrieved',
    as_of: '2025-06-14',
    source: 'https://example.com/rainfall',
  },
  {
    layer: 'Rotation outlook',
    value: 'Favourable',
    basis: 'modelled',
    as_of: '2025-06-13',
    source: 'https://example.com/outlook',
  },
  {
    layer: 'Water access',
    value: 'Unknown',
    basis: 'entered',
    as_of: '2025-06-12',
    source: 'https://example.com/water-access',
  },
]

afterEach(cleanup)

describe('EvidencePanel', () => {
  it('renders the evidence skeletons while loading and keeps the region contract', () => {
    render(<EvidencePanel rows={rows} isLoading />)

    const panel = screen.getByRole('region', { name: 'Evidence' })
    expect(panel.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(within(panel).queryByRole('table')).toBeNull()
  })

  it('renders the empty state with its reason instead of evidence rows', () => {
    render(<EvidencePanel rows={[]} emptyReason="Evidence is unavailable for this field." />)

    const panel = screen.getByRole('region', { name: 'Evidence' })
    expect(within(panel).getByText('Evidence is unavailable for this field.')).toBeTruthy()
    expect(panel.querySelector('[data-slot="empty"]')).not.toBeNull()
    expect(within(panel).queryByRole('table')).toBeNull()
  })

  it('renders evidence normally when no loading or empty flags are provided', () => {
    render(<EvidencePanel rows={rows} />)

    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1)
    expect(document.querySelector('[data-slot="skeleton"]')).toBeNull()
    expect(document.querySelector('[data-slot="empty"]')).toBeNull()
  })

  it('renders the five specified table columns', () => {
    render(<EvidencePanel rows={rows} />)

    const table = within(screen.getByRole('region', { name: 'Evidence' })).getByRole('table')
    const headers = within(table).getAllByRole('columnheader')

    expect(headers.map((header) => header.textContent)).toEqual([
      'Layer',
      'Value',
      'Basis',
      'As of',
      'Source',
    ])
  })

  it('shows an allowed basis label on every evidence row', () => {
    render(<EvidencePanel rows={rows} />)

    const table = within(screen.getByRole('region', { name: 'Evidence' })).getByRole('table')
    const bodyRows = within(table).getAllByRole('row').slice(1)
    const expectedBases = ['observed', 'retrieved', 'modelled', 'entered']

    expect(bodyRows).toHaveLength(expectedBases.length)
    expect(bodyRows.map((row) => row.querySelectorAll('th, td')[2].textContent)).toEqual(expectedBases)
  })

  it('renders No observation for a row with no value', () => {
    render(<EvidencePanel rows={rows} />)

    const rainfallRow = screen.getByRole('row', { name: /Rainfall/ })

    expect(within(rainfallRow).getByRole('cell', { name: 'No observation' })).toBeTruthy()
  })

  it('links the source URL using the source itself as link text', () => {
    render(<EvidencePanel rows={rows} />)

    const sourceUrl = 'https://example.com/soil-moisture'
    const sourceLink = screen.getByRole('link', { name: sourceUrl })

    expect(sourceLink.getAttribute('href')).toBe(sourceUrl)
  })
})

describe('EvidencePanel climate table', () => {
  it('renders a reported row with the reported badge', () => {
    render(<EvidencePanel rows={[{ layer: 'Crop history', value: 'Soybean → Corn', basis: 'reported', as_of: '2025-06-30', source: 'https://example.com' }]} />)
    expect(screen.getByText('reported').className).toContain('basis-reported')
  })

  it('renders one climate row per fixture row and flags exactly the flagged rows', () => {
    const climate = fieldClimateSchema.parse({ state: 'available', ...climateFixture<Record<string, unknown>>('municipality-5107248.json') })
    render(<EvidencePanel rows={[]} emptyReason="Evidence rows appear once a scenario is selected" climate={{ municipality: 'Santa Carmem (MT)', rows: climate.rows }} />)
    const table = document.querySelector('.climate-evidence') as HTMLElement
    expect(table.getAttribute('aria-label')).toBe('Climate signal, Santa Carmem (MT)')
    const bodyRows = [...table.querySelectorAll('tbody tr')]
    expect(bodyRows).toHaveLength(climate.rows.length)
    bodyRows.forEach((tr, index) => {
      const row = climate.rows[index]
      expect(tr.textContent?.includes('small sample')).toBe(row.small_sample)
      expect(tr.textContent?.includes('assumed crop season')).toBe(row.assumption)
      expect(tr.querySelector('.basis-label')?.textContent).toBe(row.basis)
      expect(tr.textContent).toContain(row.value)
    })
  })
})
