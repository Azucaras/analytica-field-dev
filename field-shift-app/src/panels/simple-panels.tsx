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
  return <AgentBar commandNameInputRef={inputRef} draft={draft} onDraftChange={setDraft} />
}
