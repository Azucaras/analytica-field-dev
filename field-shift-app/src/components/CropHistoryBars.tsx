import { t, translationKeyFor } from '@/strings'
import type { EvidenceRow } from './ScenarioCards'

type CropHistoryBarsProps = {
  crops: string[]
  basis?: EvidenceRow['basis']
  asOf?: string
}

function cropLabel(crop: string): string {
  const key = translationKeyFor(crop)
  return key ? t(key) : crop
}

export function CropHistoryBars({ crops, basis, asOf }: CropHistoryBarsProps) {
  const row = t('evidence.layer.crop_history')
  const sequence = crops.map(cropLabel).join(t('visual.crop_sequence_separator'))
  const basisLabel = basis ? t(`evidence.basis_${basis}`) : null
  const groupLabel = basisLabel
    ? t('visual.crop_group_label_basis', { row, crops: sequence, basis: basisLabel })
    : t('visual.crop_group_label', { row, crops: sequence })

  return (
    <div
      className="crop-history"
      role="group"
      aria-label={groupLabel}
      data-basis={basisLabel ? 'reported' : 'none'}
    >
      <span className="visual-caption">{row}</span>
      <ul className="crop-bar-list">
        {crops.map((crop) => (
          <li className="crop-bar" key={crop}>
            <span className="crop-bar-track">
              <span className="crop-bar-fill" style={{ width: '100%' }} />
            </span>
            <span className="crop-bar-label">{cropLabel(crop)}</span>
          </li>
        ))}
      </ul>
      {basisLabel ? (
        <div className="crop-readout">
          <span className={`basis-label basis-${basis}`}>{basisLabel}</span>
          {asOf ? <time data-dynamic-content dateTime={asOf}>{asOf}</time> : null}
        </div>
      ) : null}
    </div>
  )
}
