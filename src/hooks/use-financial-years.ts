import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { financialYearsCollection, financialYearDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { FinancialYearDoc } from '@/types/firestore'

export interface FinancialYearWithId extends FinancialYearDoc {
  id: string
}

export function financialYearsQueryKey(companyId: string | undefined) {
  return ['financialYears', companyId] as const
}

/** Whole-collection fetch, sorted client-side by `startDate` (newest first) — same
 * not-a-server-`orderBy` reasoning as every other list hook here. */
export function useFinancialYears() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<(FinancialYearDoc & { id: string })[]>(
    financialYearsQueryKey(companyId),
    companyId ? collection(db, financialYearsCollection(companyId)) : null,
    (docs) => {
      const rows = docs as (FinancialYearDoc & { id: string })[]
      return ((rows) => rows
        .sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis()))(rows)
    },
    !!companyId
  )
}

/** `preview (3)` — Name/Start/End Date, for a manually created (non-sequential) FY. Never
 * auto-activates: a newly created FY starts `isActive: false`/`isCurrent: false` so creating one
 * ahead of time (e.g. preparing next year's FY before the switchover date) can't silently change
 * which period new transactions land under — see `useActivateFinancialYear` for that. */
export function useCreateFinancialYear() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; startDate: Date; endDate: Date }) => {
      const ref = doc(collection(db, financialYearsCollection(companyId)))
      const now = serverTimestamp()
      const data: FinancialYearDoc = {
        name: input.name,
        startDate: Timestamp.fromDate(input.startDate),
        endDate: Timestamp.fromDate(input.endDate),
        isActive: false,
        isLocked: false,
        isCurrent: false,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'settings',
        entityType: 'Financial Year',
        entityId: ref.id,
        entityLabel: data.name,
        critical: true,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyId) }),
  })
}

/**
 * Renames a financial year or corrects its dates.
 *
 * Only those three fields. `isActive`/`isCurrent`/`isLocked` are state transitions with their own
 * invariants — "only one active at a time" is enforced atomically by `useActivateFinancialYear`,
 * and letting a plain edit set them would route around that.
 *
 * A locked year is refused: closing a period is the point at which its figures stop moving, and
 * shifting its dates afterwards would silently re-scope every report that reads them.
 */
export function useUpdateFinancialYear() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; name: string; startDate: Date; endDate: Date; isLocked: boolean }) => {
      if (input.isLocked) {
        throw new Error('This financial year is closed. Reopen it before editing its dates.')
      }
      if (input.endDate <= input.startDate) {
        throw new Error('The end date must be after the start date.')
      }
      const batch = writeBatch(db)
      batch.update(doc(db, financialYearDoc(companyId, input.id)), {
        name: input.name,
        startDate: Timestamp.fromDate(input.startDate),
        endDate: Timestamp.fromDate(input.endDate),
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'Financial Year',
        entityId: input.id,
        entityLabel: input.name,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyId) }),
  })
}

/** Deactivates whichever FY is currently `isCurrent`/`isActive` and activates the target one, in
 * one atomic batch — the only way `isActive`/`isCurrent` ever change, so "only one financial year
 * can be active at a time" (`preview (4)`'s own copy) is a real invariant, not just a UI
 * convention. A `isLocked` FY is skipped when deactivating everything else (its own lock status
 * is untouched by someone else's activation) and can never itself be the activation target. */
export function useActivateFinancialYear() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { target: FinancialYearWithId; allFYs: FinancialYearWithId[] }) => {
      if (input.target.isLocked) throw new Error('A locked financial year cannot be activated.')
      const batch = writeBatch(db)
      for (const fy of input.allFYs) {
        if (fy.id === input.target.id || !fy.isCurrent) continue
        batch.update(doc(db, financialYearDoc(companyId, fy.id)), { isActive: false, isCurrent: false, updatedAt: serverTimestamp() })
      }
      batch.update(doc(db, financialYearDoc(companyId, input.target.id)), { isActive: true, isCurrent: true, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Activate',
        module: 'settings',
        entityType: 'Financial Year',
        entityId: input.target.id,
        entityLabel: input.target.name,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyId) }),
  })
}

export function useSetFinancialYearLock() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; isLocked: boolean; name: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, financialYearDoc(companyId, input.id)), { isLocked: input.isLocked, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.isLocked ? 'Lock' : 'Unlock',
        module: 'settings',
        entityType: 'Financial Year',
        entityId: input.id,
        entityLabel: input.name,
        critical: true,
        details: {
          note: 'Advisory only in this build — no other feature currently reads/enforces isLocked against posting new transactions.',
        },
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyId) }),
  })
}
