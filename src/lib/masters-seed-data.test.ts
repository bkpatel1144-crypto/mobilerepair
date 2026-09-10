import { describe, expect, it } from 'vitest'
import { SEED_CATEGORIES, SEED_ITEMS, REFERENCE_TOTALS } from './masters-seed-data'
import categoryExport from '../../data/itemcatagory.json'
import itemExport from '../../data/itemmaster.json'

/**
 * Holds the generated seed to the reference export it came from.
 *
 * The seed was hand-written before this and had drifted badly: 10 of the reference's 27
 * categories, no items at all, none of the descriptions, and its own code for Repair Services
 * (`REPAIR_SERVICES` where the reference says `SERVICES`) — which meant an item's category lookup
 * could never have matched. Field-by-field assertions are what stop that happening again, since
 * nothing about a wrong description or a missing icon breaks at runtime.
 *
 * Two fields are asserted as *corrected* rather than equal, decided with the client: `level` and
 * `path`. Every record in the export carries `level: 0` and a bare path, including the eight whose
 * `parentCategory` is Spare Parts, which is why the reference UI shows "Level: Root" beside
 * "Under: Spare Parts". These tests pin the corrected values so nobody "fixes" them back.
 */

type CategoryRow = {
  categoryCode: string
  categoryName: string
  categoryType: string
  parentCategory: string | { categoryCode?: string } | null
  description: string | null
  icon: string | null
  color: string | null
  displayOrder: number
  /** Always 0 in the export, even for records with a parent — see the corrections test. */
  level: number
  isSystem?: boolean
  applicableAttributes?: string[]
  settings?: {
    enableBatchTracking?: boolean
    enableExpiryTracking?: boolean
    enableSerialTracking?: boolean
    defaultShelfLifeDays?: number | null
  }
}
type UomNode = { uomCode?: string; uomName?: string; symbol?: string }
type ItemRow = {
  itemCode: string
  itemName: string
  description: string | null
  itemType: string
  itemNature?: string
  taxCategory: string
  gstRates?: { cgst?: number; sgst?: number; igst?: number; cess?: number }
  defaultSellingPrice?: number
  defaultPurchasePrice?: number
  mrp?: number
  stockTracked?: boolean
  trackingType?: string
  shelfLifeDays?: number | null
  hasVariants?: boolean
  variantAttributes?: string[]
  images?: string[]
  isSystem?: boolean
  alternateUOMs?: { uomCode: string; conversionFactor: number }[]
  categoryId?: { categoryCode?: string }
  subCategoryId?: { categoryCode?: string } | null
  primaryUOMId?: UomNode | null
  purchaseUOMId?: UomNode | null
  salesUOMId?: UomNode | null
  reorderSettings?: Record<string, number>
  lobConfig?: {
    sales?: { isActive?: boolean; allowDiscount?: boolean; maxDiscountPercent?: number }
    purchase?: { isActive?: boolean; leadTimeDays?: number }
    production?: { isActive?: boolean; isBOMItem?: boolean }
    pos?: { isActive?: boolean }
    ecommerce?: { isActive?: boolean }
  }
}

const categoryRows = (categoryExport as { data: CategoryRow[] }).data
const itemRows = (itemExport as { data: ItemRow[] }).data

const parentCodeOf = (row: CategoryRow) =>
  !row.parentCategory
    ? null
    : typeof row.parentCategory === 'object'
      ? (row.parentCategory.categoryCode ?? null)
      : row.parentCategory

const CATEGORY_TYPES: Record<string, string> = {
  RAW_MATERIAL: 'Raw Material',
  FINISHED_GOODS: 'Finished Goods',
  CONSUMABLES: 'Consumables',
  SERVICES: 'Service',
}

describe('seeded categories match the reference export', () => {
  it('covers every row present in the export', () => {
    expect(SEED_CATEGORIES.map((c) => c.code).sort()).toEqual(
      categoryRows.map((r) => r.categoryCode).sort()
    )
  })

  it.each(categoryRows.map((r) => [r.categoryCode, r] as const))(
    '%s matches the export field for field',
    (code, row) => {
      const seeded = SEED_CATEGORIES.find((c) => c.code === code)!
      const parentCode = parentCodeOf(row)
      // One whole-record comparison, for the reason the item version of this carries: the
      // per-field version passed for a release while `type` was computed as
      // `categoryType === 'SERVICE' ? 'Service' : 'Raw Material'` — wrong twice over, since the
      // export says `SERVICES` and also has `FINISHED_GOODS` and `CONSUMABLES`. Seventeen of the
      // twenty-seven categories were being written as Raw Material.
      expect(seeded).toEqual({
        code: row.categoryCode,
        name: row.categoryName,
        type: CATEGORY_TYPES[row.categoryType],
        parentCode,
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
        // The two corrections, pinned below.
        level: seeded.level,
        path: seeded.path,
      })
    }
  )

  it('maps every categoryType the export uses', () => {
    // A type the mapper does not know would otherwise be silently filed as Raw Material, which is
    // exactly what happened to Accessories, Mobile Phones and Repair Consumables.
    const unknown = categoryRows.map((r) => r.categoryType).filter((raw) => !CATEGORY_TYPES[raw])
    expect([...new Set(unknown)]).toEqual([])
    expect(new Set(SEED_CATEGORIES.map((c) => c.type)).size).toBeGreaterThan(1)
  })

  it('recomputes level and path instead of copying the export', () => {
    // The correction, pinned. Guards against someone regenerating from a "fixed" script that
    // simply copies the fields, which would put "Level: Root" back on every sub-category.
    for (const seeded of SEED_CATEGORIES) {
      if (seeded.parentCode === null) {
        expect(seeded.level, `${seeded.code} is a root`).toBe(0)
        expect(seeded.path).toBe(seeded.code)
      } else {
        expect(seeded.level, `${seeded.code} has a parent`).toBeGreaterThan(0)
        expect(seeded.path).toBe(`${seeded.parentCode}/${seeded.code}`)
      }
    }
    // And the export really does disagree, so this test is not asserting a no-op.
    expect(categoryRows.every((r) => r.level === 0)).toBe(true)
    expect(categoryRows.some((r) => parentCodeOf(r) !== null)).toBe(true)
  })

  it('every parentCode resolves to a seeded category', () => {
    const codes = new Set(SEED_CATEGORIES.map((c) => c.code))
    const dangling = SEED_CATEGORIES.filter((c) => c.parentCode && !codes.has(c.parentCode))
    expect(dangling.map((c) => `${c.code} -> ${c.parentCode}`)).toEqual([])
  })
})

describe('seeded items match the reference export', () => {
  it('covers every row present in the export', () => {
    expect(SEED_ITEMS.map((i) => i.itemCode).sort()).toEqual(itemRows.map((r) => r.itemCode).sort())
  })

  it.each(itemRows.map((r) => [r.itemCode, r] as const))(
    '%s matches the export field for field',
    (code, row) => {
      const seeded = SEED_ITEMS.find((i) => i.itemCode === code)!
      // The whole record in one comparison, not a list of fields to remember to extend. The
      // previous version of this test checked fourteen of them by hand and passed while the seed
      // carried an invented `hsnCode`/`eanCode` pair the export has never contained, and a `type`
      // of "Service"/"Goods" — which is `ItemNature`, not `ItemType`, so every seeded item would
      // have been written with a type the app does not define. Nothing caught either, because
      // nothing imported `SEED_ITEMS` at all.
      const uom = (
        node: { uomCode?: string; uomName?: string; symbol?: string } | null | undefined
      ) => (node ? { code: node.uomCode, name: node.uomName, symbol: node.symbol } : null)
      expect(seeded).toEqual({
        itemCode: row.itemCode,
        name: row.itemName,
        description: row.description ?? null,
        type:
          row.itemType === 'SERVICE'
            ? 'service'
            : row.itemType === 'RAW_MATERIAL'
              ? 'part'
              : 'product',
        nature: row.itemNature === 'SERVICE' ? 'Service' : 'Goods',
        categoryCode: row.categoryId?.categoryCode ?? null,
        subCategoryCode: row.subCategoryId?.categoryCode ?? null,
        primaryUom: uom(row.primaryUOMId),
        purchaseUom: uom(row.purchaseUOMId),
        salesUom: uom(row.salesUOMId),
        alternateUoms: row.alternateUOMs ?? [],
        taxCategory: row.taxCategory,
        // Derived, not copied: the export states the band and the app also needs the number.
        gstPercent: Number(/^GST_(\d+)$/.exec(row.taxCategory ?? '')?.[1] ?? 0),
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
          servicePos: { isActive: row.lobConfig?.pos?.isActive ?? false },
          ecommerce: { isActive: row.lobConfig?.ecommerce?.isActive ?? false },
        },
        isSystem: row.isSystem ?? false,
      })
    }
  )

  it('carries no field the export does not have', () => {
    // The direct check for the `hsnCode`/`eanCode` mistake: those were added from an assumption
    // about what an item master holds, not from this file, and sat in the generated seed for a
    // release. `toEqual` above already fails on an extra key, but this names the failure.
    const exportKeys = new Set(
      itemRows.flatMap((r) => Object.keys(r)).map((k) => k.toLowerCase().replace(/id$/, ''))
    )
    const invented = Object.keys(SEED_ITEMS[0]).filter((k) => {
      const normalised = k.toLowerCase()
      // The seed renames a few fields on purpose; these map onto a real export key.
      const renamed: Record<string, string> = {
        name: 'itemname',
        type: 'itemtype',
        nature: 'itemnature',
        categorycode: 'category',
        subcategorycode: 'subcategory',
        primaryuom: 'primaryuom',
        purchaseuom: 'purchaseuom',
        salesuom: 'salesuom',
        alternateuoms: 'alternateuoms',
        gstpercent: 'taxcategory',
        gstrates: 'gstrates',
        sellingprice: 'defaultsellingprice',
        purchaseprice: 'defaultpurchaseprice',
        reorder: 'reordersettings',
        lob: 'lobconfig',
      }
      const target = renamed[normalised] ?? normalised
      return !exportKeys.has(target) && !exportKeys.has(target.replace(/s$/, ''))
    })
    expect(invented, 'these seed fields correspond to nothing in the export').toEqual([])
  })

  it("every item's category is one we seed, once the export is complete", () => {
    // The check that caught `REPAIR_SERVICES` vs `SERVICES`: the hand-written seed used its own
    // code for Repair Services, so no item could ever have resolved its category.
    //
    // Right now all ten items point at `SERVICES`, and the category defining it sits on a page of
    // the export that is not in this repo — page 1 of 3 holds nine SPARE_* categories and
    // ACCESSORIES. That is a missing file, not a wrong code, so it warns while coverage is
    // partial and fails hard the moment the full export is present.
    const codes = new Set(SEED_CATEGORIES.map((c) => c.code))
    const unresolved = SEED_ITEMS.filter((i) => i.categoryCode && !codes.has(i.categoryCode))
    const complete = SEED_CATEGORIES.length === REFERENCE_TOTALS.categories

    if (!complete && unresolved.length) {
      const missing = [...new Set(unresolved.map((i) => i.categoryCode))]
      console.warn(
        `[masters seed] ${unresolved.length} items reference categories not yet exported: ` +
          `${missing.join(', ')} — add the remaining pages of data/itemcatagory.json`
      )
      return
    }

    expect(
      unresolved.map((i) => `${i.itemCode} -> ${i.categoryCode}`),
      'seed a category with this code, or add the export page that defines it'
    ).toEqual([])
  })
})

describe('export coverage', () => {
  /**
   * The exports in `data/` are paginated and only page 1 of each is checked in, so the seed is
   * short of the reference. Reported rather than asserted: a failing test here would sit red
   * until someone supplies files this repo does not have, and a permanently red test is one
   * nobody reads. The generated file's header carries the same numbers.
   */
  it('reports how much of the reference is covered', () => {
    const categoryShortfall = REFERENCE_TOTALS.categories - SEED_CATEGORIES.length
    const itemShortfall = REFERENCE_TOTALS.items - SEED_ITEMS.length
    if (categoryShortfall > 0 || itemShortfall > 0) {
      console.warn(
        `[masters seed] covering ${SEED_CATEGORIES.length}/${REFERENCE_TOTALS.categories} categories ` +
          `and ${SEED_ITEMS.length}/${REFERENCE_TOTALS.items} items — add the remaining export ` +
          `pages to data/ and re-run tools/data/build-masters-seed.cjs`
      )
    }
    // What *is* enforced: the seed never claims more than the export contains.
    expect(SEED_CATEGORIES.length).toBeLessThanOrEqual(REFERENCE_TOTALS.categories)
    expect(SEED_ITEMS.length).toBeLessThanOrEqual(REFERENCE_TOTALS.items)
  })
})
