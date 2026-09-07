import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import gu from '@/locales/gu.json'

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'aim-language'

export function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value)
}

export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLanguageCode(stored) ? stored : null
}

/**
 * The stored choice, else the browser's own preference if we speak it, else English.
 *
 * Deliberately not `i18next-browser-languagedetector`'s full chain: this app has exactly three
 * languages and a picker in the header, so a short explicit rule is easier to reason about than
 * a plugin's ordered detector list — and it keeps the decision in one readable place.
 */
export function getPreferredLanguage(): LanguageCode {
  const stored = getStoredLanguage()
  if (stored) return stored
  if (typeof navigator === 'undefined') return 'en'
  for (const tag of navigator.languages ?? [navigator.language]) {
    // Match on the primary subtag only: "hi-IN" and "hi" are the same language to us.
    const primary = tag?.split('-')[0]
    if (isLanguageCode(primary)) return primary
  }
  return 'en'
}

/** Persists the choice and updates `<html lang>`, which screen readers and the browser's own
 * spellcheck both read. */
export function applyLanguage(code: LanguageCode) {
  window.localStorage.setItem(STORAGE_KEY, code)
  document.documentElement.lang = code
}

/**
 * Called once before React mounts, so the first paint is already in the right language rather
 * than flashing English — the same reason `initTheme` runs before mount.
 */
export function initI18n() {
  const lng = getPreferredLanguage()

  void i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      gu: { translation: gu },
    },
    lng,
    fallbackLng: 'en',
    // A missing Gujarati or Hindi key falls back to the English string rather than rendering the
    // raw dotted key at the user. An untranslated label is a cosmetic gap; `settings.company.gstin`
    // in the middle of a form is a broken screen.
    returnNull: false,
    interpolation: {
      // React escapes for us; letting i18next escape as well double-encodes an apostrophe in a
      // shop name into `&#39;`.
      escapeValue: false,
    },
  })

  document.documentElement.lang = lng
  return i18next
}

export { i18next }
