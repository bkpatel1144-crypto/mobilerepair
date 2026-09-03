import { useState } from 'react'
import { Ban, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey, specialActionKey } from '@/config/permission-schema'
import { useApplyJobAction, useRecordPayment, useUndoLastAction } from '@/hooks/use-job-actions'
import { useJobActionGating } from '@/hooks/use-job-action-gating'
import { useAllServiceOptions } from '@/hooks/use-service-options'
import { useUsers } from '@/hooks/use-users'
import { useCompany } from '@/hooks/use-company'
import { usePrintTemplatesFor } from '@/hooks/use-print-templates'
import { useWhatsAppConfig } from '@/hooks/use-whatsapp-config'
import { renderPrintHtml, openPrintWindow } from '@/lib/print-render'
import { jobCardPrintContext, jobCardBillPrintContext } from '@/lib/print-contexts'
import { resolveWhatsAppMessage, whatsAppEventForStatus, buildWhatsAppLink } from '@/lib/whatsapp'
import { buildPath } from '@/config/nav'
import { useNavigate } from 'react-router-dom'
import type { JobCardWithId } from '@/hooks/use-job-cards'

/** Which statuses each action even makes sense in — the status×action *permission* matrix
 * (Phase 4) says whether a role is *allowed* to do something; this says whether doing it would
 * be meaningful at all given the job's current status. A button only shows when both are true. */
const ACTION_APPLICABLE_STATUSES: Record<string, string[]> = {
  takeJob: ['pending', 'inQueue'],
  jobDone: ['inProgress'],
  hold: ['pending', 'inQueue', 'inProgress'],
  resume: ['onHold'],
  generateBill: ['techDone', 'ready'],
  payment: ['techDone', 'ready', 'delivered', 'closed'],
  deliver: ['ready'],
  close: ['delivered'],
  cancel: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready'],
  returnAndClose: ['cancelled'],
  fieldVisit: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready'],
  handover: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready'],
}

type DialogKind = 'hold' | 'cancel' | 'jobDone' | 'generateBill' | 'payment' | 'handover' | 'fieldVisit' | null

export function ActionButtons({ job }: { job: JobCardWithId }) {
  const navigate = useNavigate()
  const { canDo } = usePermissions()
  const { canPerform, workflowConfig, allowUndo } = useJobActionGating(job)
  const applyAction = useApplyJobAction(job)
  const recordPayment = useRecordPayment(job)
  const undoLastAction = useUndoLastAction(job)
  const { data: options } = useAllServiceOptions()
  const { data: users = [] } = useUsers()
  const { data: company } = useCompany()
  const { defaultTemplate: jobCardTemplate } = usePrintTemplatesFor('jobCard')
  const { defaultTemplate: jobCardBillTemplate } = usePrintTemplatesFor('jobCardBill')
  const { defaultTemplate: deviceTagTemplate } = usePrintTemplatesFor('deviceTagLabel')
  const { data: whatsAppConfig } = useWhatsAppConfig()

  function handlePrintLabel() {
    if (!deviceTagTemplate) return
    openPrintWindow(renderPrintHtml(deviceTagTemplate, jobCardPrintContext(job, company)))
  }
  function handlePrintJobCard() {
    if (!jobCardTemplate) return
    openPrintWindow(renderPrintHtml(jobCardTemplate, jobCardPrintContext(job, company)))
  }
  function handlePrintBill() {
    if (!jobCardBillTemplate) return
    openPrintWindow(renderPrintHtml(jobCardBillTemplate, jobCardBillPrintContext(job, company)))
  }

  const whatsAppTemplate = whatsAppConfig?.templates.find((t) => t.event === whatsAppEventForStatus(job.status) && t.enabled)
  const whatsAppMessage = whatsAppTemplate
    ? resolveWhatsAppMessage(whatsAppTemplate.message, {
        customerName: job.customerName,
        jobNumber: job.jobNumber,
        status: job.status,
        amount: String(job.finalAmount ?? job.estimatedCost),
        shopName: company?.name ?? '',
      })
    : `Hi ${job.customerName}, update on your job card ${job.jobNumber}.`
  const whatsAppLink = buildWhatsAppLink(job.customerMobile, whatsAppConfig?.countryCode ?? '91', whatsAppMessage)

  const [dialog, setDialog] = useState<DialogKind>(null)
  const [confirmingUndo, setConfirmingUndo] = useState(false)
  const [confirmingTerminal, setConfirmingTerminal] = useState<'close' | 'returnAndClose' | null>(null)
  const [reasonInput, setReasonInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [amountInput, setAmountInput] = useState(0)
  const [modeInput, setModeInput] = useState<'cash' | 'upi' | 'card'>('cash')
  const [handoverToId, setHandoverToId] = useState<string | undefined>()
  const [collectPayment, setCollectPayment] = useState(false)
  const [durationInput, setDurationInput] = useState<number | ''>('')

  function shows(action: string) {
    return ACTION_APPLICABLE_STATUSES[action]?.includes(job.status) && canPerform(action)
  }

  function closeDialog() {
    setDialog(null)
    setReasonInput('')
    setDescriptionInput('')
    setAmountInput(0)
    setHandoverToId(undefined)
    setCollectPayment(false)
    setDurationInput('')
  }

  async function submitDialog(e: React.FormEvent) {
    e.preventDefault()
    if (dialog === 'hold') {
      if (!reasonInput.trim()) return
      await applyAction.mutateAsync({ action: 'hold', reason: reasonInput.trim() })
    } else if (dialog === 'cancel') {
      if (!reasonInput.trim()) return
      await applyAction.mutateAsync({ action: 'cancel', reason: reasonInput.trim() })
    } else if (dialog === 'jobDone') {
      const requireDescription = workflowConfig?.behavior.requireDescriptionOnJobDone
      if (requireDescription && !descriptionInput.trim()) return
      await applyAction.mutateAsync({ action: 'jobDone', description: descriptionInput.trim() || undefined })
    } else if (dialog === 'generateBill') {
      await applyAction.mutateAsync({ action: 'generateBill', finalAmount: amountInput })
      if (collectPayment && amountInput > 0) {
        await recordPayment.mutateAsync({ amount: amountInput, mode: modeInput, purpose: 'final' })
      }
    } else if (dialog === 'payment') {
      if (amountInput <= 0) return
      await recordPayment.mutateAsync({ amount: amountInput, mode: modeInput, purpose: 'final' })
    } else if (dialog === 'handover') {
      const toUser = users.find((u) => u.id === handoverToId)
      if (!toUser) return
      await applyAction.mutateAsync({ action: 'handover', toUserId: toUser.id, toUserName: toUser.fullName })
    } else if (dialog === 'fieldVisit') {
      await applyAction.mutateAsync({
        action: 'fieldVisit',
        durationMinutes: durationInput === '' ? undefined : durationInput,
        note: descriptionInput.trim() || undefined,
      })
    }
    closeDialog()
  }

  const collectPaymentDefault = workflowConfig?.behavior.collectPaymentWithGenerateBill === true
  const isTerminal = ['closed', 'cancelled', 'pendingReturn'].includes(job.status)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {shows('cancel') && (
          <Button type="button" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setDialog('cancel')}>
            <Ban className="size-4" />
            Cancel Job
          </Button>
        )}
        {canDo(crudKey('service', 'jobCards', 'create')) && (
          <Button type="button" variant="outline" onClick={() => navigate(buildPath('service', 'job-cards') + '/create')}>
            <RotateCcw className="size-4" />
            Repeat Job
          </Button>
        )}
        {canDo(specialActionKey('service', 'printLabel')) && (
          <Button type="button" variant="outline" onClick={handlePrintLabel} disabled={!deviceTagTemplate}>
            Print Label
          </Button>
        )}
        {canDo(specialActionKey('service', 'printJobCard')) && (
          <Button type="button" variant="outline" onClick={handlePrintJobCard} disabled={!jobCardTemplate}>
            Print Job Card
          </Button>
        )}
        {canDo(specialActionKey('service', 'printBill')) && (
          <Button type="button" variant="outline" onClick={handlePrintBill} disabled={!jobCardBillTemplate}>
            Print Bill
          </Button>
        )}
        <Button
          type="button"
          className="bg-teal-600 hover:bg-teal-700"
          render={<a href={whatsAppLink} target="_blank" rel="noreferrer" />}
        >
          WhatsApp
        </Button>

        {shows('takeJob') && (
          <Button type="button" onClick={() => applyAction.mutate({ action: 'takeJob' })} disabled={applyAction.isPending}>
            Take Job
          </Button>
        )}
        {shows('jobDone') && (
          <Button type="button" onClick={() => setDialog('jobDone')}>
            Job Done
          </Button>
        )}
        {shows('hold') && (
          <Button type="button" variant="outline" onClick={() => setDialog('hold')}>
            Hold
          </Button>
        )}
        {shows('resume') && (
          <Button type="button" onClick={() => applyAction.mutate({ action: 'resume' })} disabled={applyAction.isPending}>
            Resume
          </Button>
        )}
        {shows('generateBill') && (
          <Button
            type="button"
            onClick={() => {
              setAmountInput(job.estimatedCost + job.partsCost)
              setCollectPayment(collectPaymentDefault)
              setDialog('generateBill')
            }}
          >
            Generate Bill
          </Button>
        )}
        {shows('payment') && (
          <Button type="button" variant="outline" onClick={() => setDialog('payment')}>
            Payment
          </Button>
        )}
        {shows('deliver') && (
          <Button type="button" onClick={() => applyAction.mutate({ action: 'deliver' })} disabled={applyAction.isPending}>
            Deliver
          </Button>
        )}
        {shows('close') && (
          <Button type="button" onClick={() => setConfirmingTerminal('close')} disabled={applyAction.isPending}>
            Close
          </Button>
        )}
        {shows('returnAndClose') && (
          <Button type="button" onClick={() => setConfirmingTerminal('returnAndClose')} disabled={applyAction.isPending}>
            Return &amp; Close
          </Button>
        )}
        {shows('fieldVisit') && (
          <Button type="button" variant="outline" onClick={() => setDialog('fieldVisit')}>
            Field Visit
          </Button>
        )}
        {shows('handover') && (
          <Button type="button" variant="outline" onClick={() => setDialog('handover')}>
            Handover
          </Button>
        )}
      </div>

      {!isTerminal && allowUndo && job.lastActionUndo && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <span className="flex items-center gap-2">
            <Undo2 className="size-4" />
            Undo Last Action ({job.lastActionUndo.actionLabel}) · no time limit
          </span>
          <Button type="button" size="sm" variant="outline" className="border-amber-400" onClick={() => setConfirmingUndo(true)} disabled={undoLastAction.isPending}>
            <Undo2 className="size-3.5" />
            Undo
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmingUndo}
        onOpenChange={setConfirmingUndo}
        title={`Undo "${job.lastActionUndo?.actionLabel}"?`}
        message="This reverts the job's own fields to before that action and permanently deletes its timeline entry — the audit trail for this specific action is erased, not just hidden."
        confirmLabel="Undo"
        isPending={undoLastAction.isPending}
        onConfirm={() => undoLastAction.mutate(undefined, { onSuccess: () => setConfirmingUndo(false) })}
      />

      <ConfirmDialog
        open={confirmingTerminal !== null}
        onOpenChange={(o) => !o && setConfirmingTerminal(null)}
        title={confirmingTerminal === 'close' ? 'Close this job?' : 'Return device & close this job?'}
        message={
          allowUndo
            ? 'This is a terminal status — once closed, "Undo Last Action" is no longer available for it.'
            : 'This is a terminal status and cannot be changed afterward.'
        }
        confirmLabel={confirmingTerminal === 'close' ? 'Close' : 'Return & Close'}
        destructive={false}
        isPending={applyAction.isPending}
        onConfirm={() => {
          if (confirmingTerminal) applyAction.mutate({ action: confirmingTerminal }, { onSuccess: () => setConfirmingTerminal(null) })
        }}
      />

      <FormModal
        open={dialog === 'hold'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Hold Job"
        onSubmit={submitDialog}
        submitLabel="Hold"
        isSubmitting={applyAction.isPending}
      >
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Select value={reasonInput} onValueChange={(v) => v && setReasonInput(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a reason..." />
            </SelectTrigger>
            <SelectContent>
              {options?.holdReasons.map((r) => (
                <SelectItem key={r.id} value={r.label}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      <FormModal
        open={dialog === 'cancel'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Cancel Job"
        onSubmit={submitDialog}
        submitLabel="Cancel Job"
        isSubmitting={applyAction.isPending}
      >
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Select value={reasonInput} onValueChange={(v) => v && setReasonInput(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a reason..." />
            </SelectTrigger>
            <SelectContent>
              {options?.cancelReasons.map((r) => (
                <SelectItem key={r.id} value={r.label}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      <FormModal
        open={dialog === 'jobDone'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Mark Job Done"
        onSubmit={submitDialog}
        submitLabel="Job Done"
        isSubmitting={applyAction.isPending}
      >
        <div className="space-y-1.5">
          <Label>
            Description{workflowConfig?.behavior.requireDescriptionOnJobDone && <span className="text-red-600"> *</span>}
          </Label>
          <Textarea value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} placeholder="What was done..." rows={3} />
        </div>
      </FormModal>

      <FormModal
        open={dialog === 'generateBill'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Generate Bill"
        onSubmit={submitDialog}
        submitLabel="Generate Bill"
        isSubmitting={applyAction.isPending || recordPayment.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Final Amount</Label>
            <Input type="number" min={0} value={amountInput} onChange={(e) => setAmountInput(Number(e.target.value) || 0)} />
          </div>
          {workflowConfig?.behavior.collectPaymentWithGenerateBill && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={collectPayment} onChange={(e) => setCollectPayment(e.target.checked)} />
                Collect payment now
              </label>
              {collectPayment && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Mode</Label>
                    <Select value={modeInput} onValueChange={(v) => v && setModeInput(v as typeof modeInput)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </FormModal>

      <FormModal
        open={dialog === 'payment'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Record Payment"
        onSubmit={submitDialog}
        submitLabel="Record Payment"
        isSubmitting={recordPayment.isPending}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" min={0} value={amountInput} onChange={(e) => setAmountInput(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={modeInput} onValueChange={(v) => v && setModeInput(v as typeof modeInput)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={dialog === 'handover'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Handover"
        onSubmit={submitDialog}
        submitLabel="Handover"
        isSubmitting={applyAction.isPending}
      >
        <div className="space-y-1.5">
          <Label>Handover to</Label>
          <Select value={handoverToId} onValueChange={(v) => v && setHandoverToId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      <FormModal
        open={dialog === 'fieldVisit'}
        onOpenChange={(o) => !o && closeDialog()}
        title="Log Field Visit"
        onSubmit={submitDialog}
        submitLabel="Log Visit"
        isSubmitting={applyAction.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Time Spent (minutes) <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input
              type="number"
              min={0}
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value === '' ? '' : Number(e.target.value) || 0)}
              placeholder="e.g. 45"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Textarea value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} placeholder="What was done on-site..." rows={2} />
          </div>
        </div>
      </FormModal>
    </>
  )
}
