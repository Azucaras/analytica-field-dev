import { en } from './en'
import { ptBR } from './pt-BR'

export type TranslationKey = keyof typeof en
export type TranslationVariables = Record<string, string | number>
export type Locale = 'en' | 'pt-BR'

const LOCALE_STORAGE_KEY = 'fs.locale'

function getLocale(): Locale {
  if (typeof localStorage === 'undefined') return 'en'
  return localStorage.getItem(LOCALE_STORAGE_KEY) === 'pt-BR' ? 'pt-BR' : 'en'
}

export function translationKeyFor(value: string): TranslationKey | null {
  const entry = Object.entries(en).find(([, english]) => english === value)
  return entry ? entry[0] as TranslationKey : null
}

export function t(key: TranslationKey | string, vars?: TranslationVariables): string {
  const english = en[key as TranslationKey]
  const template = getLocale() === 'pt-BR' && ptBR[key as keyof typeof ptBR]
    ? ptBR[key as keyof typeof ptBR] as string
    : english ?? key

  if (!vars) return template
  return template.replace(/\{([^{}]+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : placeholder,
  )
}
