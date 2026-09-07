import { describe, it, expect } from 'vitest'
import { marginPct, lineOverrunPct, dayKey, monthKey, formatMonthLabel } from './reports'

describe('marginPct', () => {
  it('computes profit as a percentage of revenue', () => {
    expect(marginPct(250, 1000)).toBe(25)
  })

  it('returns 0 rather than Infinity for a job with no revenue', () => {
    // A table cell reading "Infinity%" or "NaN%" is a bug report waiting to happen; 0% reads
    // sanely and is what every report page relies on.
    expect(marginPct(500, 0)).toBe(0)
    expect(Number.isFinite(marginPct(500, 0))).toBe(true)
  })

  it('goes negative on a loss-making job', () => {
    expect(marginPct(-200, 800)).toBe(-25)
  })

  it('treats negative revenue as no revenue', () => {
    // Only `revenue > 0` counts, so a nonsensical negative revenue can't produce a
    // sign-flipped margin that looks plausible.
    expect(marginPct(100, -500)).toBe(0)
  })
})

describe('lineOverrunPct', () => {
  it('reproduces the reference’s own ₹2,500-part-on-a-₹245-job figure', () => {
    // 920.4% — the value the competitor's Supplier Report displays for this exact pair.
    expect(lineOverrunPct(2500, 245)).toBeCloseTo(920.408, 3)
  })

  it('is 0 when the line cost exactly equals the job revenue', () => {
    expect(lineOverrunPct(500, 500)).toBe(0)
  })

  it('is negative when the line came in under the job’s revenue', () => {
    expect(lineOverrunPct(250, 1000)).toBe(-75)
  })

  it('returns 0 rather than dividing by zero', () => {
    expect(lineOverrunPct(2500, 0)).toBe(0)
  })
})

describe('dayKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 8, 4))).toBe('2026-09-04')
  })

  it('zero-pads single-digit months and days', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses the shop’s own clock, not UTC', () => {
    // Late-evening local time in a positive-offset zone is already tomorrow in UTC.
    // `toISOString()` would file such a job under the wrong day; this must not.
    const lateEvening = new Date(2026, 8, 4, 23, 30)
    expect(dayKey(lateEvening)).toBe('2026-09-04')
  })

  it('groups two moments on the same local day under one key', () => {
    expect(dayKey(new Date(2026, 8, 4, 0, 1))).toBe(dayKey(new Date(2026, 8, 4, 23, 59)))
  })
})

describe('monthKey', () => {
  it('formats as YYYY-MM', () => {
    expect(monthKey(new Date(2026, 8, 4))).toBe('2026-09')
  })

  it('zero-pads a single-digit month', () => {
    expect(monthKey(new Date(2026, 0, 31))).toBe('2026-01')
  })

  it('keeps December and the following January apart', () => {
    expect(monthKey(new Date(2026, 11, 31))).toBe('2026-12')
    expect(monthKey(new Date(2027, 0, 1))).toBe('2027-01')
  })
})

describe('formatMonthLabel', () => {
  it('round-trips a key produced by monthKey', () => {
    const key = monthKey(new Date(2026, 8, 4))
    expect(formatMonthLabel(key)).toContain('2026')
    // Parsed as a local date, so the label can't slip to the previous month at a UTC boundary.
    expect(formatMonthLabel(key)).toMatch(/September/)
  })

  it('labels January correctly rather than rolling back to December', () => {
    expect(formatMonthLabel('2026-01')).toMatch(/January/)
    expect(formatMonthLabel('2026-01')).toContain('2026')
  })
})
