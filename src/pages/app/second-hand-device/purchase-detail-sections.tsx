import { Smartphone, IdCard, ShoppingCart, Wallet } from 'lucide-react'
import type { DetailSection, TimelineEvent } from '@/components/shared/detail-drawer'
import { PatternLockPreview } from '@/components/shared/pattern-lock'
import { formatTimestamp } from '@/lib/utils'
import type { SecondHandPurchaseWithId } from '@/hooks/use-second-hand-purchases'
import type { SecondHandSaleWithId } from '@/hooks/use-second-hand-sales'
import type { BadgeTone } from '@/lib/status-tone'

/** Shared right-drawer sections for a Second Hand Device Purchase — reused, unstyled-per-page,
 * across Device Purchase / Device Stock / Device Sale / Purchase Register / Sale Register
 * (`preview (41)`/`(43)`/`(45)`/`(47)` all show the exact same DEVICE/SELLER/PURCHASE block; only
 * the action-buttons row above it differs per page). */
export function purchaseDetailSections(p: SecondHandPurchaseWithId, sale?: SecondHandSaleWithId): DetailSection[] {
  const sections: DetailSection[] = [
    {
      title: 'DEVICE',
      icon: Smartphone,
      rows: [
        { label: 'Type', value: p.deviceTypeName ?? '—' },
        { label: 'Brand', value: p.brandName ?? '—' },
        { label: 'Model', value: p.model ?? '—' },
        { label: 'Purchased On', value: formatTimestamp(p.purchaseDate, false) },
        { label: 'IMEI / Serial', value: p.imei ?? '—' },
        { label: 'Condition', value: `Grade ${p.conditionGrade}` },
        ...(p.devicePinPattern
          ? [{ label: 'PIN / Pattern', value: <PatternLockPreview value={p.devicePinPattern} /> }]
          : []),
      ],
    },
    {
      title: 'SELLER & ID VERIFICATION',
      icon: IdCard,
      rows: [{ label: 'Seller', value: p.sellerName }],
    },
    {
      title: sale ? 'PURCHASE' : p.status === 'inStock' || p.status === 'inRefurb' ? 'PRICING' : 'PURCHASE',
      icon: ShoppingCart,
      rows: [
        { label: 'Purchase Price', value: `₹${p.purchasePrice}` },
        { label: 'Payment Mode', value: p.paymentMode.toUpperCase() },
        { label: 'Purchased By', value: p.purchasedByName },
      ],
    },
  ]

  if (sale) {
    sections.push({
      title: 'SALE',
      icon: Wallet,
      rows: [
        { label: 'Sale Invoice #', value: sale.saleNumber },
        { label: 'Buyer', value: sale.buyerName },
        { label: 'Sale Price', value: `₹${sale.salePrice}` },
        { label: 'Warranty', value: `${sale.warrantyDays} days` },
        { label: 'Profit', value: `₹${sale.profit}`, tone: sale.profit >= 0 ? 'success' : 'danger' },
      ],
    })
  }

  return sections
}

export function purchaseTimeline(p: SecondHandPurchaseWithId, sale?: SecondHandSaleWithId): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { title: 'Purchased', description: `₹${p.purchasePrice} · ${p.purchaseNumber}`, timestamp: formatTimestamp(p.createdAt) },
  ]
  if (sale) {
    events.push({ title: 'Sold', description: `₹${sale.salePrice} · ${sale.saleNumber}`, timestamp: formatTimestamp(sale.createdAt) })
  }
  if (p.status === 'returnedToSeller') {
    events.push({ title: 'Returned to Seller', timestamp: formatTimestamp(p.updatedAt) })
  }
  return events
}

export const PURCHASE_STATUS_TONE: Record<SecondHandPurchaseWithId['status'], BadgeTone> = {
  inStock: 'success',
  inRefurb: 'warning',
  sold: 'info',
  returnedToSeller: 'danger',
}

export const PURCHASE_STATUS_LABEL: Record<SecondHandPurchaseWithId['status'], string> = {
  inStock: 'In Stock',
  inRefurb: 'In Refurb',
  sold: 'Sold',
  returnedToSeller: 'Returned to Seller',
}
