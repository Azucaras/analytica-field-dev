import { t } from '@/strings'
import { en } from '@/strings/en'
import type { EvidenceRow } from './ScenarioCards'

export const SMAP_SCALE_MAX = 0.5

/** Observed, retrieved and entered are the measured bases. */
const MEASURED_BASES: ReadonlyArray<EvidenceRow['basis']> = ['observed', 'retrieved', 'entered']

type SmapBarProps = {
  value?: string | null
  basis?: EvidenceRow['basis']
  asOf?: string
  scaleMax: number
}

type SmapState = {
  drawn: boolean
  numeric: number
  label: string | null
  marked: boolean
}

/**
 * The drawn or empty state is a pure function of the row's own basis and of
 * whether its value parses to a finite number. No prop carries an assumption.
 */
function resolveState(value: string | null | undefined, basis: EvidenceRow['basis'] | undefined): SmapState {
  if (basis === 'modelled') {
    return {
      drawn: false,
      numeric: 0,
      label: t('evidence.layer_modelled', { layer: t('evidence.layer.smap') }),
      marked: true,
    }
  }
  if (value === undefined) return { drawn: false, numeric: 0, label: t('visual.not_reported'), marked: false }
  if (value === null) return { drawn: false, numeric: 0, label: t('evidence.no_observation'), marked: false }
  if (value === en['evidence.value.not_entered']) {
    return { drawn: false, numeric: 0, label: t('evidence.value.not_entered'), marked: false }
  }
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) {
    return { drawn: false, numeric: 0, label: t('evidence.no_observation'), marked: false }
  }
  if (!basis || !MEASURED_BASES.includes(basis)) {
    return { drawn: false, numeric: 0, label: t('evidence.no_observation'), marked: false }
  }
  return { drawn: true, numeric, label: null, marked: false }
}

export function SmapBar({ value, basis, asOf, scaleMax }: SmapBarProps) {
  const layer = t('evidence.layer.smap')
  const state = resolveState(value, basis)
  const ratio = state.drawn && scaleMax > 0 ? Math.min(Math.max(state.numeric / scaleMax, 0), 1) : 0
  const percent = Number((ratio * 100).toFixed(2))
  const basisLabel = basis ? t(`evidence.basis_${basis}`) : null

  let groupLabel: string
  if (state.drawn) {
    groupLabel = basisLabel
      ? t('visual.smap_group_label', { layer, value: value as string, basis: basisLabel })
      : t('visual.smap_group_label_plain', { layer, value: value as string })
  } else if (state.marked) {
    // The accessible name carries the same literal as the visible label.
    groupLabel = state.label as string
  } else {
    groupLabel = t('visual.smap_group_label_empty', { layer, label: state.label as string })
  }

  return (
    <div
      className="smap-visual"
      role="group"
      aria-label={groupLabel}
      data-state={state.drawn ? 'drawn' : 'empty'}
      data-basis={basis ?? 'none'}
    >
      <span className={state.marked ? 'visual-caption smap-modelled-label' : 'visual-caption'}>
        {state.marked ? state.label : layer}
      </span>
      <div className="smap-track">
        <div
          className="smap-fill"
          data-fill-percent={percent}
          style={{ width: state.drawn ? `${percent}%` : '0px' }}
        />
      </div>
      {state.drawn ? (
        <div className="smap-readout">
          <span className="smap-value">{value}</span>
          {basisLabel ? <span className={`basis-label basis-${basis}`}>{basisLabel}</span> : null}
          {asOf ? <time data-dynamic-content dateTime={asOf}>{asOf}</time> : null}
        </div>
      ) : (
        <div className="smap-readout">
          {state.marked ? null : <span className="smap-empty-label">{state.label}</span>}
          {basisLabel ? <span className={`basis-label basis-${basis}`}>{basisLabel}</span> : null}
        </div>
      )}
    </div>
  )
}
