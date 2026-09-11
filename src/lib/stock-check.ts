import type { StockRow } from '@/hooks/use-stock'

/**
 * Whether there is enough of a part to fit it.
 *
 * Nothing checked this before: a technician could fit five screens when one was ever bought, and
 * the only consequence was a negative number on a page nobody had open. Stock was a report, not
 * a control.
 *
 * Pure, because the rule is the part that has to be right — particularly the distinction between
 * "not enough" and "not tracked", which are opposite answers and were easy to conflate.
 */

export interface StockPosition {
  onHand: number
  reorderPoint: number
  state: 'out' | 'low' | 'ok'
}

export function stockByItemId(rows: StockRow[]): Map<string, StockPosition> {
  return new Map(
    rows.map((r) => [
      r.item.id,
      { onHand: r.onHand, reorderPoint: r.reorderPoint, state: r.state },
    ])
  )
}

export interface FitCheck {
  /** The fit exceeds what is on hand. */
  blocked: boolean
  /** How many more are needed than exist. `0` when nothing is short. */
  shortfall: number
  /** No stock opinion exists for this item — a service, or an item nobody asked to track. */
  untracked: boolean
  onHand: number
}

/**
 * Can `qty` of this item be fitted?
 *
 * An item with no position is **not** blocked. `useStock` only tracks items whose `stockTracked`
 * is set, so an absent position means a service or a part the shop deliberately does not count —
 * refusing those would block most of the catalogue on a rule nobody asked for. It is the one
 * case where saying nothing is the correct answer.
 */
export function fitCheck(position: StockPosition | undefined, qty: number): FitCheck {
  if (!position) return { blocked: false, shortfall: 0, untracked: true, onHand: 0 }
  const shortfall = Math.max(0, qty - position.onHand)
  return { blocked: shortfall > 0, shortfall, untracked: false, onHand: position.onHand }
}

/** The short line shown beside a part in the picker — the number is needed while choosing, not
 *  on a separate screen afterwards. */
export function stockHelperText(
  position: StockPosition | undefined,
  labels: { inStock: (n: number) => string; outOfStock: string; low: (n: number) => string }
): string | undefined {
  if (!position) return undefined
  if (position.onHand <= 0) return labels.outOfStock
  if (position.state === 'low') return labels.low(position.onHand)
  return labels.inStock(position.onHand)
}

/**
 * The fit check for a job whose parts are being *edited* rather than added to.
 *
 * `useStock` derives on-hand as purchased minus everything every job has consumed, so the parts
 * already saved on this job are **already subtracted**. Comparing a draft against that number
 * directly would count them twice and refuse an edit that changes nothing — so what this job
 * already holds is added back before the comparison.
 *
 * Adding a brand-new part on the job card is the `alreadyOnJob = 0` case of the same rule.
 */
export function fitCheckForDraft(
  position: StockPosition | undefined,
  draftQty: number,
  alreadyOnJob: number
): FitCheck {
  if (!position) return { blocked: false, shortfall: 0, untracked: true, onHand: 0 }
  const available = position.onHand + alreadyOnJob
  const shortfall = Math.max(0, draftQty - available)
  return { blocked: shortfall > 0, shortfall, untracked: false, onHand: available }
}

/** Quantities per item id, for either the saved parts or the draft. */
export function qtyByItemId(parts: { itemId: string | null; qty: number }[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const part of parts) {
    if (!part.itemId) continue
    out.set(part.itemId, (out.get(part.itemId) ?? 0) + part.qty)
  }
  return out
}

/** Every item in the draft that is over what the shop can cover, so a bill edit can name them
 *  all at once rather than one refusal at a time. */
export function draftShortfalls(
  positions: Map<string, StockPosition>,
  draft: { itemId: string | null; itemName: string; qty: number }[],
  saved: { itemId: string | null; qty: number }[]
): { itemId: string; itemName: string; shortfall: number; onHand: number }[] {
  const draftQty = qtyByItemId(draft)
  const savedQty = qtyByItemId(saved)
  const names = new Map(draft.filter((p) => p.itemId).map((p) => [p.itemId!, p.itemName]))
  const out: { itemId: string; itemName: string; shortfall: number; onHand: number }[] = []
  for (const [itemId, qty] of draftQty) {
    const check = fitCheckForDraft(positions.get(itemId), qty, savedQty.get(itemId) ?? 0)
    if (check.blocked) {
      out.push({
        itemId,
        itemName: names.get(itemId) ?? itemId,
        shortfall: check.shortfall,
        onHand: check.onHand,
      })
    }
  }
  return out
}
