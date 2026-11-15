import { useCallback, useEffect, useRef, useState } from 'react'
import { SeasonBand } from './SeasonBand'
import { AvailabilityTrack } from './AvailabilityTrack'
import { ageLabel } from '@/lib/layer-age'
import { useMapStore } from '@/lib/map-store'
import type { ZarcSnapshot } from '@/lib/season-band'
import {
  addDays,
  clampToAxis,
  daysBetween,
  primaryLayerId,
  readDateParam,
  seasonForDate,
} from '@/lib/timeline'
import { t } from '@/strings'
import snapshotJson from '../../artifacts/zarc-mt-snapshot.json'

export const DEFAULT_ZARC_SNAPSHOT = snapshotJson as unknown as ZarcSnapshot

type TimelineDockProps = {
  location: string | null
  crops: readonly string[]
  /** The recorded snapshot in the tree; a test may pass a recorded copy or null. */
  snapshot?: ZarcSnapshot | null
}

/**
 * R-27 to R-34: the daily timeline that replaces the season control. There is no date
 * animation (CO-B4-17): one chosen date, two step buttons, one range and one typed
 * date. The season band and the primary availability track are drawn behind
 * the range and are not interactive (R-37).
 */
export function TimelineDock({ location, crops, snapshot = DEFAULT_ZARC_SNAPSHOT }: TimelineDockProps) {
  const axis = useMapStore((state) => state.axis)
  const storedDate = useMapStore((state) => state.chosenDate)
  const setChosenDate = useMapStore((state) => state.setChosenDate)
  const order = useMapStore((state) => state.order)
  const on = useMapStore((state) => state.on)
  const catalog = useMapStore((state) => state.catalog)
  const [dateLimit, setDateLimit] = useState<string | null>(null)
  const initialisedRef = useRef(false)

  const chosenDate = storedDate ?? axis.default
  const season = seasonForDate(chosenDate)
  const primaryId = primaryLayerId(order, on)
  const primaryEntry = catalog.find((entry) => entry.id === primaryId) ?? null
  const primaryAge = ageLabel(primaryEntry?.age_days ?? null)
  const rangeMin = 0
  const rangeMax = Math.max(0, daysBetween(axis.start, axis.end))
  const rangeValue = Math.min(rangeMax, Math.max(0, daysBetween(axis.start, chosenDate)))

  // R-28: `?date=` sets the chosen date at load when it lies on the axis, and a date
  // outside the axis clamps to the nearest bound with `Date limited to {date}`.
  useEffect(() => {
    if (initialisedRef.current) return
    initialisedRef.current = true
    // No query means no write: the store's null is "the axis default" (R-28), and writing
    // the default back would refetch the same date and repeat the /layers request.
    if (!new URLSearchParams(window.location.search).get('date')) return
    const applied = readDateParam(window.location.search, axis)
    if (applied.clamped !== null) setDateLimit(applied.clamped)
    if (useMapStore.getState().chosenDate === null) setChosenDate(applied.date)
  }, [axis, setChosenDate])

  const choose = useCallback((date: string) => {
    setDateLimit(null)
    setChosenDate(date)
  }, [setChosenDate])

  const chooseClamped = useCallback((date: string) => {
    const applied = clampToAxis(date, axis)
    if (applied.clamped !== null) setDateLimit(applied.clamped)
    else setDateLimit(null)
    setChosenDate(applied.date)
  }, [axis, setChosenDate])

  const step = useCallback((days: number) => {
    chooseClamped(addDays(chosenDate, days))
  }, [chooseClamped, chosenDate])

  return (
    <section className="timeline-dock panel-surface" data-timeline-dock role="region" aria-label={t('timeline.region')}>
      <div className="timeline-row timeline-date-row">
        <input
          aria-label={t('timeline.go_to_date')}
          className="timeline-date-input"
          max={axis.end}
          min={axis.start}
          onChange={(event) => {
            if (event.target.value) chooseClamped(event.target.value)
          }}
          type="date"
          value={chosenDate}
        />
        <span className="timeline-age" data-dynamic-content>{primaryAge ?? primaryEntry?.status ?? ''}</span>
        <span className="timeline-season" data-dynamic-content data-season-label>{season}</span>
        <span className="timeline-crop-class">{t('timeline.no_crop_class')}</span>
      </div>

      <div className="timeline-row timeline-range-row">
        <button aria-label={t('timeline.previous_day')} className="timeline-step" onClick={() => step(-1)} type="button">
          <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 14 14" width="14">
            <path d="M9 2L4 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
        <div className="timeline-range-wrap">
          <SeasonBand axis={axis} crops={crops} location={location} season={season} snapshot={snapshot} />
          <AvailabilityTrack layerId={primaryId} name={primaryEntry ? t(primaryEntry.labelKey ?? primaryEntry.label) : primaryId} />
          <input
            aria-label={t('timeline.date')}
            aria-valuemax={rangeMax}
            aria-valuemin={rangeMin}
            aria-valuetext={primaryAge
              ? t('timeline.value_text', { date: chosenDate, age: primaryAge })
              : t('timeline.value_text_date', { date: chosenDate })}
            className="timeline-range"
            max={rangeMax}
            min={rangeMin}
            onChange={(event) => chooseClamped(addDays(axis.start, Number(event.target.value)))}
            onKeyDown={(event) => {
              // AC-31: one day per arrow, thirty per page key, the axis bounds on Home and
              // End, and no other key moves the date.
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); step(1) }
              else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); step(-1) }
              else if (event.key === 'PageUp') { event.preventDefault(); step(30) }
              else if (event.key === 'PageDown') { event.preventDefault(); step(-30) }
              else if (event.key === 'Home') { event.preventDefault(); choose(axis.start) }
              else if (event.key === 'End') { event.preventDefault(); choose(axis.end) }
            }}
            step={1}
            type="range"
            value={rangeValue}
          />
        </div>
        <button aria-label={t('timeline.next_day')} className="timeline-step" onClick={() => step(1)} type="button">
          <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 14 14" width="14">
            <path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {dateLimit !== null && (
        <p className="timeline-date-limit" role="status">
          {t('timeline.date_limited', { date: dateLimit })}
        </p>
      )}
    </section>
  )
}
