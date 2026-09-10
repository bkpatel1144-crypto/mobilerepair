/**
 * Generates `src/lib/masters-seed-data.ts` from the reference exports in `data/`.
 *
 *   node tools/data/build-masters-seed.cjs
 *
 * The seed used to be hand-written, which is how it drifted: it carried 10 of the reference's 27
 * categories, no items at all, none of the descriptions, and its own code for Repair Services
 * (`REPAIR_SERVICES` where the reference says `SERVICES`) — so an item's category lookup could
 * never have matched. Deriving it from the export makes that class of drift impossible, and means
 * dropping in the remaining pages of the export is the whole of the work next time.
 *
 * Two things are deliberately *not* copied verbatim, both decided with the client:
 *
 *  - `level` and `path` are recomputed from the parent. Every record in the export carries
 *    `level: 0` and a bare `path`, including the eight whose `parentCategory` is Spare Parts,
 *    which is why the reference UI shows "Level: Root" beside "Under: Spare Parts". A
 *    sub-category labelled Root is a defect, not a spec.
 *  - Mongo `_id`s are dropped. Firestore mints its own ids, and the seed links records by code.
 *
 * Everything else — descriptions (Marathi and all), icons, colours, display order, tracking
 * settings, tax categories, LOB config, reorder points — is carried through unchanged.
 */
const fs = require('node:fs')
const path = require('node:path')

const DATA_DIR = 'data'
const OUT = 'src/lib/masters-seed-data.ts'

/** Reads one paginated reference export, returning its rows and its declared total. */
function readExport(name) {
  const file = path.join(DATA_DIR, `${name}.json`)
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
  const rows = parsed.data ?? []
  const total = parsed.pagination?.total ?? rows.length
  return { rows, total, file }
}

const categoriesExport = readExport('itemcatagory')
const itemsExport = readExport('itemmaster')

/**
 * The export's `categoryType` onto `ItemCategoryType`.
 *
 * Was `raw === 'SERVICE' ? 'Service' : 'Raw Material'`, which was wrong twice over once the full
 * export arrived: the export says `SERVICES`, not `SERVICE`, so Repair Services fell through to
 * Raw Material; and `FINISHED_GOODS` and `CONSUMABLES` exist, so Accessories, Mobile Phones and
 * Repair Consumables — seventeen of the twenty-seven categories — were all typed Raw Material.
 */
const CATEGORY_TYPES = {
  RAW_MATERIAL: 'Raw Material',
  FINISHED_GOODS: 'Finished Goods',
  CONSUMABLES: 'Consumables',
  SERVICES: 'Service',
}

function categoryType(raw) {
  const mapped = CATEGORY_TYPES[raw]
  if (!mapped) throw new Error(`unknown categoryType ${raw} - add it to CATEGORY_TYPES`)
  return mapped
}

function parentCodeOf(row) {
  const parent = row.parentCategory
  if (!parent) return null
  return typeof parent === 'object' ? (parent.categoryCode ?? null) : parent
}

// ---- categories -----------------------------------------------------------------------------
const byCode = new Map(categoriesExport.rows.map((r) => [r.categoryCode, r]))

/** Walks up `parentCategory` to get the real depth and ancestry, which the export lacks. */
function lineage(code, seen = new Set()) {
  if (seen.has(code)) throw new Error(`category cycle at ${code}`)
  seen.add(code)
  const row = byCode.get(code)
  const parent = row ? parentCodeOf(row) : null
  if (!parent || !byCode.has(parent)) return [code]
  return [...lineage(parent, seen), code]
}

const categories = categoriesExport.rows.map((row) => {
  const chain = lineage(row.categoryCode)
  return {
    code: row.categoryCode,
    name: row.categoryName,
    type: categoryType(row.categoryType),
    parentCode: parentCodeOf(row),
    description: row.description ?? null,
    icon: row.icon ?? null,
    color: row.color ?? null,
    displayOrder: row.displayOrder ?? 0,
    applicableAttributes: row.applicableAttributes ?? [],
    settings: {
      enableBatchTracking: row.settings?.enableBatchTracking ?? false,
      enableExpiryTracking: row.settings?.enableExpiryTracking ?? false,
      enableSerialTracking: row.settings?.enableSerialTracking ?? false,
      defaultShelfLifeDays: row.settings?.defaultShelfLifeDays ?? null,
    },
    isSystem: row.isSystem ?? false,
    level: chain.length - 1,
    path: chain.join('/'),
  }
})

// ---- items ----------------------------------------------------------------------------------
/** `GST_18` -> 18. The export states the band; the app also needs the number to compute tax. */
function gstPercentFrom(taxCategory) {
  const m = /^GST_(\d+)$/.exec(taxCategory ?? '')
  return m ? Number(m[1]) : 0
}

/** `SERVICE` -> `service`. The export's `itemType`, mapped onto this app's own `ItemType`.
 *  `RAW_MATERIAL` is a part; anything else that is not a service is a finished product. */
function itemTypeOf(raw) {
  if (raw === 'SERVICE') return 'service'
  if (raw === 'RAW_MATERIAL') return 'part'
  return 'product'
}

/** The export's `itemNature`, mapped onto `ItemNature` — which has two values, not three: this
 *  app distinguishes a service from a good, and leaves raw-material vs finished-good to `type`. */
function itemNatureOf(raw) {
  return raw === 'SERVICE' ? 'Service' : 'Goods'
}

/** A UOM reference as the item stores it, denormalised exactly as the export does. */
function uomRefOf(node) {
  if (!node) return null
  return {
    code: node.uomCode ?? null,
    name: node.uomName ?? null,
    symbol: node.symbol ?? null,
  }
}

const items = itemsExport.rows.map((row) => ({
  itemCode: row.itemCode,
  name: row.itemName,
  description: row.description ?? null,
  type: itemTypeOf(row.itemType),
  nature: itemNatureOf(row.itemNature),
  categoryCode: row.categoryId?.categoryCode ?? null,
  subCategoryCode: row.subCategoryId?.categoryCode ?? null,
  primaryUom: uomRefOf(row.primaryUOMId),
  purchaseUom: uomRefOf(row.purchaseUOMId),
  salesUom: uomRefOf(row.salesUOMId),
  alternateUoms: row.alternateUOMs ?? [],
  taxCategory: row.taxCategory ?? 'GST_0',
  gstPercent: gstPercentFrom(row.taxCategory),
  gstRates: {
    cgst: row.gstRates?.cgst ?? 0,
    sgst: row.gstRates?.sgst ?? 0,
    igst: row.gstRates?.igst ?? 0,
    cess: row.gstRates?.cess ?? 0,
  },
  sellingPrice: row.defaultSellingPrice ?? 0,
  purchasePrice: row.defaultPurchasePrice ?? 0,
  mrp: row.mrp ?? 0,
  stockTracked: row.stockTracked ?? false,
  trackingType: row.trackingType ?? 'NONE',
  shelfLifeDays: row.shelfLifeDays ?? null,
  reorder: {
    minStock: row.reorderSettings?.minStock ?? 0,
    reorderPoint: row.reorderSettings?.reorderPoint ?? 0,
    reorderQty: row.reorderSettings?.reorderQty ?? 0,
    maxStock: row.reorderSettings?.maxStock ?? 0,
  },
  hasVariants: row.hasVariants ?? false,
  variantAttributes: row.variantAttributes ?? [],
  images: row.images ?? [],
  lob: {
    sales: {
      isActive: row.lobConfig?.sales?.isActive ?? false,
      allowDiscount: row.lobConfig?.sales?.allowDiscount ?? false,
      maxDiscountPercent: row.lobConfig?.sales?.maxDiscountPercent ?? 0,
    },
    purchase: {
      isActive: row.lobConfig?.purchase?.isActive ?? false,
      leadTimeDays: row.lobConfig?.purchase?.leadTimeDays ?? 0,
    },
    production: {
      isActive: row.lobConfig?.production?.isActive ?? false,
      isBomItem: row.lobConfig?.production?.isBOMItem ?? false,
    },
    // `pos` in the export; this app calls the counter-sale line of business Service POS.
    servicePos: { isActive: row.lobConfig?.pos?.isActive ?? false },
    ecommerce: { isActive: row.lobConfig?.ecommerce?.isActive ?? false },
  },
  isSystem: row.isSystem ?? false,
}))

const header = `// GENERATED by tools/data/build-masters-seed.cjs — do not edit by hand.
//
// Source: ${categoriesExport.file} (${categories.length} of ${categoriesExport.total} categories)
//         ${itemsExport.file} (${items.length} of ${itemsExport.total} items)
//
// The exports are paginated and only page 1 of each is present, so this covers
// ${categories.length}/${categoriesExport.total} categories and ${items.length}/${itemsExport.total} items. Drop the remaining pages into
// data/ and re-run the generator; \`masters-seed-data.test.ts\` asserts the counts match, so the
// suite fails until the seed and the export agree.
//
// \`level\` and \`path\` are recomputed from \`parentCategory\` rather than copied: every record in
// the export carries \`level: 0\` and a bare path, including the ones with a parent.

import type {
  ItemAlternateUom,
  ItemCategorySettings,
  ItemCategoryType,
  ItemGstRates,
  ItemLobConfig,
  ItemNature,
  ItemReorderSettings,
  ItemType,
  TaxCategory,
  TrackingType,
} from '@/types/firestore'

export interface SeedCategory {
  code: string
  name: string
  type: ItemCategoryType
  parentCode: string | null
  description: string | null
  icon: string | null
  color: string | null
  displayOrder: number
  applicableAttributes: string[]
  settings: ItemCategorySettings
  isSystem: boolean
  level: number
  path: string
}

export interface SeedItem {
  itemCode: string
  name: string
  description: string | null
  type: ItemType
  nature: ItemNature
  categoryCode: string | null
  subCategoryCode: string | null
  primaryUom: SeedUomRef | null
  purchaseUom: SeedUomRef | null
  salesUom: SeedUomRef | null
  alternateUoms: ItemAlternateUom[]
  taxCategory: TaxCategory
  gstPercent: number
  gstRates: ItemGstRates
  sellingPrice: number
  purchasePrice: number
  mrp: number
  stockTracked: boolean
  trackingType: TrackingType
  shelfLifeDays: number | null
  reorder: ItemReorderSettings
  hasVariants: boolean
  variantAttributes: string[]
  images: string[]
  lob: ItemLobConfig
  isSystem: boolean
}

/** The export embeds the code, name and symbol but not an id this app can use - its Mongo _id
 *  belongs to the reference system. The seeder fills the id in from the UOM it writes. */
export interface SeedUomRef {
  code: string
  name: string
  symbol: string
}

/** Totals declared by the export's own pagination, asserted in the test. */
export const REFERENCE_TOTALS = {
  categories: ${categoriesExport.total},
  items: ${itemsExport.total},
} as const

export const SEED_CATEGORIES: SeedCategory[] = ${JSON.stringify(categories, null, 2)}

export const SEED_ITEMS: SeedItem[] = ${JSON.stringify(items, null, 2)}
`

fs.writeFileSync(OUT, header)
console.log(
  `${OUT}: ${categories.length}/${categoriesExport.total} categories, ${items.length}/${itemsExport.total} items`
)
