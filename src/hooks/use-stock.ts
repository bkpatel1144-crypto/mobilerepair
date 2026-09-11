import { useMemo } from 'react'
import { useItems, type ItemWithId } from '@/hooks/use-items'
import { usePurchases } from '@/hooks/use-purchases'
import { useJobCards } from '@/hooks/use-job-cards'

export interface StockRow {
  item: ItemWithId
  /** Everything bought on an active purchase. */
  purchased: number
  /** Everything fitted to a job card. */
  consumed: number
  onHand: number
  reorderPoint: number
  /** What the remaining quantity cost, at the item's own purchase price. */
  value: number
  state: 'out' | 'low' | 'ok'
}

/**
 * Inventory > Stock — what the shop is holding, derived rather than stored.
 *
 * There is no stock ledger in this app and this does not invent one. General Purchase's own
 * subtitle says it "feeds inventory stock", and a job card records the parts it fitted, so
 * on-hand is exactly what came in on a purchase minus what went out on a job. Deriving it means
 * the number cannot drift from the documents it is made of — a stored counter would need every
 * one of those writes to remember to touch it, and one that forgot would be wrong forever.
 *
 * Cancelled purchases are left out: the entry is kept for the record but those parts never
 * arrived.
 *
 * Only stock-tracked items appear. An item nobody asked to track has no meaningful on-hand, and
 * showing a confident 0 against it would be worse than not listing it.
 */
export function useStock() {
  const items = useItems()
  const purchases = usePurchases()
  const jobs = useJobCards()

  const rows = useMemo<StockRow[]>(() => {
    const tracked = (items.data ?? []).filter((i) => i.stockTracked)
    if (tracked.length === 0) return []

    const purchased = new Map<string, number>()
    for (const p of purchases.data ?? []) {
      if (p.status !== 'active') continue
      for (const l of p.lines) {
        if (!l.itemId) continue
        purchased.set(l.itemId, (purchased.get(l.itemId) ?? 0) + l.qty)
      }
    }

    const consumed = new Map<string, number>()
    for (const j of jobs.data ?? []) {
      if (j.status === 'cancelled') continue
      for (const part of j.partsUsed) {
        if (!part.itemId) continue
        consumed.set(part.itemId, (consumed.get(part.itemId) ?? 0) + part.qty)
      }
    }

    return tracked.map((item) => {
      const inQty = purchased.get(item.id) ?? 0
      const outQty = consumed.get(item.id) ?? 0
      const onHand = inQty - outQty
      const reorderPoint = item.reorder?.reorderPoint ?? 0
      return {
        item,
        purchased: inQty,
        consumed: outQty,
        onHand,
        reorderPoint,
        value: Math.max(0, onHand) * (item.purchasePrice ?? 0),
        state: onHand <= 0 ? 'out' : reorderPoint > 0 && onHand <= reorderPoint ? 'low' : 'ok',
      }
    })
  }, [items.data, purchases.data, jobs.data])

  return {
    rows,
    isLoading: items.isLoading || purchases.isLoading || jobs.isLoading,
    error: items.error ?? purchases.error ?? jobs.error,
    refetch: () => {
      void items.refetch()
      void purchases.refetch()
      void jobs.refetch()
    },
  }
}

export function stockSummary(rows: StockRow[]) {
  return {
    tracked: rows.length,
    inStock: rows.filter((r) => r.state === 'ok').length,
    low: rows.filter((r) => r.state === 'low').length,
    out: rows.filter((r) => r.state === 'out').length,
    value: rows.reduce((sum, r) => sum + r.value, 0),
  }
}
