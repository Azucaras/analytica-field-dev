import { Suspense, lazy, useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { MapCanvas } from '@/components/MapCanvas'
import { EnsoChip } from '@/components/EnsoChip'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { SheetBoundary } from '@/analysis/SheetBoundary'
import { useLocaleStore } from '@/strings/locale-store'
import { useMapStore } from '@/lib/map-store'
import { useLayers } from '@/lib/use-layers'
import { regionAdapter, regionFromSearch, searchWithRegion } from '@/lib/regions'
import { BASEMAP_ADAPTERS } from '@/lib/basemap-adapters'
import { polygonIdFromSearch, searchWithPolygon } from '@/lib/polygon-selection'
import { PHONE_QUERY, useMediaMatch } from '@/lib/viewport'
import { AppDataProvider, useAppData } from '@/shell/app-data'
import { Shell } from '@/shell/Shell'
import { PANELS } from '@/shell/panels'
import { t } from '@/strings'

// The analysis is a sheet on this page, loaded on first open so the map bundle does not
// carry Recharts. Its state lives in the hash, #analise/<IBGE code or FIPS>.
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

/** Reads `?region=`, `?basemap=` and `?polygon=` once, then keeps region and polygon in the URL. */
function useUrlState() {
  const regionId = useMapStore((state) => state.regionId)
  const selectedPolygonId = useMapStore((state) => state.selectedPolygonId)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const search = window.location.search
    const store = useMapStore.getState()
    const loadedRegion = regionFromSearch(search)
    if (loadedRegion !== store.regionId) store.setRegionId(loadedRegion)
    const requestedBasemap = new URLSearchParams(search).get('basemap')
    if (requestedBasemap === 'google' || requestedBasemap === 'google-satellite') {
      const google = BASEMAP_ADAPTERS.find((adapter) => adapter.id === 'google-satellite')
      // Without a key the EOX basemap stays, and the polygon panel says why.
      if (google?.selectable()) store.setBasemapId('google-satellite')
      else store.setBasemapKeyMissing(true)
    }
    const restored = polygonIdFromSearch(search, regionAdapter(loadedRegion))
    if (restored !== null) store.restorePolygon(restored)
    else if (store.selectedPolygonId !== null) store.clearPolygonSelection()
  }, [])

  // The URL is the only record of the region and the polygon, rewritten without a navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const store = useMapStore.getState()
    const next = searchWithPolygon(
      searchWithRegion(window.location.search, store.regionId),
      regionAdapter(store.regionId),
      store.selectedPolygonId,
    )
    if (next !== window.location.search) {
      window.history.replaceState(null, '', `${window.location.pathname}${next}${window.location.hash}`)
    }
  }, [regionId, selectedPolygonId])
}

function Brand() {
  return (
    <a aria-label={t('map.field_map_home')} className="brand" href="/">
      <span aria-hidden="true" className="brand-mark"><i /><i /><i /></span>
      <span>{t('map.brand')}{t('map.brand_accent')}</span>
    </a>
  )
}

function FieldMap({ analysisOpen, onToggleAnalysis, toggleRef }: {
  analysisOpen: boolean
  onToggleAnalysis: () => void
  toggleRef: RefObject<HTMLButtonElement | null>
}) {
  const { fields, selectedField, enso, error } = useAppData()
  const [mapTile, setMapTile] = useState<{ z: number; x: number; y: number } | null>(null)
  const phone = useMediaMatch(PHONE_QUERY)
  // One `/layers` request per chosen date and viewport tile feeds both the layer panel and the map.
  useLayers(mapTile)

  return (
    <Shell
      end={(
        <>
          <button
            aria-expanded={analysisOpen}
            className="fs-button analysis-toggle"
            onClick={onToggleAnalysis}
            ref={toggleRef}
            type="button"
          >
            {t('analysis.toggle')}
          </button>
          <LocaleSwitch />
        </>
      )}
      map={<MapCanvas fields={fields} onTileChange={setMapTile} selectedField={selectedField} />}
      notice={error ? <p className="error-notice" role="alert">{error}</p> : null}
      panels={PANELS}
      start={(
        <>
          <Brand />
          {!phone && <EnsoChip enso={enso} />}
        </>
      )}
    />
  )
}

function App() {
  // Subscribing re-renders the whole screen when the language switch changes.
  useLocaleStore((state) => state.locale)
  useUrlState()
  const [analysis, setAnalysis] = useState<AnalysisState>(analysisFromHash)
  const analysisToggleRef = useRef<HTMLButtonElement | null>(null)
  const openAnalysis = useCallback((code: number | null) => setAnalysis({ open: true, code }), [])
  const closeAnalysis = useCallback(() => {
    setAnalysis((current) => ({ ...current, open: false }))
    analysisToggleRef.current?.focus()
  }, [])
  const selectAnalysisCode = useCallback((code: number) => setAnalysis({ open: true, code }), [])

  useEffect(() => { writeAnalysisHash(analysis) }, [analysis])
  useEffect(() => {
    const onHashChange = () => setAnalysis(analysisFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <AppDataProvider openAnalysis={openAnalysis}>
      <AnalysisAwareMap
        analysis={analysis}
        closeAnalysis={closeAnalysis}
        openAnalysis={openAnalysis}
        toggleRef={analysisToggleRef}
      />
      {analysis.open && (
        <SheetBoundary onClose={closeAnalysis}>
          <Suspense fallback={null}>
            <AnalysisSheet code={analysis.code} onClose={closeAnalysis} onSelectCode={selectAnalysisCode} />
          </Suspense>
        </SheetBoundary>
      )}
    </AppDataProvider>
  )
}

/** The analysis button opens the selected field's municipality; it needs the field data, so it sits inside the provider. */
function AnalysisAwareMap({ analysis, closeAnalysis, openAnalysis, toggleRef }: {
  analysis: AnalysisState
  closeAnalysis: () => void
  openAnalysis: (code: number | null) => void
  toggleRef: RefObject<HTMLButtonElement | null>
}) {
  const { selectedField } = useAppData()
  return (
    <FieldMap
      analysisOpen={analysis.open}
      onToggleAnalysis={() => (analysis.open ? closeAnalysis() : openAnalysis(selectedField?.municipality_code ?? null))}
      toggleRef={toggleRef}
    />
  )
}

export default App
