import { useState } from 'react'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EmptyDescription } from '@/components/ui/empty'
import type { FieldSummary } from '@/lib/map-store'
import { t, translationKeyFor } from '@/strings'

export const FIELDS_CHIP_ROW_ID = 'fields-chip-row'

/** R-28: the polygon carried by the fields header chip, as the active region names it. */
export type SelectedPolygonChip = {
  /** The `select_field` id of the polygon, `trazo:12345` or `csb:381825001868504`. */
  fieldId: string
  name: string | null
  hex: string
}

type FieldsPanelProps = {
  fields: FieldSummary[]
  selectedFieldId: string | null
  isLoading: boolean
  error: string | null
  canRetry: boolean
  onSelectField: (fieldId: string) => void
  onRetry: () => void
  selectedPolygon?: SelectedPolygonChip | null
}

export function FieldsPanel({
  fields,
  selectedFieldId,
  isLoading,
  error,
  canRetry,
  onSelectField,
  onRetry,
  selectedPolygon = null,
}: FieldsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null
  // R-28: the chip resolves the name through the class table, not through the catalog, and it
  // renders in both panel states. AM-04 makes it the single class surface at 360x640.
  const chipName = selectedPolygon ? selectedPolygon.name ?? t('polygon.class_not_mapped') : null

  return (
    <section className="overlay-interactive field-chip-stack" aria-label={t('map.your_fields')}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="fields-header">
          <CollapsibleTrigger className="fields-trigger" aria-controls={FIELDS_CHIP_ROW_ID}>
            {t('fields.trigger')}
          </CollapsibleTrigger>
          {selectedPolygon && chipName && (
            <button
              className="top-chip field-chip selected polygon-chip"
              type="button"
              aria-label={chipName}
              aria-pressed
              data-polygon-chip
              onClick={() => onSelectField(selectedPolygon.fieldId)}
            >
              <span
                aria-hidden="true"
                className="field-class-dot"
                data-class-hex={selectedPolygon.hex}
                style={{ background: selectedPolygon.hex }}
              />
              <span className="field-chip-name">{chipName}</span>
            </button>
          )}
          {!selectedPolygon && !isOpen && selectedField && (
            <button
              className="top-chip field-chip selected"
              type="button"
              aria-pressed
              onClick={() => onSelectField(selectedField.id)}
            >
              <span className="field-chip-name">{t(translationKeyFor(selectedField.name) ?? selectedField.name)}</span>
            </button>
          )}
        </div>
        <div id={FIELDS_CHIP_ROW_ID}>
          <CollapsiblePanel className="field-chip-row">
            {isLoading && <p className="field-list-status">{t('empty.loading_fields')}</p>}
            {!isLoading && fields.map((field) => (
              <button
                className={`top-chip field-chip${selectedFieldId === field.id ? ' selected' : ''}`}
                key={field.id}
                onClick={() => onSelectField(field.id)}
                type="button"
                aria-pressed={selectedFieldId === field.id}
              >
                <span className="field-chip-name">{t(translationKeyFor(field.name) ?? field.name)}</span>
              </button>
            ))}
            {!isLoading && fields.length === 0 && (
              <div className="field-empty-copy">
                <EmptyDescription role={error ? 'alert' : undefined}>
                  {error ?? t('empty.no_fields_available')}
                </EmptyDescription>
                {canRetry && (
                  <button className="text-sm underline" type="button" onClick={onRetry}>
                    {t('common.retry')}
                  </button>
                )}
              </div>
            )}
          </CollapsiblePanel>
        </div>
      </Collapsible>
    </section>
  )
}
