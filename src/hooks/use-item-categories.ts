import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { itemCategoriesCollection, itemCategoryDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, ItemCategoryDoc } from '@/types/firestore'

export interface ItemCategoryWithId extends ItemCategoryDoc { id: string }

export function itemCategoriesQueryKey(companyId: string | undefined) {
  return ['itemCategories', companyId] as const
}

export function useItemCategories() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: itemCategoriesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, itemCategoriesCollection(companyId!)), orderBy('name', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ItemCategoryDoc) }))
    },
    enabled: !!companyId,
  })
}

/** "Root" vs "Under: {parent}" — matches `preview (58)`'s own Level column. */
export function categoryLevel(cat: ItemCategoryWithId, all: ItemCategoryWithId[]): { level: 'Root' | 'Sub'; parentName: string | null } {
  if (!cat.parentId) return { level: 'Root', parentName: null }
  return { level: 'Sub', parentName: all.find((c) => c.id === cat.parentId)?.name ?? null }
}

export interface ItemCategoryInput {
  name: string
  code?: string
  type: 'Raw Material' | 'Service'
  parentId: string | null
  description: string | null
}

export function useCreateItemCategory() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ItemCategoryInput) => {
      const ref = doc(collection(db, itemCategoriesCollection(companyId)))
      const now = serverTimestamp()
      const data: ItemCategoryDoc = {
        name: input.name,
        code: input.code || slugifyCode(input.name, 20),
        type: input.type,
        parentId: input.parentId,
        description: input.description,
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
      batch.update(doc(db, itemCategoryDoc(companyId, input.id)), {
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        description: input.description,
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
      batch.update(doc(db, itemCategoryDoc(companyId, input.id)), { status: input.status, updatedAt: serverTimestamp() })
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
