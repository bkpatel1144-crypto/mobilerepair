export interface FinancialYearPeriod {
  name: string
  startDate: Date
  endDate: Date
}

function financialYearFromStartYear(startYear: number): FinancialYearPeriod {
  const endYear = startYear + 1
  return {
    name: `FY ${startYear}-${String(endYear).slice(-2)}`,
    startDate: new Date(startYear, 3, 1), // Apr 1
    endDate: new Date(endYear, 2, 31), // Mar 31
  }
}

/** Indian fiscal year: Apr 1 → Mar 31. Matches the "FY 2026-27" naming seen throughout
 * SCREENS_NOTES.md, derived from the real current date rather than hardcoded. Used for
 * sequence-ID generation (`JC-2026-27-...`) — deliberately independent of whichever
 * `FinancialYearDoc` a company has marked "Current" in Settings → Financial Years; see that
 * page's own doc comment for why the two are kept separate. */
export function getCurrentFinancialYear(referenceDate = new Date()): FinancialYearPeriod {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed; 3 = April
  const startYear = month >= 3 ? year : year - 1
  return financialYearFromStartYear(startYear)
}

/** The period immediately after `fy` — backs "Create Next FY"'s one-click sequential creation
 * (`preview (3)`'s own copy: "Use 'Create Next FY' button for sequential years"). */
export function getNextFinancialYear(fy: { startDate: Date }): FinancialYearPeriod {
  return financialYearFromStartYear(fy.startDate.getFullYear() + 1)
}

/** "12 months, 4 days" — the reference's own duration string (`preview (4)`) for the standard
 * Apr 1 – Mar 31 FY, reverse-engineered and confirmed exactly: the *exclusive* day difference
 * (364 for that period) divided by a flat 30-day month (364 = 12×30 + 4). Computed from the real
 * stored dates, not hardcoded, so a manually created non-standard-length FY still gets an honest
 * duration rather than always reading "12 months, 4 days". */
export function formatFinancialYearDuration(startDate: Date, endDate: Date): string {
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
  const months = Math.floor(totalDays / 30)
  const days = totalDays % 30
  const parts: string[] = []
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days === 1 ? '' : 's'}`)
  return parts.join(', ')
}
