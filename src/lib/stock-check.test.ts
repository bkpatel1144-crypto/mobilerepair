import { describe, expect, it } from 'vitest'
import {
  draftShortfalls,
  fitCheck,
  fitCheckForDraft,
  qtyByItemId,
  stockByItemId,
  stockHelperText,
  type StockPosition,
} from './stock-check'
import type { StockRow } from '@/hooks/use-stock'

const LABELS = {
  inStock: (n: number) => `${n} in stock`,
  outOfStock: 'Out of stock',
  low: (n: number) => `Only ${n} left`,
}

function position(patch: Partial<StockPosition> = {}): StockPosition {
  return { onHand: 5, reorderPoint: 0, state: 'ok', ...patch }
}

describe('fitCheck', () => {
  it('allows a fit covered by stock', () => {
    expect(fitCheck(position({ onHand: 5 }), 3)).toEqual({
      blocked: false,
      shortfall: 0,
      untracked: false,
      onHand: 5,
    })
  })

  it('allows a fit that takes the last one', () => {
    expect(fitCheck(position({ onHand: 2 }), 2).blocked).toBe(false)
  })

  it('blocks a fit that exceeds stock and names the shortfall', () => {
    expect(fitCheck(position({ onHand: 2 }), 5)).toEqual({
      blocked: true,
      shortfall: 3,
      untracked: false,
      onHand: 2,
    })
  })

  it('blocks anything at all when nothing is on hand', () => {
    expect(fitCheck(position({ onHand: 0 }), 1)).toMatchObject({ blocked: true, shortfall: 1 })
  })

  // Stock already went negative before this existed; the check must still report honestly.
  it('reports the full shortfall from an already-negative position', () => {
    expect(fitCheck(position({ onHand: -2 }), 1)).toMatchObject({ blocked: true, shortfall: 3 })
  })

  // The case that matters most: an untracked item must not be blocked, or most of the catalogue
  // (every service) becomes unfittable on a rule nobody asked for.
  it('never blocks an item with no stock position', () => {
    expect(fitCheck(undefined, 99)).toEqual({
      blocked: false,
      shortfall: 0,
      untracked: true,
      onHand: 0,
    })
  })
})

describe('stockByItemId', () => {
  it('keys positions by item id', () => {
    const rows = [
      { item: { id: 'a' }, onHand: 4, reorderPoint: 2, state: 'ok' },
      { item: { id: 'b' }, onHand: 0, reorderPoint: 0, state: 'out' },
    ] as unknown as StockRow[]
    const map = stockByItemId(rows)
    expect(map.get('a')).toEqual({ onHand: 4, reorderPoint: 2, state: 'ok' })
    expect(map.get('b')?.state).toBe('out')
    expect(map.get('missing')).toBeUndefined()
  })
})

describe('stockHelperText', () => {
  it('says nothing about an untracked item rather than claiming zero', () => {
    expect(stockHelperText(undefined, LABELS)).toBeUndefined()
  })

  it('distinguishes out, low and plentiful', () => {
    expect(stockHelperText(position({ onHand: 0, state: 'out' }), LABELS)).toBe('Out of stock')
    expect(stockHelperText(position({ onHand: 1, state: 'low' }), LABELS)).toBe('Only 1 left')
    expect(stockHelperText(position({ onHand: 9, state: 'ok' }), LABELS)).toBe('9 in stock')
  })

  it('treats a negative on-hand as out, not as a negative count', () => {
    expect(stockHelperText(position({ onHand: -3, state: 'out' }), LABELS)).toBe('Out of stock')
  })
})

describe('fitCheckForDraft', () => {
  // The double-counting trap: on-hand already has this job's parts subtracted, so an unchanged
  // draft must not be refused.
  it('does not refuse an edit that changes nothing', () => {
    expect(fitCheckForDraft(position({ onHand: 0 }), 2, 2).blocked).toBe(false)
  })

  it('allows raising a line as far as the stock left over', () => {
    expect(fitCheckForDraft(position({ onHand: 3 }), 5, 2).blocked).toBe(false)
    expect(fitCheckForDraft(position({ onHand: 3 }), 6, 2)).toMatchObject({
      blocked: true,
      shortfall: 1,
    })
  })

  it('always allows lowering a line', () => {
    expect(fitCheckForDraft(position({ onHand: -4 }), 1, 5).blocked).toBe(false)
  })

  it('never blocks an untracked item', () => {
    expect(fitCheckForDraft(undefined, 99, 0)).toMatchObject({ blocked: false, untracked: true })
  })
})

describe('qtyByItemId', () => {
  it('sums repeated lines of the same item and skips loose ones', () => {
    const map = qtyByItemId([
      { itemId: 'a', qty: 2 },
      { itemId: 'a', qty: 3 },
      { itemId: null, qty: 9 },
    ])
    expect(map.get('a')).toBe(5)
    expect(map.size).toBe(1)
  })
})

describe('draftShortfalls', () => {
  const positions = new Map<string, StockPosition>([
    ['screen', { onHand: 1, reorderPoint: 0, state: 'low' }],
    ['battery', { onHand: 10, reorderPoint: 0, state: 'ok' }],
  ])

  it('names every item that is over, and nothing that is not', () => {
    const out = draftShortfalls(
      positions,
      [
        { itemId: 'screen', itemName: 'Screen', qty: 4 },
        { itemId: 'battery', itemName: 'Battery', qty: 2 },
        { itemId: 'labour', itemName: 'Labour', qty: 1 },
      ],
      []
    )
    expect(out).toEqual([{ itemId: 'screen', itemName: 'Screen', shortfall: 3, onHand: 1 }])
  })

  it('counts what the job already holds as available to it', () => {
    const out = draftShortfalls(
      positions,
      [{ itemId: 'screen', itemName: 'Screen', qty: 3 }],
      [{ itemId: 'screen', qty: 3 }]
    )
    expect(out).toEqual([])
  })

  it('sums a part split across two lines before judging it', () => {
    const out = draftShortfalls(
      positions,
      [
        { itemId: 'screen', itemName: 'Screen', qty: 1 },
        { itemId: 'screen', itemName: 'Screen', qty: 1 },
      ],
      []
    )
    expect(out).toMatchObject([{ shortfall: 1 }])
  })
})
