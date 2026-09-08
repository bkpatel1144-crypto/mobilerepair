import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18next from 'i18next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** `"Shrey Ghadge"` → `"SG"`, `"Shrey"` → `"SH"` — the avatar-initials pattern used for the
 * header's own profile avatar and, since it's the same visual language, every other avatar
 * circle in the app (people pickers like Assign To / Handover To). */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]
  return initials.toUpperCase()
}

/** `"Store Manager"` → `"STOREMANAGER"` — the auto-generated-code pattern used throughout the
 * reference app (Branch codes, UOM codes, Party Category codes, Role codes, …): uppercase,
 * alphanumeric only, capped so it never becomes an unreasonably long identifier. */
export function slugifyCode(name: string, maxLength = 16) {
  const code = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, maxLength)
  return code || 'CODE'
}

/** Firestore `Timestamp` → localized string, `'—'` for anything not yet resolved (a pending
 * `serverTimestamp()` sentinel reads back as `null`/no `toDate()` until the server confirms it —
 * see `profile-cache.ts`'s doc comment). `withTime: false` for a date-only display (list table
 * columns); the default includes time (detail panels, timelines). */
export function formatTimestamp(
  ts: { toDate?: () => Date } | null | undefined,
  withTime = true
): string {
  if (!ts?.toDate) return '—'
  return ts
    .toDate()
    .toLocaleString(
      'en-IN',
      withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }
    )
}

/**
 * `04 Sep 2026` — two-digit day, three-letter month, four-digit year.
 *
 * Month names are spelled out here rather than left to `Intl`, which is not stable across
 * environments: the same `month: 'short'` gives "Sep" in some ICU builds and "Sept" in others,
 * so a date column would read differently depending on the user's browser and OS. Table columns
 * also align better with a fixed-width day.
 */
const MONTHS_SHORT_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Short month names in the active language.
 *
 * Read from i18next at call time rather than captured at module load, so a language switch takes
 * effect immediately — these run during render, not once at import. The English list above stays
 * as the fallback for the reason it existed before translation: `Intl` is not stable across ICU
 * builds ("Sep" vs "Sept"), so a date column would otherwise read differently per browser.
 */
function monthsShort(): string[] {
  const fromLocale = i18next.t('months.short', { returnObjects: true })
  return Array.isArray(fromLocale) && fromLocale.length === 12
    ? (fromLocale as string[])
    : MONTHS_SHORT_EN
}

export function formatDateShort(ts: { toDate?: () => Date } | Date | null | undefined): string {
  const d = ts instanceof Date ? ts : ts?.toDate?.()
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')} ${monthsShort()[d.getMonth()]} ${d.getFullYear()}`
}

/** `Sep 04, 2026 • 11:58 AM` — the long form used in detail drawers' Timeline blocks. */
export function formatDateTimeLong(ts: { toDate?: () => Date } | Date | null | undefined): string {
  const d = ts instanceof Date ? ts : ts?.toDate?.()
  if (!d) return '—'
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${monthsShort()[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} • ${time}`
}

/**
 * A `Date` as the `YYYY-MM-DD` string an `<input type="date">` expects, in the *local* calendar.
 *
 * Not `toISOString().slice(0, 10)`, which formats in UTC and is off by a day for much of every
 * day in India: `new Date(2026, 3, 1)` — 1 April, local midnight — stringifies as
 * `"2026-03-31"` at UTC+5:30. Round-tripping a stored date through a date input that way loses
 * a day on every save, and defaulting a form to "today" that way shows yesterday before 5:30am.
 */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** `₹6,200` — thousands-separated rupee display, matching the `₹{amt.toLocaleString('en-IN')}`
 * pattern already used ad hoc in a few earlier pages, now a shared helper for Phase 9's reports
 * (which need it in many more places than any earlier phase did). Rounds to whole rupees —
 * nothing in this app deals in paise. */
export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/** `-2,430.61%` / `12.5%` — the reference's own percentage style (2 decimals, thousands
 * separator on the integer part) for margin/deviation figures across every Phase 9 report. */
export function formatPercent(pct: number): string {
  return `${pct.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
