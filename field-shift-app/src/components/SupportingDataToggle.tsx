import { useCallback, useState } from 'react'
import { t } from '@/strings'

export const SUPPORTING_DATA_PANEL_ID = 'supporting-data-panel'

export type SupportingDataToggleState = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

/** Owns the supporting data toggle state; the panel mounts only while open. */
export function useSupportingDataToggle(): SupportingDataToggleState {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen((open) => !open), [])
  const close = useCallback(() => setIsOpen(false), [])
  return { isOpen, toggle, close }
}

type SupportingDataToggleProps = {
  isOpen: boolean
  onToggle: () => void
}

export function SupportingDataToggle({ isOpen, onToggle }: SupportingDataToggleProps) {
  return (
    <button
      type="button"
      className="top-chip toggle-control supporting-data-toggle"
      aria-expanded={isOpen}
      aria-controls={isOpen ? SUPPORTING_DATA_PANEL_ID : undefined}
      onClick={onToggle}
    >
      {t('evidence.supporting_data')}
    </button>
  )
}
