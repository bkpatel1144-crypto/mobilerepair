import { useCallback, useEffect, useState } from 'react'
import { applyTheme, getPreferredTheme, getStoredTheme, type Theme } from '@/lib/theme'

/**
 * Reads and writes the app-wide light/dark theme.
 *
 * `initTheme()` — called once in main.tsx before React mounts — has already set the class on
 * `<html>`; this hook only tracks subsequent toggles.
 *
 * The `storage` listener is what makes more than one toggle safe. Each instance of this hook
 * holds its own `useState`, so the public site's nav switch and the app's top-bar switch would
 * otherwise drift apart the moment either was used, and the sun/moon icon would end up
 * contradicting the actual page. Listening to storage also means a second tab follows along,
 * which is the behaviour anyone would expect of a preference.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme())

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'aim-theme') return
      const stored = getStoredTheme()
      if (stored) setTheme(stored)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      // Persisted: this one is an explicit choice, unlike `initTheme()`'s.
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
