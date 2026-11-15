import { useLocaleStore } from '@/strings/locale-store'
import { t } from '@/strings'
import type { Locale } from '@/strings'

const LOCALES: ReadonlyArray<{ locale: Locale; key: string }> = [
  { locale: 'pt-BR', key: 'locale.pt' },
  { locale: 'en', key: 'locale.en' },
]

/** Block 5, R-10: one switch for the HUD and the analysis page, stored under `fs.locale`. */
export function LocaleSwitch() {
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  return (
    <span className="top-chip locale-switch" role="group" aria-label={t('locale.switch_label')}>
      {LOCALES.map((entry) => (
        <button
          key={entry.locale}
          type="button"
          className="locale-option"
          aria-pressed={locale === entry.locale}
          onClick={() => setLocale(entry.locale)}
        >
          {t(entry.key)}
        </button>
      ))}
    </span>
  )
}
