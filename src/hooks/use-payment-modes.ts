import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { paymentModeDoc, paymentModesCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, PaymentModeDoc } from '@/types/firestore'

export interface PaymentModeWithId extends PaymentModeDoc { id: string }

export function paymentModesQueryKey(companyId: string | undefined) {
  return ['paymentModes', companyId] as const
}

export function usePaymentModes() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: paymentModesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, paymentModesCollection(companyId!)), orderBy('name', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PaymentModeDoc) }))
    },
    enabled: !!companyId,
  })
}

export interface PaymentModeInput {
  name: string
  code?: string
  type: string
  description: string | null
  isDefault: boolean
}

/** Clears any other row's `isDefault` in the same batch — at most one payment mode may be the
 * default at a time (same "only one active FY" single-flag pattern as Phase 2/10). */
function clearOtherDefaults(batch: ReturnType<typeof writeBatch>, companyId: string, existing: PaymentModeWithId[], exceptId?: string) {
  for (const mode of existing) {
    if (mode.isDefault && mode.id !== exceptId) {
      batch.update(doc(db, paymentModeDoc(companyId, mode.id)), { isDefault: false, updatedAt: serverTimestamp() })
    }
  }
}

export function useCreatePaymentMode(existing: PaymentModeWithId[]) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PaymentModeInput) => {
      const ref = doc(collection(db, paymentModesCollection(companyId)))
      const now = serverTimestamp()
      const data: PaymentModeDoc = {
        name: input.name,
        code: input.code || slugifyCode(input.name, 12),
        type: input.type,
        description: input.description,
        isDefault: input.isDefault,
        source: 'custom',
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      if (input.isDefault) clearOtherDefaults(batch, companyId, existing)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'masters',
        entityType: 'Payment Mode',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentModesQueryKey(companyId) }),
  })
}

export function useUpdatePaymentMode(existing: PaymentModeWithId[]) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PaymentModeInput & { id: string }) => {
      const batch = writeBatch(db)
      if (input.isDefault) clearOtherDefaults(batch, companyId, existing, input.id)
      batch.update(doc(db, paymentModeDoc(companyId, input.id)), {
        name: input.name,
        type: input.type,
        description: input.description,
        isDefault: input.isDefault,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'Payment Mode',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentModesQueryKey(companyId) }),
  })
}

export function useSetPaymentModeStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; modeName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, paymentModeDoc(companyId, input.id)), { status: input.status, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'Payment Mode',
        entityId: input.id,
        entityLabel: input.modeName,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentModesQueryKey(companyId) }),
  })
}

export function useDeletePaymentMode() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mode: PaymentModeWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, paymentModeDoc(companyId, mode.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'masters',
        entityType: 'Payment Mode',
        entityId: mode.id,
        entityLabel: mode.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentModesQueryKey(companyId) }),
  })
}
