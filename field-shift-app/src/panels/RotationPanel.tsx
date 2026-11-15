import { AbstentionNotice } from '@/components/AbstentionNotice'
import { ScenarioCards } from '@/components/ScenarioCards'
import { useMapStore } from '@/lib/map-store'
import { useAppData } from '@/shell/app-data'
import { t } from '@/strings'

/** The rotation scenarios of the selected field, with its coverage and any reason the ranking is withheld. */
export function RotationPanel() {
  const data = useAppData()
  const selectedPolygonId = useMapStore((state) => state.selectedPolygonId)
  const { selectedField, scenarios, scenarioState, threshold, isLoadingFields, isLoadingScenarios, error } = data
  const loading = isLoadingFields || isLoadingScenarios
  const emptyReason = loading
    ? null
    : error ?? (!data.selectedFieldId
      ? t('empty.select_field')
      : scenarios.length === 0 ? t('empty.no_rotation_scenarios') : null)

  return (
    <div className="fs-stack">
      <div className="fs-row">
        {/* A polygon has no coverage measurement, so no percentage is printed for it. */}
        {selectedPolygonId === null && (
          <span className="field-coverage-pill">
            <span className="coverage-dot" />
            {selectedField && selectedField.coverage === null
              ? t('map.coverage_not_measured')
              : t('map.data_coverage', { coverage: selectedField?.coverage ?? 0 })}
          </span>
        )}
        {selectedField !== null && data.derivedSeason !== data.fixtureSeason && (
          <span className="fs-muted">
            {t('timeline.fixture_data', { season: data.fixtureSeason, derived: data.derivedSeason })}
          </span>
        )}
      </div>
      {data.showsAbstention && threshold && <AbstentionNotice threshold={threshold} />}
      <ScenarioCards
        emptyReason={emptyReason}
        isLoading={loading}
        scenarios={scenarios}
        showHeading={false}
        state={scenarioState === 'abstained' ? null : scenarioState}
        threshold={scenarioState === 'abstained' ? null : threshold}
      />
    </div>
  )
}
