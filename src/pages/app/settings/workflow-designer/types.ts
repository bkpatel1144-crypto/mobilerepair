import type { WorkflowConfigDoc } from '@/types/firestore'

/** The editable subset of `WorkflowConfigDoc` — same shape minus the doc-management fields
 * (`roleId`/`roleName`/timestamps), which the page itself carries separately rather than
 * letting the draft think it can rename or re-target a config. */
export type WorkflowConfigDraft = Omit<
  WorkflowConfigDoc,
  'roleId' | 'roleName' | 'createdAt' | 'updatedAt'
>

export function draftFromConfig(config: WorkflowConfigDoc): WorkflowConfigDraft {
  return {
    active: config.active,
    jobAccess: config.jobAccess,
    statusFilter: [...config.statusFilter],
    statusActionMatrix: Object.fromEntries(
      Object.entries(config.statusActionMatrix).map(([status, actions]) => [
        status,
        { ...actions },
      ])
    ),
    assignment: { ...config.assignment },
    whoDidIt: { ...config.whoDidIt },
    behavior: {
      ...config.behavior,
      autoOpenPopups: {
        afterJobDone: { ...config.behavior.autoOpenPopups.afterJobDone },
        afterGenerateBill: { ...config.behavior.autoOpenPopups.afterGenerateBill },
        afterReceivePayment: { ...config.behavior.autoOpenPopups.afterReceivePayment },
      },
    },
  }
}

export function draftsEqual(a: WorkflowConfigDraft, b: WorkflowConfigDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
