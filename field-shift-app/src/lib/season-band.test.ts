import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSeasonBand, type ZarcSnapshot } from './season-band'

const SNAPSHOT_SHA256 = 'b53c8a7be60948fccb72e5cfa108b95debfdd932f5f15b315363d42a332dfde9'

const windowOf = (start: string, end: string) => ({
  start_date: start,
  end_date: end,
})

function row(crop: string, season: string, start: string, end: string, municipality = 'Santa Carmem', uf = 'MT') {
  return {
    crop,
    season,
    uf,
    municipality,
    management: 'Sequeiro',
    window_risk_20: windowOf(start, end),
  }
}

function snapshot(rows: ZarcSnapshot['rows']): ZarcSnapshot {
  return { rows }
}

const FIELD = { municipality: 'Santa Carmem', uf: 'MT', crops: ['Soybean', 'Corn', 'Cotton'] }

describe('AC-25 (a) and (b): the band names the municipality it cannot read', () => {
  it('shows the municipality empty text when the snapshot file is absent', () => {
    const band = buildSeasonBand(null, { ...FIELD, season: '2026/27' })
    expect(band.windows).toEqual([])
    expect(band.empty).toEqual([{ kind: 'municipality' }])
  })

  it('shows the municipality empty text when the snapshot does not list Santa Carmem', () => {
    const copy = snapshot([row('Soja', '2026/2027', '2026-10-01', '2027-01-10', 'Sinop')])
    const band = buildSeasonBand(copy, { ...FIELD, season: '2026/27' })
    expect(band.windows).toEqual([])
    expect(band.empty).toEqual([{ kind: 'municipality' }])
  })
})

describe('AC-25 (c): a crop the snapshot does not hold for the municipality', () => {
  const copy = snapshot([
    row('Soja', '2026/2027', '2026-10-01', '2027-01-10'),
    row('Milho 1ª Safra', '2026/2027', '2026-10-01', '2026-12-31'),
    row('Milho 2ª Safra', '2026/2027', '2027-01-01', '2027-03-10'),
  ])

  it('names Cotton and still draws Soybean and Corn', () => {
    const band = buildSeasonBand(copy, { ...FIELD, season: '2026/27' })
    expect(band.empty).toEqual([{ kind: 'crop', crop: 'Cotton' }])
    expect(band.windows.map((window) => window.fieldCrop)).toEqual(['Soybean', 'Corn', 'Corn'])
  })
})

describe('AC-25 (d) and (e): the file in the tree, at the three pinned dates', () => {
  const url = join(process.cwd(), 'artifacts', 'zarc-mt-snapshot.json')
  const raw = readFileSync(url)
  const file = JSON.parse(raw.toString('utf8')) as ZarcSnapshot

  it('checks the recorded sha256 before it reads the envelope values (AC-25 e)', () => {
    expect(createHash('sha256').update(raw).digest('hex')).toBe(SNAPSHOT_SHA256)
  })

  it('reads 2026/27 from the 2026/2027 rows only, with the table envelopes', () => {
    const band = buildSeasonBand(file, { ...FIELD, season: '2026/27' })
    expect(band.empty).toEqual([])
    expect(band.windows).toEqual([
      { fieldCrop: 'Soybean', snapshotCrop: 'Soja', start: '2026-10-01', end: '2027-01-10' },
      { fieldCrop: 'Corn', snapshotCrop: 'Milho 1ª Safra', start: '2026-10-01', end: '2026-12-31' },
      { fieldCrop: 'Corn', snapshotCrop: 'Milho 2ª Safra', start: '2027-01-01', end: '2027-03-10' },
      { fieldCrop: 'Cotton', snapshotCrop: 'Algodão Herbáceo', start: '2026-12-21', end: '2027-02-20' },
    ])
  })

  it('reads 2025/26 from the 2025/2026 rows only', () => {
    const band = buildSeasonBand(file, { ...FIELD, season: '2025/26' })
    expect(band.windows).toEqual([
      { fieldCrop: 'Soybean', snapshotCrop: 'Soja', start: '2025-10-01', end: '2026-01-10' },
      { fieldCrop: 'Corn', snapshotCrop: 'Milho 1ª Safra', start: '2025-10-11', end: '2025-12-31' },
      { fieldCrop: 'Corn', snapshotCrop: 'Milho 2ª Safra', start: '2026-01-01', end: '2026-02-28' },
      { fieldCrop: 'Cotton', snapshotCrop: 'Algodão Herbáceo', start: '2025-12-21', end: '2026-02-20' },
    ])
  })

  it('names the derived season when the snapshot does not hold it', () => {
    const band = buildSeasonBand(file, { ...FIELD, season: '2024/25' })
    expect(band.windows).toEqual([])
    expect(band.empty).toEqual([{ kind: 'season' }])
  })
})
