import { useMemo } from 'react'
import {
  buildSeasonBand,
  type BandEmpty,
  type FieldCrop,
  type ZarcSnapshot,
} from '@/lib/season-band'
import { daysBetween, parseFieldLocation, type Axis } from '@/lib/timeline'
import { t } from '@/strings'

type SeasonBandProps = {
  location: string | null
  crops: readonly string[]
  /** The derived `Y/YY` label of R-29. */
  season: string
  axis: Axis
  snapshot: ZarcSnapshot | null
}

const CROP_LABEL_KEY = {
  Soybean: 'common.crop.soybean',
  Corn: 'common.crop.corn',
  Cotton: 'common.crop.cotton',
} as const satisfies Record<FieldCrop, string>

function positionOf(date: string, axis: Axis): number {
  const total = Math.max(1, daysBetween(axis.start, axis.end) + 1)
  return (daysBetween(axis.start, date) / total) * 100
}

function widthOf(start: string, end: string, axis: Axis): number {
  const total = Math.max(1, daysBetween(axis.start, axis.end) + 1)
  return ((daysBetween(start, end) + 1) / total) * 100
}

/**
 * The band draws one season (R-31), so its horizontal domain is that season's own year,
 * 1 July to 30 June, clipped at the axis start. The four windows of one season then read
 * as positions in a crop calendar instead of four slivers of an eleven year axis.
 */
function seasonAxisOf(season: string, axis: Axis): Axis {
  const year = Number(season.split('/')[0])
  const start = `${year}-07-01` > axis.start ? `${year}-07-01` : axis.start
  return { start, end: `${year + 1}-06-30`, default: start }
}

function emptyText(empty: BandEmpty, season: string): string {
  if (empty.kind === 'municipality') return t('timeline.no_municipality_data')
  if (empty.kind === 'season') return t('timeline.no_season_data', { season })
  return t('timeline.no_crop_data', { crop: t(CROP_LABEL_KEY[empty.crop]) })
}

/**
 * R-31: the planting windows of the field's municipality and crops, for the derived
 * season only. The windows sit behind the range input and are not interactive (R-37), so
 * the band is a drawing with one text label per window and the empty text of R-31.
 */
export function SeasonBand({ location, crops, season, axis, snapshot }: SeasonBandProps) {
  const band = useMemo(() => {
    const parsed = parseFieldLocation(location)
    if (!parsed) return null
    return buildSeasonBand(snapshot, { ...parsed, crops, season })
  }, [location, crops, season, snapshot])

  // No field is selected yet: the dock renders (R-35) and the band claims nothing.
  if (!band) return null

  const bandAxis = seasonAxisOf(season, axis)

  return (
    <div className="timeline-season-band" data-season-band aria-label={t('timeline.band')}>
      {band.windows.map((window) => (
        <span
          className="timeline-window"
          data-end={window.end}
          data-field-crop={window.fieldCrop}
          data-season-window
          data-snapshot-crop={window.snapshotCrop}
          data-start={window.start}
          key={`${window.fieldCrop}-${window.snapshotCrop}`}
          style={{ left: `${positionOf(window.start, bandAxis)}%`, width: `${widthOf(window.start, window.end, bandAxis)}%` }}
        >
          <span className="timeline-window-label" data-dynamic-content>
            {t('timeline.window', { crop: window.snapshotCrop, start: window.start, end: window.end })}
          </span>
        </span>
      ))}
      {band.empty.map((empty) => (
        <span className="timeline-band-empty" data-season-empty={empty.kind} key={`${empty.kind}-${empty.kind === 'crop' ? empty.crop : ''}`}>
          {emptyText(empty, season)}
        </span>
      ))}
    </div>
  )
}
