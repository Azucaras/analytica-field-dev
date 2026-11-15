import { Component, type ReactNode } from 'react'
import { t } from '@/strings'

type Props = { children: ReactNode; onClose: () => void }
type State = { failed: boolean }

/**
 * Block 5, AM-04: the analysis sheet shares the HUD page, so a rendering failure inside it must
 * close only the sheet, never the field map underneath.
 */
export class SheetBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="fp-page" role="dialog" aria-modal="true" aria-label={t('analysis.sheet_label')}>
        <div className="analysis-sheet-error" role="alert">
          <p>{t('analysis.sheet_error')}</p>
          <button type="button" className="fp-back" onClick={this.props.onClose}>{t('analysis.back_to_map')}</button>
        </div>
      </div>
    )
  }
}
