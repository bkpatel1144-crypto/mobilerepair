import type { JobCardDoc, PartUsed, PartWarranty } from '@/types/firestore'

/**
 * When a warranty recorded on a bill actually runs out, and whether it still has time left.
 *
 * `billWarranty` and `PartUsed.warranty` have been written since Edit Bill shipped and read by
 * **nothing**. Recording a warranty no screen can answer a question about is the same as not
 * recording it — the only reason it is captured is the moment a customer walks back in with the
 * same phone.
 *
 * Pure, and date arithmetic is done in whole days against a supplied `now`, so a test does not
 * depend on when it runs.
 */

export type WarrantyUnit = 'days' | 'months' | 'years'

export interface WarrantyWindow {
  /** `YYYY-MM-DD`. Null when there is no warranty at all, or no date to count from. */
  expiresOn: string | null
  /** Negative once it has run out. Null when there is no window to speak of. */
  daysLeft: number | null
  state: 'live' | 'expired' | 'none' | 'unknown'
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toDateOnly(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** `YYYY-MM-DD` parsed as local midnight. `new Date('2026-09-11')` is parsed as UTC, which lands
 *  on the previous day for anyone west of Greenwich and made a same-day expiry read as expired. */
function parseDateOnly(text: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Add a warranty duration to a start date.
 *
 * Months and years are added by calendar, not by multiplying days: six months from 31 August is
 * 28 February, not "31 August plus 184 days". A day that does not exist in the target month
 * clamps to that month's last day, which is what every other "+N months" in the app means and
 * what a shopkeeper writing "6 months" on a bill means too.
 */
export function addWarranty(start: Date, value: number, unit: WarrantyUnit): Date {
  const out = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  if (unit === 'days') {
    out.setDate(out.getDate() + value)
    return out
  }
  const months = unit === 'years' ? value * 12 : value
  const day = out.getDate()
  out.setDate(1)
  out.setMonth(out.getMonth() + months)
  const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate()
  out.setDate(Math.min(day, lastDay))
  return out
}

/**
 * The window a warranty of `value` `unit` gives, counted from `from`.
 *
 * A stored `until` wins over the duration: Edit Bill lets a specific date be typed per part, and
 * a date someone entered by hand is a decision, not something to recompute.
 */
export function warrantyWindow(
  warranty: { value: number; unit: WarrantyUnit; until?: string | null } | null | undefined,
  from: Date | null,
  now: Date
): WarrantyWindow {
  if (!warranty || warranty.value <= 0) {
    if (warranty?.until) {
      const explicit = parseDateOnly(warranty.until)
      if (explicit) return windowFrom(explicit, now)
    }
    return { expiresOn: null, daysLeft: null, state: 'none' }
  }
  if (warranty.until) {
    const explicit = parseDateOnly(warranty.until)
    if (explicit) return windowFrom(explicit, now)
  }
  // No date to count from — the job was never delivered or billed, so the clock has not started.
  // "Unknown" rather than "none": the warranty exists, it just cannot be placed on a calendar.
  if (!from) return { expiresOn: null, daysLeft: null, state: 'unknown' }
  return windowFrom(addWarranty(from, warranty.value, warranty.unit), now)
}

function windowFrom(expires: Date, now: Date): WarrantyWindow {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysLeft = Math.round((expires.getTime() - today.getTime()) / MS_PER_DAY)
  return {
    expiresOn: toDateOnly(expires),
    daysLeft,
    // The last day is still covered — a warranty that expires today has not expired yet.
    state: daysLeft >= 0 ? 'live' : 'expired',
  }
}

/** The date a job's warranties are counted from: when the device went back to the customer, or
 *  failing that when it was billed. Both are optional on jobs written before those fields. */
export function warrantyStartOf(job: Pick<JobCardDoc, 'deliveredAt' | 'billGeneratedAt'>): Date | null {
  const stamp = job.deliveredAt ?? job.billGeneratedAt
  const millis = (stamp as { toMillis?: () => number } | null)?.toMillis?.()
  return millis ? new Date(millis) : null
}

export interface WarrantyLine {
  label: string
  /** Null for the bill-level warranty, which covers the job rather than one part. */
  part: PartUsed | null
  window: WarrantyWindow
}

/**
 * Every warranty on one job — the bill's own, plus each part that carries one.
 *
 * A part with no warranty of its own is *not* given the bill's: they are different promises, and
 * inventing coverage is the one mistake this screen must not make.
 */
export function warrantyLinesOf(
  job: Pick<JobCardDoc, 'deliveredAt' | 'billGeneratedAt' | 'billWarranty' | 'partsUsed'>,
  now: Date,
  billLabel: string
): WarrantyLine[] {
  const from = warrantyStartOf(job)
  const lines: WarrantyLine[] = []
  if (job.billWarranty && job.billWarranty.value > 0) {
    lines.push({ label: billLabel, part: null, window: warrantyWindow(job.billWarranty, from, now) })
  }
  for (const part of job.partsUsed ?? []) {
    const w = part.warranty as PartWarranty | null | undefined
    if (!w || (w.value <= 0 && !w.until)) continue
    lines.push({ label: part.itemName, part, window: warrantyWindow(w, from, now) })
  }
  return lines
}

/** The single answer the counter needs: is anything on this job still covered? */
export function jobWarrantyState(lines: WarrantyLine[]): WarrantyWindow['state'] {
  if (lines.length === 0) return 'none'
  if (lines.some((l) => l.window.state === 'live')) return 'live'
  if (lines.some((l) => l.window.state === 'unknown')) return 'unknown'
  return 'expired'
}

/**
 * Does this job match what was typed into the lookup box?
 *
 * One box rather than four, because the person at the counter has whatever the customer brought:
 * a phone number, the device in hand (IMEI), a printed job card, or an invoice. Digits are
 * compared with separators stripped so `98765 00000` finds `9876500000`.
 */
export function jobMatchesLookup(
  job: Pick<
    JobCardDoc,
    'jobNumber' | 'customerName' | 'customerMobile' | 'alternativeMobile' | 'imei' | 'imei2' | 'serialNo' | 'model'
  >,
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  const digits = q.replace(/\D/g, '')
  const text = [job.jobNumber, job.customerName, job.model].filter(Boolean).join(' ').toLowerCase()
  if (text.includes(q)) return true
  if (!digits) return false
  const numbers = [job.customerMobile, job.alternativeMobile, job.imei, job.imei2, job.serialNo]
    .filter(Boolean)
    .map((v) => String(v).replace(/\D/g, ''))
  return numbers.some((n) => {
    if (n.length === 0) return false
    // A partial typed from a printed card or read off the device.
    if (n.includes(digits)) return true
    // The other direction, for a number typed with a country code — `+91 98765 00000` against a
    // stored `9876500000`. Length-guarded so a two-digit stored value cannot match everything.
    return n.length >= 7 && digits.endsWith(n)
  })
}
