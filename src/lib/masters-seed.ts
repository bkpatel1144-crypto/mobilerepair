import { collection, doc, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  itemCategoriesCollection,
  paymentModesCollection,
  partyCategoriesCollection,
  uomCollection,
} from '@/lib/firestore-paths'
import type { ItemCategoryDoc, PartyCategoryDoc, PaymentModeDoc, UomDoc } from '@/types/firestore'

/**
 * The default Masters dataset every new company starts with, seeded in the same signup batch as
 * the 5 default roles / Main Branch / Service Options (`service-options-seed.ts`) — same
 * "starting point an Owner can rename/add-to/delete afterward" convention throughout this app.
 * Unlike Service Options' 91-model real-world export, these are hand-authored from
 * `SCREENS_NOTES.md`'s own documented rows (`preview (54)`/`(56)`/`(58)`/`(59)`) — Item
 * Categories seeds the exact 9 rows the reference screenshot itself shows (root "Spare Parts" +
 * 8 children) rather than fabricating its full observed "Total 27", since only those 9 are
 * actually documented; see BUILD_PLAN.md's deviations list.
 */

const UOM_SEED: Omit<UomDoc, 'source' | 'status' | 'createdAt' | 'updatedAt' | 'baseUomId'>[] = [
  { name: 'Pieces', code: 'PCS', type: 'Quantity', symbol: 'pcs', decimalPlaces: 0, displayOrder: 0, conversionFactor: null, description: null },
  { name: 'Numbers', code: 'NOS', type: 'Quantity', symbol: 'nos', decimalPlaces: 0, displayOrder: 1, conversionFactor: null, description: null },
  { name: 'Set', code: 'SET', type: 'Quantity', symbol: 'set', decimalPlaces: 0, displayOrder: 2, conversionFactor: null, description: null },
  { name: 'Pair', code: 'PAIR', type: 'Quantity', symbol: 'pair', decimalPlaces: 0, displayOrder: 3, conversionFactor: null, description: null },
  { name: 'Box', code: 'BOX', type: 'Quantity', symbol: 'box', decimalPlaces: 0, displayOrder: 4, conversionFactor: null, description: null },
  { name: 'Pack', code: 'PACK', type: 'Quantity', symbol: 'pack', decimalPlaces: 0, displayOrder: 5, conversionFactor: null, description: null },
  { name: 'Roll', code: 'ROLL', type: 'Quantity', symbol: 'roll', decimalPlaces: 0, displayOrder: 6, conversionFactor: null, description: null },
  { name: 'Dozen', code: 'DZN', type: 'Quantity', symbol: 'dzn', decimalPlaces: 0, displayOrder: 7, conversionFactor: null, description: null },
  { name: 'Meter', code: 'M', type: 'Length', symbol: 'm', decimalPlaces: 2, displayOrder: 8, conversionFactor: null, description: null },
  { name: 'Centimeter', code: 'CM', type: 'Length', symbol: 'cm', decimalPlaces: 2, displayOrder: 9, conversionFactor: null, description: null },
  // "Inch" carries a real base-UOM conversion (→ Meter) — matches `preview (59)`'s "LENGTH" pill
  // + "Base unit" annotation on this exact row; resolved to `baseUomId` after Meter is created.
  { name: 'Inch', code: 'INCH', type: 'Length', symbol: 'in', decimalPlaces: 2, displayOrder: 10, conversionFactor: 0.0254, description: null },
  { name: 'Kilogram', code: 'KG', type: 'Weight', symbol: 'kg', decimalPlaces: 3, displayOrder: 11, conversionFactor: null, description: null },
  { name: 'Gram', code: 'GM', type: 'Weight', symbol: 'gm', decimalPlaces: 0, displayOrder: 12, conversionFactor: null, description: null },
  { name: 'Litre', code: 'LTR', type: 'Volume', symbol: 'ltr', decimalPlaces: 2, displayOrder: 13, conversionFactor: null, description: null },
  { name: 'Millilitre', code: 'ML', type: 'Volume', symbol: 'ml', decimalPlaces: 0, displayOrder: 14, conversionFactor: null, description: null },
]

const PAYMENT_MODE_SEED: Omit<PaymentModeDoc, 'source' | 'status' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Cash', code: 'CASH', type: 'Cash', description: null, isDefault: true },
  { name: 'UPI', code: 'UPI', type: 'UPI', description: null, isDefault: false },
  { name: 'Card', code: 'CARD', type: 'Card', description: null, isDefault: false },
]

const PARTY_CATEGORY_SEED: Omit<PartyCategoryDoc, 'source' | 'status' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'General Supplier', code: 'GENERAL_SUPPLIER', defaultCreditDays: 15, isDefaultForCustomer: false, isDefaultForSupplier: true },
  { name: 'Regular Customer', code: 'REGULAR_CUSTOMER', defaultCreditDays: 0, isDefaultForCustomer: false, isDefaultForSupplier: false },
  { name: 'Walk-in Customer', code: 'WALKIN_CUSTOMER', defaultCreditDays: 0, isDefaultForCustomer: true, isDefaultForSupplier: false },
]

// Root "Spare Parts" + the 8 sub-categories `preview (58)` documents under it — the reference
// screenshot's own "Total 27" isn't reproducible from what's actually documented, so this seeds
// exactly what's confirmed rather than padding the count with invented rows (see file doc comment).
const ITEM_CATEGORY_SEED: { name: string; code: string; parentCode: string | null }[] = [
  { name: 'Spare Parts', code: 'SPARE_PARTS', parentCode: null },
  { name: 'Screens & Displays', code: 'SPARE_SCREENS', parentCode: 'SPARE_PARTS' },
  { name: 'Batteries', code: 'SPARE_BATTERIES', parentCode: 'SPARE_PARTS' },
  { name: 'Charging Ports & Flex', code: 'SPARE_CHARGING', parentCode: 'SPARE_PARTS' },
  { name: 'Camera Modules', code: 'SPARE_CAMERAS', parentCode: 'SPARE_PARTS' },
  { name: 'Speakers & Mic', code: 'SPARE_SPEAKERS', parentCode: 'SPARE_PARTS' },
  { name: 'Buttons & Keys', code: 'SPARE_BUTTONS', parentCode: 'SPARE_PARTS' },
  { name: 'Back Panel & Housing', code: 'SPARE_BACK_PANEL', parentCode: 'SPARE_PARTS' },
  { name: 'IC & Chips', code: 'SPARE_IC_CHIPS', parentCode: 'SPARE_PARTS' },
  { name: 'Repair Services', code: 'REPAIR_SERVICES', parentCode: null },
]

/** Adds every default Masters document to `batch` (not committed here — `seedTenantForUser()`
 * commits everything together, same as `addDefaultServiceOptionsToBatch`). */
export function addDefaultMastersToBatch(batch: WriteBatch, companyId: string, now: unknown) {
  // Refs (not just ids) are pre-created in one pass so Inch's `baseUomId` can resolve to Meter's
  // real id regardless of seed order, then every doc is `batch.set()` in a second pass.
  const uomRefByCode = new Map(UOM_SEED.map((s) => [s.code, doc(collection(db, uomCollection(companyId)))]))
  for (const seed of UOM_SEED) {
    const data: UomDoc = {
      ...seed,
      baseUomId: seed.code === 'INCH' ? (uomRefByCode.get('M')?.id ?? null) : null,
      source: 'system',
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(uomRefByCode.get(seed.code)!, data)
  }

  for (const seed of PAYMENT_MODE_SEED) {
    const ref = doc(collection(db, paymentModesCollection(companyId)))
    const data: PaymentModeDoc = {
      ...seed,
      source: 'system',
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }

  for (const seed of PARTY_CATEGORY_SEED) {
    const ref = doc(collection(db, partyCategoriesCollection(companyId)))
    const data: PartyCategoryDoc = {
      ...seed,
      source: 'system',
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }

  const categoryIdByCode = new Map<string, string>()
  for (const seed of ITEM_CATEGORY_SEED) {
    const ref = doc(collection(db, itemCategoriesCollection(companyId)))
    categoryIdByCode.set(seed.code, ref.id)
  }
  for (const seed of ITEM_CATEGORY_SEED) {
    const ref = doc(db, itemCategoriesCollection(companyId), categoryIdByCode.get(seed.code)!)
    const data: ItemCategoryDoc = {
      name: seed.name,
      code: seed.code,
      type: seed.code === 'REPAIR_SERVICES' ? 'Service' : 'Raw Material',
      parentId: seed.parentCode ? (categoryIdByCode.get(seed.parentCode) ?? null) : null,
      description: null,
      source: 'system',
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }

  return { categoryIdByCode }
}
