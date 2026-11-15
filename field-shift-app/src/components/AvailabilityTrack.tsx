import { useMemo } from 'react'
import { useMapStore } from '@/lib/map-store'
import {
  SENTINEL2_WINDOW,
  declaredTrackSpans,
  sentinel2Scenes,
  type DeclaredRangesSource,
  type StacResponse,
} from '@/lib/availability'
import { daysBetween } from '@/lib/timeline'
import { t } from '@/strings'
import declaredRangesJson from '../../artifacts/fixtures/gibs-declared-ranges-2026-11-14.json'
import stacJson from '../../artifacts/fixtures/stac-s2-2026-09-15-2026-11-14.json'

const declaredRanges = declaredRangesJson as unknown as DeclaredRangesSource
const stacResponse = stacJson as unknown as StacResponse

type AvailabilityTrackProps = {
  layerId: string
  /** The display name, already translated, for the accessible name of the track. */
  name: string
  /**
   * `declared` draws the marks of the layer's own recorded declared ranges (R-33). The
   * Sentinel-2 track is track-only and reads the recorded STAC response instead (R-33).
   */
  kind?: 'declared' | 'sentinel2'
}

function percentOf(date: string, window: { start: string; end: string }): number {
  const total = Math.max(1, daysBetween(window.start, window.end) + 1)
  return (daysBetween(window.start, date) / total) * 100
}

function widthPercent(start: string, end: string, window: { start: string; end: string }): number {
  const total = Math.max(1, daysBetween(window.start, window.end) + 1)
  return ((daysBetween(start, end) + 1) / total) * 100
}

/**
 * R-33 and R-34: a track marks only the days the recorded declared ranges hold, so a gap
 * day and a day before `time_start` carry no mark. The Sentinel-2 track is drawn from the
 * recorded STAC response and highlights the scenes under 20 percent cloud.
 */
export function AvailabilityTrack({ layerId, name, kind = 'declared' }: AvailabilityTrackProps) {
  const axis = useMapStore((state) => state.axis)
  const window = kind === 'sentinel2' ? SENTINEL2_WINDOW : axis
  const spans = useMemo(
    () => (kind === 'sentinel2' ? [] : declaredTrackSpans(layerId, declaredRanges, window)),
    [kind, layerId, window],
  )
  const scenes = useMemo(
    () => (kind === 'sentinel2' ? sentinel2Scenes(stacResponse, window) : []),
    [kind, window],
  )

  if (kind === 'sentinel2') {
    return (
      <div className="layer-track timeline-track" data-track="sentinel2" role="img" aria-label={t('timeline.sentinel2_track')}>
        {scenes.map((scene) => (
          <span
            className="track-scene"
            data-date={scene.date}
            data-highlight={scene.highlight ? 'true' : 'false'}
            data-track-scene
            key={scene.date}
            style={{ left: `${percentOf(scene.date, window)}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="layer-track timeline-track"
      data-track="declared"
      data-layer-id={layerId}
      role="img"
      aria-label={t('layers.track', { name })}
    >
      {spans.map((span) => (
        <span
          className="track-span"
          data-end={span.end}
          data-start={span.start}
          data-track-span
          key={`${span.start}-${span.end}`}
          style={{ left: `${percentOf(span.start, window)}%`, width: `${widthPercent(span.start, span.end, window)}%` }}
        />
      ))}
    </div>
  )
}
