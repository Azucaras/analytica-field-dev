import { EmptyDescription } from '@/components/ui/empty'
import { useMapStore } from '@/lib/map-store'
import type { SelectedPolygonChip } from '@/lib/polygon-chip'
import { useAppData } from '@/shell/app-data'
import { t, translationKeyFor } from '@/strings'

export type { SelectedPolygonChip }

/**
 * The class name from the table; for a United States null class the No CDL label of its painted
 * year; otherwise `class not mapped`. The panel is wide enough for the long form at every width.
 */
function polygonLabel(chip: SelectedPolygonChip): string {
  if (chip.name) return chip.name
  if (chip.noCdlYear !== null && chip.noCdlYear !== undefined) return t('polygon.no_cdl_class', { year: chip.noCdlYear })
  return t('polygon.class_not_mapped')
}

/** The fields of the active region. Picking one moves the map to it and loads its scenarios. */
export function FieldListPanel() {
  const { fields, selectedFieldId, selectField, isLoadingFields, error, canRetryFields, retryFields, selectedPolygonChip } = useAppData()
  const registeredFields = useMapStore((state) => state.registeredFields)
  const polygonName = selectedPolygonChip ? polygonLabel(selectedPolygonChip) : null

  return (
    <div className="fs-field-list" aria-label={t('map.your_fields')} role="group">
      {selectedPolygonChip && polygonName && (
        <button
          aria-label={polygonName}
          aria-pressed
          className="fs-field-item is-selected"
          data-polygon-chip
          onClick={() => selectField(selectedPolygonChip.fieldId)}
          type="button"
        >
          <span aria-hidden="true" className="fs-field-dot" style={{ background: selectedPolygonChip.hex }} />
          <span className="fs-field-name">{polygonName}</span>
          <span className="fs-field-tag">{t('polygon.selected_polygon')}</span>
        </button>
      )}
      {isLoadingFields && <p className="fs-muted">{t('empty.loading_fields')}</p>}
      {!isLoadingFields && fields.map((field) => {
        const selected = selectedPolygonChip === null && selectedFieldId === field.id
        return (
          <button
            aria-pressed={selected}
            className={`fs-field-item${selected ? ' is-selected' : ''}`}
            key={field.id}
            onClick={() => selectField(field.id)}
            type="button"
          >
            <span aria-hidden="true" className="fs-field-dot" />
            <span className="fs-field-name">{t(translationKeyFor(field.name) ?? field.name)}</span>
            {field.synthetic ? <span className="fs-field-tag">{t('fields.synthetic')}</span> : null}
          </button>
        )
      })}
      {/* Fields the producer drew in Field record, after the fixture fields, name only. */}
      {registeredFields.map((field) => {
        const selected = selectedPolygonChip === null && selectedFieldId === field.id
        return (
          <button
            aria-pressed={selected}
            className={`fs-field-item${selected ? ' is-selected' : ''}`}
            key={field.id}
            onClick={() => selectField(field.id)}
            type="button"
          >
            <span aria-hidden="true" className="fs-field-dot" />
            <span className="fs-field-name">{field.name}</span>
          </button>
        )
      })}
      {!isLoadingFields && fields.length === 0 && registeredFields.length === 0 && (
        <div className="fs-empty">
          <EmptyDescription role={error ? 'alert' : undefined}>{error ?? t('empty.no_fields_available')}</EmptyDescription>
          {canRetryFields && (
            <button className="fs-link" onClick={retryFields} type="button">{t('common.retry')}</button>
          )}
        </div>
      )}
    </div>
  )
}
