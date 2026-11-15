import { create } from 'zustand'
import type { Locale } from './index'

/**
 * One locale for the HUD and the analysis page, stored under `fs.locale`.
 * Portuguese is the default; `t()` reads the same key, so this store only exists to re-render
 * the tree when the switch changes it.
 */
export const LOCALE_STORAGE_KEY = 'fs.locale'

export function readLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'pt-BR'
  } catch {
    return 'pt-BR'
  }
}

type LocaleState = { locale: Locale; setLocale: (locale: Locale) => void }

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readLocale(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      /* private mode: the choice holds for this visit only */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = locale
    set({ locale })
  },
}))
