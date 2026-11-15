import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RotationScenario } from '@/components/ScenarioCards'
import type { EvidenceRow } from '@/components/EvidencePanel'
import type { SelectedPolygonChip } from '@/panels/FieldListPanel'
import { ensoSchema, fieldClimateSchema, loadParsed, type EnsoState, type FieldClimate, type Loadable } from '@/lib/climate'
import { useMapStore, type FieldSummary } from '@/lib/map-store'
import { regionAdapter } from '@/lib/regions'
import { unmappedClassColour } from '@/lib/polygon-style'
import { commandFieldId } from '@/lib/polygon-selection'
import { seasonForDate } from '@/lib/timeline'
import { t, translationKeyFor } from '@/strings'

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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

/** Everything the panels share. A panel reads it with `useAppData()`. */
export type AppData = {
  /** The fields of the active region only. */
  fields: FieldSummary[]
  selectedField: FieldSummary | null
  selectedFieldId: string | null
  selectField: (fieldId: string) => void
  isLoadingFields: boolean
  isLoadingScenarios: boolean
  error: string | null
  canRetryFields: boolean
  retryFields: () => void
  scenarios: RotationScenario[]
  scenarioState: 'ranked' | 'abstained' | null
  threshold: string | null
  showsAbstention: boolean
  /** The season the fixture values belong to, and the one the chosen date falls in. */
  fixtureSeason: string
  derivedSeason: string
  evidenceRows: EvidenceRow[]
  fieldCrops: string[]
  enso: Loadable<EnsoState>
  climate: Loadable<FieldClimate> | null
  climateEvidence: { municipality: string; rows: FieldClimate['rows'] } | null
  selectedPolygonChip: SelectedPolygonChip | null
  openAnalysis: (code: number | null) => void
}

const AppDataContext = createContext<AppData | null>(null)

export function useAppData(): AppData {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData needs an AppDataProvider above it')
  return value
}

export function AppDataProvider({ openAnalysis, children }: { openAnalysis: (code: number | null) => void; children: ReactNode }) {
  const selectedFieldId = useMapStore((state) => state.selectedFieldId)
  const selectFieldInStore = useMapStore((state) => state.selectField)
  const regionId = useMapStore((state) => state.regionId)
  const selectedPolygonId = useMapStore((state) => state.selectedPolygonId)
  const polygonClass = useMapStore((state) => state.polygonClass)
  const chosenDate = useMapStore((state) => state.chosenDate ?? state.axis.default)

  const [allFields, setAllFields] = useState<FieldSummary[]>([])
  const [fixtureSeason, setFixtureSeason] = useState('2025/26')
  const [scenarios, setScenarios] = useState<RotationScenario[]>([])
  const [scenarioState, setScenarioState] = useState<ScenarioResponse['state'] | null>(null)
  const [threshold, setThreshold] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canRetryFields, setCanRetryFields] = useState(false)
  const [fieldsRequest, setFieldsRequest] = useState(0)
  const [isLoadingFields, setIsLoadingFields] = useState(true)
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false)
  // The ENSO state and the climate line load on their own; a failure there never sets `error`.
  const [enso, setEnso] = useState<Loadable<EnsoState>>({ status: 'loading' })
  const [climate, setClimate] = useState<Loadable<FieldClimate> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/fields`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new BackendHttpError(response.status)
        return response.json() as Promise<FieldResponse>
      })
      .then((data) => {
        setAllFields(data.fields)
        setFixtureSeason(data.default_season)
        setError(null)
        setCanRetryFields(false)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setAllFields([])
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
    const controller = new AbortController()
    loadParsed(`${API_BASE}/climate/enso`, ensoSchema, controller.signal).then(setEnso).catch(() => {})
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

  useEffect(() => {
    if (!selectedFieldId) return
    const controller = new AbortController()
    setIsLoadingScenarios(true)
    setError(null)
    // The scenario request carries no season: a date change must not refetch or relabel the values.
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

  const retryFields = useCallback(() => {
    setIsLoadingFields(true)
    setFieldsRequest((request) => request + 1)
  }, [])

  const selectField = useCallback((fieldId: string) => {
    if (fieldId === useMapStore.getState().selectedFieldId) return
    setScenarios([])
    setScenarioState(null)
    setThreshold(null)
    selectFieldInStore(fieldId)
  }, [selectFieldInStore])

  // Only the fields of the active region are listed or drawn.
  const fields = useMemo(
    () => allFields.filter((field) => regionAdapter(regionId).fixtureIds.includes(field.id) || field.region === regionId),
    [allFields, regionId],
  )
  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  )
  const selectedPolygonChip = useMemo<SelectedPolygonChip | null>(
    () => (selectedPolygonId === null
      ? null
      : {
        fieldId: commandFieldId(regionAdapter(regionId), selectedPolygonId),
        name: polygonClass?.name ?? null,
        hex: polygonClass?.hex ?? unmappedClassColour(),
      }),
    [selectedPolygonId, polygonClass, regionId],
  )
  const evidenceRows = useMemo<EvidenceRow[]>(() => {
    const current = scenarios.find((scenario) => scenario.is_current) ?? scenarios[0]
    return (current?.evidence_rows ?? []).map((row) => ({ ...row, layer: t(translationKeyFor(row.layer) ?? row.layer) }))
  }, [scenarios])
  const fieldCrops = useMemo(() => [...new Set(scenarios.flatMap((scenario) => scenario.crops))], [scenarios])
  const climateEvidence = useMemo(() => {
    if (climate?.status !== 'ready') return null
    const { municipality, rows } = climate.data
    return { municipality: `${municipality.name_official} (${municipality.uf})`, rows }
  }, [climate])
  const showsAbstention = Boolean(
    scenarioState === 'abstained' && threshold && (scenarios.length > 0 || threshold === 'coverage_not_measured'),
  )

  const value = useMemo<AppData>(() => ({
    fields,
    selectedField,
    selectedFieldId,
    selectField,
    isLoadingFields,
    isLoadingScenarios,
    error,
    canRetryFields,
    retryFields,
    scenarios,
    scenarioState,
    threshold,
    showsAbstention,
    fixtureSeason,
    derivedSeason: seasonForDate(chosenDate),
    evidenceRows,
    fieldCrops,
    enso,
    climate: selectedFieldId ? climate : null,
    climateEvidence,
    selectedPolygonChip,
    openAnalysis,
  }), [
    fields, selectedField, selectedFieldId, selectField, isLoadingFields, isLoadingScenarios, error, canRetryFields,
    retryFields, scenarios, scenarioState, threshold, showsAbstention, fixtureSeason, chosenDate, evidenceRows,
    fieldCrops, enso, climate, climateEvidence, selectedPolygonChip, openAnalysis,
  ])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
