import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { buildPath } from '@/config/nav'
import { useReopenAsRework } from '@/hooks/use-rework'
import { jobWarrantyState, warrantyLinesOf } from '@/lib/warranty'
import type { JobCardWithId } from '@/hooks/use-job-cards'
import { useTranslation } from 'react-i18next'

/**
 * "The device came back." Raises a new job card linked to this one.
 *
 * Free by default when the original is still covered, because that is what a warranty means —
 * but it stays a tick box. A screen warranty does not cover a phone that has since been dropped,
 * and the person at the counter is the only one who can tell which it is.
 */
export function ReworkModal({ job, onClose }: { job: JobCardWithId; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const rework = useReopenAsRework(job)

  // Not a bare `Date.now()` in a render body — the React Compiler treats it as impure.
  const now = new Date(new Date().getTime())
  const covered =
    jobWarrantyState(warrantyLinesOf(job, now, t('pages.service.warranty.wholeBill'))) === 'live'

  const [reason, setReason] = useState('')
  const [underWarranty, setUnderWarranty] = useState(covered)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError(t('pages.service.rework.aReasonIsRequired'))
      return
    }
    rework.mutate(
      { reason: reason.trim(), underWarranty },
      {
        onSuccess: (created) => {
          onClose()
          // Straight to the new card: the device is on the counter and the next thing anyone
          // does is take the job.
          navigate(`${buildPath('service', 'job-cards')}/${created.id}`)
        },
        onError: (err) =>
          setError(
            err instanceof Error ? err.message : t('pages.service.rework.couldNotRaiseRework')
          ),
      }
    )
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={t('pages.service.rework.reopenForRework')}
      description={`${job.jobNumber} · ${job.customerName}`}
      error={error}
      onSubmit={handleSubmit}
      submitLabel={t('pages.service.rework.reopenForRework')}
      isSubmitting={rework.isPending}
      needsConnection
    >
      <p className="text-sm text-muted-foreground">{t('pages.service.rework.deviceCameBack')}</p>

      <div className="space-y-1.5">
        <Label htmlFor="reworkReason">{t('pages.service.rework.whyDidItComeBack')}</Label>
        <Textarea
          id="reworkReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('pages.service.rework.reasonPlaceholder')}
          rows={3}
          autoFocus
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border p-3">
        <Checkbox
          checked={underWarranty}
          onCheckedChange={(v) => setUnderWarranty(v === true)}
          className="mt-0.5"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            {t('pages.service.rework.underWarrantyNoCharge')}
          </span>
          <span className="block text-xs text-muted-foreground">
            {covered
              ? t('pages.service.rework.warrantyStillLive')
              : t('pages.service.rework.warrantyExpired')}
          </span>
        </span>
      </label>
    </FormModal>
  )
}
