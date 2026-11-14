import { t } from '@/strings'

type AbstentionNoticeProps = {
  threshold: string
}

export function AbstentionNotice({ threshold }: AbstentionNoticeProps) {
  const message = threshold === 'coverage_below_80_percent'
    ? t('notice.ranking_withheld_period', { threshold: t('notice.coverage_below_80_percent') })
    : t('notice.ranking_withheld', { threshold: t(threshold.replaceAll('_', ' ')) })

  return <p className="abstention-notice" role="status">{message}</p>
}
