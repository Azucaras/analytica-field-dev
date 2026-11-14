import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ZarcSnapshot } from './season-band'
import { brazilWindowSource, windowSourceFor } from './window-source'

const SNAPSHOT_SHA256 = 'b53c8a7be60948fccb72e5cfa108b95debfdd932f5f15b315363d42a332dfde9'
const CROPS = ['Soybean', 'Corn', 'Cotton']
const BRAZIL = 'Santa Carmem, Mato Grosso'
const UNITED_STATES = 'Fresno, California'

function treeSnapshot(): ZarcSnapshot {
  const raw = readFileSync(join(process.cwd(), 'artifacts', 'zarc-mt-snapshot.json'))
  expect(createHash('sha256').update(raw).digest('hex')).toBe(SNAPSHOT_SHA256)
  return JSON.parse(raw.toString('utf8')) as ZarcSnapshot
}

function recordedCopy(rows: ZarcSnapshot['rows']): ZarcSnapshot {
  return { rows }
}

describe('R-31 (revision 8): the window source boundary', () => {
  it('selects the Brazil source for a field whose location names a Brazilian state', () => {
    const source = windowSourceFor(BRAZIL, treeSnapshot())
    expect(source).not.toBeNull()
    expect(source?.region).toBe('br')
  })

  it('has no source for a region this block supplies none for (AC-25 f)', () => {
    // The United States source is OD-23, owned by block 7: the boundary says so here.
    expect(windowSourceFor(UNITED_STATES, treeSnapshot())).toBeNull()
  })

  it('has no source when the field names no location at all', () => {
    expect(windowSourceFor(null, treeSnapshot())).toBeNull()
  })

  it('returns the windows of the chosen date from the snapshot, as wave 3 read them', () => {
    const source = windowSourceFor(BRAZIL, treeSnapshot())
    expect(source).not.toBeNull()
    expect(source!.windowsFor({ date: '2026-11-12', crops: CROPS })).toEqual({
      season: '2026/27',
      windows: [
        { fieldCrop: 'Soybean', snapshotCrop: 'Soja', start: '2026-10-01', end: '2027-01-10' },
        { fieldCrop: 'Corn', snapshotCrop: 'Milho 1ª Safra', start: '2026-10-01', end: '2026-12-31' },
        { fieldCrop: 'Corn', snapshotCrop: 'Milho 2ª Safra', start: '2027-01-01', end: '2027-03-10' },
        { fieldCrop: 'Cotton', snapshotCrop: 'Algodão Herbáceo', start: '2026-12-21', end: '2027-02-20' },
      ],
      empty: [],
    })
  })

  it('reads 2025-11-10 from the 2025/2026 rows only', () => {
    const source = windowSourceFor(BRAZIL, treeSnapshot())!
    const band = source.windowsFor({ date: '2025-11-10', crops: CROPS })
    expect(band.season).toBe('2025/26')
    expect(band.windows.map((window) => [window.snapshotCrop, window.start, window.end])).toEqual([
      ['Soja', '2025-10-01', '2026-01-10'],
      ['Milho 1ª Safra', '2025-10-11', '2025-12-31'],
      ['Milho 2ª Safra', '2026-01-01', '2026-02-28'],
      ['Algodão Herbáceo', '2025-12-21', '2026-02-20'],
    ])
  })

  it('names the season the snapshot does not hold with the derived Y/YY label', () => {
    const source = windowSourceFor(BRAZIL, treeSnapshot())!
    expect(source.windowsFor({ date: '2024-11-01', crops: CROPS })).toEqual({
      season: '2024/25',
      windows: [],
      empty: [{ kind: 'season' }],
    })
  })

  it('normalises the derived Y/YY label to the snapshot Y/YYYY key through the one mapping', () => {
    // 2015-04-01 is the derived season 2014/15, whose snapshot key is 2014/2015.
    const source = windowSourceFor(BRAZIL, recordedCopy([{
      crop: 'Soja',
      season: '2014/2015',
      uf: 'MT',
      municipality: 'Santa Carmem',
      management: 'Sequeiro',
      window_risk_20: { start_date: '2014-10-05', end_date: '2015-01-15' },
    }]))!
    expect(source.windowsFor({ date: '2015-04-01', crops: ['Soybean'] })).toEqual({
      season: '2014/15',
      windows: [{ fieldCrop: 'Soybean', snapshotCrop: 'Soja', start: '2014-10-05', end: '2015-01-15' }],
      empty: [],
    })
  })

  it('keeps the municipality empty when the snapshot file is absent (AC-25 a)', () => {
    const source = windowSourceFor(BRAZIL, null)!
    expect(source.windowsFor({ date: '2026-11-12', crops: CROPS })).toEqual({
      season: '2026/27',
      windows: [],
      empty: [{ kind: 'municipality' }],
    })
  })

  it('builds the Brazil source for an already parsed place', () => {
    const source = brazilWindowSource({ municipality: 'Santa Carmem', uf: 'MT' }, treeSnapshot())
    expect(source.region).toBe('br')
    expect(source.windowsFor({ date: '2026-11-12', crops: ['Soybean'] }).windows).toEqual([
      { fieldCrop: 'Soybean', snapshotCrop: 'Soja', start: '2026-10-01', end: '2027-01-10' },
    ])
  })
})
