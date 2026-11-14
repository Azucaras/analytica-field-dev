import { describe, expect, it } from 'vitest'
import {
  SENTINEL2_WINDOW,
  declaredTrackSpans,
  sentinel2Scenes,
  trackCovers,
} from './availability'
import declaredRanges from '../../artifacts/fixtures/gibs-declared-ranges-2026-11-14.json'
import stac from '../../artifacts/fixtures/stac-s2-2026-09-15-2026-11-14.json'

describe('AC-27 / R-33: marks come from the recorded declared ranges', () => {
  it('leaves the smap-l3 gap day 2026-11-02 unmarked', () => {
    const spans = declaredTrackSpans('smap-l3', declaredRanges, { start: '2015-04-01', end: '2026-11-14' })
    expect(trackCovers(spans, '2026-11-02')).toBe(false)
    expect(trackCovers(spans, '2026-11-01')).toBe(true)
    expect(trackCovers(spans, '2026-11-03')).toBe(true)
  })

  it('carries no ndvi-8day mark before its declared start 2025-02-12', () => {
    const spans = declaredTrackSpans('ndvi-8day', declaredRanges, { start: '2015-04-01', end: '2026-11-14' })
    expect(spans.length).toBeGreaterThan(0)
    expect(spans.every((span) => span.start >= '2025-02-12')).toBe(true)
    expect(trackCovers(spans, '2025-02-11')).toBe(false)
    expect(trackCovers(spans, '2025-02-12')).toBe(true)
  })

  it('stops the hls-l30 track at its declared end 2026-11-06', () => {
    const spans = declaredTrackSpans('hls-l30', declaredRanges, { start: '2015-04-01', end: '2026-11-14' })
    expect(spans.every((span) => span.end <= '2026-11-06')).toBe(true)
  })

  it('clips a span to the window it is drawn in', () => {
    const spans = declaredTrackSpans('smap-l3', declaredRanges, { start: '2026-10-30', end: '2026-11-04' })
    expect(spans).toEqual([
      { start: '2026-10-30', end: '2026-11-01' },
      { start: '2026-11-03', end: '2026-11-04' },
    ])
  })
})

describe('AC-27 / R-33: the Sentinel-2 track reads the recorded STAC response', () => {
  it('carries 18 marks and highlights the 6 scenes under 20 percent cloud', () => {
    const scenes = sentinel2Scenes(stac, SENTINEL2_WINDOW)
    expect(scenes).toHaveLength(18)
    expect(scenes.filter((scene) => scene.highlight)).toHaveLength(6)
  })

  it('keeps every scene inside the recorded window', () => {
    const scenes = sentinel2Scenes(stac, SENTINEL2_WINDOW)
    expect(scenes.every((scene) => scene.date >= SENTINEL2_WINDOW.start && scene.date <= SENTINEL2_WINDOW.end)).toBe(true)
  })
})
