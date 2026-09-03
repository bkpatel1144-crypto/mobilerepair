import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** `"Shrey Ghadge"` → `"SG"`, `"Shrey"` → `"SH"` — the avatar-initials pattern used for the
 * header's own profile avatar and, since it's the same visual language, every other avatar
 * circle in the app (people pickers like Assign To / Handover To). */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]
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
  return ts.toDate().toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
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
