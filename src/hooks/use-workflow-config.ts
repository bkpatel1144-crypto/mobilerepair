import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { workflowConfigCollection, workflowConfigDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { emptyStatusActionMatrix } from '@/config/workflow-statuses-actions'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { WorkflowConfigDoc } from '@/types/firestore'

export interface WorkflowConfigWithId extends WorkflowConfigDoc {
  id: string // == roleId
}

export function workflowConfigsQueryKey(companyId: string | undefined) {
  return ['workflowConfigs', companyId] as const
}

export function workflowConfigQueryKey(companyId: string | undefined, roleId: string | undefined) {
  return ['workflowConfig', companyId, roleId] as const
}

/** Every role that has ever been saved at least once — backs the "CONFIGURED ROLES" grid.
 * A brand-new company has none yet; `role-permissions-tab.tsx` shows an empty state and points
 * at the role picker dropdown instead, which lists *every* role (configured or not). */
export function useWorkflowConfigs() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: workflowConfigsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, workflowConfigCollection(companyId!)))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkflowConfigDoc) }))
    },
    enabled: !!companyId,
  })
}

export function useWorkflowConfig(roleId: string | undefined) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: workflowConfigQueryKey(companyId, roleId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, workflowConfigDoc(companyId!, roleId!)))
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as WorkflowConfigDoc) }) : null
    },
    enabled: !!companyId && !!roleId,
  })
}

/** A never-before-configured role's starting point — every status×action box unchecked, "All
 * Jobs" access, every status in the filter (a role should see everything until an Owner
 * deliberately narrows it), every behavior toggle off except the two the reference app itself
 * ships on by default (`preview (11)`: Collect payment with Generate Bill, Print prompt after
 * job card creation). */
export function blankWorkflowConfig(roleId: string, roleName: string): WorkflowConfigDoc {
  return {
    roleId,
    roleName,
    active: true,
    jobAccess: 'all',
    statusFilter: [
      'pending', 'inQueue', 'inProgress', 'onHold', 'techDone',
      'ready', 'delivered', 'closed', 'cancelled', 'pendingReturn',
    ],
    statusActionMatrix: emptyStatusActionMatrix(),
    assignment: { assignToRoles: 'all', handoverRoles: 'all', defaultHandover: null },
    whoDidIt: {
      receivedBy: false,
      deliveredBy: false,
      cancelledBy: false,
      returnedBy: false,
      fieldVisitTechnician: false,
      fieldVisitTechnicianRoles: 'all',
    },
    behavior: {
      collectPaymentWithGenerateBill: true,
      printPromptAfterJobCardCreation: true,
      requireDescriptionOnJobDone: false,
      canViewPricesAndPaymentData: true,
      allowUndoLastAction: false,
      autoOpenPopups: {
        afterJobDone: { openGenerateBill: false, openHandover: false },
        afterGenerateBill: { openHandover: false },
        afterReceivePayment: { openHandover: false },
      },
    },
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
  }
}

export function useSaveWorkflowConfig() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: WorkflowConfigDoc) => {
      const batch = writeBatch(db)
      batch.set(doc(db, workflowConfigDoc(companyId, config.roleId)), {
        ...config,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'Workflow Config',
        entityId: config.roleId,
        entityLabel: config.roleName,
        critical: true, // changes which status-action buttons a role can even see
      })
      await batch.commit()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowConfigsQueryKey(companyId) })
      queryClient.invalidateQueries({
        queryKey: workflowConfigQueryKey(companyId, variables.roleId),
      })
    },
  })
}
