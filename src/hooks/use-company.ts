import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteField, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
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
  gstRate?: number
  pricesIncludeGst?: boolean
  email: string
  phone: string
  currency: string
  timezone: string
}

/**
 * Takes the company to edit rather than assuming the active one.
 *
 * It previously wrote to `profile.companyId` regardless of which row the user clicked, which is
 * why Company Settings had to *disable* Save for every company except the active one — the
 * button did nothing and the reason was buried in the dialog's description. Passing the id makes
 * editing any company the user belongs to work, and `firestore.rules` still gates it: the update
 * requires `belongsToCompany(companyId)` and `hasMenuAccess(companyId, 'settings/company')`, so
 * an id the user has no membership in is refused server-side.
 */
export function useUpdateCompany() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ companyId, ...input }: UpdateCompanyInput & { companyId: string }) => {
      const batch = writeBatch(db)
      // A shop that switches away from Regular stops charging GST, so its rate and inclusive
      // flag are cleared rather than left behind to be picked up if it ever switches back with
      // different intentions.
      const gstFields =
        input.gstRegistration === 'Regular'
          ? { gstRate: input.gstRate ?? 18, pricesIncludeGst: input.pricesIncludeGst !== false }
          : { gstRate: deleteField(), pricesIncludeGst: deleteField() }
      batch.update(doc(db, companyDoc(companyId)), {
        ...input,
        ...gstFields,
        updatedAt: serverTimestamp(),
      })
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
    onSuccess: (_data, { companyId }) => {
      void queryClient.invalidateQueries({ queryKey: companyQueryKey(companyId) })
      // The list page reads every company the user belongs to from its own key, so that has to
      // be refreshed too or the edited row keeps showing the old name until a reload.
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
