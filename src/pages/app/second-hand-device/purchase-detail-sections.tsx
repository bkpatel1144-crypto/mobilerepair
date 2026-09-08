import { Smartphone, IdCard, ShoppingCart, Wallet } from 'lucide-react'
import type { DetailSection, TimelineEvent } from '@/components/shared/detail-drawer'
import { PatternLockPreview } from '@/components/shared/pattern-lock'
import { formatTimestamp } from '@/lib/utils'
import type { SecondHandPurchaseWithId } from '@/hooks/use-second-hand-purchases'
import type { SecondHandSaleWithId } from '@/hooks/use-second-hand-sales'
import type { BadgeTone } from '@/lib/status-tone'
import type { TFunction } from 'i18next'

/** Shared right-drawer sections for a Second Hand Device Purchase — reused, unstyled-per-page,
 * across Device Purchase / Device Stock / Device Sale / Purchase Register / Sale Register
 * (`preview (41)`/`(43)`/`(45)`/`(47)` all show the exact same DEVICE/SELLER/PURCHASE block; only
 * the action-buttons row above it differs per page). */
export function purchaseDetailSections(
  p: SecondHandPurchaseWithId,
  t: TFunction,
  sale?: SecondHandSaleWithId
): DetailSection[] {
  const sections: DetailSection[] = [
    {
      title: t('pages.secondHandDevice.purchaseDetailSections.device'),
      icon: Smartphone,
      rows: [
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.type'),
          value: p.deviceTypeName ?? '—',
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.brand'),
          value: p.brandName ?? '—',
        },
        { label: t('pages.secondHandDevice.purchaseDetailSections.model'), value: p.model ?? '—' },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.purchasedOn'),
          value: formatTimestamp(p.purchaseDate, false),
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.imeiSerial'),
          value: p.imei ?? '—',
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.condition'),
          value: `Grade ${p.conditionGrade}`,
        },
        ...(p.devicePinPattern
          ? [
              {
                label: t('pages.secondHandDevice.purchaseDetailSections.pinPattern'),
                value: <PatternLockPreview value={p.devicePinPattern} />,
              },
            ]
          : []),
      ],
    },
    {
      title: t('pages.secondHandDevice.purchaseDetailSections.sellerIdVerification'),
      icon: IdCard,
      rows: [
        { label: t('pages.secondHandDevice.purchaseDetailSections.seller'), value: p.sellerName },
      ],
    },
    {
      title: sale
        ? 'PURCHASE'
        : p.status === 'inStock' || p.status === 'inRefurb'
          ? 'PRICING'
          : 'PURCHASE',
      icon: ShoppingCart,
      rows: [
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.purchasePrice'),
          value: `₹${p.purchasePrice}`,
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.paymentMode'),
          value: p.paymentMode.toUpperCase(),
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.purchasedBy'),
          value: p.purchasedByName,
        },
      ],
    },
  ]

  if (sale) {
    sections.push({
      title: t('pages.secondHandDevice.purchaseDetailSections.sale'),
      icon: Wallet,
      rows: [
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.saleInvoice'),
          value: sale.saleNumber,
        },
        { label: t('pages.secondHandDevice.purchaseDetailSections.buyer'), value: sale.buyerName },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.salePrice'),
          value: `₹${sale.salePrice}`,
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.warranty'),
          value: `${sale.warrantyDays} days`,
        },
        {
          label: t('pages.secondHandDevice.purchaseDetailSections.profit'),
          value: `₹${sale.profit}`,
          tone: sale.profit >= 0 ? 'success' : 'danger',
        },
      ],
    })
  }

  return sections
}

export function purchaseTimeline(
  p: SecondHandPurchaseWithId,
  t: TFunction,
  sale?: SecondHandSaleWithId
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      title: t('pages.secondHandDevice.purchaseDetailSections.purchased'),
      description: `₹${p.purchasePrice} · ${p.purchaseNumber}`,
      timestamp: formatTimestamp(p.createdAt),
    },
  ]
  if (sale) {
    events.push({
      title: t('pages.secondHandDevice.purchaseDetailSections.sold'),
      description: `₹${sale.salePrice} · ${sale.saleNumber}`,
      timestamp: formatTimestamp(sale.createdAt),
    })
  }
  if (p.status === 'returnedToSeller') {
    events.push({
      title: t('pages.secondHandDevice.purchaseDetailSections.returnedToSeller'),
      timestamp: formatTimestamp(p.updatedAt),
    })
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
