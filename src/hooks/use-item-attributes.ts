import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { itemAttributesCollection, itemAttributeDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus } from '@/types/firestore'

/**
 * Masters > Attributes — the vocabulary item variants are described by.
 *
 * `ItemDoc.variantAttributes` already stored attribute *names* as free text, and Create Item
 * asked the shopkeeper to type them from memory, so "Colour", "colour" and "Color" all became
 * different attributes and nothing could list what a company actually uses. This is the list
 * they are chosen from.
 *
 * Deliberately not a field on the company document: each attribute carries its own values and
 * has to be added, renamed and retired like any other master.
 */
/** What an attribute can be attached to. The reference's picker reads "Item / Product"; these
 *  are the app's other forms that could carry a custom field. */
export type AttributeEntity = 'item' | 'party' | 'jobCard'

/** How the value is captured on whatever form the attribute appears on. `select` is the one that
 *  uses `values`; the rest ignore it. */
export type AttributeDataType = 'text' | 'number' | 'date' | 'boolean' | 'select'

export interface ItemAttributeDoc {
  name: string
  /** Derived from the name unless typed over — the reference shows it as AUTO-GENERATED. Held
   *  so an attribute can be referred to by something stable while its label is still being
   *  argued about. */
  code: string
  appliesTo: AttributeEntity
  dataType: AttributeDataType
  /** Refuse to save the form this attribute appears on until it has a value. */
  mandatory: boolean
  /** The choices a `select` attribute offers — "Black, White, Blue". Ignored for every other
   *  data type, and kept rather than cleared so switching type and back does not lose them. */
  values: string[]
  status: EntityStatus
  createdById: string
  createdByName: string
  createdAt: unknown
  updatedAt: unknown
}

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
  code: string
  appliesTo: AttributeEntity
  dataType: AttributeDataType
  mandatory: boolean
  values: string[]
  status?: EntityStatus
}

export function useCreateItemAttribute() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ItemAttributeInput) => {
      const batch = writeBatch(db)
      const ref = doc(collection(db, itemAttributesCollection(companyId)))
      const now = serverTimestamp()
      batch.set(ref, {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        appliesTo: input.appliesTo,
        dataType: input.dataType,
        mandatory: input.mandatory,
        values: input.values,
        status: input.status ?? 'active',
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now,
        updatedAt: now,
      } satisfies ItemAttributeDoc)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Attribute Created',
        module: 'masters',
        entityType: 'Attribute',
        entityId: ref.id,
        entityLabel: input.name.trim(),
        details: { values: input.values.length },
      })
      await batch.commit()
      return { id: ref.id }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemAttributesQueryKey(companyId) }),
  })
}

export function useUpdateItemAttribute() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: ItemAttributeInput & { id: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, itemAttributeDoc(companyId, id)), {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        appliesTo: input.appliesTo,
        dataType: input.dataType,
        mandatory: input.mandatory,
        values: input.values,
        ...(input.status ? { status: input.status } : {}),
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Attribute Updated',
        module: 'masters',
        entityType: 'Attribute',
        entityId: id,
        entityLabel: input.name.trim(),
        details: { values: input.values.length },
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
        action: 'Attribute Deleted',
        module: 'masters',
        entityType: 'Attribute',
        entityId: attribute.id,
        entityLabel: attribute.name,
        // Items keep the attribute *name* they stored, so deleting one never rewrites an item —
        // but it does remove the only place that name was defined, which is worth flagging.
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemAttributesQueryKey(companyId) }),
  })
}
