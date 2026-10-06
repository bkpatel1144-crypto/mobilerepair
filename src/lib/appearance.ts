/**
 * The look of the app, as the person using it chose it.
 *
 * Four independent settings — accent colour, card style, chrome style and typeface — each one a
 * data attribute on `<html>` that `index.css` keys off. Same mechanism as `accessibility.ts`,
 * for the same reasons: data attributes cannot collide with Tailwind's class names or with the
 * `.dark` theme class, and applying them before React mounts means no flash of the previous
 * look on every page load.
 *
 * Per device, in `localStorage`, deliberately. The alternative — storing it on the user doc —
 * means a Firestore read before the first paint can be correct, a write on every toggle, and a
 * setting that breaks when the shop is offline. None of that is worth it for a preference whose
 * blast radius is one browser.
 *
 * Theme (light/dark) is NOT here. It lives in `theme.ts`, it predates this, and it is the one
 * appearance setting other code already depends on.
 */

export const ACCENTS = [
  'teal',
  'navy',
  'forest',
  'indigo',
  'orchid',
  'rosewood',
  'amber',
  'slate',
] as const
export type Accent = (typeof ACCENTS)[number]

/** How much the content layer is allowed to assert itself. */
export const CARD_STYLES = ['white', 'tinted', 'filled'] as const
export type CardStyle = (typeof CARD_STYLES)[number]

/** `floating` lifts the sidebar and top bar off the edges as glass; `docked` is the original. */
export const CHROME_STYLES = ['docked', 'floating'] as const
export type ChromeStyle = (typeof CHROME_STYLES)[number]

/**
 * Typefaces. Only families already in the bundle — `geist` ships with the app, and the other
 * three are system stacks that cost nothing to download. A picker offering ten webfonts would
 * add ten font payloads to a shop on a phone connection to solve a preference.
 */
export const FONTS = ['geist', 'system', 'serif', 'mono'] as const
export type Font = (typeof FONTS)[number]

export interface Appearance {
  accent: Accent
  cards: CardStyle
  chrome: ChromeStyle
  font: Font
}

export const DEFAULT_APPEARANCE: Appearance = {
  accent: 'teal', // the brand colour the app was designed around
  cards: 'white',
  chrome: 'docked', // the look every existing user already has; floating is opt-in
  font: 'geist',
}

const STORAGE_KEY = 'aim-appearance'

function isOneOf<T extends readonly string[]>(list: T, v: unknown): v is T[number] {
  return typeof v === 'string' && (list as readonly string[]).includes(v)
}

export function readAppearance(): Appearance {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APPEARANCE
    const parsed = JSON.parse(raw) as Partial<Appearance>
    // Field by field rather than trusting the object: a value written by an older build, or
    // edited by hand, must not be able to put the app into a look that has no CSS behind it.
    return {
      accent: isOneOf(ACCENTS, parsed.accent) ? parsed.accent : DEFAULT_APPEARANCE.accent,
      cards: isOneOf(CARD_STYLES, parsed.cards) ? parsed.cards : DEFAULT_APPEARANCE.cards,
      chrome: isOneOf(CHROME_STYLES, parsed.chrome) ? parsed.chrome : DEFAULT_APPEARANCE.chrome,
      font: isOneOf(FONTS, parsed.font) ? parsed.font : DEFAULT_APPEARANCE.font,
    }
  } catch {
    // Private mode, cleared storage, corrupt JSON — the default look is always a valid answer.
    return DEFAULT_APPEARANCE
  }
}

export function applyAppearance(appearance: Appearance, { persist = true } = {}): void {
  const root = document.documentElement
  root.setAttribute('data-accent', appearance.accent)
  root.setAttribute('data-cards', appearance.cards)
  root.setAttribute('data-chrome', appearance.chrome)
  root.setAttribute('data-font', appearance.font)
  if (!persist) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    // Storage being unavailable makes the choice last for this tab only, which is better than
    // refusing to apply it.
  }
}

/** Called once from `main.tsx`, before React mounts, so the first paint is already correct. */
export function initAppearance(): Appearance {
  const appearance = readAppearance()
  applyAppearance(appearance, { persist: false })
  return appearance
}
