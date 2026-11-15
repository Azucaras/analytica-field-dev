import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { MapCanvas } from '@/components/MapCanvas'
import { LayerRail } from '@/components/LayerRail'
import { ScenarioCards, type RotationScenario } from '@/components/ScenarioCards'
import { EvidencePanel, type EvidenceRow } from '@/components/EvidencePanel'
import { SeasonSelect } from '@/components/SeasonSelect'
import { AbstentionNotice } from '@/components/AbstentionNotice'
import { FieldsPanel } from '@/components/FieldsPanel'
import { AgentBar, CommandToggle, useCommandToggle } from '@/components/CommandToggle'
import { SUPPORTING_DATA_PANEL_ID, SupportingDataToggle, useSupportingDataToggle } from '@/components/SupportingDataToggle'
import { EnsoChip } from '@/components/EnsoChip'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { useLocaleStore } from '@/strings/locale-store'
import { SheetBoundary } from '@/analysis/SheetBoundary'
import { ClimateSignal } from '@/components/ClimateSignal'
import { ensoSchema, fieldClimateSchema, loadParsed, type EnsoState, type FieldClimate, type Loadable } from '@/lib/climate'
import { useMapStore, type FieldSummary } from '@/lib/map-store'
import { t, translationKeyFor } from '@/strings'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Block 5, AM-04: the Field Phase analysis is a sheet on this page, loaded on first open so the
// HUD bundle does not carry Recharts. Its state lives in the hash, #analise/<IBGE code>.
const AnalysisSheet = lazy(() => import('@/analysis/AnalysisPage'))
const ANALYSIS_HASH = /^#analise(?:\/(\d+))?$/

type AnalysisState = { open: boolean; code: number | null }

function analysisFromHash(): AnalysisState {
  if (typeof window === 'undefined') return { open: false, code: null }
  const match = window.location.hash.match(ANALYSIS_HASH)
  return match ? { open: true, code: match[1] ? Number(match[1]) : null } : { open: false, code: null }
}

function writeAnalysisHash(state: AnalysisState) {
  if (typeof window === 'undefined') return
  const next = state.open ? `#analise${state.code ? `/${state.code}` : ''}` : ''
  if (window.location.hash === next) return
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`)
}

type FieldResponse = { fields: FieldSummary[]; seasons: string[]; default_season: string }
type ScenarioResponse = {
  field_id: string
  season: string
  state: 'ranked' | 'abstained'
  threshold: string | null
  coverage: number | null
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
  // Block 5, R-10: subscribing re-renders the whole HUD when the language switch changes.
  useLocaleStore((state) => state.locale)
  const selectedFieldId = useMapStore((state) => state.selectedFieldId)
  const selectField = useMapStore((state) => state.selectField)
  const command = useCommandToggle()
  const supportingData = useSupportingDataToggle()
  const [fields, setFields] = useState<FieldSummary[]>([])
  const [mapTile, setMapTile] = useState<{ z: number; x: number; y: number } | null>(null)
  const [scenarios, setScenarios] = useState<RotationScenario[]>([])
  const [scenarioState, setScenarioState] = useState<ScenarioResponse['state'] | null>(null)
  const [threshold, setThreshold] = useState<string | null>(null)
  const [season, setSeason] = useState('2025/26')
  const [seasons, setSeasons] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [canRetryFields, setCanRetryFields] = useState(false)
  const [fieldsRequest, setFieldsRequest] = useState(0)
  const [isLoadingFields, setIsLoadingFields] = useState(true)
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false)
  // Block 4: the ENSO chip and the climate line load on their own; a failure here never sets
  // `error`, so the rest of the screen behaves exactly as without them (R-16, R-18).
  const [enso, setEnso] = useState<Loadable<EnsoState>>({ status: 'loading' })
  const [climate, setClimate] = useState<Loadable<FieldClimate> | null>(null)
  // Block 4 AM-01: the top strip has no free room at 360, so below 640 px the ENSO chip
  // renders at the top of the rotation panel instead of beside the brand. One mount only.
  const [isNarrow, setIsNarrow] = useState(isNarrowViewport)
  const [analysis, setAnalysis] = useState<AnalysisState>(analysisFromHash)
  const analysisToggleRef = useRef<HTMLButtonElement | null>(null)
  const noticeRef = useRef<HTMLDivElement | null>(null)
  const [noticeHeight, setNoticeHeight] = useState(0)
  // R-40: which right edge panel was opened last. The transition into 360 keeps it
  // and closes the other; leaving 360 never reopens anything (R-35).
  const lastRightPanelRef = useRef<'command' | 'supporting' | null>(null)

  // R-20: a field whose coverage is not measured has no scenarios, and still shows why.
  const showsAbstention = Boolean(
    scenarioState === 'abstained' && threshold && (scenarios.length > 0 || threshold === 'coverage_not_measured'),
  )
  const hasNotice = Boolean(error || showsAbstention)

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

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/fields`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new BackendHttpError(response.status)
        return response.json() as Promise<FieldResponse>
      })
      .then((data) => {
        setFields(data.fields)
        setSeasons(data.seasons)
        setSeason(data.default_season)
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
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(NARROW_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsNarrow(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadParsed(`${API_BASE}/climate/enso`, ensoSchema, controller.signal)
      .then(setEnso)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedFieldId) return
    const controller = new AbortController()
    setClimate({ status: 'loading' })
    loadParsed(`${API_BASE}/fields/${selectedFieldId}/climate`, fieldClimateSchema, controller.signal)
      .then(setClimate)
      .catch(() => {})
    return () => controller.abort()
  }, [selectedFieldId])

  const climateEvidence = useMemo(() => {
    if (climate?.status !== 'ready') return null
    const { municipality, rows } = climate.data
    return { municipality: `${municipality.name_official} (${municipality.uf})`, rows }
  }, [climate])

  useEffect(() => {
    if (!selectedFieldId) return
    const controller = new AbortController()
    setIsLoadingScenarios(true)
    setError(null)
    const query = new URLSearchParams({ season })
    fetch(`${API_BASE}/fields/${selectedFieldId}/scenarios?${query.toString()}`, { signal: controller.signal })
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
  }, [selectedFieldId, season])

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

  const handleSeasonChange = useCallback((nextSeason: string) => {
    setScenarios([])
    setScenarioState(null)
    setThreshold(null)
    setSeason(nextSeason)
  }, [])

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

  // AM-04: opening the analysis follows the selected field's municipality; the sheet's own
  // picker may move to another municipality without changing the selected field.
  const openAnalysis = useCallback((code: number | null) => {
    setAnalysis({ open: true, code })
  }, [])
  const closeAnalysis = useCallback(() => {
    setAnalysis((current) => ({ ...current, open: false }))
    analysisToggleRef.current?.focus()
  }, [])
  const selectAnalysisCode = useCallback((code: number) => setAnalysis({ open: true, code }), [])

  useEffect(() => {
    writeAnalysisHash(analysis)
  }, [analysis])

  useEffect(() => {
    const onHashChange = () => setAnalysis(analysisFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const shellStyle = {
    '--fs-notice-block': `${hasNotice ? noticeHeight + 8 : 0}px`,
  } as CSSProperties

  return (
    <main className="app-shell" style={shellStyle}>
      <MapCanvas fields={fields} selectedField={selectedField} onTileChange={setMapTile} />
      <div className="overlay anchor-bottom-right layer-rail-anchor" style={{ zIndex: ZOrder.layerRail }}>
        <div className="overlay-interactive panel-surface layer-panel"><LayerRail tile={mapTile} /></div>
      </div>

      <div className="overlay anchor-top-left layer-chips" style={{ zIndex: ZOrder.chips }}>
        <div className="overlay-interactive top-chip brand-chip">
          <a className="brand" href="/" aria-label={t('map.field_map_home')}>
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>{t('map.brand')}{t('map.brand_accent')}</span>
          </a>
        </div>
        {!isNarrow && <div className="overlay-interactive enso-chip-slot"><EnsoChip enso={enso} /></div>}
      </div>

      <div className="overlay anchor-top-right layer-controls" style={{ zIndex: ZOrder.controlStrip }}>
        <div className="overlay-interactive topbar-meta">
          <span className="top-chip workspace-label">{t('map.field_intelligence')}</span>
          <span className="top-chip profile-avatar" aria-label={t('map.grower_profile')}>GM</span>
          <CommandToggle isOpen={command.isOpen} buttonRef={command.buttonRef} onToggle={handleToggleCommand} />
          <SupportingDataToggle isOpen={supportingData.isOpen} onToggle={handleToggleSupportingData} />
          <label className="top-chip season-control">
            <span>{t('season.label')}</span>
            <SeasonSelect key={season} seasons={seasons} default_season={season} onChange={handleSeasonChange} />
          </label>
          <button
            ref={analysisToggleRef}
            type="button"
            className="top-chip analysis-toggle"
            aria-expanded={analysis.open}
            onClick={() => (analysis.open ? closeAnalysis() : openAnalysis(selectedField?.municipality_code ?? null))}
          >
            {t('analysis.toggle')}
          </button>
          <LocaleSwitch />
        </div>
      </div>

      {/* One notice node. At 360 it is the first box of the left stack (R-39); above 640 it
          sits at right 22, top 60 and the right edge column starts 8 px below it (R-23). */}
      <div className="left-stack">
        {hasNotice && (
          <div className="overlay anchor-notice layer-notice" style={{ zIndex: ZOrder.abstentionNotice }}>
            <div ref={noticeRef} className="overlay-interactive panel-surface notice-anchor">
              {error && <p className="error-notice" role="alert">{error}</p>}
              {showsAbstention && threshold && <AbstentionNotice threshold={threshold} />}
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
        <div className="overlay-interactive panel-surface scenario-anchor">
          <div className="rotation-heading-row">
            <div>
              <p className="eyebrow">{t('map.plan_with_evidence')}</p>
              <h2>{t('map.rotation_outlook')}</h2>
            </div>
            <span className="field-coverage-pill"><span className="coverage-dot" />{selectedField && selectedField.coverage === null
              ? t('map.coverage_not_measured')
              : t('map.data_coverage', { coverage: selectedField?.coverage ?? 0 })}</span>
          </div>
          {selectedField?.municipality_code ? (
            <div className="analysis-link-row">
              <button
                type="button"
                className="analysis-link"
                onClick={() => openAnalysis(selectedField.municipality_code ?? null)}
              >
                {t('analysis.open')}
              </button>
            </div>
          ) : null}
          {isNarrow && <div className="enso-chip-slot enso-chip-inline"><EnsoChip enso={enso} /></div>}
          <ClimateSignal climate={selectedFieldId ? climate : null} />
          <ScenarioCards
            scenarios={scenarios}
            state={scenarioState === 'abstained' ? null : scenarioState}
            threshold={scenarioState === 'abstained' ? null : threshold}
            isLoading={isLoadingFields || isLoadingScenarios}
            emptyReason={isLoadingFields || isLoadingScenarios
              ? null
              : error ?? (!selectedFieldId
                ? t('empty.select_field')
                : scenarios.length === 0 ? t('empty.no_rotation_scenarios') : null)}
          />
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
                  climate={climateEvidence}
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
      {analysis.open && (
        <SheetBoundary onClose={closeAnalysis}>
          <Suspense fallback={null}>
            <AnalysisSheet code={analysis.code} onSelectCode={selectAnalysisCode} onClose={closeAnalysis} />
          </Suspense>
        </SheetBoundary>
      )}
    </main>
  )
}

export default App

