import { useCallback, useEffect, useState } from 'react'
import {
  applyPrefs,
  clampFontScale,
  DEFAULT_PREFS,
  FONT_SCALE_STEP,
  readPrefs,
  writePrefs,
  type AccessibilityPrefs,
} from '@/lib/accessibility'

/**
 * The reading preferences, plus the setters that persist and apply them.
 *
 * Shared between the public site's floating toolbar and Settings > Preferences inside the app, so
 * the two surfaces cannot disagree about what the current state is. A second copy of this logic
 * in the settings page is exactly how the toolbar would end up showing 110% while the settings
 * page showed 100%.
 *
 * `storage` is listened to so a change made in one tab reaches the others. Someone who turns on
 * high contrast because they are struggling to read does not expect it to apply to only the tab
 * they happened to be looking at.
 */
export function useAccessibility() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(readPrefs)

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'aim-a11y') return
      const next = readPrefs()
      setPrefs(next)
      applyPrefs(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((patch: Partial<AccessibilityPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch }
      if (patch.fontScale !== undefined) next.fontScale = clampFontScale(patch.fontScale)
      applyPrefs(next)
      writePrefs(next)
      return next
    })
  }, [])

  const increaseFont = useCallback(
    () => update({ fontScale: clampFontScale(readPrefs().fontScale + FONT_SCALE_STEP) }),
    [update]
  )
  const decreaseFont = useCallback(
    () => update({ fontScale: clampFontScale(readPrefs().fontScale - FONT_SCALE_STEP) }),
    [update]
  )
  const reset = useCallback(() => update(DEFAULT_PREFS), [update])

  return {
    prefs,
    update,
    increaseFont,
    decreaseFont,
    reset,
    /** True when anything differs from the design default — drives whether Reset is offered. */
    isModified:
      prefs.fontScale !== DEFAULT_PREFS.fontScale || prefs.highContrast || prefs.dyslexiaFont,
  }
}
