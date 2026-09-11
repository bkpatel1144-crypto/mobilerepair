import { Receipt } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import type { JobCardWithId } from '@/hooks/use-job-cards'
import { useCompany } from '@/hooks/use-company'
import { gstConfigFor, splitGst } from '@/lib/gst'
import { useTranslation } from 'react-i18next'

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * Bill Details — the read-only half of Sales Invoices, behind the eye.
 *
 * The eye used to open the whole job card drawer, which answers a different question: someone
 * looking down a list of bills wants the bill, not the device's intake accessories and repair
 * timeline. This is the client's own panel — who it is for, what it came to, what is left.
 *
 * "Fully settled" rather than a bare ₹0 when nothing is outstanding: the number alone reads as
 * missing data, and the phrase is the actual answer to the question being asked.
 */
export function BillDetailsModal({
  job,
  onClose,
}: {
  job: JobCardWithId | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: company } = useCompany()
  const gst = gstConfigFor(company)
  if (!job) return null

  const total = job.finalAmount ?? 0
  const tax = splitGst(total, gst)
  const outstanding = Math.max(0, total - job.paidAmount)
  const statusLabel = JOB_STATUSES.find((s) => s.key === job.status)?.label ?? job.status

  const rows: [string, React.ReactNode][] = [
    [t('common.jobCard'), <span className="font-semibold">{job.jobNumber}</span>],
    [t('common.customer'), <span className="font-semibold">{job.customerName}</span>],
    [t('common.mobile'), job.customerMobile],
    [
      t('common.device'),
      [job.brandName, job.model].filter(Boolean).join(' ') || job.deviceTypeName || '—',
    ],
    [t('common.status'), <StatusBadge status={statusLabel} dot />],
  ]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            {t('pages.sales.billDetails.billDetails')}
          </DialogTitle>
        </DialogHeader>

        <dl className="space-y-2 rounded-lg border p-3 text-sm">
          {rows.map(([label, value], i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <dl className="space-y-2 rounded-lg border p-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('pages.sales.billDetails.partsServices')}</dt>
            <dd>{money(job.partsCost)}</dd>
          </div>
          {gst.enabled && (
            <>
              <div className="flex items-center justify-between text-muted-foreground">
                <dt>{t('pages.sales.editBill.taxableValue')}</dt>
                <dd>{money(tax.taxable)}</dd>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <dt>{t('pages.sales.editBill.cgstSgst', { rate: gst.rate / 2 })}</dt>
                <dd>
                  {money(tax.cgst)} + {money(tax.sgst)}
                </dd>
              </div>
            </>
          )}
          <div className="flex items-center justify-between border-t pt-2">
            <dt className="font-semibold">{t('common.total')}</dt>
            <dd className="font-bold">{money(total)}</dd>
          </div>
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <dt>{t('common.paid')}</dt>
            <dd>{money(job.paidAmount)}</dd>
          </div>
          <div
            className={
              outstanding > 0
                ? 'flex items-center justify-between font-semibold text-red-600'
                : 'flex items-center justify-between font-semibold text-emerald-700 dark:text-emerald-400'
            }
          >
            <dt>
              {outstanding > 0
                ? t('pages.sales.billDetails.outstanding')
                : t('pages.sales.billDetails.fullySettled')}
            </dt>
            <dd>{money(outstanding)}</dd>
          </div>
        </dl>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
