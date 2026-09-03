import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { uomCollection, uomDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, UomDoc } from '@/types/firestore'

export interface UomWithId extends UomDoc { id: string }

export function uomQueryKey(companyId: string | undefined) {
  return ['uom', companyId] as const
}

export function useUoms() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: uomQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, uomCollection(companyId!)), orderBy('displayOrder', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as UomDoc) }))
    },
    enabled: !!companyId,
  })
}

export interface UomInput {
  name: string
  code?: string
  type: string
  symbol: string | null
  decimalPlaces: number
  displayOrder: number
  baseUomId: string | null
  conversionFactor: number | null
  description: string | null
}

export function useCreateUom() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UomInput) => {
      const ref = doc(collection(db, uomCollection(companyId)))
      const now = serverTimestamp()
      const data: UomDoc = {
        name: input.name,
        code: (input.code || slugifyCode(input.name, 8)).toUpperCase(),
        type: input.type,
        symbol: input.symbol,
        decimalPlaces: input.decimalPlaces,
        displayOrder: input.displayOrder,
        baseUomId: input.baseUomId,
        conversionFactor: input.conversionFactor,
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
        entityType: 'UOM',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: uomQueryKey(companyId) }),
  })
}

export function useUpdateUom() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UomInput & { id: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, uomDoc(companyId, input.id)), {
        name: input.name,
        type: input.type,
        symbol: input.symbol,
        decimalPlaces: input.decimalPlaces,
        displayOrder: input.displayOrder,
        baseUomId: input.baseUomId,
        conversionFactor: input.conversionFactor,
        description: input.description,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'UOM',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: uomQueryKey(companyId) }),
  })
}

export function useSetUomStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; uomName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, uomDoc(companyId, input.id)), { status: input.status, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'UOM',
        entityId: input.id,
        entityLabel: input.uomName,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: uomQueryKey(companyId) }),
  })
}

/** Only a `source: 'custom'` row may ever reach this — the UI hides/disables Delete on system
 * rows, and `firestore.rules` backs that up server-side too. */
export function useDeleteUom() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uomEntry: UomWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, uomDoc(companyId, uomEntry.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'masters',
        entityType: 'UOM',
        entityId: uomEntry.id,
        entityLabel: uomEntry.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: uomQueryKey(companyId) }),
  })
}
