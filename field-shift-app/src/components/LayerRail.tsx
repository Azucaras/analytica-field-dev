import { useId, useState } from 'react'
import type { LayerCatalogEntry } from '@/lib/layer-catalog'
import { COMPARE_DEFAULT_DIVIDER, useMapStore, chosenDateOf, opacityOf, type CompositionPreset } from '@/lib/map-store'
import { ageLabel } from '@/lib/layer-age'
import { AvailabilityTrack } from './AvailabilityTrack'
import { t } from '@/strings'

const PRESETS: Array<{ composition: CompositionPreset; key: 'layers.map' | 'layers.satellite' | 'layers.satellite_with_labels' }> = [
  { composition: 'map', key: 'layers.map' },
  { composition: 'satellite', key: 'layers.satellite' },
  { composition: 'satellite-with-labels', key: 'layers.satellite_with_labels' },
]

/** R-22: side B defaults to seven days before the chosen date, clamped to the axis start. */
export function defaultCompareDate(chosenDate: string, axisStart: string): string {
  const chosen = new Date(`${chosenDate}T00:00:00Z`)
  chosen.setUTCDate(chosen.getUTCDate() - 7)
  const candidate = chosen.toISOString().slice(0, 10)
  return candidate < axisStart ? axisStart : candidate
}

function layerName(entry: LayerCatalogEntry): string {
  return t(entry.labelKey ?? entry.label)
}

/** R-33: the Sentinel-2 track is track-only and sits in these two optical rows. */
const SENTINEL2_TRACK_LAYERS = new Set(['hls-l30', 'hls-s30'])

/** R-26, one rail row: a collapsed summary and, behind one button, the fine controls. */
function LayerRow({ entry }: { entry: LayerCatalogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const name = layerName(entry)
  const chosenDate = useMapStore(chosenDateOf)
  const axisStart = useMapStore((state) => state.axis.start)
  const on = useMapStore((state) => state.on[entry.id] ?? false)
  const opacity = useMapStore((state) => opacityOf(state, entry.id))
  const pinnedDate = useMapStore((state) => state.pinnedDates[entry.id] ?? null)
  const compare = useMapStore((state) => state.compare[entry.id] ?? null)
  const setLayerOn = useMapStore((state) => state.setLayerOn)
  const setOpacity = useMapStore((state) => state.setOpacity)
  const moveLayer = useMapStore((state) => state.moveLayer)
  const setPinnedDate = useMapStore((state) => state.setPinnedDate)
  const setCompare = useMapStore((state) => state.setCompare)
  const setCompareDate = useMapStore((state) => state.setCompareDate)

  const showMarker = entry.status !== 'unavailable' && entry.status !== 'stale'
    && entry.effective_date !== null
    && entry.effective_date.slice(0, 10) !== chosenDate
  const age = ageLabel(entry.age_days)

  return (
    <li className="layer-entry" data-layer-id={entry.id} data-status={entry.status}>
      <div className="layer-entry-head">
        <button
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={t('layers.row_options', { name })}
          className="layer-entry-trigger"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <svg aria-hidden="true" focusable="false" height="12" viewBox="0 0 12 12" width="12">
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
        <span className="layer-entry-name">{name}</span>
        <button
          aria-label={t('layers.toggle_on', { name })}
          aria-pressed={on}
          className="layer-entry-switch"
          onClick={() => setLayerOn(entry.id, !on)}
          type="button"
        />
      </div>
      <span className="layer-entry-metadata" data-dynamic-content>
        <span>{t(`evidence.basis_${entry.basis}`)}</span>
        <span>{entry.resolution}</span>
        {entry.status === 'stale' && entry.last_observation
          ? <span>{t('layers.last_observation', { date: entry.last_observation })}</span>
          : entry.effective_date
            ? <time dateTime={entry.effective_date}>{entry.effective_date}</time>
            : null}
        {age ? <span>{age}</span> : null}
        {pinnedDate ? <span>{t('layers.pinned')}</span> : null}
      </span>
      <span className="layer-entry-status">
        <span className="layer-entry-status-text">{t(`layers.status.${entry.status}`)}</span>
        {showMarker ? <span className="layer-no-observation">{t('evidence.no_observation')}</span> : null}
      </span>

      {expanded && (
        <div className="layer-options" id={panelId}>
          <label className="layer-control">
            <span>{t('layers.opacity', { name })}</span>
            <input
              aria-label={t('layers.opacity', { name })}
              className="layer-opacity"
              max={1}
              min={0}
              onChange={(event) => setOpacity(entry.id, Number(event.target.value))}
              onKeyDown={(event) => {
                // AC-37: arrow keys step the paint opacity by 0.05, Home and End go to 0
                // and 1. jsdom implements no slider keyboard, so the step is explicit.
                const stepBy = (delta: number) => {
                  event.preventDefault()
                  setOpacity(entry.id, Math.min(1, Math.max(0, Math.round((opacity + delta) * 100) / 100)))
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowUp') stepBy(0.05)
                else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') stepBy(-0.05)
                else if (event.key === 'Home') stepBy(-1)
                else if (event.key === 'End') stepBy(1)
              }}
              step={0.05}
              type="range"
              value={opacity}
            />
          </label>
          <div className="layer-move">
            <button
              aria-label={t('layers.move_up', { name })}
              onClick={() => moveLayer(entry.id, 'up')}
              type="button"
            >
              <svg aria-hidden="true" focusable="false" height="12" viewBox="0 0 12 12" width="12">
                <path d="M6 10V2M2 6l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button
              aria-label={t('layers.move_down', { name })}
              onClick={() => moveLayer(entry.id, 'down')}
              type="button"
            >
              <svg aria-hidden="true" focusable="false" height="12" viewBox="0 0 12 12" width="12">
                <path d="M6 2v8M2 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
          <button
            aria-label={t('layers.pin_date', { name })}
            aria-pressed={pinnedDate !== null}
            className="layer-pin"
            onClick={() => setPinnedDate(entry.id, pinnedDate === null ? (entry.effective_date ?? chosenDate) : null)}
            type="button"
          >
            <svg aria-hidden="true" focusable="false" height="12" viewBox="0 0 12 12" width="12">
              <path d="M4 1h4l-1 4 2 2H3l2-2-1-4zM6 7v4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <AvailabilityTrack layerId={entry.id} name={name} />
          {entry.kind === 'tile' && SENTINEL2_TRACK_LAYERS.has(entry.id) && (
            <AvailabilityTrack kind="sentinel2" layerId={entry.id} name={name} />
          )}
          {entry.kind === 'tile' && (
            <button
              aria-label={t('layers.compare', { name })}
              aria-pressed={compare !== null}
              className="layer-compare"
              onClick={() => setCompare(entry.id, compare === null
                ? { date: defaultCompareDate(chosenDate, axisStart), divider: COMPARE_DEFAULT_DIVIDER }
                : null)}
              type="button"
            >
              <span>{t('layers.compare', { name })}</span>
            </button>
          )}
          {entry.kind === 'tile' && compare !== null && (
            <label className="layer-control">
              <span>{t('layers.compare_date', { name })}</span>
              <input
                aria-label={t('layers.compare_date', { name })}
                max={chosenDate}
                min={axisStart}
                onChange={(event) => setCompareDate(entry.id, event.target.value || null)}
                type="date"
                value={compare.date ?? ''}
              />
            </label>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * The layer rail: the three block 1 composition presets, then one row per catalog entry in
 * the stack order the `/layers` response fixes (R-26). The `navigation` landmark and its
 * name are block 3's `Layers` pair, which block 3 AC-21 counts as one of its four
 * unconditional pairs, so this component keeps both.
 */
export function LayerRail() {
  const composition = useMapStore((state) => state.composition)
  const setComposition = useMapStore((state) => state.setComposition)
  const catalog = useMapStore((state) => state.catalog)
  const order = useMapStore((state) => state.order)
  const catalogFailed = useMapStore((state) => state.layerCatalogFailed)

  // R-18: the rows follow the stack list, not the response order, so moving a row moves
  // the row on screen. The first item is the layer drawn on top.
  const rows = order
    .map((id) => catalog.find((entry) => entry.id === id))
    .filter((entry): entry is LayerCatalogEntry => entry !== undefined)

  return (
    <nav className="layer-rail" aria-label={t('layers.navigation')}>
      <div className="layer-presets" aria-label={t('layers.presets')}>
        {PRESETS.map(({ composition: preset, key }) => (
          <button
            aria-pressed={composition === preset}
            key={preset}
            onClick={() => setComposition(preset)}
            type="button"
          >
            {t(key)}
          </button>
        ))}
      </div>
      {catalogFailed && <p className="layer-catalog-error">{t('layers.catalog_error')}</p>}
      <ul className="layer-entries">
        {rows.map((entry) => <LayerRow entry={entry} key={entry.id} />)}
      </ul>
    </nav>
  )
}
