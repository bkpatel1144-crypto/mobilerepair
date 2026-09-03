import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { companyDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { CompanyDoc } from '@/types/firestore'

export interface CompanyWithId extends CompanyDoc {
  id: string
}

export function companyQueryKey(companyId: string | undefined) {
  return ['company', companyId] as const
}

/** `preview (5)`/`(6)` — this app has exactly one company per tenant (`UserDoc.companyId` is
 * single-valued, with no company-switcher anywhere), so "Company Management" here manages *the*
 * company, not a real multi-company list — the reference's own screenshot shows the identical
 * shape (a "list" with exactly one row) for the same underlying reason. A single `get()` on the
 * known `companyId`, not a collection query — sidesteps needing a `list` rule on `companies` for
 * a query that would only ever return one document anyway. See `BUILD_PLAN.md`'s Phase 10
 * deviations for the full reasoning; "Create Company" is deliberately not built for the same
 * reason (a second company doc would be permanently unreachable — nothing in this data model can
 * ever point `UserDoc.companyId` at it). */
export function useCompany() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: companyQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, companyDoc(companyId!)))
      if (!snap.exists()) return null
      return { id: snap.id, ...(snap.data() as CompanyDoc) }
    },
    enabled: !!companyId,
  })
}

export interface UpdateCompanyInput {
  name: string
  code: string
  legalName: string
  gstRegistration: CompanyDoc['gstRegistration']
  gstin: string | null
  pan: string | null
  email: string
  phone: string
  currency: string
  timezone: string
}

export function useUpdateCompany() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateCompanyInput) => {
      const batch = writeBatch(db)
      batch.update(doc(db, companyDoc(companyId)), { ...input, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'Company',
        entityId: companyId,
        entityLabel: input.name,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyQueryKey(companyId) }),
  })
}
