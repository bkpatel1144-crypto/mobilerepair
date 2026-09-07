import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { expenseCategoriesCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { ExpenseCategoryDoc } from '@/types/firestore'

export interface ExpenseCategoryWithId extends ExpenseCategoryDoc {
  id: string
}

export function expenseCategoriesQueryKey(companyId: string | undefined) {
  return ['expenseCategories', companyId] as const
}

export function useExpenseCategories() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<ExpenseCategoryWithId[]>(
    expenseCategoriesQueryKey(companyId),
    companyId
      ? query(
          collection(db, expenseCategoriesCollection(companyId)),
          orderBy('displayOrder', 'asc')
        )
      : null,
    (docs) => docs as ExpenseCategoryWithId[],
    !!companyId
  )
}

/** Created inline from the expense form's own picker, the same "+ Add New" affordance Job Cards
 * uses for brands and problems — a category is a one-word thing and does not deserve a trip to
 * a separate Masters page mid-entry. */
export function useCreateExpenseCategory() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; existingCount: number }) => {
      const ref = doc(collection(db, expenseCategoriesCollection(companyId)))
      const now = serverTimestamp()
      const data: ExpenseCategoryDoc = {
        name: input.name.trim(),
        displayOrder: input.existingCount + 1,
        protected: false,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'finance',
        entityType: 'Expense Category',
        entityId: ref.id,
        entityLabel: data.name,
      })
      await batch.commit()
      return ref.id
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: expenseCategoriesQueryKey(companyId) }),
  })
}
