import { en } from './en'
import { t, type TranslationVariables } from '@/strings'

/** True when the catalog has this key, so a caller can fall back to the data's own text. */
export function hasTranslation(key: string): boolean {
  return Object.hasOwn(en, key)
}

/** The catalog text for `key`, or `fallback` (a value that came with the data) when there is none. */
export function tOr(key: string, fallback: string, vars?: TranslationVariables): string {
  return hasTranslation(key) ? t(key, vars) : fallback
}

/** A crop name from the data in the current language; an unknown crop keeps the name it came with. */
export function cropLabel(crop: string): string {
  return tOr(`common.crop.${crop.toLowerCase()}`, crop)
}
