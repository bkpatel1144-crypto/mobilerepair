import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { itemDoc, itemsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, ItemDoc, ItemNature, ItemType } from '@/types/firestore'

/** Started minimal in Phase 5 (see `ItemDoc`'s own doc comment) so Job Cards/Service Items had a
 * real catalog; Phase 7's Item Master extends the same collection (classification, pricing,
 * inventory, enabled-in flags) rather than replacing it. */
export interface ItemWithId extends ItemDoc {
  id: string
}

export function itemsQueryKey(companyId: string | undefined) {
  return ['items', companyId] as const
}

export function useItems() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: itemsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, itemsCollection(companyId!)), orderBy('name', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ItemDoc) }))
    },
    enabled: !!companyId,
  })
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
  uom?: string
  gstPercent?: number
  cgstPercent?: number
  sgstPercent?: number
  sellingPrice?: number | null
  purchasePrice?: number | null
  mrp?: number | null
  stockTracked?: boolean
  enabledInSales?: boolean
  enabledInPurchase?: boolean
  enabledInProduction?: boolean
  enabledInServicePos?: boolean
  description?: string | null
}

export function useCreateItem() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const ref = doc(collection(db, itemsCollection(companyId)))
      const now = serverTimestamp()
      const isService = input.type === 'service'
      const data: ItemDoc = {
        itemCode: input.itemCode,
        name: input.name,
        type: input.type,
        nature: input.nature ?? (isService ? 'Service' : 'Goods'),
        categoryId: input.categoryId ?? null,
        categoryName: input.categoryName ?? (isService ? 'Repair Services' : null),
        uom: input.uom ?? 'nos',
        gstPercent: input.gstPercent ?? 18,
        cgstPercent: input.cgstPercent ?? 0,
        sgstPercent: input.sgstPercent ?? 0,
        sellingPrice: input.sellingPrice ?? null,
        purchasePrice: input.purchasePrice ?? null,
        mrp: input.mrp ?? null,
        stockTracked: input.stockTracked ?? !isService,
        enabledInSales: input.enabledInSales ?? true,
        enabledInPurchase: input.enabledInPurchase ?? !isService,
        enabledInProduction: input.enabledInProduction ?? false,
        enabledInServicePos: input.enabledInServicePos ?? true,
        description: input.description ?? null,
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
      const isService = input.type === 'service'
      const batch = writeBatch(db)
      batch.update(doc(db, itemDoc(companyId, input.id)), {
        name: input.name,
        type: input.type,
        nature: input.nature ?? (isService ? 'Service' : 'Goods'),
        categoryId: input.categoryId ?? null,
        categoryName: input.categoryName ?? null,
        uom: input.uom ?? 'nos',
        gstPercent: input.gstPercent ?? 18,
        cgstPercent: input.cgstPercent ?? 0,
        sgstPercent: input.sgstPercent ?? 0,
        sellingPrice: input.sellingPrice ?? null,
        purchasePrice: input.purchasePrice ?? null,
        mrp: input.mrp ?? null,
        stockTracked: input.stockTracked ?? !isService,
        enabledInSales: input.enabledInSales ?? true,
        enabledInPurchase: input.enabledInPurchase ?? !isService,
        enabledInProduction: input.enabledInProduction ?? false,
        enabledInServicePos: input.enabledInServicePos ?? true,
        description: input.description ?? null,
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
      batch.update(doc(db, itemDoc(companyId, input.id)), { status: input.status, updatedAt: serverTimestamp() })
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
