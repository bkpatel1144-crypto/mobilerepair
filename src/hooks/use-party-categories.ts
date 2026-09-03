import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { partyCategoriesCollection, partyCategoryDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, PartyCategoryDoc } from '@/types/firestore'

export interface PartyCategoryWithId extends PartyCategoryDoc { id: string }

export function partyCategoriesQueryKey(companyId: string | undefined) {
  return ['partyCategories', companyId] as const
}

export function usePartyCategories() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: partyCategoriesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, partyCategoriesCollection(companyId!)), orderBy('name', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PartyCategoryDoc) }))
    },
    enabled: !!companyId,
  })
}

export interface PartyCategoryInput {
  name: string
  code?: string
  defaultCreditDays: number
  isDefaultForCustomer: boolean
  isDefaultForSupplier: boolean
}

/** `isDefaultForCustomer`/`isDefaultForSupplier` are each independently single-flagged across
 * the whole list — the star icon in `preview (54)` reads as "the one" default, not "a" default. */
function clearOtherDefaults(
  batch: ReturnType<typeof writeBatch>,
  companyId: string,
  existing: PartyCategoryWithId[],
  input: PartyCategoryInput,
  exceptId?: string
) {
  for (const cat of existing) {
    if (cat.id === exceptId) continue
    const patch: Partial<PartyCategoryDoc> = {}
    if (input.isDefaultForCustomer && cat.isDefaultForCustomer) patch.isDefaultForCustomer = false
    if (input.isDefaultForSupplier && cat.isDefaultForSupplier) patch.isDefaultForSupplier = false
    if (Object.keys(patch).length) {
      batch.update(doc(db, partyCategoryDoc(companyId, cat.id)), { ...patch, updatedAt: serverTimestamp() })
    }
  }
}

export function useCreatePartyCategory(existing: PartyCategoryWithId[]) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PartyCategoryInput) => {
      const ref = doc(collection(db, partyCategoriesCollection(companyId)))
      const now = serverTimestamp()
      const data: PartyCategoryDoc = {
        name: input.name,
        code: input.code || slugifyCode(input.name, 20),
        defaultCreditDays: input.defaultCreditDays,
        isDefaultForCustomer: input.isDefaultForCustomer,
        isDefaultForSupplier: input.isDefaultForSupplier,
        source: 'custom',
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      clearOtherDefaults(batch, companyId, existing, input)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'masters',
        entityType: 'Party Category',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partyCategoriesQueryKey(companyId) }),
  })
}

export function useUpdatePartyCategory(existing: PartyCategoryWithId[]) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PartyCategoryInput & { id: string }) => {
      const batch = writeBatch(db)
      clearOtherDefaults(batch, companyId, existing, input, input.id)
      batch.update(doc(db, partyCategoryDoc(companyId, input.id)), {
        name: input.name,
        defaultCreditDays: input.defaultCreditDays,
        isDefaultForCustomer: input.isDefaultForCustomer,
        isDefaultForSupplier: input.isDefaultForSupplier,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'Party Category',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partyCategoriesQueryKey(companyId) }),
  })
}

export function useSetPartyCategoryStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; categoryName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, partyCategoryDoc(companyId, input.id)), { status: input.status, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'Party Category',
        entityId: input.id,
        entityLabel: input.categoryName,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partyCategoriesQueryKey(companyId) }),
  })
}

export function useDeletePartyCategory() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: PartyCategoryWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, partyCategoryDoc(companyId, category.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'masters',
        entityType: 'Party Category',
        entityId: category.id,
        entityLabel: category.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partyCategoriesQueryKey(companyId) }),
  })
}
