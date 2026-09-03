import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StatusBadge } from '@/components/shared/status-badge'
import { TONE_STYLES, TONE_DOT_STYLES, toneFromStatus } from '@/lib/status-tone'
import {
  JOB_ACCESS_SCOPES,
  JOB_ACTIONS,
  JOB_STATUSES,
  countEnabledActions,
  type JobAccessScope,
} from '@/config/workflow-statuses-actions'
import { cn } from '@/lib/utils'
import type { WorkflowConfigDraft } from './types'

interface PermissionsSubtabProps {
  draft: WorkflowConfigDraft
  setDraft: (updater: (prev: WorkflowConfigDraft) => WorkflowConfigDraft) => void
  disabled: boolean
}

/** "Permissions" sub-tab of a selected role — Job Access scope, the removable-chip Status
 * Filter multi-select, and the full status×action matrix. Matches `preview (13)` exactly. */
export function PermissionsSubtab({ draft, setDraft, disabled }: PermissionsSubtabProps) {
  const [statusPickerOpen, setStatusPickerOpen] = useState(false)
  const enabledCount = countEnabledActions(draft.statusActionMatrix)

  function setJobAccess(scope: JobAccessScope) {
    setDraft((prev) => ({ ...prev, jobAccess: scope }))
  }

  function toggleStatusFilter(statusKey: string) {
    setDraft((prev) => ({
      ...prev,
      statusFilter: prev.statusFilter.includes(statusKey)
        ? prev.statusFilter.filter((s) => s !== statusKey)
        : [...prev.statusFilter, statusKey],
    }))
  }

  function toggleAction(statusKey: string, actionKey: string) {
    setDraft((prev) => ({
      ...prev,
      statusActionMatrix: {
        ...prev.statusActionMatrix,
        [statusKey]: {
          ...prev.statusActionMatrix[statusKey],
          [actionKey]: !prev.statusActionMatrix[statusKey]?.[actionKey],
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Job Access
        </p>
        <div className="flex flex-wrap gap-1.5">
          {JOB_ACCESS_SCOPES.map((scope) => (
            <Button
              key={scope.key}
              type="button"
              size="sm"
              variant={draft.jobAccess === scope.key ? 'default' : 'outline'}
              disabled={disabled}
              onClick={() => setJobAccess(scope.key)}
            >
              {scope.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Status Filter
        </p>
        <Popover open={statusPickerOpen} onOpenChange={setStatusPickerOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                disabled={disabled}
                className="flex w-full max-w-sm items-center justify-between rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50 sm:w-auto sm:min-w-64"
              >
                <span>{draft.statusFilter.length} selected</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            }
          />
          <PopoverContent className="w-64 p-1" align="start">
            {JOB_STATUSES.map((status) => (
              <label
                key={status.key}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={draft.statusFilter.includes(status.key)}
                  onCheckedChange={() => toggleStatusFilter(status.key)}
                />
                {status.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-1.5">
          {JOB_STATUSES.filter((s) => draft.statusFilter.includes(s.key)).map((status) => {
            const tone = toneFromStatus(status.label)
            return (
              <span
                key={status.key}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2 text-xs font-medium whitespace-nowrap',
                  TONE_STYLES[tone]
                )}
              >
                <span className={cn('size-1.5 rounded-full', TONE_DOT_STYLES[tone])} />
                {status.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => toggleStatusFilter(status.key)}
                    className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label={`Remove ${status.label} from status filter`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Allowed Actions per Status</h3>
            <p className="text-xs text-muted-foreground">
              Tick a box = this role can do that action while the job is in that status.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{enabledCount} enabled</span>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 z-10 min-w-32 bg-muted/40 p-2.5 text-left font-medium">
                  Status
                </th>
                {JOB_ACTIONS.map((action) => (
                  <th
                    key={action.key}
                    className="min-w-20 p-2.5 text-center text-xs font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOB_STATUSES.map((status) => (
                <tr key={status.key} className="border-b last:border-0">
                  <td className="sticky left-0 z-10 bg-background p-2.5">
                    <StatusBadge status={status.label} dot />
                  </td>
                  {JOB_ACTIONS.map((action) => (
                    <td key={action.key} className="p-2.5">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={draft.statusActionMatrix[status.key]?.[action.key] === true}
                          onCheckedChange={() => toggleAction(status.key, action.key)}
                          disabled={disabled}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
