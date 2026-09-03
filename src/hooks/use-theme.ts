import { useCallback, useState } from 'react'
import { applyTheme, getPreferredTheme, type Theme } from '@/lib/theme'

/** Reads/writes the app-wide dark/light theme. `initTheme()` (called once in main.tsx, before
 * React mounts) already set the initial class on <html> — this hook just keeps subsequent
 * toggles in sync across every component that renders the toggle button. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme())

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
