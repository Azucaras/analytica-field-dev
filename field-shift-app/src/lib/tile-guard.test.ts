import { afterEach, describe, expect, it, vi } from 'vitest'
import { decideTile, probeLayerTile } from './tile-guard'

const base = {
  chosenDate: '2026-11-12',
  headerDate: '2026-11-12',
  headerSource: null as string | null,
  headerStatus: null as string | null,
  httpStatus: 200,
  byteLength: 5401,
}

describe('tile guard, the app half of R-23 (AC-19)', () => {
  it('draws a dated observation for the chosen date', () => {
    expect(decideTile(base)).toEqual({ draw: true, status: 'on_date', date: '2026-11-12', offline: 'none', source: 'upstream' })
  })

  it('rejects a tile whose X-Tile-Date is later than the chosen date', () => {
    const decision = decideTile({ ...base, headerDate: '2026-11-13', chosenDate: '2026-11-12' })
    expect(decision.draw).toBe(false)
    expect(decision.status).toBe('none_in_lookback')
    expect(decision.date).toBeNull()
  })

  it('does not draw a 200 with a zero byte body and reports unavailable', () => {
    const decision = decideTile({ ...base, byteLength: 0 })
    expect(decision.draw).toBe(false)
    expect(decision.status).toBe('unavailable')
  })
})

describe('tile guard, the app half of R-25 (AC-20)', () => {
  it('draws a cached tile dated on or before the chosen date and labels it with its date', () => {
    const decision = decideTile({
      ...base,
      headerDate: '2026-11-09',
      headerSource: 'cache-offline',
      byteLength: 9999,
    })
    expect(decision.draw).toBe(true)
    expect(decision.date).toBe('2026-11-09')
    expect(decision.status).toBe('earlier')
  })

  it('draws the reserve as an undated offline sample, never as a current observation', () => {
    const decision = decideTile({
      ...base,
      headerDate: null,
      headerSource: 'reserve',
      byteLength: 9999,
    })
    expect(decision.draw).toBe(true)
    expect(decision.date).toBeNull()
    expect(decision.offline).toBe('offline_sample_date_unknown')
    expect(decision.status).not.toBe('on_date')
  })

  it('reports no offline copy when the layer has neither a cache entry nor a reserve', () => {
    const decision = decideTile({
      ...base,
      headerDate: null,
      headerStatus: 'no_offline_copy',
      httpStatus: 404,
      byteLength: 0,
    })
    expect(decision.draw).toBe(false)
    expect(decision.offline).toBe('no_offline_copy')
  })
})

describe('probeLayerTile reads the headers the map cannot see', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends the chosen date and reads X-Tile-Date from the response', async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(9999),
      headers: new Headers({ 'X-Tile-Date': '2026-11-11', 'X-Tile-Source': 'cache-offline' }),
    }) as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const decision = await probeLayerTile('smap-l3', '2026-11-12', { z: 11, x: 592, y: 911 })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/tiles/smap-l3/11/592/911?date=2026-11-12',
      expect.objectContaining({ signal: undefined }),
    )
    expect(decision).toEqual({ draw: true, status: 'earlier', date: '2026-11-11', offline: 'none', source: 'cache-offline' })
  })
})
