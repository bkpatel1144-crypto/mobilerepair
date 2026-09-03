import { Switch } from '@/components/ui/switch'
import type { WorkflowConfigDraft } from './types'

interface BehaviorSubtabProps {
  draft: WorkflowConfigDraft
  setDraft: (updater: (prev: WorkflowConfigDraft) => WorkflowConfigDraft) => void
  disabled: boolean
}

const TOGGLE_ROWS: {
  key: keyof Pick<
    WorkflowConfigDraft['behavior'],
    | 'collectPaymentWithGenerateBill'
    | 'printPromptAfterJobCardCreation'
    | 'requireDescriptionOnJobDone'
    | 'canViewPricesAndPaymentData'
    | 'allowUndoLastAction'
  >
  title: string
  description: string
}[] = [
  {
    key: 'collectPaymentWithGenerateBill',
    title: 'Collect payment with Generate Bill',
    description:
      'Collect Payment section shows in the Generate Bill popup (partial / split / outstanding).',
  },
  {
    key: 'printPromptAfterJobCardCreation',
    title: 'Print prompt after job card creation',
    description:
      'After creating a job card, a popup offers Print Label / Print Receipt / WhatsApp.',
  },
  {
    key: 'requireDescriptionOnJobDone',
    title: 'Require description on Job Done',
    description: 'Description is optional when marking a job done.',
  },
  {
    key: 'canViewPricesAndPaymentData',
    title: 'Can view prices & payment data',
    description: 'Sees estimated cost, final amount, paid, due, receipts and parts cost.',
  },
  {
    key: 'allowUndoLastAction',
    title: 'Allow undo last action',
    description: 'Undo disabled — status changes are permanent for this role.',
  },
]

/** "Behavior" sub-tab of a selected role — popups, undo & prompts. Matches `preview (11)`. */
export function BehaviorSubtab({ draft, setDraft, disabled }: BehaviorSubtabProps) {
  function setBehavior(patch: Partial<WorkflowConfigDraft['behavior']>) {
    setDraft((prev) => ({ ...prev, behavior: { ...prev.behavior, ...patch } }))
  }

  function setAutoOpen(
    which: 'afterJobDone' | 'afterGenerateBill' | 'afterReceivePayment',
    patch: Partial<WorkflowConfigDraft['behavior']['autoOpenPopups'][typeof which]>
  ) {
    setDraft((prev) => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        autoOpenPopups: {
          ...prev.behavior.autoOpenPopups,
          [which]: { ...prev.behavior.autoOpenPopups[which], ...patch },
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="divide-y rounded-lg border">
        {TOGGLE_ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 p-3">
            <div>
              <p className="text-sm font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.description}</p>
            </div>
            <Switch
              checked={draft.behavior[row.key]}
              onCheckedChange={(checked) => setBehavior({ [row.key]: checked })}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Auto-Open Popups</h3>
          <p className="text-xs text-muted-foreground">
            Which popup opens automatically after an action completes — no extra click. All OFF
            by default.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">After Job Done</p>
              <p className="text-xs text-muted-foreground">
                Technician marks the repair complete
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">Open Generate Bill</p>
                <p className="text-xs text-muted-foreground">Bill popup opens automatically</p>
              </div>
              <Switch
                checked={draft.behavior.autoOpenPopups.afterJobDone.openGenerateBill}
                onCheckedChange={(checked) => setAutoOpen('afterJobDone', { openGenerateBill: checked })}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">Open Handover</p>
                <p className="text-xs text-muted-foreground">Handover popup opens automatically</p>
              </div>
              <Switch
                checked={draft.behavior.autoOpenPopups.afterJobDone.openHandover}
                onCheckedChange={(checked) => setAutoOpen('afterJobDone', { openHandover: checked })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">After Generate Bill</p>
              <p className="text-xs text-muted-foreground">Bill is generated for the job</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">Open Handover</p>
                <p className="text-xs text-muted-foreground">Handover popup opens automatically</p>
              </div>
              <Switch
                checked={draft.behavior.autoOpenPopups.afterGenerateBill.openHandover}
                onCheckedChange={(checked) =>
                  setAutoOpen('afterGenerateBill', { openHandover: checked })
                }
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">After Receive Payment</p>
              <p className="text-xs text-muted-foreground">A payment is recorded for the job</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">Open Handover</p>
                <p className="text-xs text-muted-foreground">Handover popup opens automatically</p>
              </div>
              <Switch
                checked={draft.behavior.autoOpenPopups.afterReceivePayment.openHandover}
                onCheckedChange={(checked) =>
                  setAutoOpen('afterReceivePayment', { openHandover: checked })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
