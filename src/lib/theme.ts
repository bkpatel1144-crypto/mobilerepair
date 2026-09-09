export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'aim-theme'

/** The theme when nobody has chosen one. Light, deliberately — see `getPreferredTheme()`. */
export const DEFAULT_THEME: Theme = 'light'

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

/**
 * The theme to show: whatever was chosen, otherwise light.
 *
 * Deliberately *not* `prefers-color-scheme`. Following the OS is the right default for a tool
 * someone lives in all day, and the wrong one for a public site: a visitor whose laptop is in
 * dark mode was getting the dark palette as their first impression of the brand, with no way to
 * change it, because the marketing pages had no theme control at all. The light palette is the
 * one the site is designed around — the warm paper, the lit interior heroes — so that is what a
 * first-time visitor sees, and dark is a choice they can make.
 */
export function getPreferredTheme(): Theme {
  return getStoredTheme() ?? DEFAULT_THEME
}

/**
 * Applies a theme, and only records it when the user actually picked it.
 *
 * The previous version wrote to storage on every call, including the one from `initTheme()` on
 * first load. That meant every visitor's first render silently persisted a preference they had
 * never expressed — so this change of default would have reached nobody who had already loaded
 * the site once, and "no stored choice" became impossible to distinguish from "chose light".
 */
export function applyTheme(theme: Theme, { persist = true }: { persist?: boolean } = {}) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  if (persist) window.localStorage.setItem(STORAGE_KEY, theme)
}

/** Called once before React mounts, so there's never a flash of the wrong theme. */
export function initTheme() {
  applyTheme(getPreferredTheme(), { persist: false })
}
