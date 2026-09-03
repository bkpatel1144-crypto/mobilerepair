import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { useWorkflowConfig } from '@/hooks/use-workflow-config'
import type { JobCardWithId } from '@/hooks/use-job-cards'

/**
 * The whole point of Phase 4's Workflow Designer: every status-transition/action button on the
 * Job Card detail page gates on the *current user's role's* `statusActionMatrix` for the job's
 * *current* status — never "show every button always." An Owner (`fullAccess`) bypasses the
 * matrix entirely, same as every other RBAC check in this app (`usePermissions().canDo`) — a
 * role with `fullAccess` was never meant to need its own workflowConfig row filled in.
 */
export function useJobActionGating(job: JobCardWithId | null | undefined) {
  const { profile } = useAuth()
  const { isOwner } = usePermissions()
  const { data: workflowConfig, isLoading } = useWorkflowConfig(profile?.roleId)

  function canPerform(actionKey: string): boolean {
    if (!job) return false
    if (isOwner) return true
    if (!workflowConfig || workflowConfig.active === false) return false
    return workflowConfig.statusActionMatrix[job.status]?.[actionKey] === true
  }

  const behavior = workflowConfig?.behavior
  const canViewMoney = isOwner || behavior?.canViewPricesAndPaymentData !== false
  const allowUndo = isOwner || behavior?.allowUndoLastAction === true

  return { canPerform, isLoading, workflowConfig, canViewMoney, allowUndo }
}
