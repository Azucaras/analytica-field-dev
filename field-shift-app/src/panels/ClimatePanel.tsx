import { ClimateSignal } from '@/components/ClimateSignal'
import { EnsoChip } from '@/components/EnsoChip'
import { useAppData } from '@/shell/app-data'
import { PHONE_QUERY, useMediaMatch } from '@/lib/viewport'
import { t } from '@/strings'

/**
 * The ENSO state and the rain since the start of the crop year for the selected field's
 * municipality. On a phone the ENSO state lives here, because the top bar has no room for it.
 */
export function ClimatePanel() {
  const { enso, climate, selectedField, openAnalysis } = useAppData()
  const phone = useMediaMatch(PHONE_QUERY)
  const code = selectedField?.municipality_code ?? null

  return (
    <div className="fs-stack">
      {phone && <EnsoChip enso={enso} />}
      {climate === null
        ? <p className="fs-muted">{t('empty.select_field')}</p>
        : <ClimateSignal climate={climate} />}
      {code !== null && (
        <button className="fs-button" onClick={() => openAnalysis(code)} type="button">
          {t('analysis.open')}
        </button>
      )}
    </div>
  )
}
