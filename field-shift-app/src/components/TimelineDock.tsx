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

// The recorded ZARC snapshot is 249 KB. It is its own chunk, fetched once after the first paint
// instead of being part of the bundle every page load parses.
let zarcLoaded: ZarcSnapshot | null | undefined
let zarcRequest: Promise<ZarcSnapshot | null> | null = null

function loadZarcSnapshot(): Promise<ZarcSnapshot | null> {
  zarcRequest ??= import('../../artifacts/zarc-mt-snapshot.json')
    .then((module) => (zarcLoaded = module.default as unknown as ZarcSnapshot))
    .catch(() => (zarcLoaded = null))
  return zarcRequest
}

/** The snapshot a caller passed, else the recorded one once it has loaded (undefined until then). */
function useZarcSnapshot(given: ZarcSnapshot | null | undefined): ZarcSnapshot | null | undefined {
  const [loaded, setLoaded] = useState(zarcLoaded)
  useEffect(() => {
    if (given !== undefined || zarcLoaded !== undefined) return
    let live = true
    void loadZarcSnapshot().then((value) => { if (live) setLoaded(value) })
    return () => { live = false }
  }, [given])
  return given !== undefined ? given : loaded
}

type TimelineDockProps = {
  location: string | null
  crops: readonly string[]
  /** Omitted: the recorded snapshot, loaded on demand. A test may pass a recorded copy or null. */
  snapshot?: ZarcSnapshot | null
  /**
   * R-46: while false the dock is the single `Timeline controls` button and the region
   * `Timeline` is not mounted at all.
   */
  expanded?: boolean
  onToggle?: () => void
  /** R-46: the toggle exists at 360x640 and at 780x900, and not at 1440x900. */
  showToggle?: boolean
  /**
   * R-46: at 360x640 the toggle is the first control inside the region, before the date
   * input. At 780x900 it is a sibling of the region, so it is not passed here.
   */
  toggleInside?: boolean
}

/**
 * R-27 to R-34: the daily timeline that replaces the season control. There is no date
 * animation (CO-B4-17): one chosen date, two step buttons, one range and one typed
 * date. The season band and the primary availability track are drawn behind
 * the range and are not interactive (R-37).
 *
 * R-46: the same native button is the whole dock while collapsed, the region's first
 * control at 360x640 while expanded, and the region's sibling at 780x900. Its visible
 * text always carries the chosen date; at the 44 by 44 px states the text is clipped by
 * the box, and the accessible name is the fixed `Timeline controls`.
 */
export function TimelineDock({
  location,
  crops,
  snapshot: snapshotProp,
  expanded = true,
  onToggle,
  showToggle = false,
  toggleInside = false,
}: TimelineDockProps) {
  const axis = useMapStore((state) => state.axis)
  const snapshot = useZarcSnapshot(snapshotProp)
  const storedDate = useMapStore((state) => state.chosenDate)
  const setChosenDate = useMapStore((state) => state.setChosenDate)
  const order = useMapStore((state) => state.order)
  const on = useMapStore((state) => state.on)
  const catalog = useMapStore((state) => state.catalog)
  const [dateLimit, setDateLimit] = useState<string | null>(null)
  const initialisedRef = useRef(false)
  // R-46, AC-39: the toggle is one DOM node while it is a sibling of the region, but at
  // 360x640 it moves inside the region, which unmounts and remounts it. Focus is put back
  // on the new node after a press, so the keyboard user keeps the control.
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const restoreFocusRef = useRef(false)

  useEffect(() => {
    if (!restoreFocusRef.current) return
    restoreFocusRef.current = false
    toggleRef.current?.focus()
  }, [expanded])

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

  // R-46, R-48 pattern: a native button, `aria-expanded` on the state, a fixed accessible
  // name, and the visible text carrying the chosen date. Enter and Space are the
  // element's own activation, and focus stays on it because the node is not remounted.
  const toggle = (
    <button
      aria-expanded={expanded}
      aria-label={t('timeline.controls')}
      className={toggleInside
        ? 'timeline-toggle timeline-toggle-inline overlay-interactive'
        : 'timeline-toggle overlay-interactive'}
      data-timeline-toggle
      onClick={() => {
        restoreFocusRef.current = true
        onToggle?.()
      }}
      ref={toggleRef}
      type="button"
    >
      <svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 14 14" width="14">
        <path
          d={expanded ? 'M2 9l5-5 5 5' : 'M2 5l5 5 5-5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      <span className="timeline-toggle-text">
        {t('timeline.controls')}
        {' '}
        <span data-dynamic-content>{chosenDate}</span>
      </span>
    </button>
  )

  // R-46: collapsed, the whole dock is the button and the region is not mounted.
  if (!expanded) return toggle

  return (
    <>
      {showToggle && !toggleInside ? toggle : null}
      <section className="timeline-dock panel-surface overlay-interactive" data-timeline-dock role="region" aria-label={t('timeline.region')}>
        <div className="timeline-row timeline-date-row">
          {toggleInside ? toggle : null}
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
          <span className="timeline-age" data-dynamic-content>{primaryAge ?? (primaryEntry ? t(`layers.status.${primaryEntry.status}`) : '')}</span>
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
            {snapshot === undefined
              ? <div aria-hidden="true" className="timeline-season-band" />
              : <SeasonBand axis={axis} crops={crops} date={chosenDate} location={location} snapshot={snapshot} />}
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
    </>
  )
}
