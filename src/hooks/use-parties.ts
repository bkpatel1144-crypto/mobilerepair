import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { partiesCollection, partyDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { getNextSequence, formatPartyId } from '@/lib/sequences'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, PartyDoc } from '@/types/firestore'

/**
 * Started minimal in Phase 5 (see `PartyDoc`'s own doc comment) so Job Cards had a real customer
 * to attach to; Phase 7 ("Masters > Parties") extends the same collection with the fuller shape
 * (category, address, GST/PAN, credit terms, Customer/Supplier as independent checkboxes) rather
 * than standing up a second one — every Phase 5/6 call site (`useCreateParty({name, mobile})`,
 * `party.type`) keeps working unchanged.
 */
export interface PartyWithId extends PartyDoc {
  id: string
}

export function partiesQueryKey(companyId: string | undefined) {
  return ['parties', companyId] as const
}

export function useParties() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: partiesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, partiesCollection(companyId!)), orderBy('name', 'asc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PartyDoc) }))
    },
    enabled: !!companyId,
  })
}

export interface CreatePartyInput {
  name: string
  mobile: string
  partyTypes?: ('customer' | 'supplier')[]
  categoryId?: string | null
  categoryName?: string | null
  email?: string | null
  address?: string | null
  gstNumber?: string | null
  panNumber?: string | null
  area?: string | null
  village?: string | null
  taluka?: string | null
  district?: string | null
  pincode?: string | null
  creditLimit?: number
  creditDays?: number
}

export function useCreateParty() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePartyInput) => {
      const fy = getCurrentFinancialYear()
      const seq = await getNextSequence(companyId, 'parties')
      const ref = doc(collection(db, partiesCollection(companyId)))
      const now = serverTimestamp()
      const partyTypes: ('customer' | 'supplier')[] = input.partyTypes?.length ? input.partyTypes : ['customer']
      const data: PartyDoc = {
        partyNumber: formatPartyId(fy.name, seq),
        name: input.name,
        mobile: input.mobile,
        // Derived for Phase 5/6 backward-compat — see `PartyDoc.type`'s own doc comment.
        type: partyTypes.includes('customer') ? 'customer' : 'supplier',
        partyTypes,
        categoryId: input.categoryId ?? null,
        categoryName: input.categoryName ?? null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        gstNumber: input.gstNumber?.trim() || null,
        panNumber: input.panNumber?.trim() || null,
        area: input.area?.trim() || null,
        village: input.village?.trim() || null,
        taluka: input.taluka?.trim() || null,
        district: input.district?.trim() || null,
        pincode: input.pincode?.trim() || null,
        creditLimit: input.creditLimit ?? 0,
        creditDays: input.creditDays ?? 0,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'masters',
        entityType: 'Party',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partiesQueryKey(companyId) }),
  })
}

export interface UpdatePartyInput extends CreatePartyInput {
  id: string
}

export function useUpdateParty() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePartyInput) => {
      const partyTypes: ('customer' | 'supplier')[] = input.partyTypes?.length ? input.partyTypes : ['customer']
      const batch = writeBatch(db)
      batch.update(doc(db, partyDoc(companyId, input.id)), {
        name: input.name,
        mobile: input.mobile,
        type: partyTypes.includes('customer') ? 'customer' : 'supplier',
        partyTypes,
        categoryId: input.categoryId ?? null,
        categoryName: input.categoryName ?? null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        gstNumber: input.gstNumber?.trim() || null,
        panNumber: input.panNumber?.trim() || null,
        area: input.area?.trim() || null,
        village: input.village?.trim() || null,
        taluka: input.taluka?.trim() || null,
        district: input.district?.trim() || null,
        pincode: input.pincode?.trim() || null,
        creditLimit: input.creditLimit ?? 0,
        creditDays: input.creditDays ?? 0,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'masters',
        entityType: 'Party',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partiesQueryKey(companyId) }),
  })
}

/** `firestore.rules` forbids a real Firestore delete on `parties` (a party may be referenced by
 * job cards/receipts elsewhere) — "Delete" in the UI is this same soft-delete-via-status pattern
 * used everywhere else in the app (`EntityStatus` already includes `'deleted'` for exactly this). */
export function useSetPartyStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; partyName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, partyDoc(companyId, input.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'deleted' ? 'Delete' : input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'masters',
        entityType: 'Party',
        entityId: input.id,
        entityLabel: input.partyName,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partiesQueryKey(companyId) }),
  })
}
