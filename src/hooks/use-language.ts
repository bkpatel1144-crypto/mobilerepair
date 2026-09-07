import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { applyLanguage, isLanguageCode, type LanguageCode } from '@/lib/i18n'

/**
 * The current language and a setter that also persists the choice.
 *
 * Wrapping `i18n.changeLanguage` matters: on its own it switches the running app but forgets the
 * choice on reload, and it does not update `<html lang>` — which the browser's spellcheck and
 * every screen reader read to decide how to pronounce the page.
 */
export function useLanguage() {
  const { i18n } = useTranslation()
  const current: LanguageCode = isLanguageCode(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en'

  const setLanguage = useCallback(
    async (code: LanguageCode) => {
      if (code === current) return
      await i18n.changeLanguage(code)
      applyLanguage(code)
    },
    [i18n, current]
  )

  return { language: current, setLanguage }
}
