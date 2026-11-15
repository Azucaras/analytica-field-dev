/**
 * R-33 and R-34: the availability tracks. Marks come only from the recorded declared
 * ranges of the layer, so a day inside a gap carries no mark; the Sentinel-2 track reads
 * the recorded STAC response and highlights the scenes under 20 percent cloud.
 */

export type TrackWindow = { start: string; end: string }

export type DeclaredRangesSource = {
  layers: Record<string, { time_ranges?: string[] } | undefined>
}

export type TrackSpan = { start: string; end: string }

/**
 * One span per declared Time range, clipped to the window it is drawn in. A range is
 * `start/end/cadence` and a gap between two ranges is a day the layer does not declare,
 * which is exactly the day the track must leave unmarked (AC-27).
 */
export function declaredTrackSpans(
  layerId: string,
  source: DeclaredRangesSource,
  window: TrackWindow,
): TrackSpan[] {
  const ranges = source?.layers?.[layerId]?.time_ranges ?? []
  const spans: TrackSpan[] = []
  for (const range of ranges) {
    const [rangeStart, rangeEnd] = range.split('/')
    if (!rangeStart || !rangeEnd) continue
    const start = rangeStart.slice(0, 10) > window.start ? rangeStart.slice(0, 10) : window.start
    const end = rangeEnd.slice(0, 10) < window.end ? rangeEnd.slice(0, 10) : window.end
    if (start <= end) spans.push({ start, end })
  }
  return spans
}

/** True when any recorded span covers the date, so an unmarked day is never read as clear. */
export function trackCovers(spans: readonly TrackSpan[], date: string): boolean {
  return spans.some((span) => span.start <= date && date <= span.end)
}

/** The window of the recorded Earth Search response that the Sentinel-2 track draws. */
export const SENTINEL2_WINDOW: TrackWindow = { start: '2026-09-15', end: '2026-11-14' }

/** R-33: scenes under this cloud cover are highlighted. */
export const SENTINEL2_CLOUD_THRESHOLD = 20

export type StacFeature = {
  properties?: {
    datetime?: string
    'eo:cloud_cover'?: number
  }
}

export type StacResponse = { features?: StacFeature[] }

export type Sentinel2Scene = { date: string; cloud: number; highlight: boolean }

/**
 * The scene marks of the Sentinel-2 track: one mark per returned scene inside the window,
 * in date order, with the scenes under 20 percent cloud flagged for the highlight.
 */
export function sentinel2Scenes(response: StacResponse | null | undefined, window: TrackWindow): Sentinel2Scene[] {
  const features = response?.features ?? []
  return features
    .map((feature) => {
      const date = (feature.properties?.datetime ?? '').slice(0, 10)
      const cloud = feature.properties?.['eo:cloud_cover']
      return { date, cloud: typeof cloud === 'number' ? cloud : Number.NaN }
    })
    .filter((scene) => scene.date >= window.start && scene.date <= window.end)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((scene) => ({
      ...scene,
      highlight: Number.isFinite(scene.cloud) && scene.cloud < SENTINEL2_CLOUD_THRESHOLD,
    }))
}
