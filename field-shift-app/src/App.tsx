import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { MapCanvas } from '@/components/MapCanvas'
import { LayerRail } from '@/components/LayerRail'
import { ScenarioCards, type RotationScenario } from '@/components/ScenarioCards'
import { EvidencePanel, type EvidenceRow } from '@/components/EvidencePanel'
import { TimelineDock } from '@/components/TimelineDock'
import { AbstentionNotice } from '@/components/AbstentionNotice'
import { FieldsPanel } from '@/components/FieldsPanel'
import { AgentBar, CommandToggle, useCommandToggle } from '@/components/CommandToggle'
import { SUPPORTING_DATA_PANEL_ID, SupportingDataToggle, useSupportingDataToggle } from '@/components/SupportingDataToggle'
import { useMapStore, type FieldSummary } from '@/lib/map-store'
import { useLayers } from '@/lib/use-layers'
import { seasonForDate } from '@/lib/timeline'
import { t, translationKeyFor } from '@/strings'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

type FieldResponse = { fields: FieldSummary[]; seasons: string[]; default_season: string }
type ScenarioResponse = {
  field_id: string
  season: string
  state: 'ranked' | 'abstained'
  threshold: string | null
  coverage: number
  scenarios: RotationScenario[]
}

class BackendHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

function backendFailureReason(reason: unknown): string {
  return reason instanceof BackendHttpError
    ? t('empty.backend_http_error', { status: reason.status })
    : t('empty.backend_unreachable')
}

export const ZOrder = Object.freeze({
  chips: 10,
  layerRail: 20,
  evidence: 30,
  abstentionNotice: 40,
  timelineDock: 45,
  scenarioCards: 50,
  controlStrip: 60,
  agentBar: 70,
})

/** R-40: below 640 px the right edge column holds one panel at a time. */
const NARROW_QUERY = '(max-width: 640px)'

function isNarrowViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(NARROW_QUERY).matches
}

function App() {
  const selectedFieldId = useMapStore((state) => state.selectedFieldId)
  const selectField = useMapStore((state) => state.selectField)
  const command = useCommandToggle()
  const supportingData = useSupportingDataToggle()
  const [fields, setFields] = useState<FieldSummary[]>([])
  const [mapTile, setMapTile] = useState<{ z: number; x: number; y: number } | null>(null)
  const [scenarios, setScenarios] = useState<RotationScenario[]>([])
  const [scenarioState, setScenarioState] = useState<ScenarioResponse['state'] | null>(null)
  const [threshold, setThreshold] = useState<string | null>(null)
  // R-30: the fixture's own season, so the panel can say when the derived season differs.
  const [fixtureSeason, setFixtureSeason] = useState('2025/26')
  const [error, setError] = useState<string | null>(null)
  const [canRetryFields, setCanRetryFields] = useState(false)
  const [fieldsRequest, setFieldsRequest] = useState(0)
  const [isLoadingFields, setIsLoadingFields] = useState(true)
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false)
  const noticeRef = useRef<HTMLDivElement | null>(null)
  const [noticeHeight, setNoticeHeight] = useState(0)
  // R-40: which right edge panel was opened last. The transition into 360 keeps it
  // and closes the other; leaving 360 never reopens anything (R-35).
  const lastRightPanelRef = useRef<'command' | 'supporting' | null>(null)

  // Block 4: one `/layers` request per chosen date and viewport tile feeds both the rail
  // and the map (R-14, R-24). The rail no longer fetches on its own.
  useLayers(mapTile)

  const hasNotice = Boolean(error || (scenarioState === 'abstained' && threshold && scenarios.length > 0))

  // The status notice and the right edge column are separate fixed overlays, so the
  // 8 px gap of R-23 is kept by measuring the notice, not by nesting it. The measure
  // runs after every render, because a viewport change can rewrap the notice without
  // dispatching a resize event.
  useLayoutEffect(() => {
    const node = noticeRef.current
    const next = node ? node.getBoundingClientRect().height : 0
    setNoticeHeight((current) => (Math.abs(current - next) > 0.5 ? next : current))
  })

  useEffect(() => {
    const node = noticeRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      setNoticeHeight((current) => {
        const next = node.getBoundingClientRect().height
        return Math.abs(current - next) > 0.5 ? next : current
      })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNotice])

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  )
  // R-14, R-15: every evidence row is presented from its own fields. The layer name is
  // the fixture string through its catalog key; the basis label comes from the row's
  // own `basis` in EvidencePanel. No state outside the row can relabel it.
  const evidenceRows = useMemo<EvidenceRow[]>(() => {
    const selectedScenario = scenarios.find((scenario) => scenario.is_current) ?? scenarios[0]
    return (selectedScenario?.evidence_rows ?? []).map((row) => ({
      ...row,
      layer: t(translationKeyFor(row.layer) ?? row.layer),
    }))
  }, [scenarios])

  // R-29 and R-31: the dock and the band read one chosen date and one derived season.
  const chosenDate = useMapStore((state) => state.chosenDate ?? state.axis.default)
  const derivedSeason = seasonForDate(chosenDate)
  // The band draws the crops of the field's scenarios (Soybean, Corn and Cotton here).
  const fieldCrops = useMemo(() => {
    const seen = new Set<string>()
    for (const scenario of scenarios) {
      for (const crop of scenario.crops) seen.add(crop)
    }
    return [...seen]
  }, [scenarios])
  // R-30: the fixture scenario stays the fixture scenario, and the panel says which
  // season its values belong to when the chosen date derives another one.
  const showFixtureNote = selectedField !== null && derivedSeason !== fixtureSeason

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/fields`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new BackendHttpError(response.status)
        return response.json() as Promise<FieldResponse>
      })
      .then((data) => {
        setFields(data.fields)
        setFixtureSeason(data.default_season)
        setError(null)
        setCanRetryFields(false)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setFields([])
        setScenarios([])
        setScenarioState(null)
        setThreshold(null)
        setError(backendFailureReason(reason))
        setCanRetryFields(true)
      })
      .finally(() => setIsLoadingFields(false))
    return () => controller.abort()
  }, [fieldsRequest])

  useEffect(() => {
    if (!selectedFieldId) return
    const controller = new AbortController()
    setIsLoadingScenarios(true)
    setError(null)
    // R-30: the scenario request carries no season. The fixture evidence rows have no
    // season field, so a date change must not refetch or relabel their values.
    fetch(`${API_BASE}/fields/${selectedFieldId}/scenarios`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new BackendHttpError(response.status)
        return response.json() as Promise<ScenarioResponse>
      })
      .then((data) => {
        setScenarios(data.scenarios)
        setScenarioState(data.state)
        setThreshold(data.threshold)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setScenarios([])
        setScenarioState(null)
        setError(backendFailureReason(reason))
      })
      .finally(() => setIsLoadingScenarios(false))
    return () => controller.abort()
  }, [selectedFieldId])

  const handleRetryFields = useCallback(() => {
    setIsLoadingFields(true)
    setFieldsRequest((request) => request + 1)
  }, [])

  const handleSelectField = useCallback((fieldId: string) => {
    if (fieldId === useMapStore.getState().selectedFieldId) return
    setScenarios([])
    setScenarioState(null)
    setThreshold(null)
    selectField(fieldId)
  }, [selectField])

  // R-40: at 360 opening one panel closes the other. Above 640 both may stay open (R-23).
  // The width is read at press time so a resize cannot leave the rule stale.
  const handleToggleCommand = useCallback(() => {
    const willOpen = !command.isOpen
    if (isNarrowViewport() && willOpen) supportingData.close()
    if (willOpen) lastRightPanelRef.current = 'command'
    command.toggle()
  }, [command, supportingData])

  const handleToggleSupportingData = useCallback(() => {
    const willOpen = !supportingData.isOpen
    if (isNarrowViewport() && willOpen) command.close()
    if (willOpen) lastRightPanelRef.current = 'supporting'
    supportingData.toggle()
  }, [command, supportingData])

  // R-40: the one resize transition that changes a toggle state. When the viewport
  // becomes 360 while both panels are open, the panel opened last stays and the older
  // one closes. Both closes are programmatic, so neither pulls focus (the command
  // form's close skips its focus restore), and focus stays where it was.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(NARROW_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      if (!event.matches || !command.isOpen || !supportingData.isOpen) return
      if (lastRightPanelRef.current === 'supporting') command.close()
      else supportingData.close()
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [command.isOpen, supportingData.isOpen, command.close, supportingData.close])

  const shellStyle = {
    '--fs-notice-block': `${hasNotice ? noticeHeight + 8 : 0}px`,
  } as CSSProperties

  return (
    <main className="app-shell" style={shellStyle}>
      <MapCanvas fields={fields} selectedField={selectedField} onTileChange={setMapTile} />
      <div className="overlay anchor-bottom-right layer-rail-anchor" style={{ zIndex: ZOrder.layerRail }}>
        <div className="overlay-interactive panel-surface layer-panel"><LayerRail /></div>
      </div>

      <div className="overlay anchor-top-left layer-chips" style={{ zIndex: ZOrder.chips }}>
        <div className="overlay-interactive top-chip brand-chip">
          <a className="brand" href="/" aria-label={t('map.field_map_home')}>
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>{t('map.brand')}{t('map.brand_accent')}</span>
          </a>
        </div>
      </div>

      <div className="overlay anchor-top-right layer-controls" style={{ zIndex: ZOrder.controlStrip }}>
        <div className="overlay-interactive topbar-meta">
          <span className="top-chip workspace-label">{t('map.field_intelligence')}</span>
          <span className="top-chip profile-avatar" aria-label={t('map.grower_profile')}>GM</span>
          <CommandToggle isOpen={command.isOpen} buttonRef={command.buttonRef} onToggle={handleToggleCommand} />
          <SupportingDataToggle isOpen={supportingData.isOpen} onToggle={handleToggleSupportingData} />
        </div>
      </div>

      {/* One notice node. At 360 it is the first box of the left stack (R-39); above 640 it
          sits at right 22, top 60 and the right edge column starts 8 px below it (R-23). */}
      <div className="left-stack">
        {hasNotice && (
          <div className="overlay anchor-notice layer-notice" style={{ zIndex: ZOrder.abstentionNotice }}>
            <div ref={noticeRef} className="overlay-interactive panel-surface notice-anchor">
              {error && <p className="error-notice" role="alert">{error}</p>}
              {scenarioState === 'abstained' && threshold && scenarios.length > 0 && (
                <AbstentionNotice threshold={threshold} />
              )}
            </div>
          </div>
        )}

        <div className="overlay anchor-left field-list-anchor layer-chips" style={{ zIndex: ZOrder.chips }}>
          <FieldsPanel
            fields={fields}
            selectedFieldId={selectedFieldId}
            isLoading={isLoadingFields}
            error={error}
            canRetry={canRetryFields}
            onSelectField={handleSelectField}
            onRetry={handleRetryFields}
          />
        </div>
      </div>

      <div className="overlay anchor-bottom-left layer-cards" style={{ zIndex: ZOrder.scenarioCards }}>
        <div className="bottom-left-column">
          <TimelineDock
            crops={fieldCrops}
            location={selectedField?.location ?? null}
          />
          <div className="overlay-interactive panel-surface scenario-anchor" style={{ zIndex: ZOrder.scenarioCards }}>
            <div className="rotation-heading-row">
              <div>
                <p className="eyebrow">{t('map.plan_with_evidence')}</p>
                <h2>{t('map.rotation_outlook')}</h2>
              </div>
              <span className="field-coverage-pill"><span className="coverage-dot" />{t('map.data_coverage', { coverage: selectedField?.coverage ?? 0 })}</span>
              {showFixtureNote && (
                <p className="fixture-season-note">
                  {t('timeline.fixture_data', { season: fixtureSeason, derived: derivedSeason })}
                </p>
              )}
            </div>
            <ScenarioCards
              emptyReason={isLoadingFields || isLoadingScenarios
                ? null
                : error ?? (!selectedFieldId
                  ? t('empty.select_field')
                  : scenarios.length === 0 ? t('empty.no_rotation_scenarios') : null)}
              isLoading={isLoadingFields || isLoadingScenarios}
              scenarios={scenarios}
              state={scenarioState === 'abstained' ? null : scenarioState}
              threshold={scenarioState === 'abstained' ? null : threshold}
            />
          </div>
        </div>
      </div>

      {(command.isOpen || supportingData.isOpen) && (
        <div className="overlay anchor-right-column">
          <div className="right-column-stack">
            {command.isOpen && (
              <div className="overlay-interactive panel-surface agent-anchor layer-agent" style={{ zIndex: ZOrder.agentBar }}>
                <AgentBar
                  draft={command.draft}
                  commandNameInputRef={command.commandNameInputRef}
                  onDraftChange={command.updateDraft}
                />
              </div>
            )}
            {supportingData.isOpen && (
              <div
                id={SUPPORTING_DATA_PANEL_ID}
                className="overlay-interactive panel-surface evidence-anchor layer-evidence"
                style={{ zIndex: ZOrder.evidence }}
              >
                <EvidencePanel
                  rows={evidenceRows}
                  isLoading={isLoadingFields || isLoadingScenarios}
                  emptyReason={isLoadingFields || isLoadingScenarios
                    ? null
                    : error ?? (evidenceRows.length === 0 ? t('evidence.empty_hint') : null)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default App

