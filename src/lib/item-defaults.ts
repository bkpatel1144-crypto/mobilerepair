import type {
  ItemAlternateUom,
  ItemDoc,
  ItemGstRates,
  ItemLobConfig,
  ItemReorderSettings,
  ItemUomRef,
  TaxCategory,
  TrackingType,
} from '@/types/firestore'

/**
 * Fills in the fields an `items` document may not carry, so every screen can read one shape.
 *
 * The Item Master collection has been live since Phase 5 with twenty fields; the client's export
 * describes thirty-five. Rather than migrate every tenant's documents — which this app cannot do
 * safely with no server and no Admin SDK — the new fields are optional on `ItemDoc` and resolved
 * here on read. A component therefore never writes `item.gstRates?.igst ?? 0`, and an older
 * document never throws on `item.lob.sales.isActive`.
 *
 * Every default below is *derived from what the older document already says*, not invented: a
 * record that only knew `gstPercent: 18` resolves to `GST_18`, and one that only knew
 * `enabledInSales` resolves to a `lob.sales` that is active. Round-tripping an old document
 * through this and back out again changes nothing a user would see.
 */

export const TAX_CATEGORIES: { value: TaxCategory; label: string; percent: number }[] = [
  { value: 'GST_0', label: 'GST 0%', percent: 0 },
  { value: 'GST_5', label: 'GST 5%', percent: 5 },
  { value: 'GST_12', label: 'GST 12%', percent: 12 },
  { value: 'GST_18', label: 'GST 18%', percent: 18 },
  { value: 'GST_28', label: 'GST 28%', percent: 28 },
  // Both are 0%, and they are not interchangeable: an exempt supply is reported on a GSTR-1 and a
  // nil-rated one is not, so the distinction has to survive as a value rather than as a rate.
  { value: 'EXEMPT', label: 'Exempt', percent: 0 },
  { value: 'NIL_RATED', label: 'Nil rated', percent: 0 },
]

export const TRACKING_TYPES: { value: TrackingType; label: string }[] = [
  { value: 'NONE', label: 'No tracking' },
  { value: 'BATCH', label: 'Batch / Lot' },
  { value: 'SERIAL', label: 'Serial number' },
  { value: 'BATCH_SERIAL', label: 'Batch and serial' },
]

/** `GST_18` -> 18. Unknown or zero-rated categories are 0. */
export function taxPercentOf(category: TaxCategory): number {
  return TAX_CATEGORIES.find((c) => c.value === category)?.percent ?? 0
}

/** 18 -> `GST_18`, for a document written before `taxCategory` existed. A rate that is not a slab
 *  (someone typed 7) falls back to `GST_0` rather than inventing a `GST_7` the reference has no
 *  concept of — the numeric `gstPercent` is still carried alongside, so nothing is lost. */
export function taxCategoryOf(percent: number): TaxCategory {
  return (
    TAX_CATEGORIES.find((c) => c.percent === percent && c.value.startsWith('GST_'))?.value ??
    'GST_0'
  )
}

/** The unit an item defaults to. Matches the export's own `NOS / Numbers / nos`. */
export const DEFAULT_UOM: ItemUomRef = { id: null, code: 'NOS', name: 'Numbers', symbol: 'nos' }

export function emptyGstRates(): ItemGstRates {
  return { cgst: 0, sgst: 0, igst: 0, cess: 0 }
}

export function emptyReorder(): ItemReorderSettings {
  return { minStock: 0, reorderPoint: 0, reorderQty: 0, maxStock: 0 }
}

export function defaultLob(isService: boolean): ItemLobConfig {
  return {
    sales: { isActive: true, allowDiscount: true, maxDiscountPercent: 100 },
    purchase: { isActive: !isService, leadTimeDays: 0 },
    production: { isActive: false, isBomItem: false },
    servicePos: { isActive: true },
    ecommerce: { isActive: false },
  }
}

/** An `ItemDoc` with every optional field resolved. What `useItems()` hands out. */
export interface ResolvedItem extends ItemDoc {
  subCategoryId: string | null
  subCategoryName: string | null
  primaryUom: ItemUomRef
  purchaseUom: ItemUomRef | null
  salesUom: ItemUomRef | null
  alternateUoms: ItemAlternateUom[]
  taxCategory: TaxCategory
  gstRates: ItemGstRates
  trackingType: TrackingType
  shelfLifeDays: number | null
  reorder: ItemReorderSettings
  hasVariants: boolean
  variantAttributes: string[]
  images: string[]
  lob: ItemLobConfig
  isSystem: boolean
}

export function resolveItem<T extends ItemDoc>(raw: T): T & ResolvedItem {
  const isService = raw.type === 'service'
  const symbol = raw.uom || DEFAULT_UOM.symbol
  return {
    ...raw,
    subCategoryId: raw.subCategoryId ?? null,
    subCategoryName: raw.subCategoryName ?? null,
    primaryUom:
      raw.primaryUom ??
      // Reconstructed from the one string an older document kept. `code` is the symbol upper-cased
      // because that is exactly the relationship the export shows (`nos` -> `NOS`).
      (symbol === DEFAULT_UOM.symbol
        ? DEFAULT_UOM
        : { id: null, code: symbol.toUpperCase(), name: symbol, symbol }),
    purchaseUom: raw.purchaseUom ?? null,
    salesUom: raw.salesUom ?? null,
    alternateUoms: raw.alternateUoms ?? [],
    taxCategory: raw.taxCategory ?? taxCategoryOf(raw.gstPercent),
    gstRates: raw.gstRates ?? {
      cgst: raw.cgstPercent ?? 0,
      sgst: raw.sgstPercent ?? 0,
      // An older document has no split, only a headline rate. Inter-state is the one case that
      // rate maps to on its own, so it goes to `igst` and the intra-state halves stay as stored.
      igst: raw.gstPercent ?? 0,
      cess: 0,
    },
    trackingType: raw.trackingType ?? 'NONE',
    shelfLifeDays: raw.shelfLifeDays ?? null,
    reorder: raw.reorder ?? emptyReorder(),
    hasVariants: raw.hasVariants ?? false,
    variantAttributes: raw.variantAttributes ?? [],
    images: raw.images ?? [],
    lob: raw.lob ?? {
      sales: {
        isActive: raw.enabledInSales,
        allowDiscount: true,
        maxDiscountPercent: 100,
      },
      purchase: { isActive: raw.enabledInPurchase, leadTimeDays: 0 },
      production: { isActive: raw.enabledInProduction, isBomItem: false },
      servicePos: { isActive: raw.enabledInServicePos },
      ecommerce: { isActive: false },
    },
    isSystem: raw.isSystem ?? false,
    stockTracked: raw.stockTracked ?? !isService,
  }
}

/**
 * The four `enabledIn*` booleans that mirror `lob`.
 *
 * Written on every save so a screen still reading the older spelling — Job Cards' service-item
 * picker, the Service Items page — keeps agreeing with the Item Master. Dropping them instead
 * would have been a silent behaviour change on screens nobody was editing.
 */
export function legacyLobFlags(lob: ItemLobConfig) {
  return {
    enabledInSales: lob.sales.isActive,
    enabledInPurchase: lob.purchase.isActive,
    enabledInProduction: lob.production.isActive,
    enabledInServicePos: lob.servicePos.isActive,
  }
}
