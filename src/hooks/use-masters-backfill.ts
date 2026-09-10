import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { itemCategoriesCollection, itemsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { useItems, itemsQueryKey, type ItemRow } from '@/hooks/use-items'
import {
  useItemCategories,
  itemCategoriesQueryKey,
  type ItemCategoryWithId,
} from '@/hooks/use-item-categories'
import { useUoms, uomQueryKey, type UomWithId } from '@/hooks/use-uom'
import { SEED_CATEGORIES, SEED_ITEMS, type SeedUomRef } from '@/lib/masters-seed-data'
import { legacyLobFlags } from '@/lib/item-defaults'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { ItemCategoryDoc, ItemDoc, ItemUomRef } from '@/types/firestore'

/**
 * Brings an existing company's Masters up to the current default catalogue.
 *
 * The signup seed only ever runs once, at signup. So a company created before the catalogue was
 * fixed keeps whatever it got on its own first day: an empty Item Master, ten of the twenty-seven
 * categories, and seventeen of those typed Raw Material because the old mapping only knew
 * `SERVICE` and defaulted everything else. Fixing the seed did nothing for any of them — which is
 * every tenant already in production.
 *
 * This is the same data, applied to a company that already exists:
 *
 *  - A category or item whose code is missing is created.
 *  - A category the *seed* owns (`source: 'system'`) has its type, presentation and ancestry
 *    corrected to match. That is what repairs the mis-typed seventeen.
 *  - Anything a shopkeeper added or edited themselves is left completely alone. A custom category
 *    is never touched, and an existing item is never overwritten — the code is the identity, and
 *    if it is already there, their version wins.
 *
 * Deliberately a button rather than something that runs on load: it writes up to forty-three
 * documents, and a write that size should be something a person chose.
 */

export interface BackfillPlan {
  categoriesToCreate: number
  categoriesToFix: number
  itemsToCreate: number
  /** Nothing to do — the company already matches the catalogue. */
  isUpToDate: boolean
}

/** What a system category should look like, ignoring the fields a company may legitimately edit.
 *  Exported for `use-masters-backfill.test.ts`, which is where the "leave custom rows alone"
 *  guarantee is actually pinned. */
export function categoryDrift(
  existing: ItemCategoryWithId,
  seedIndex: Map<string, (typeof SEED_CATEGORIES)[number]>
) {
  const seed = seedIndex.get(existing.code)
  if (!seed) return null
  // Only the fields the export owns. `name` and `description` are included because the old seed
  // wrote its own wording for several of these; a company that renamed one keeps the rename only
  // if it also stopped being a system row, which is what `source` records.
  const wanted = {
    type: seed.type,
    icon: seed.icon,
    color: seed.color,
    displayOrder: seed.displayOrder,
    level: seed.level,
    path: seed.path,
    isSystem: seed.isSystem,
  }
  const differs =
    existing.type !== wanted.type ||
    (existing.icon ?? null) !== wanted.icon ||
    (existing.color ?? null) !== wanted.color ||
    (existing.displayOrder ?? 0) !== wanted.displayOrder ||
    (existing.level ?? 0) !== wanted.level ||
    (existing.path ?? '') !== wanted.path ||
    (existing.isSystem ?? false) !== wanted.isSystem
  return differs ? wanted : null
}

/** What `useBackfillDefaultMasters` would do, for the button's own label. */
export function useBackfillPlan(): BackfillPlan {
  const { data: categories = [] } = useItemCategories()
  const { data: items = [] } = useItems()

  const seedIndex = new Map(SEED_CATEGORIES.map((c) => [c.code, c]))
  const haveCategory = new Set(categories.map((c) => c.code))
  const haveItem = new Set(items.map((i) => i.itemCode))

  const categoriesToCreate = SEED_CATEGORIES.filter((c) => !haveCategory.has(c.code)).length
  const categoriesToFix = categories.filter(
    (c) => c.source === 'system' && categoryDrift(c, seedIndex) !== null
  ).length
  const itemsToCreate = SEED_ITEMS.filter((i) => !haveItem.has(i.itemCode)).length

  return {
    categoriesToCreate,
    categoriesToFix,
    itemsToCreate,
    isUpToDate: categoriesToCreate + categoriesToFix + itemsToCreate === 0,
  }
}

export function useBackfillDefaultMasters() {
  const { user, profile } = useAuth()
  const companyId = profile?.companyId
  const queryClient = useQueryClient()
  const { data: categories = [] } = useItemCategories()
  const { data: items = [] } = useItems()
  const { data: uoms = [] } = useUoms()

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company')
      const batch = writeBatch(db)
      const now = serverTimestamp()
      const seedIndex = new Map(SEED_CATEGORIES.map((c) => [c.code, c]))

      // ---- categories ------------------------------------------------------------------------
      // Ids first, for both the ones already here and the ones about to be written, so an item
      // and a child category can point at either without a second pass over Firestore.
      const categoryIdByCode = new Map<string, string>()
      const categoryNameByCode = new Map<string, string>()
      for (const existing of categories) {
        categoryIdByCode.set(existing.code, existing.id)
        categoryNameByCode.set(existing.code, existing.name)
      }
      const toCreate = SEED_CATEGORIES.filter((c) => !categoryIdByCode.has(c.code))
      for (const seed of toCreate) {
        const ref = doc(collection(db, itemCategoriesCollection(companyId)))
        categoryIdByCode.set(seed.code, ref.id)
        categoryNameByCode.set(seed.code, seed.name)
      }

      let created = 0
      let fixed = 0
      for (const seed of toCreate) {
        const data: ItemCategoryDoc = {
          name: seed.name,
          code: seed.code,
          type: seed.type,
          parentId: seed.parentCode ? (categoryIdByCode.get(seed.parentCode) ?? null) : null,
          description: seed.description,
          icon: seed.icon,
          color: seed.color,
          displayOrder: seed.displayOrder,
          applicableAttributes: seed.applicableAttributes,
          settings: seed.settings,
          isSystem: seed.isSystem,
          level: seed.level,
          path: seed.path,
          source: 'system',
          status: 'active',
          createdAt: now as never,
          updatedAt: now as never,
        }
        batch.set(
          doc(db, itemCategoriesCollection(companyId), categoryIdByCode.get(seed.code)!),
          data
        )
        created += 1
      }

      for (const existing of categories) {
        if (existing.source !== 'system') continue
        const wanted = categoryDrift(existing, seedIndex)
        if (!wanted) continue
        const seed = seedIndex.get(existing.code)!
        batch.update(doc(db, itemCategoriesCollection(companyId), existing.id), {
          ...wanted,
          // Re-link the parent too: a sub-category created before its parent existed has none.
          parentId: seed.parentCode ? (categoryIdByCode.get(seed.parentCode) ?? null) : null,
          updatedAt: now,
        })
        fixed += 1
      }

      // ---- items -----------------------------------------------------------------------------
      const haveItem = new Set(items.map((i) => i.itemCode))
      const uomByCode = new Map(uoms.map((u) => [u.code, u]))
      const uomRef = (node: SeedUomRef | null): ItemUomRef | null =>
        node
          ? {
              id: uomByCode.get(node.code)?.id ?? null,
              code: node.code,
              name: node.name,
              symbol: node.symbol,
            }
          : null

      let itemsCreated = 0
      for (const seed of SEED_ITEMS) {
        if (haveItem.has(seed.itemCode)) continue
        const primaryUom = uomRef(seed.primaryUom) ?? {
          id: uomByCode.get('NOS')?.id ?? null,
          code: 'NOS',
          name: 'Numbers',
          symbol: 'nos',
        }
        const data: ItemDoc = {
          itemCode: seed.itemCode,
          name: seed.name,
          type: seed.type,
          nature: seed.nature,
          categoryId: seed.categoryCode ? (categoryIdByCode.get(seed.categoryCode) ?? null) : null,
          categoryName: categoryNameByCode.get(seed.categoryCode ?? '') ?? null,
          subCategoryId: seed.subCategoryCode
            ? (categoryIdByCode.get(seed.subCategoryCode) ?? null)
            : null,
          subCategoryName: categoryNameByCode.get(seed.subCategoryCode ?? '') ?? null,
          uom: primaryUom.symbol,
          primaryUom,
          purchaseUom: uomRef(seed.purchaseUom),
          salesUom: uomRef(seed.salesUom),
          alternateUoms: seed.alternateUoms,
          taxCategory: seed.taxCategory,
          gstRates: seed.gstRates,
          gstPercent: seed.gstPercent,
          cgstPercent: seed.gstRates.cgst,
          sgstPercent: seed.gstRates.sgst,
          sellingPrice: seed.sellingPrice,
          purchasePrice: seed.purchasePrice,
          mrp: seed.mrp,
          stockTracked: seed.stockTracked,
          trackingType: seed.trackingType,
          shelfLifeDays: seed.shelfLifeDays,
          reorder: seed.reorder,
          hasVariants: seed.hasVariants,
          variantAttributes: seed.variantAttributes,
          images: seed.images,
          lob: seed.lob,
          ...legacyLobFlags(seed.lob),
          isSystem: seed.isSystem,
          description: seed.description,
          status: 'active',
          createdAt: now as never,
          updatedAt: now as never,
        }
        batch.set(doc(collection(db, itemsCollection(companyId))), data)
        itemsCreated += 1
      }

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'masters',
        entityType: 'Item',
        entityId: 'default-catalogue',
        entityLabel: `Loaded defaults: ${created} categories, ${fixed} corrected, ${itemsCreated} items`,
      })
      await batch.commit()
      return { created, fixed, itemsCreated }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemCategoriesQueryKey(companyId) })
      void queryClient.invalidateQueries({ queryKey: itemsQueryKey(companyId) })
      void queryClient.invalidateQueries({ queryKey: uomQueryKey(companyId) })
    },
  })
}

/** Re-exported so the pages can type their props without importing three hooks. */
export type { ItemRow, ItemCategoryWithId, UomWithId }
