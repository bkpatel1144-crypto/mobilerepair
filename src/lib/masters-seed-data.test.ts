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
  settings?: Record<string, unknown>
}
type ItemRow = {
  itemCode: string
  itemName: string
  description: string | null
  itemType: string
  taxCategory: string
  gstRates?: { cgst?: number; sgst?: number; igst?: number; cess?: number }
  defaultSellingPrice?: number
  mrp?: number
  stockTracked?: boolean
  trackingType?: string
  categoryId?: { categoryCode?: string }
  primaryUOMId?: { uomCode?: string }
  reorderSettings?: Record<string, number>
  lobConfig?: Record<string, { isActive?: boolean }>
}

const categoryRows = (categoryExport as { data: CategoryRow[] }).data
const itemRows = (itemExport as { data: ItemRow[] }).data

const parentCodeOf = (row: CategoryRow) =>
  !row.parentCategory
    ? null
    : typeof row.parentCategory === 'object'
      ? (row.parentCategory.categoryCode ?? null)
      : row.parentCategory

describe('seeded categories match the reference export', () => {
  it('covers every row present in the export', () => {
    expect(SEED_CATEGORIES.map((c) => c.code).sort()).toEqual(
      categoryRows.map((r) => r.categoryCode).sort()
    )
  })

  it.each(categoryRows.map((r) => [r.categoryCode, r] as const))(
    '%s carries the export values',
    (code, row) => {
      const seeded = SEED_CATEGORIES.find((c) => c.code === code)!
      expect(seeded.name).toBe(row.categoryName)
      expect(seeded.description).toBe(row.description ?? null)
      expect(seeded.icon).toBe(row.icon ?? null)
      expect(seeded.color).toBe(row.color ?? null)
      expect(seeded.displayOrder).toBe(row.displayOrder ?? 0)
      expect(seeded.parentCode).toBe(parentCodeOf(row))
      expect(seeded.type).toBe(row.categoryType === 'SERVICE' ? 'Service' : 'Raw Material')
      expect(seeded.settings).toEqual({
        enableBatchTracking: row.settings?.enableBatchTracking ?? false,
        enableExpiryTracking: row.settings?.enableExpiryTracking ?? false,
        enableSerialTracking: row.settings?.enableSerialTracking ?? false,
        defaultShelfLifeDays: row.settings?.defaultShelfLifeDays ?? null,
      })
    }
  )

  it('recomputes level and path instead of copying the export', () => {
    // The correction, pinned. Guards against someone regenerating from a "fixed" script that
    // simply copies the fields, which would put "Level: Root" back on eight sub-categories.
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
    '%s carries the export values',
    (code, row) => {
      const seeded = SEED_ITEMS.find((i) => i.itemCode === code)!
      expect(seeded.name).toBe(row.itemName)
      expect(seeded.description).toBe(row.description ?? null)
      expect(seeded.taxCategory).toBe(row.taxCategory)
      expect(seeded.cgstPercent).toBe(row.gstRates?.cgst ?? 0)
      expect(seeded.sgstPercent).toBe(row.gstRates?.sgst ?? 0)
      expect(seeded.igstPercent).toBe(row.gstRates?.igst ?? 0)
      expect(seeded.cessPercent).toBe(row.gstRates?.cess ?? 0)
      expect(seeded.sellingPrice).toBe(row.defaultSellingPrice ?? 0)
      expect(seeded.mrp).toBe(row.mrp ?? 0)
      expect(seeded.stockTracked).toBe(row.stockTracked ?? false)
      expect(seeded.trackingType).toBe(row.trackingType ?? 'NONE')
      expect(seeded.categoryCode).toBe(row.categoryId?.categoryCode ?? null)
      expect(seeded.primaryUomCode).toBe(row.primaryUOMId?.uomCode ?? null)
      expect(seeded.reorder).toEqual({
        minStock: row.reorderSettings?.minStock ?? 0,
        reorderPoint: row.reorderSettings?.reorderPoint ?? 0,
        reorderQty: row.reorderSettings?.reorderQty ?? 0,
        maxStock: row.reorderSettings?.maxStock ?? 0,
      })
      expect(seeded.lob.sales).toBe(row.lobConfig?.sales?.isActive ?? false)
      expect(seeded.lob.purchase).toBe(row.lobConfig?.purchase?.isActive ?? false)
      expect(seeded.lob.production).toBe(row.lobConfig?.production?.isActive ?? false)
      expect(seeded.lob.servicePos).toBe(row.lobConfig?.pos?.isActive ?? false)
      expect(seeded.lob.ecommerce).toBe(row.lobConfig?.ecommerce?.isActive ?? false)
    }
  )

  it("every item's category is one we seed, once the export is complete", () => {
    // The check that caught `REPAIR_SERVICES` vs `SERVICES`: the hand-written seed used its own
    // code for Repair Services, so no item could ever have resolved its category.
    //
    // Right now all ten items point at `SERVICES`, and the category defining it sits on a page of
    // the export that is not in this repo — page 1 of 3 holds nine SPARE_* categories and
    // ACCESSORIES. That is a missing file, not a wrong code, so it warns while coverage is
    // partial and fails hard the moment the full export is present. Getting that distinction
    // right matters: a permanently red test is one nobody reads, and a silently skipped one
    // would let a genuine typo through.
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
