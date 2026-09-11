import { describe, expect, it } from 'vitest'
import {
  addWarranty,
  jobMatchesLookup,
  jobWarrantyState,
  warrantyLinesOf,
  warrantyStartOf,
  warrantyWindow,
} from './warranty'
import type { JobCardDoc, PartUsed } from '@/types/firestore'

const NOW = new Date(2026, 8, 11) // 11 Sept 2026, local midnight
const stamp = (d: Date) => ({ toMillis: () => d.getTime() }) as unknown as JobCardDoc['deliveredAt']

describe('addWarranty', () => {
  it('adds days', () => {
    expect(addWarranty(new Date(2026, 0, 1), 30, 'days')).toEqual(new Date(2026, 0, 31))
  })

  // By calendar, not by multiplying days — "6 months" on a bill means the same date six months on.
  it('adds months by calendar', () => {
    expect(addWarranty(new Date(2026, 2, 15), 6, 'months')).toEqual(new Date(2026, 8, 15))
  })

  it('clamps a day the target month does not have', () => {
    expect(addWarranty(new Date(2026, 7, 31), 6, 'months')).toEqual(new Date(2027, 1, 28))
  })

  it('adds years, leap day included', () => {
    expect(addWarranty(new Date(2024, 1, 29), 1, 'years')).toEqual(new Date(2025, 1, 28))
  })
})

describe('warrantyWindow', () => {
  const delivered = new Date(2026, 5, 11) // 11 June 2026

  it('reports a live warranty with the days left', () => {
    const w = warrantyWindow({ value: 6, unit: 'months' }, delivered, NOW)
    expect(w.state).toBe('live')
    expect(w.expiresOn).toBe('2026-12-11')
    expect(w.daysLeft).toBe(91)
  })

  it('reports an expired one with a negative count', () => {
    const w = warrantyWindow({ value: 1, unit: 'months' }, delivered, NOW)
    expect(w.state).toBe('expired')
    expect(w.daysLeft).toBeLessThan(0)
  })

  // The last day is still covered; an off-by-one here refuses a customer a repair they are owed.
  it('counts the expiry day itself as still covered', () => {
    const w = warrantyWindow({ value: 3, unit: 'months' }, new Date(2026, 5, 11), NOW)
    expect(w.expiresOn).toBe('2026-09-11')
    expect(w.daysLeft).toBe(0)
    expect(w.state).toBe('live')
  })

  it('prefers a date typed by hand over the duration', () => {
    const w = warrantyWindow({ value: 6, unit: 'months', until: '2026-09-30' }, delivered, NOW)
    expect(w.expiresOn).toBe('2026-09-30')
  })

  // `new Date('2026-09-11')` is UTC midnight, which is the previous day west of Greenwich — that
  // made a same-day expiry read as expired.
  it('reads a stored date as a local day, not as UTC', () => {
    const w = warrantyWindow({ value: 0, unit: 'days', until: '2026-09-11' }, null, NOW)
    expect(w.daysLeft).toBe(0)
    expect(w.state).toBe('live')
  })

  it('says none when there is no warranty', () => {
    expect(warrantyWindow(null, delivered, NOW).state).toBe('none')
    expect(warrantyWindow({ value: 0, unit: 'months' }, delivered, NOW).state).toBe('none')
  })

  // A warranty that exists but has no start date is not the same as no warranty.
  it('says unknown when the clock has not started', () => {
    expect(warrantyWindow({ value: 6, unit: 'months' }, null, NOW).state).toBe('unknown')
  })
})

describe('warrantyStartOf', () => {
  it('counts from delivery when there is one', () => {
    const job = {
      deliveredAt: stamp(new Date(2026, 5, 1)),
      billGeneratedAt: stamp(new Date(2026, 4, 1)),
    } as JobCardDoc
    expect(warrantyStartOf(job)).toEqual(new Date(2026, 5, 1))
  })

  it('falls back to the bill date', () => {
    const job = { deliveredAt: null, billGeneratedAt: stamp(new Date(2026, 4, 1)) } as JobCardDoc
    expect(warrantyStartOf(job)).toEqual(new Date(2026, 4, 1))
  })

  it('is null when neither happened', () => {
    expect(warrantyStartOf({ deliveredAt: null, billGeneratedAt: null } as JobCardDoc)).toBeNull()
  })
})

describe('warrantyLinesOf', () => {
  const part = (patch: Partial<PartUsed>): PartUsed =>
    ({ id: 'p', itemId: 'i', itemName: 'Screen', rate: 100, qty: 1, ...patch }) as PartUsed

  const job = {
    deliveredAt: stamp(new Date(2026, 5, 11)),
    billGeneratedAt: null,
    billWarranty: { value: 6, unit: 'months' },
    partsUsed: [
      part({ itemName: 'Screen', warranty: { value: 1, unit: 'years', until: null } }),
      part({ itemName: 'Battery', warranty: null }),
    ],
  } as unknown as JobCardDoc

  it('lists the bill warranty and every part that carries one', () => {
    const lines = warrantyLinesOf(job, NOW, 'Whole bill')
    expect(lines.map((l) => l.label)).toEqual(['Whole bill', 'Screen'])
  })

  // Different promises. Giving a part the bill's warranty would invent coverage nobody agreed to.
  it('does not lend the bill warranty to a part that has none', () => {
    const lines = warrantyLinesOf(job, NOW, 'Whole bill')
    expect(lines.some((l) => l.part?.itemName === 'Battery')).toBe(false)
  })

  it('is empty for a job with no warranties at all', () => {
    const bare = { deliveredAt: null, billGeneratedAt: null, billWarranty: null, partsUsed: [] }
    expect(warrantyLinesOf(bare as unknown as JobCardDoc, NOW, 'Whole bill')).toEqual([])
  })
})

describe('jobWarrantyState', () => {
  const line = (state: string) => ({ label: '', part: null, window: { state } }) as never

  it('is live if anything at all is still live', () => {
    expect(jobWarrantyState([line('expired'), line('live')])).toBe('live')
  })

  it('is expired only when everything has run out', () => {
    expect(jobWarrantyState([line('expired'), line('expired')])).toBe('expired')
  })

  it('is none when there is nothing to judge', () => {
    expect(jobWarrantyState([])).toBe('none')
  })
})

describe('jobMatchesLookup', () => {
  const job = {
    jobNumber: 'JC-2026-27-00042',
    customerName: 'Rajesh Kumar',
    customerMobile: '9876500000',
    alternativeMobile: null,
    imei: '987465132065432',
    imei2: null,
    serialNo: null,
    model: 'Galaxy A15',
  } as JobCardDoc

  it('finds by job number, name and model', () => {
    expect(jobMatchesLookup(job, 'JC-2026-27-00042')).toBe(true)
    expect(jobMatchesLookup(job, 'rajesh')).toBe(true)
    expect(jobMatchesLookup(job, 'galaxy')).toBe(true)
  })

  it('finds by phone number however it is typed', () => {
    expect(jobMatchesLookup(job, '9876500000')).toBe(true)
    expect(jobMatchesLookup(job, '98765 00000')).toBe(true)
    expect(jobMatchesLookup(job, '+91-98765-00000')).toBe(true)
  })

  it('does not let a short stored number match everything', () => {
    const odd = { ...job, customerMobile: '12' } as JobCardDoc
    expect(jobMatchesLookup(odd, '9998887771')).toBe(false)
  })

  it('finds by IMEI, including a partial one', () => {
    expect(jobMatchesLookup(job, '987465132065432')).toBe(true)
    expect(jobMatchesLookup(job, '2065432')).toBe(true)
  })

  it('does not match on an empty box', () => {
    expect(jobMatchesLookup(job, '   ')).toBe(false)
  })

  it('does not match an unrelated number', () => {
    expect(jobMatchesLookup(job, '1112223333')).toBe(false)
  })
})
