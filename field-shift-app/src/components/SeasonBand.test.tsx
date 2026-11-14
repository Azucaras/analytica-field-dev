import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SeasonBand } from './SeasonBand'
import type { ZarcSnapshot } from '@/lib/season-band'
import snapshotJson from '../../artifacts/zarc-mt-snapshot.json'

const AXIS = { start: '2015-04-01', end: '2026-11-14', default: '2026-11-14' }
const CROPS = ['Soybean', 'Corn', 'Cotton']
const SNAPSHOT = snapshotJson as unknown as ZarcSnapshot

afterEach(cleanup)

const windowsOf = () => [...document.querySelectorAll('[data-season-window]')].map((node) => ({
  crop: node.getAttribute('data-snapshot-crop'),
  fieldCrop: node.getAttribute('data-field-crop'),
  start: node.getAttribute('data-start'),
  end: node.getAttribute('data-end'),
}))

describe('R-31 and AC-25: the band of the season band source', () => {
  it('claims nothing while no field is selected (R-35)', () => {
    render(<SeasonBand axis={AXIS} crops={CROPS} date="2026-11-12" location={null} snapshot={SNAPSHOT} />)
    expect(document.querySelector('[data-season-band]')).toBeNull()
    expect(windowsOf()).toEqual([])
  })

  it('draws the four Brazil windows of 2026/27 with the wave 3 labels and dates', () => {
    render(<SeasonBand axis={AXIS} crops={CROPS} date="2026-11-12" location="Santa Carmem, Mato Grosso" snapshot={SNAPSHOT} />)
    expect(windowsOf()).toEqual([
      { crop: 'Soja', fieldCrop: 'Soybean', start: '2026-10-01', end: '2027-01-10' },
      { crop: 'Milho 1ª Safra', fieldCrop: 'Corn', start: '2026-10-01', end: '2026-12-31' },
      { crop: 'Milho 2ª Safra', fieldCrop: 'Corn', start: '2027-01-01', end: '2027-03-10' },
      { crop: 'Algodão Herbáceo', fieldCrop: 'Cotton', start: '2026-12-21', end: '2027-02-20' },
    ])
    const labels = [...document.querySelectorAll('[data-season-window]')].map((node) => node.textContent ?? '')
    expect(labels).toEqual([
      'Soja, 2026-10-01 to 2027-01-10',
      'Milho 1ª Safra, 2026-10-01 to 2026-12-31',
      'Milho 2ª Safra, 2027-01-01 to 2027-03-10',
      'Algodão Herbáceo, 2026-12-21 to 2027-02-20',
    ])
    expect(document.querySelector('[data-season-empty]')).toBeNull()
  })

  it('draws no window and names the missing source when the region has none (AC-25 f)', () => {
    render(<SeasonBand axis={AXIS} crops={CROPS} date="2026-11-12" location="Fresno, California" snapshot={SNAPSHOT} />)
    expect(document.querySelector('[data-season-band]')).not.toBeNull()
    expect(windowsOf()).toEqual([])
    expect(screen.getByText('No planting window source for this region')).toBeTruthy()
    expect(document.querySelectorAll('[data-season-empty="no_source"]').length).toBe(1)
    expect(screen.queryByText(/No planting window data/)).toBeNull()
  })

  it('keeps the Brazil municipality empty text for an absent snapshot file (AC-25 a)', () => {
    render(<SeasonBand axis={AXIS} crops={CROPS} date="2026-11-12" location="Santa Carmem, Mato Grosso" snapshot={null} />)
    expect(windowsOf()).toEqual([])
    expect(screen.getByText('No planting window data for this municipality')).toBeTruthy()
    expect(screen.queryByText('No planting window source for this region')).toBeNull()
  })
})
