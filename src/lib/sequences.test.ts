import { describe, it, expect } from 'vitest'
import {
  formatJobCardId,
  formatPartyId,
  formatSecondHandPurchaseId,
  formatSecondHandSaleId,
  formatReceiptId,
  formatExpenseId,
  formatSupplierBillId,
} from './sequences'
import { getCurrentFinancialYear } from './financial-year'

/** These strings are printed on bills and quoted over the phone, so their shape is a contract:
 * changing one silently breaks every document a shop has already handed to a customer. */
describe('financial-year-scoped ids', () => {
  const cases = [
    ['job card', formatJobCardId, 'JC-2026-27-00001'],
    ['party', formatPartyId, 'PTY-2026-27-00001'],
    ['second-hand purchase', formatSecondHandPurchaseId, 'SHDP-2026-27-00001'],
    ['second-hand sale', formatSecondHandSaleId, 'SHDS-2026-27-00001'],
    ['expense', formatExpenseId, 'EXP-2026-27-00001'],
    ['supplier bill', formatSupplierBillId, 'SB-2026-27-00001'],
  ] as const

  it.each(cases)('formats a %s id', (_label, format, expected) => {
    expect(format('FY 2026-27', 1)).toBe(expected)
  })

  it.each(cases)('strips the "FY " prefix for a %s id', (_label, format) => {
    // Callers pass `getCurrentFinancialYear().name`, which includes the prefix. Leaving it in
    // would produce "JC-FY 2026-27-00001" with a space in the middle of an identifier.
    expect(format('FY 2026-27', 1)).not.toContain('FY')
    expect(format('FY 2026-27', 1)).not.toContain(' ')
  })

  it('accepts a label that already has the prefix stripped', () => {
    expect(formatJobCardId('2026-27', 1)).toBe('JC-2026-27-00001')
  })

  it('pads to five digits and stops padding beyond them', () => {
    expect(formatJobCardId('FY 2026-27', 1)).toBe('JC-2026-27-00001')
    expect(formatJobCardId('FY 2026-27', 42)).toBe('JC-2026-27-00042')
    expect(formatJobCardId('FY 2026-27', 99999)).toBe('JC-2026-27-99999')
    // A shop past 99,999 documents in one year gets a longer id rather than a wrapped or
    // truncated one — collisions would be far worse than an extra digit.
    expect(formatJobCardId('FY 2026-27', 100000)).toBe('JC-2026-27-100000')
  })

  it('composes with the real financial-year name', () => {
    const fy = getCurrentFinancialYear(new Date(2026, 5, 1))
    expect(formatJobCardId(fy.name, 7)).toBe('JC-2026-27-00007')
  })

  it('gives each document type its own prefix', () => {
    const prefixes = cases.map(([, format]) => format('FY 2026-27', 1).split('-')[0])
    expect(new Set(prefixes).size).toBe(prefixes.length)
  })
})

describe('formatReceiptId', () => {
  it('is day-and-month scoped, not financial-year scoped', () => {
    // RCP-2609-00001 for 26 September — a receipt is a counter slip, looked up by the day it
    // was written rather than by book year.
    expect(formatReceiptId(new Date(2026, 8, 26), 1)).toBe('RCP-2609-00001')
  })

  it('zero-pads both the day and the month', () => {
    expect(formatReceiptId(new Date(2026, 0, 5), 3)).toBe('RCP-0501-00003')
  })

  it('pads the sequence to five digits', () => {
    expect(formatReceiptId(new Date(2026, 8, 26), 250)).toBe('RCP-2609-00250')
  })

  it('uses the local date rather than UTC', () => {
    // A receipt written at 11:30pm must carry that day's number, not tomorrow's.
    expect(formatReceiptId(new Date(2026, 8, 26, 23, 30), 1)).toBe('RCP-2609-00001')
  })
})
