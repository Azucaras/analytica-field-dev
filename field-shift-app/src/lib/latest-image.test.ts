import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  LATEST_IMAGE_DAYS,
  LATEST_IMAGE_THRESHOLD_BYTES,
  scanLatestImage,
  type CoverageRow,
} from './latest-image'

/**
 * The recorded coverage of AC-35 and AC-41, taken at the first field tile of zoom 12
 * (z 12, y 2184, x 1419) on 2026-11-14. The three dates above the threshold are 2026-10-16,
 * 2026-10-24 and 2026-11-01, which is M-17 by character.
 */
type Fixture = {
  layer: string
  recorded: string
  tile: { matrix: string; zoom: number; y: number; x: number; suffix: string }
  threshold_bytes: number
  dates: Array<{ date: string; http_status: number; bytes: number; address: string; url: string }>
}

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'artifacts/fixtures/hls-l30-coverage-zoom12-2026-11-14.json'), 'utf8'),
) as Fixture

const rowOf = (date: string): CoverageRow => {
  const row = fixture.dates.find((entry) => entry.date === date)
  if (!row) throw new Error(`The fixture holds no row for ${date}`)
  return {
    date: row.date,
    http_status: row.http_status,
    bytes: row.bytes,
    coverage_ok: row.http_status === 200 && row.bytes > fixture.threshold_bytes,
  }
}

/** One date per coverage call, which is the route the scan uses (`days=1`). */
function recordedTransport(options: { stopAt?: string; blank?: boolean } = {}) {
  const requested: string[] = []
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input))
    const date = url.searchParams.get('date') ?? ''
    requested.push(`${url.pathname}?date=${date}&days=${url.searchParams.get('days')}`)
    if (options.stopAt === date) {
      return { ok: false, status: 503, json: async () => ({ status: 'unavailable', dates_scanned: [date] }) } as Response
    }
    // A blank run answers every date, so it does not depend on the fixture's window.
    const row: CoverageRow = options.blank
      ? { date, http_status: 200, bytes: 400, coverage_ok: false }
      : rowOf(date)
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', layer: fixture.layer, start: date, end: date, days: 1, dates: [row] }),
    } as Response
  }
  return { fetcher, requested }
}

describe('R-44 the Latest image scan on the recorded HLS fixture (AC-35)', () => {
  it('reads the fixture the spec names, at the first field tile of zoom 12', () => {
    expect(fixture.layer).toBe('hls-l30')
    expect(fixture.tile).toEqual({ matrix: 'GoogleMapsCompatible_Level12', zoom: 12, y: 2184, x: 1419, suffix: '.jpg' })
    expect(fixture.threshold_bytes).toBe(LATEST_IMAGE_THRESHOLD_BYTES)
    expect(fixture.dates).toHaveLength(31)
    expect(fixture.dates[0].date).toBe('2026-10-15')
    expect(fixture.dates.at(-1)?.date).toBe('2026-11-14')
  })

  it('lands on 2026-11-01, the first date above 5,000 bytes going backwards', async () => {
    const { fetcher, requested } = recordedTransport()
    const scan = await scanLatestImage({ layerId: 'hls-l30', chosenDate: '2026-11-14', fetcher })

    expect(scan.status).toBe('found')
    expect(scan.status === 'found' && scan.date).toBe('2026-11-01')
    if (scan.status !== 'found') return
    // 2026-11-14 down to 2026-11-01, one day at a time, and not one date more.
    expect(scan.dates_scanned).toHaveLength(14)
    expect(scan.dates_scanned[0]).toBe('2026-11-14')
    expect(scan.dates_scanned.at(-1)).toBe('2026-11-01')
    expect(scan.dates_scanned).not.toContain('2026-10-31')
    expect(requested).toHaveLength(14)
    expect(requested.every((url) => url.startsWith('/layers/hls-l30/coverage?date=') && url.endsWith('&days=1'))).toBe(true)
  })

  it('starts at the chosen date 2026-11-14, not at the declared end 2026-11-06', async () => {
    const { fetcher } = recordedTransport()
    const scan = await scanLatestImage({ layerId: 'hls-l30', chosenDate: '2026-11-14', fetcher })
    if (scan.status !== 'found') throw new Error(`expected a hit, got ${scan.status}`)

    // R-08: the scan is not clamped to the layer's declared end.
    expect(scan.dates_scanned[0]).toBe('2026-11-14')
    expect(scan.dates_scanned).toContain('2026-11-06')
    expect(scan.dates_scanned.indexOf('2026-11-06')).toBe(8)
    // The dates after the declared end answer 404 with 196 bytes and count as no observation.
    expect(rowOf('2026-11-07')).toMatchObject({ http_status: 404, bytes: 196, coverage_ok: false })
  })

  it('keeps the chosen date and reports none_in_lookback when no date holds imagery', async () => {
    const { fetcher, requested } = recordedTransport({ blank: true })
    const scan = await scanLatestImage({ layerId: 'hls-l30', chosenDate: '2026-11-14', fetcher })

    expect(scan.status).toBe('none_in_lookback')
    expect(scan).not.toHaveProperty('date')
    // The whole 30 day window, newest first, and nothing beyond it.
    expect(scan.dates_scanned).toHaveLength(LATEST_IMAGE_DAYS)
    expect(scan.dates_scanned[0]).toBe('2026-11-14')
    expect(scan.dates_scanned.at(-1)).toBe('2026-10-16')
    expect(requested).toHaveLength(LATEST_IMAGE_DAYS)
  })

  it('stops at a 503 on 2026-11-10, keeps the date and reports unavailable', async () => {
    const { fetcher, requested } = recordedTransport({ stopAt: '2026-11-10' })
    const scan = await scanLatestImage({ layerId: 'hls-l30', chosenDate: '2026-11-14', fetcher })

    expect(scan.status).toBe('unavailable')
    expect(scan).not.toHaveProperty('date')
    // 2026-11-14, 13, 12, 11 and then the 503 on 2026-11-10. The scan does not skip it.
    expect(scan.dates_scanned).toEqual(['2026-11-14', '2026-11-13', '2026-11-12', '2026-11-11', '2026-11-10'])
    expect(requested).toHaveLength(5)
    expect(scan.dates_scanned).not.toContain('2026-11-09')
  })

  it('requests no date before the axis start (R-08)', async () => {
    const { fetcher, requested } = recordedTransport({ blank: true })
    const scan = await scanLatestImage({
      layerId: 'hls-l30',
      chosenDate: '2015-04-02',
      axisStart: '2015-04-01',
      fetcher,
    })

    expect(scan.status).toBe('none_in_lookback')
    expect(scan.dates_scanned).toEqual(['2015-04-02', '2015-04-01'])
    expect(requested).toHaveLength(2)
  })

  it('treats an unreachable transport as unavailable without moving the date', async () => {
    const scan = await scanLatestImage({
      layerId: 'hls-l30',
      chosenDate: '2026-11-14',
      fetcher: async () => { throw new Error('network down') },
    })

    expect(scan.status).toBe('unavailable')
    expect(scan.dates_scanned).toEqual(['2026-11-14'])
  })
})
