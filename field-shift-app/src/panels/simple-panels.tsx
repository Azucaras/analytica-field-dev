import { useEffect, useRef, useState } from 'react'
import { AgentBar, type CommandDraft } from '@/components/AgentBar'
import { EvidencePanel } from '@/components/EvidencePanel'
import { LayerRail } from '@/components/LayerRail'
import { PolygonPanel } from '@/components/PolygonPanel'
import { TimelineDock } from '@/components/TimelineDock'
import { useAppData } from '@/shell/app-data'
import { t } from '@/strings'

/** Panels that only hand shared data to an existing component. */

export function LayersPanel() {
  return <LayerRail />
}

export function PolygonInfoPanel() {
  return <PolygonPanel />
}

export function TimelinePanel() {
  const { fieldCrops, selectedField } = useAppData()
  return <TimelineDock crops={fieldCrops} expanded location={selectedField?.location ?? null} />
}

export function EvidenceDataPanel() {
  const { evidenceRows, climateEvidence, isLoadingFields, isLoadingScenarios, error } = useAppData()
  const loading = isLoadingFields || isLoadingScenarios
  return (
    <EvidencePanel
      climate={climateEvidence}
      emptyReason={loading ? null : error ?? (evidenceRows.length === 0 ? t('evidence.empty_hint') : null)}
      isLoading={loading}
      rows={evidenceRows}
    />
  )
}

export function CommandPanel() {
  const [draft, setDraft] = useState<CommandDraft>({ commandName: '', argumentsText: '{}' })
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Opening the panel puts the cursor in the command name.
  useEffect(() => { inputRef.current?.focus() }, [])
  const { fields } = useAppData()
  // One ready example per command; the field example uses a field of the active region.
  const examples: Array<{ name: string; args: Record<string, string> }> = [
    { name: 'select_field', args: { field_id: fields[0]?.id ?? 'mt-santa-carmem-01' } },
    { name: 'set_composition', args: { preset: 'satellite' } },
    { name: 'open_panel', args: { panel: 'evidence' } },
    { name: 'apply_filter', args: { filter: 'ranked' } },
  ]
  return (
    <div className="fs-stack">
      <AgentBar commandNameInputRef={inputRef} draft={draft} onDraftChange={setDraft} />
      <section aria-label={t('agent.help_title')} className="fs-command-help">
        <h3>{t('agent.help_title')}</h3>
        <p className="fs-muted">{t('agent.help_hint')}</p>
        <ul>
          {examples.map(({ name, args }) => (
            <li key={name}>
              <button
                aria-label={t('agent.use_example', { name })}
                className="fs-command-example"
                onClick={() => {
                  setDraft({ commandName: name, argumentsText: JSON.stringify(args) })
                  inputRef.current?.focus()
                }}
                type="button"
              >
                <code data-dynamic-content>{name}</code>
                <code className="fs-command-args" data-dynamic-content>{JSON.stringify(args)}</code>
              </button>
              <p className="fs-muted">{t(`agent.help.${name}`)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
