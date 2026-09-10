import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { itemDoc, itemsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import {
  defaultLob,
  emptyGstRates,
  emptyReorder,
  legacyLobFlags,
  resolveItem,
  taxCategoryOf,
  taxPercentOf,
  DEFAULT_UOM,
  type ResolvedItem,
} from '@/lib/item-defaults'
import type {
  EntityStatus,
  ItemAlternateUom,
  ItemDoc,
  ItemGstRates,
  ItemLobConfig,
  ItemNature,
  ItemReorderSettings,
  ItemType,
  ItemUomRef,
  TaxCategory,
  TrackingType,
} from '@/types/firestore'

/** Started minimal in Phase 5 (see `ItemDoc`'s own doc comment) so Job Cards/Service Items had a
 * real catalog; Phase 7's Item Master extends the same collection (classification, pricing,
 * inventory, enabled-in flags) rather than replacing it. */
export interface ItemWithId extends ItemDoc {
  id: string
}

/** What every screen actually receives: an item with the fields an older document may not carry
 *  already resolved. See `resolveItem` for why that happens on read rather than as a migration. */
export type ItemRow = ItemWithId & ResolvedItem

export function itemsQueryKey(companyId: string | undefined) {
  return ['items', companyId] as const
}

export function useItems() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<ItemRow[]>(
    itemsQueryKey(companyId),
    companyId ? query(collection(db, itemsCollection(companyId)), orderBy('name', 'asc')) : null,
    (docs) => (docs as ItemWithId[]).map(resolveItem),
    !!companyId
  )
}

/** `SRV001`/`PRT001`-style codes, matching `preview (75)`'s exact convention — a simple
 * per-type running count is enough here (not a transactional counter like job/party/receipt
 * numbers) since a duplicate code is a cosmetic annoyance, not a data-integrity problem the way
 * a duplicate job number would be. */
export function nextItemCode(existing: ItemWithId[], type: ItemType) {
  const prefix = type === 'service' ? 'SRV' : type === 'part' ? 'PRT' : 'PRD'
  const count = existing.filter((i) => i.type === type).length
  return `${prefix}${String(count + 1).padStart(3, '0')}`
}

export interface CreateItemInput {
  name: string
  type: ItemType
  itemCode: string
  nature?: ItemNature
  categoryId?: string | null
  categoryName?: string | null
  subCategoryId?: string | null
  subCategoryName?: string | null
  /** The primary unit's symbol, kept for the older screens that read `item.uom`. Derived from
   *  `primaryUom` when that is supplied, so the two cannot disagree. */
  uom?: string
  primaryUom?: ItemUomRef
  purchaseUom?: ItemUomRef | null
  salesUom?: ItemUomRef | null
  alternateUoms?: ItemAlternateUom[]
  taxCategory?: TaxCategory
  gstRates?: ItemGstRates
  gstPercent?: number
  cgstPercent?: number
  sgstPercent?: number
  sellingPrice?: number | null
  purchasePrice?: number | null
  mrp?: number | null
  stockTracked?: boolean
  trackingType?: TrackingType
  shelfLifeDays?: number | null
  reorder?: ItemReorderSettings
  hasVariants?: boolean
  variantAttributes?: string[]
  images?: string[]
  lob?: ItemLobConfig
  isSystem?: boolean
  description?: string | null
}

/**
 * The full document a create or update writes, from whatever subset the caller supplied.
 *
 * One builder for both paths: they had drifted before — `useUpdateItem` wrote
 * `categoryName: input.categoryName ?? null` where create wrote a "Repair Services" fallback, so
 * editing a service item silently cleared its category name. With thirty-five fields to keep in
 * step, two copies of this logic would not have stayed in step for long.
 */
function itemFieldsFrom(input: CreateItemInput) {
  const isService = input.type === 'service'
  const taxCategory = input.taxCategory ?? taxCategoryOf(input.gstPercent ?? 18)
  const gstPercent = input.gstPercent ?? taxPercentOf(taxCategory)
  const primaryUom = input.primaryUom ?? {
    ...DEFAULT_UOM,
    ...(input.uom ? { symbol: input.uom, code: input.uom.toUpperCase(), name: input.uom } : {}),
  }
  const gstRates = input.gstRates ?? emptyGstRates()
  const lob = input.lob ?? defaultLob(isService)
  return {
    name: input.name,
    type: input.type,
    nature: input.nature ?? (isService ? 'Service' : 'Goods'),
    categoryId: input.categoryId ?? null,
    categoryName: input.categoryName ?? null,
    subCategoryId: input.subCategoryId ?? null,
    subCategoryName: input.subCategoryName ?? null,
    uom: primaryUom.symbol,
    primaryUom,
    purchaseUom: input.purchaseUom ?? null,
    salesUom: input.salesUom ?? null,
    alternateUoms: input.alternateUoms ?? [],
    taxCategory,
    gstRates,
    gstPercent,
    // Kept alongside `gstRates` because Job Cards and the invoice math still read these two.
    cgstPercent: input.cgstPercent ?? gstRates.cgst,
    sgstPercent: input.sgstPercent ?? gstRates.sgst,
    sellingPrice: input.sellingPrice ?? null,
    purchasePrice: input.purchasePrice ?? null,
    mrp: input.mrp ?? null,
    stockTracked: input.stockTracked ?? !isService,
    trackingType: input.trackingType ?? 'NONE',
    shelfLifeDays: input.shelfLifeDays ?? null,
    reorder: input.reorder ?? emptyReorder(),
    hasVariants: input.hasVariants ?? false,
    variantAttributes: input.variantAttributes ?? [],
    images: input.images ?? [],
    lob,
    ...legacyLobFlags(lob),
    isSystem: input.isSystem ?? false,
    description: input.description ?? null,
  }
}

export function useCreateItem() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const ref = doc(collection(db, itemsCollection(companyId)))
      const now = serverTimestamp()
      const data: ItemDoc = {
        itemCode: input.itemCode,
        ...itemFieldsFrom(input),
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'masters',
        entityType: 'Item',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryKey(companyId) }),
  })
}

export interface UpdateItemInput extends CreateItemInput {
  id: string
}

export function useUpdateItem() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateItemInput) => {
      const batch = writeBatch(db)
      batch.update(doc(db, itemDoc(companyId, input.id)), {
        ...itemFieldsFrom(input),
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'Item',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryKey(companyId) }),
  })
}

/** Same soft-delete-via-status convention as `useSetPartyStatus` — `firestore.rules` forbids a
 * real delete on `items` (a part may be referenced by a Job Card's historical `partsUsed`). */
export function useSetItemStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; itemName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, itemDoc(companyId, input.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'Item',
        entityId: input.id,
        entityLabel: input.itemName,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryKey(companyId) }),
  })
}
