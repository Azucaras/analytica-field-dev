import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { RotationFlipCard } from './RotationFlipCard'
import { t } from '@/strings'

export type EvidenceRow = {
  layer: string
  value: string | null
  basis: 'observed' | 'retrieved' | 'modelled' | 'entered'
  as_of: string
  source: string
}

export type RotationScenario = {
  id: string
  name: string
  is_current: boolean
  crops: string[]
  why: string
  evidence: string
  benefit: string
  gap: string
  risk: string
  evidence_rows: EvidenceRow[]
}

type ScenarioCardsProps = {
  scenarios: RotationScenario[]
  state: 'ranked' | 'abstained' | null
  threshold: string | null
  isLoading?: boolean
  emptyReason?: string | null
}

export function ScenarioCards({ scenarios, state, threshold, isLoading = false, emptyReason }: ScenarioCardsProps) {
  return (
    <section className="scenario-panel" aria-labelledby="scenario-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('scenarios.rotation_planning')}</p>
          <h2 id="scenario-title">{t('scenarios.title')}</h2>
        </div>
        <span className="season-chip">{t('scenarios.season', { season: '2025/26' })}</span>
      </div>
      {state === 'abstained' && (
        <p className="abstention-notice" role="status">
          {t('notice.ranking_withheld_period', { threshold: t(threshold === 'coverage_below_80_percent' ? 'notice.coverage_below_80_percent' : threshold) })}
        </p>
      )}
      <ul className="scenario-list" aria-label={t('scenarios.list_label')}>
        {isLoading ? (
          Array.from({ length: 3 }, (_, index) => (
            <li className="scenario-card" aria-hidden="true" key={`skeleton-${index}`}>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-4 h-12 w-full" />
            </li>
          ))
        ) : emptyReason ? (
          <li className="scenario-card empty-scenario">
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyTitle>{t('scenarios.no_scenarios_available')}</EmptyTitle>
                <EmptyDescription>{emptyReason}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </li>
        ) : [...scenarios].sort((a, b) => Number(b.is_current) - Number(a.is_current)).map((scenario) => (
          <RotationFlipCard key={scenario.id} scenario={scenario} />
        ))}
      </ul>
    </section>
  )
}
