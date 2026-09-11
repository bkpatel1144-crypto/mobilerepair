import { describe, expect, it } from 'vitest'
import { gstConfigFor, splitGst } from './gst'

/**
 * Tax arithmetic, tested away from any screen, because it decides what a customer is charged
 * and what the shop owes — and because the default has to be "no tax at all".
 */

const registered = { gstRegistration: 'Regular' as const }
const composition = { gstRegistration: 'Composition' as const }
const unregistered = { gstRegistration: 'Unregistered' as const }

describe('a shop that is not GST registered is charged nothing', () => {
  it('is off by default, which is what a new company gets', () => {
    expect(gstConfigFor(unregistered).enabled).toBe(false)
    expect(gstConfigFor(null).enabled).toBe(false)
    expect(gstConfigFor(undefined).enabled).toBe(false)
  })

  it('leaves the amount exactly as it was', () => {
    const out = splitGst(245, gstConfigFor(unregistered))
    expect(out).toEqual({ taxable: 245, cgst: 0, sgst: 0, tax: 0, gross: 245 })
  })

  it('is off for a composition dealer too', () => {
    // Registered, but barred from collecting GST from the customer — they pay it out of their
    // own turnover. A tax line on their invoice would be one the law says must not be there.
    expect(gstConfigFor(composition).enabled).toBe(false)
    expect(splitGst(245, gstConfigFor(composition)).tax).toBe(0)
  })
})

describe('inclusive pricing — what a walk-in shop quotes', () => {
  const config = gstConfigFor(registered)

  it('is the default for a registered shop', () => {
    expect(config).toEqual({ enabled: true, inclusive: true, rate: 18 })
  })

  it('takes the tax out of the price rather than adding to it', () => {
    // ₹236 all-in at 18% is ₹200 of work and ₹36 of tax.
    const out = splitGst(236, config)
    expect(out.gross).toBe(236)
    expect(out.taxable).toBe(200)
    expect(out.tax).toBe(36)
  })

  it('never charges the customer more than the price quoted', () => {
    for (const amount of [1, 99, 245, 1000, 12345]) {
      expect(splitGst(amount, config).gross).toBe(amount)
    }
  })
})

describe('exclusive pricing — tax on top', () => {
  const config = gstConfigFor({ ...registered, pricesIncludeGst: false })

  it('adds the tax to the price', () => {
    const out = splitGst(200, config)
    expect(out.taxable).toBe(200)
    expect(out.tax).toBe(36)
    expect(out.gross).toBe(236)
  })
})

describe('CGST and SGST always add back up to the tax line', () => {
  it('holds even where half a paise is lost', () => {
    const config = gstConfigFor(registered)
    // Rounding each half separately is what breaks this, and a one-paise disagreement between
    // the split and the total printed above it is exactly what an accountant queries.
    for (const amount of [1, 7, 13, 99.99, 245, 333.33, 1000.01, 8888.88]) {
      const out = splitGst(amount, config)
      expect(Math.round((out.cgst + out.sgst) * 100) / 100, `₹${amount}`).toBe(out.tax)
    }
  })

  it('splits evenly when it can', () => {
    const out = splitGst(236, gstConfigFor(registered))
    expect(out.cgst).toBe(18)
    expect(out.sgst).toBe(18)
  })
})

describe('nothing in, nothing out', () => {
  it('handles zero and negatives without inventing tax', () => {
    const config = gstConfigFor(registered)
    expect(splitGst(0, config)).toEqual({ taxable: 0, cgst: 0, sgst: 0, tax: 0, gross: 0 })
    expect(splitGst(-50, config).tax).toBe(0)
  })
})
