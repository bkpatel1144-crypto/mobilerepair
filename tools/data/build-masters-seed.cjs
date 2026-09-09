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

/** `RAW_MATERIAL` -> `Raw Material`, matching `ItemCategoryDoc['type']`. */
function categoryType(raw) {
  return raw === 'SERVICE' ? 'Service' : 'Raw Material'
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

const items = itemsExport.rows.map((row) => ({
  itemCode: row.itemCode,
  name: row.itemName,
  description: row.description ?? null,
  type: row.itemType === 'SERVICE' ? 'Service' : 'Goods',
  nature: row.itemNature === 'SERVICE' ? 'Service' : row.itemNature === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Good',
  categoryCode: row.categoryId?.categoryCode ?? null,
  subCategoryCode: row.subCategoryId?.categoryCode ?? null,
  primaryUomCode: row.primaryUOMId?.uomCode ?? null,
  purchaseUomCode: row.purchaseUOMId?.uomCode ?? null,
  salesUomCode: row.salesUOMId?.uomCode ?? null,
  hsnCode: row.hsnCode ?? null,
  eanCode: row.eanCode ?? null,
  taxCategory: row.taxCategory ?? null,
  gstPercent: gstPercentFrom(row.taxCategory),
  cgstPercent: row.gstRates?.cgst ?? 0,
  sgstPercent: row.gstRates?.sgst ?? 0,
  igstPercent: row.gstRates?.igst ?? 0,
  cessPercent: row.gstRates?.cess ?? 0,
  sellingPrice: row.defaultSellingPrice ?? 0,
  purchasePrice: row.defaultPurchasePrice ?? 0,
  mrp: row.mrp ?? 0,
  stockTracked: row.stockTracked ?? false,
  trackingType: row.trackingType ?? 'NONE',
  shelfLifeDays: row.shelfLifeDays ?? null,
  hasVariants: row.hasVariants ?? false,
  reorder: {
    minStock: row.reorderSettings?.minStock ?? 0,
    reorderPoint: row.reorderSettings?.reorderPoint ?? 0,
    reorderQty: row.reorderSettings?.reorderQty ?? 0,
    maxStock: row.reorderSettings?.maxStock ?? 0,
  },
  lob: {
    sales: row.lobConfig?.sales?.isActive ?? false,
    purchase: row.lobConfig?.purchase?.isActive ?? false,
    production: row.lobConfig?.production?.isActive ?? false,
    servicePos: row.lobConfig?.pos?.isActive ?? false,
    ecommerce: row.lobConfig?.ecommerce?.isActive ?? false,
    allowDiscount: row.lobConfig?.sales?.allowDiscount ?? false,
    maxDiscountPercent: row.lobConfig?.sales?.maxDiscountPercent ?? 0,
    leadTimeDays: row.lobConfig?.purchase?.leadTimeDays ?? 0,
    isBomItem: row.lobConfig?.production?.isBOMItem ?? false,
  },
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

import type { ItemCategorySettings } from '@/types/firestore'

export interface SeedCategory {
  code: string
  name: string
  type: 'Raw Material' | 'Service'
  parentCode: string | null
  description: string | null
  icon: string | null
  color: string | null
  displayOrder: number
  applicableAttributes: string[]
  settings: ItemCategorySettings
  level: number
  path: string
}

export interface SeedItem {
  itemCode: string
  name: string
  description: string | null
  type: 'Goods' | 'Service'
  nature: 'Raw Material' | 'Finished Good' | 'Service'
  categoryCode: string | null
  subCategoryCode: string | null
  primaryUomCode: string | null
  purchaseUomCode: string | null
  salesUomCode: string | null
  hsnCode: string | null
  eanCode: string | null
  taxCategory: string | null
  gstPercent: number
  cgstPercent: number
  sgstPercent: number
  igstPercent: number
  cessPercent: number
  sellingPrice: number
  purchasePrice: number
  mrp: number
  stockTracked: boolean
  trackingType: string
  shelfLifeDays: number | null
  hasVariants: boolean
  reorder: { minStock: number; reorderPoint: number; reorderQty: number; maxStock: number }
  lob: {
    sales: boolean
    purchase: boolean
    production: boolean
    servicePos: boolean
    ecommerce: boolean
    allowDiscount: boolean
    maxDiscountPercent: number
    leadTimeDays: number
    isBomItem: boolean
  }
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
