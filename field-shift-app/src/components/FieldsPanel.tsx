import { useState } from 'react'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EmptyDescription } from '@/components/ui/empty'
import type { FieldSummary } from '@/lib/map-store'
import { t, translationKeyFor } from '@/strings'

export const FIELDS_CHIP_ROW_ID = 'fields-chip-row'

type FieldsPanelProps = {
  fields: FieldSummary[]
  selectedFieldId: string | null
  isLoading: boolean
  error: string | null
  canRetry: boolean
  onSelectField: (fieldId: string) => void
  onRetry: () => void
}

export function FieldsPanel({
  fields,
  selectedFieldId,
  isLoading,
  error,
  canRetry,
  onSelectField,
  onRetry,
}: FieldsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null

  return (
    <section className="overlay-interactive field-chip-stack" aria-label={t('map.your_fields')}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="fields-header">
          <CollapsibleTrigger className="fields-trigger" aria-controls={FIELDS_CHIP_ROW_ID}>
            {t('fields.trigger')}
          </CollapsibleTrigger>
          {!isOpen && selectedField && (
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
