import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { t, translationKeyFor } from '@/strings'

export type EvidenceBasis = 'observed' | 'retrieved' | 'modelled' | 'entered'

export type EvidenceRow = {
  layer: string
  value: string | null
  basis: EvidenceBasis
  as_of: string
  source: string
}

type EvidencePanelProps = {
  rows: EvidenceRow[]
  isLoading?: boolean
  emptyReason?: string | null
}

export function EvidencePanel({ rows, isLoading = false, emptyReason }: EvidencePanelProps) {
  return (
    <section className="scenario-panel evidence-panel" role="region" aria-label={t('evidence.title')}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('evidence.supporting_data')}</p>
          <h2>{t('evidence.title')}</h2>
        </div>
      </div>
      {isLoading ? (
        <div className="evidence-loading" aria-label={t('evidence.loading')} aria-busy="true">
          <Skeleton className="mb-3 h-8 w-full" />
          {rows.length > 0 ? rows.map((row) => (
            <Skeleton className="mb-2 h-10 w-full" key={`${row.layer}-${row.as_of}`} />
          )) : Array.from({ length: 3 }, (_, index) => (
            <Skeleton className="mb-2 h-10 w-full" key={`evidence-skeleton-${index}`} />
          ))}
        </div>
      ) : emptyReason ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>{t('evidence.no_evidence_available')}</EmptyTitle>
            <EmptyDescription>{emptyReason}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
      <table>
        <thead>
          <tr>
            <th scope="col">{t('evidence.layer')}</th>
            <th scope="col">{t('evidence.value')}</th>
            <th scope="col">{t('evidence.basis')}</th>
            <th scope="col">{t('evidence.as_of')}</th>
            <th scope="col">{t('evidence.source')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.layer}-${row.as_of}`}>
              <th scope="row">{t(translationKeyFor(row.layer) ?? row.layer)}</th>
              <td>{row.value === null ? t('evidence.no_observation') : t(translationKeyFor(row.value) ?? row.value)}</td>
              <td><span className={`basis-label basis-${row.basis}`}>{t(`evidence.basis_${row.basis}`)}</span></td>
              <td data-dynamic-content><time dateTime={row.as_of}>{row.as_of}</time></td>
              <td data-dynamic-content><a href={row.source} target="_blank" rel="noreferrer">{row.source}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </section>
  )
}
