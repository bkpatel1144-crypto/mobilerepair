import { describe, it, expect } from 'vitest'
import {
  getCurrentFinancialYear,
  getNextFinancialYear,
  formatFinancialYearDuration,
} from './financial-year'

describe('getCurrentFinancialYear', () => {
  it('starts the year on 1 April', () => {
    const fy = getCurrentFinancialYear(new Date(2026, 5, 15)) // 15 Jun 2026
    expect(fy.name).toBe('FY 2026-27')
    expect(fy.startDate).toEqual(new Date(2026, 3, 1))
    expect(fy.endDate).toEqual(new Date(2027, 2, 31))
  })

  it('puts January through March in the *previous* year’s FY', () => {
    // The one that catches an off-by-one: 15 Feb 2027 is still FY 2026-27, not FY 2027-28.
    // Getting this wrong misfiles every January-to-March job card under the wrong year.
    const fy = getCurrentFinancialYear(new Date(2027, 1, 15))
    expect(fy.name).toBe('FY 2026-27')
  })

  it('flips on 1 April, not before', () => {
    expect(getCurrentFinancialYear(new Date(2027, 2, 31)).name).toBe('FY 2026-27') // 31 Mar
    expect(getCurrentFinancialYear(new Date(2027, 3, 1)).name).toBe('FY 2027-28') // 1 Apr
  })

  it('names the end year with two digits, including across a century', () => {
    expect(getCurrentFinancialYear(new Date(2099, 5, 1)).name).toBe('FY 2099-00')
  })
})

describe('getNextFinancialYear', () => {
  it('advances exactly one year', () => {
    const next = getNextFinancialYear({ startDate: new Date(2026, 3, 1) })
    expect(next.name).toBe('FY 2027-28')
    expect(next.startDate).toEqual(new Date(2027, 3, 1))
    expect(next.endDate).toEqual(new Date(2028, 2, 31))
  })

  it('starts the day after the previous year ends', () => {
    const current = getCurrentFinancialYear(new Date(2026, 5, 1))
    const next = getNextFinancialYear(current)
    // No gap and no overlap — a day falling in neither year would vanish from every report.
    const dayAfterEnd = new Date(current.endDate.getTime() + 24 * 60 * 60 * 1000)
    expect(next.startDate.getFullYear()).toBe(dayAfterEnd.getFullYear())
    expect(next.startDate.getMonth()).toBe(dayAfterEnd.getMonth())
    expect(next.startDate.getDate()).toBe(dayAfterEnd.getDate())
  })

  it('chains without drifting', () => {
    let fy = getCurrentFinancialYear(new Date(2026, 5, 1))
    for (let i = 0; i < 5; i++) fy = getNextFinancialYear(fy)
    expect(fy.name).toBe('FY 2031-32')
  })
})

describe('formatFinancialYearDuration', () => {
  it('reads "12 months, 4 days" for a standard Apr–Mar year', () => {
    // The reference app's own string for the standard FY, from a flat 30-day month:
    // 364 exclusive days = 12 x 30 + 4.
    expect(formatFinancialYearDuration(new Date(2026, 3, 1), new Date(2027, 2, 31))).toBe(
      '12 months, 4 days'
    )
  })

  it('singularises one month and one day', () => {
    expect(formatFinancialYearDuration(new Date(2026, 3, 1), new Date(2026, 4, 1))).toBe('1 month')
    expect(formatFinancialYearDuration(new Date(2026, 3, 1), new Date(2026, 3, 2))).toBe('1 day')
  })

  it('says "0 days" rather than nothing at all for a same-day period', () => {
    expect(formatFinancialYearDuration(new Date(2026, 3, 1), new Date(2026, 3, 1))).toBe('0 days')
  })

  it('drops the days part when it lands exactly on a 30-day boundary', () => {
    expect(formatFinancialYearDuration(new Date(2026, 3, 1), new Date(2026, 5, 30))).toBe('3 months')
  })

  it('survives a DST-style shift without going off by a day', () => {
    // Rounding rather than truncating the day difference is what makes this hold: an hour lost
    // or gained mid-period must not turn 364 days into 363.
    const start = new Date(2026, 3, 1)
    const end = new Date(2027, 2, 31, 1) // an hour past midnight
    expect(formatFinancialYearDuration(start, end)).toBe('12 months, 4 days')
  })
})
