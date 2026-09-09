/**
 * Reading preferences: font size, contrast, and a dyslexia-friendly typeface.
 *
 * Applied to `<html>` rather than to a React subtree, for two reasons. The whole design system is
 * sized in `rem`, so moving the root font size scales every screen at once — no component needs
 * to know this feature exists. And it means the preferences carry across the boundary between the
 * public site and the signed-in app, which are separate route trees: a technician who sets a
 * larger size on the marketing page still has it after logging in.
 *
 * Stored per browser, never on the server. These are properties of the device someone is reading
 * on, not of their account — the same person on the shop counter's PC and their own phone wants
 * different answers, and syncing would get it wrong on one of them.
 */

export interface AccessibilityPrefs {
  /** Root font size multiplier. 1 is the design default. */
  fontScale: number
  highContrast: boolean
  dyslexiaFont: boolean
}

export const DEFAULT_PREFS: AccessibilityPrefs = {
  fontScale: 1,
  highContrast: false,
  dyslexiaFont: false,
}

/** Bounds chosen so the layout still holds: below 0.9 tap targets get too small to hit, and
 *  above 1.5 the app's data tables start to break down however fluid the type is. */
export const MIN_FONT_SCALE = 0.9
export const MAX_FONT_SCALE = 1.5
export const FONT_SCALE_STEP = 0.1

const STORAGE_KEY = 'aim-a11y'

/** Rounds to one decimal so repeated stepping can't drift to 1.2000000000000002. */
export function clampFontScale(value: number): number {
  return Math.round(Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value)) * 10) / 10
}

export function readPrefs(): AccessibilityPrefs {
  // Every access is guarded: a private window, cleared site data or a browser set to block
  // storage makes the accessor itself throw, and a reading preference must never be the thing
  // that stops the page rendering.
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>
    return {
      fontScale:
        typeof parsed.fontScale === 'number'
          ? clampFontScale(parsed.fontScale)
          : DEFAULT_PREFS.fontScale,
      highContrast: parsed.highContrast === true,
      dyslexiaFont: parsed.dyslexiaFont === true,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function writePrefs(prefs: AccessibilityPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Preferences not persisting is a degraded experience; failing the write is not worth an
    // error the user can do nothing about.
  }
}

/**
 * Puts the preferences onto `<html>`. The two booleans become data attributes that `index.css`
 * keys off, rather than classes, so they cannot collide with Tailwind's own class names or with
 * the `.dark` theme class.
 */
export function applyPrefs(prefs: AccessibilityPrefs): void {
  const root = document.documentElement
  // Percentage, not `px`: this multiplies whatever the browser's own font size is, so someone
  // who has already set a larger default in their browser keeps it and this scales on top.
  root.style.fontSize = prefs.fontScale === 1 ? '' : `${prefs.fontScale * 100}%`
  root.toggleAttribute('data-a11y-contrast', prefs.highContrast)
  root.toggleAttribute('data-a11y-dyslexia', prefs.dyslexiaFont)
}

/**
 * Reads and applies stored preferences before React mounts.
 *
 * Called from `main.tsx` for the same reason `initI18n()` is: doing it in an effect means the
 * first paint uses the default size and then jumps, which for someone who needs 150% text is the
 * most disorienting possible moment to move the whole page.
 */
export function initAccessibility(): AccessibilityPrefs {
  const prefs = readPrefs()
  applyPrefs(prefs)
  return prefs
}

/** Maps a UI language to a speech-synthesis locale, so read-aloud is pronounced correctly. */
export const SPEECH_LOCALE: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
}
