import { describe, expect, it } from 'vitest'
import { billTotals } from './use-edit-bill'

/**
 * The arithmetic behind Edit Bill, tested away from Firestore because it decides what a customer
 * owes and what the shop hands back.
 *
 * The case that matters most is the last one: this whole screen exists because parts could be
 * added to a billed job without the bill following, so the assertion that `partsTotal` and
 * `total` move together is the point of the exercise.
 */

const part = (rate: number, qty: number) => ({ rate, qty })

describe('billTotals', () => {
  it('adds the parts, the service charge, and takes off the discount', () => {
    const t = billTotals({
      parts: [part(12, 1), part(23, 1), part(210, 1)],
      serviceCharge: 50,
      discount: 20,
      paidAmount: 0,
    })
    expect(t.partsTotal).toBe(245)
    expect(t.total).toBe(275)
    expect(t.balanceDue).toBe(275)
    expect(t.refundDue).toBe(0)
  })

  it('multiplies rate by quantity rather than counting rows', () => {
    expect(billTotals({ parts: [part(100, 3)], serviceCharge: 0, discount: 0, paidAmount: 0 }).total).toBe(300)
  })

  it('owes a refund when the bill drops below what was paid', () => {
    // The client's own screenshot: ₹250 taken as an advance, the bill edited down to ₹245.
    const t = billTotals({ parts: [part(245, 1)], serviceCharge: 0, discount: 0, paidAmount: 250 })
    expect(t.total).toBe(245)
    expect(t.refundDue).toBe(5)
    expect(t.balanceDue).toBe(0)
  })

  it('never owes a balance and a refund at the same time', () => {
    for (const paid of [0, 100, 245, 250, 1000]) {
      const t = billTotals({ parts: [part(245, 1)], serviceCharge: 0, discount: 0, paidAmount: paid })
      expect(t.balanceDue === 0 || t.refundDue === 0, `paid ${paid}`).toBe(true)
    }
  })

  it('clamps a discount larger than the bill instead of going negative', () => {
    // A negative total would put a refund on the books that nobody agreed to.
    const t = billTotals({ parts: [part(100, 1)], serviceCharge: 0, discount: 500, paidAmount: 0 })
    expect(t.total).toBe(0)
    expect(t.refundDue).toBe(0)
  })

  it('is zero for a bill with nothing on it', () => {
    const t = billTotals({ parts: [], serviceCharge: 0, discount: 0, paidAmount: 0 })
    expect(t.partsTotal).toBe(0)
    expect(t.total).toBe(0)
  })

  it('keeps the parts total and the bill total in step — the bug this screen exists to fix', () => {
    // Adding a part used to raise `partsCost` and leave `finalAmount` alone. Here the two are
    // derived from the same list in the same call, so they cannot disagree.
    const before = billTotals({ parts: [part(245, 1)], serviceCharge: 0, discount: 0, paidAmount: 245 })
    const after = billTotals({
      parts: [part(245, 1), part(500, 1)],
      serviceCharge: 0,
      discount: 0,
      paidAmount: 245,
    })
    expect(after.partsTotal - before.partsTotal).toBe(500)
    expect(after.total - before.total).toBe(500)
    expect(after.balanceDue).toBe(500)
  })
})
