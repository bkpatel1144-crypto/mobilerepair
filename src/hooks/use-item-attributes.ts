import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { itemAttributeDoc, itemAttributesCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, ItemAttributeDoc } from '@/types/firestore'

/**
 * Masters > Attributes — the vocabulary item variants are defined by.
 *
 * The client's menu export lists this master and their Manager role holds all four
 * `MASTERS_ATTRIBUTES_*` permissions, so it is theirs rather than invented. It is also the
 * missing half of a field this app already had: `ItemDoc.variantAttributes` stores attribute
 * names, which until now the Create Item form asked the shopkeeper to type from memory.
 */

export interface ItemAttributeWithId extends ItemAttributeDoc {
  id: string
}

export function itemAttributesQueryKey(companyId: string | undefined) {
  return ['itemAttributes', companyId] as const
}

export function useItemAttributes() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<ItemAttributeWithId[]>(
    itemAttributesQueryKey(companyId),
    companyId
      ? query(collection(db, itemAttributesCollection(companyId)), orderBy('name', 'asc'))
      : null,
    (docs) => docs as ItemAttributeWithId[],
    !!companyId
  )
}

export interface ItemAttributeInput {
  name: string
  code?: string
  values: string[]
  description?: string | null
  displayOrder?: number
}

export function useCreateItemAttribute() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ItemAttributeInput) => {
      const ref = doc(collection(db, itemAttributesCollection(companyId)))
      const now = serverTimestamp()
      const data: ItemAttributeDoc = {
        name: input.name,
        code: input.code || slugifyCode(input.name, 20),
        values: input.values,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
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
        entityType: 'Attribute',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemAttributesQueryKey(companyId) }),
  })
}

export function useUpdateItemAttribute() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ItemAttributeInput & { id: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, itemAttributeDoc(companyId, input.id)), {
        name: input.name,
        values: input.values,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'Attribute',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemAttributesQueryKey(companyId) }),
  })
}

export function useSetItemAttributeStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; name: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, itemAttributeDoc(companyId, input.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'Attribute',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemAttributesQueryKey(companyId) }),
  })
}

export function useDeleteItemAttribute() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attribute: ItemAttributeWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, itemAttributeDoc(companyId, attribute.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'masters',
        entityType: 'Attribute',
        entityId: attribute.id,
        entityLabel: attribute.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemAttributesQueryKey(companyId) }),
  })
}
