import { describe, it, expect } from 'vitest'
import {
  getInitials,
  slugifyCode,
  formatTimestamp,
  formatDateShort,
  formatDateTimeLong,
  formatCurrency,
  formatPercent,
} from './utils'

/** Stands in for a Firestore Timestamp, which is all these helpers actually touch. */
const ts = (d: Date) => ({ toDate: () => d })

describe('getInitials', () => {
  it('takes the first and last name', () => {
    expect(getInitials('Shrey Ghadge')).toBe('SG')
  })

  it('takes two letters from a single name', () => {
    expect(getInitials('Shrey')).toBe('SH')
  })

  it('skips the middle name rather than producing three letters', () => {
    expect(getInitials('Bhumit Kumar Panchal')).toBe('BP')
  })

  it('collapses runs of whitespace', () => {
    expect(getInitials('  Shrey   Ghadge  ')).toBe('SG')
  })

  it('uppercases a lowercase name', () => {
    expect(getInitials('shrey ghadge')).toBe('SG')
  })
})

describe('slugifyCode', () => {
  it('uppercases and strips non-alphanumerics', () => {
    expect(slugifyCode('Store Manager')).toBe('STOREMANAGER')
  })

  it('keeps digits', () => {
    expect(slugifyCode('Branch 2')).toBe('BRANCH2')
  })

  it('caps the length', () => {
    expect(slugifyCode('A very long descriptive role name indeed')).toHaveLength(16)
  })

  it('honours a custom cap', () => {
    expect(slugifyCode('Store Manager', 5)).toBe('STORE')
  })

  it('falls back to CODE rather than an empty identifier', () => {
    // An empty code would collide with every other empty code and break uniqueness checks.
    expect(slugifyCode('!!!')).toBe('CODE')
    expect(slugifyCode('   ')).toBe('CODE')
  })
})

describe('formatTimestamp', () => {
  it('renders an em-dash for a pending serverTimestamp', () => {
    // A `serverTimestamp()` sentinel reads back with no `toDate()` until the server confirms it.
    // Rendering "Invalid Date" or crashing there would hit every list the moment a row is added.
    expect(formatTimestamp(null)).toBe('—')
    expect(formatTimestamp(undefined)).toBe('—')
    expect(formatTimestamp({})).toBe('—')
  })

  it('includes a time by default and omits it when asked', () => {
    const withTime = formatTimestamp(ts(new Date(2026, 8, 4, 11, 58)))
    const dateOnly = formatTimestamp(ts(new Date(2026, 8, 4, 11, 58)), false)
    expect(withTime.length).toBeGreaterThan(dateOnly.length)
    expect(dateOnly).not.toMatch(/\d\d:\d\d/)
  })
})

describe('formatDateShort', () => {
  it('formats as "04 Sep 2026"', () => {
    expect(formatDateShort(ts(new Date(2026, 8, 4)))).toBe('04 Sep 2026')
  })

  it('accepts a plain Date as well as a Timestamp', () => {
    expect(formatDateShort(new Date(2026, 8, 4))).toBe('04 Sep 2026')
  })

  it('zero-pads the day so table columns line up', () => {
    expect(formatDateShort(new Date(2026, 0, 1))).toBe('01 Jan 2026')
  })

  it('spells months itself rather than trusting Intl', () => {
    // `Intl` gives "Sep" in some ICU builds and "Sept" in others, which would make the same
    // column read differently per browser. The month list is hardcoded precisely to avoid that.
    expect(formatDateShort(new Date(2026, 8, 4))).not.toContain('Sept ')
  })

  it('renders an em-dash for a missing date', () => {
    expect(formatDateShort(null)).toBe('—')
    expect(formatDateShort({})).toBe('—')
  })

  it('covers every month', () => {
    const names = Array.from({ length: 12 }, (_, m) => formatDateShort(new Date(2026, m, 15)))
    expect(names.map((n) => n.split(' ')[1])).toEqual([
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
    ])
  })
})

describe('formatDateTimeLong', () => {
  it('formats as "Sep 04, 2026 • <time>"', () => {
    const out = formatDateTimeLong(new Date(2026, 8, 4, 11, 58))
    expect(out.startsWith('Sep 04, 2026 • ')).toBe(true)
    expect(out).toMatch(/11:58\s?(AM|am)/)
  })

  it('renders an em-dash for a missing date', () => {
    expect(formatDateTimeLong(null)).toBe('—')
  })
})

describe('formatCurrency', () => {
  it('groups in the Indian lakh/crore style, not in thousands', () => {
    // ₹12,34,567 — not ₹1,234,567. Getting this wrong makes every large figure in the app read
    // as a foreign amount to the shop looking at it.
    expect(formatCurrency(1234567)).toBe('₹12,34,567')
  })

  it('groups a four-digit amount', () => {
    expect(formatCurrency(6200)).toBe('₹6,200')
  })

  it('rounds to whole rupees — nothing here deals in paise', () => {
    expect(formatCurrency(6200.4)).toBe('₹6,200')
    expect(formatCurrency(6200.5)).toBe('₹6,201')
  })

  it('keeps the sign on a negative amount', () => {
    expect(formatCurrency(-1500)).toBe('₹-1,500')
  })

  it('renders zero as ₹0', () => {
    expect(formatCurrency(0)).toBe('₹0')
  })
})

describe('formatPercent', () => {
  it('shows exactly two decimals', () => {
    expect(formatPercent(12.5)).toBe('12.50%')
    expect(formatPercent(0)).toBe('0.00%')
  })

  it('groups and signs a large negative deviation', () => {
    expect(formatPercent(-2430.61)).toBe('-2,430.61%')
  })

  it('rounds rather than truncating', () => {
    expect(formatPercent(33.336)).toBe('33.34%')
  })
})
