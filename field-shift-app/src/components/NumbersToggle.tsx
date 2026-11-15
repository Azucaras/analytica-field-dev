import { t } from '@/strings'

/** R-01: the `Field numbers` button of the block 3 control strip. Opening it writes `?numbers=1`. */
export const NUMBERS_TOGGLE_ATTR = 'data-numbers-toggle'

type NumbersToggleProps = {
  onOpen: () => void
}

export function NumbersToggle({ onOpen }: NumbersToggleProps) {
  return (
    <button
      type="button"
      className="top-chip toggle-control numbers-toggle"
      {...{ [NUMBERS_TOGGLE_ATTR]: '' }}
      onClick={onOpen}
    >
      {t('numbers.open')}
    </button>
  )
}
