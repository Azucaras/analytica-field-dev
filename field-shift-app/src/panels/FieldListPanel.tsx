import { EmptyDescription } from '@/components/ui/empty'
import { useAppData } from '@/shell/app-data'
import { t, translationKeyFor } from '@/strings'

/** The polygon picked on the map, listed above the fixture fields as the region names it. */
export type SelectedPolygonChip = {
  /** The `select_field` id of the polygon, `trazo:12345` or `csb:381825001868504`. */
  fieldId: string
  name: string | null
  hex: string
}

/** The fields of the active region. Picking one moves the map to it and loads its scenarios. */
export function FieldListPanel() {
  const { fields, selectedFieldId, selectField, isLoadingFields, error, canRetryFields, retryFields, selectedPolygonChip } = useAppData()
  const polygonName = selectedPolygonChip ? selectedPolygonChip.name ?? t('polygon.class_not_mapped') : null

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
      {!isLoadingFields && fields.length === 0 && (
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
