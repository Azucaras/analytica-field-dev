import { useMemo } from 'react'
import {
  type BandEmpty,
  type BandWindow,
  type FieldCrop,
  type ZarcSnapshot,
} from '@/lib/season-band'
import { daysBetween, type Axis } from '@/lib/timeline'
import { windowSourceFor } from '@/lib/window-source'
import { t } from '@/strings'

type SeasonBandProps = {
  location: string | null
  crops: readonly string[]
  /** The chosen date of R-28; the window source derives the season of the band from it. */
  date: string
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
 * What the band has to draw: the source's answer, or the one reason it has none. These are
 * different facts, and the band never draws the second as if it were the first.
 */
type BandDrawing =
  | { kind: 'windows'; season: string; windows: BandWindow[]; empty: BandEmpty[] }
  | { kind: 'no_source' }

/**
 * R-31: the planting windows of the field's region, for the derived season of the chosen
 * date only, drawn from the window source that region selects. The band owns the drawing,
 * the labels and the empty text; the source owns the windows and its own season key. The
 * windows sit behind the range input and are not interactive (R-37), so the band is a
 * drawing with one text label per window and one empty text per thing the source could not
 * read. A region with no source draws no window and says so, never a blank band.
 */
export function SeasonBand({ location, crops, date, axis, snapshot }: SeasonBandProps) {
  const drawing = useMemo<BandDrawing | null>(() => {
    // No field is selected yet: the dock renders (R-35) and the band claims nothing.
    if (!location || location.trim() === '') return null
    const source = windowSourceFor(location, snapshot)
    if (!source) return { kind: 'no_source' }
    return { kind: 'windows', ...source.windowsFor({ date, crops }) }
  }, [location, crops, date, snapshot])

  if (drawing === null) return null

  // R-31: no source for the field's region. No window, no key to normalise, and the reason
  // named instead of a silent blank.
  if (drawing.kind === 'no_source') {
    return (
      <div className="timeline-season-band" data-season-band aria-label={t('timeline.band')}>
        <span className="timeline-band-empty" data-season-empty="no_source">
          {t('timeline.no_window_source')}
        </span>
      </div>
    )
  }

  const bandAxis = seasonAxisOf(drawing.season, axis)

  return (
    <div className="timeline-season-band" data-season-band aria-label={t('timeline.band')}>
      {drawing.windows.map((window) => (
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
      {drawing.empty.map((empty) => (
        <span className="timeline-band-empty" data-season-empty={empty.kind} key={`${empty.kind}-${empty.kind === 'crop' ? empty.crop : ''}`}>
          {emptyText(empty, drawing.season)}
        </span>
      ))}
    </div>
  )
}
