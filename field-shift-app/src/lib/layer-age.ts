import { t } from '@/strings'

/**
 * The age readout the rail rows and the timeline share: one phrase for one number, so the
 * dock and the row never describe the same layer differently. A null age is not invented;
 * the caller prints the status text instead.
 */
export function ageLabel(ageDays: number | null): string | null {
  if (ageDays === null) return null
  if (ageDays === 0) return t('layers.age_zero')
  if (ageDays === 1) return t('layers.age_one')
  return t('layers.age_days', { days: ageDays })
}
