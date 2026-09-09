import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { itemCategoriesCollection, itemCategoryDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, ItemCategoryDoc, ItemCategorySettings } from '@/types/firestore'

export interface ItemCategoryWithId extends ItemCategoryDoc {
  id: string
}

export function itemCategoriesQueryKey(companyId: string | undefined) {
  return ['itemCategories', companyId] as const
}

export function useItemCategories() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<(ItemCategoryDoc & { id: string })[]>(
    itemCategoriesQueryKey(companyId),
    companyId
      ? query(collection(db, itemCategoriesCollection(companyId)), orderBy('name', 'asc'))
      : null,
    (docs) => {
      const rows = docs as (ItemCategoryDoc & { id: string })[]
      return ((rows) => rows)(rows)
    },
    !!companyId
  )
}

/** "Root" vs "Under: {parent}" — matches `preview (58)`'s own Level column. */
export function categoryLevel(
  cat: ItemCategoryWithId,
  all: ItemCategoryWithId[]
): { level: 'Root' | 'Sub'; parentName: string | null } {
  if (!cat.parentId) return { level: 'Root', parentName: null }
  return { level: 'Sub', parentName: all.find((c) => c.id === cat.parentId)?.name ?? null }
}

export interface ItemCategoryInput {
  name: string
  code?: string
  type: 'Raw Material' | 'Service'
  parentId: string | null
  description: string | null
  /** Presentation and tracking defaults, all optional — the create form does not collect them
   *  yet, and a category without them behaves exactly as before. */
  icon?: string | null
  color?: string | null
  displayOrder?: number
  applicableAttributes?: string[]
  settings?: ItemCategorySettings
}

/**
 * Reads the parent's depth and ancestry so a child can extend them.
 *
 * A `getDoc` rather than a lookup in whatever list the caller happens to hold: the mutation is
 * reachable from more than one screen, and a caller passing a stale or filtered list would write
 * a wrong `level` that nothing would ever correct. One read on a create is cheap.
 */
async function readParent(
  companyId: string,
  parentId: string | null
): Promise<{ level: number; path: string } | null> {
  if (!parentId) return null
  const snap = await getDoc(doc(db, itemCategoryDoc(companyId, parentId)))
  if (!snap.exists()) return null
  const data = snap.data() as ItemCategoryDoc
  // Tolerates a document written before `level`/`path` existed.
  return { level: data.level ?? 0, path: data.path ?? data.code }
}

export function useCreateItemCategory() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ItemCategoryInput) => {
      const ref = doc(collection(db, itemCategoriesCollection(companyId)))
      const now = serverTimestamp()
      const code = input.code || slugifyCode(input.name, 20)
      // Depth and ancestry are derived from the parent at write time, so a query can filter by
      // level or find everything under a category with a prefix match on `path`. The reference
      // app stores `level: 0` and a bare path on every record, including children — see
      // `ItemCategoryDoc` for why that is not copied.
      const parent = await readParent(companyId, input.parentId)
      const data: ItemCategoryDoc = {
        name: input.name,
        code,
        type: input.type,
        parentId: input.parentId,
        description: input.description,
        icon: input.icon ?? null,
        color: input.color ?? null,
        displayOrder: input.displayOrder ?? 0,
        applicableAttributes: input.applicableAttributes ?? [],
        settings: input.settings ?? {
          enableBatchTracking: false,
          enableExpiryTracking: false,
          enableSerialTracking: false,
          defaultShelfLifeDays: null,
        },
        level: parent ? parent.level + 1 : 0,
        path: parent ? `${parent.path}/${code}` : code,
        source: 'custom',
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'masters',
        entityType: 'Item Category',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemCategoriesQueryKey(companyId) }),
  })
}

export function useUpdateItemCategory() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ItemCategoryInput & { id: string }) => {
      const batch = writeBatch(db)
      // `level` and `path` are recomputed here too. Editing a category's parent without
      // updating them would leave a child claiming the old depth and ancestry, which is the
      // state the reference data is permanently in.
      const parent = await readParent(companyId, input.parentId)
      const code = input.code || slugifyCode(input.name, 20)
      batch.update(doc(db, itemCategoryDoc(companyId, input.id)), {
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        description: input.description,
        level: parent ? parent.level + 1 : 0,
        path: parent ? `${parent.path}/${code}` : code,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'Item Category',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemCategoriesQueryKey(companyId) }),
  })
}

export function useSetItemCategoryStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; categoryName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, itemCategoryDoc(companyId, input.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'Item Category',
        entityId: input.id,
        entityLabel: input.categoryName,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemCategoriesQueryKey(companyId) }),
  })
}

export function useDeleteItemCategory() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: ItemCategoryWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, itemCategoryDoc(companyId, category.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'masters',
        entityType: 'Item Category',
        entityId: category.id,
        entityLabel: category.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemCategoriesQueryKey(companyId) }),
  })
}
