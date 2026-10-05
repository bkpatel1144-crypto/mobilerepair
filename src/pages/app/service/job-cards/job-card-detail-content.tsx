import { useState } from 'react'
import {
  Wrench,
  Phone,
  ClipboardList,
  Smartphone,
  AlertTriangle,
  UserRound,
  IndianRupee,
  Cog,
  Image as ImageIcon,
  StickyNote,
  Plus,
  ChevronDown,
  ChevronUp,
  Expand,
  Tags,
  History,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { SearchSelect } from '@/components/shared/search-select'
import { useJobTimeline, type JobCardWithId } from '@/hooks/use-job-cards'
import { useItemAttributes } from '@/hooks/use-item-attributes'
import { attributeRows, attributesFor } from '@/lib/attribute-values'
import { usePermissions } from '@/hooks/use-permissions'
import { CreateItemPage } from '@/pages/app/masters/items/create-item-page'
import { useJobCards } from '@/hooks/use-job-cards'
import { warrantyLinesOf, jobWarrantyState } from '@/lib/warranty'
import { Link } from 'react-router-dom'
import { buildPath } from '@/config/nav'
import { useStock } from '@/hooks/use-stock'
import { fitCheck, stockByItemId, stockHelperText } from '@/lib/stock-check'
import { useApplyJobAction } from '@/hooks/use-job-actions'
import { useJobActionGating } from '@/hooks/use-job-action-gating'
import { useItems } from '@/hooks/use-items'
import { useReceipts } from '@/hooks/use-receipts'
import { cn } from '@/lib/utils'
import { DetailPanel, CountChip, EmptyDash } from './detail-panel'
import { uploadJobCardImage } from '@/lib/job-card-images'
import { useAuth } from '@/hooks/use-auth'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import { ActionButtons } from './action-buttons'
import { TimelinePanel } from './timeline-panel'
import { useTranslation } from 'react-i18next'
import { actionAppliesTo } from '@/config/job-action-statuses'

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

/** One line of a bill: label left, amount right, digits that line up between rows. */
function MoneyRow({
  label,
  amount,
  strong,
  muted,
}: {
  label: string
  amount: number
  strong?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <dt className={muted ? 'text-muted-foreground' : undefined}>{label}</dt>
      <dd className={cn('tabular-nums', strong && 'font-semibold')}>₹{amount}</dd>
    </div>
  )
}

/**
 * The single component behind both the Job Card detail drawer and its full-page view — the
 * exact same markup, just constrained by a narrower container in the drawer. Matches
 * `preview (71)`/`(72)` panel-for-panel.
 */
export function JobCardDetailContent({
  job,
  onExpand,
}: {
  job: JobCardWithId
  onExpand?: () => void
}) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { data: allAttributes = [] } = useItemAttributes()

  // Reworks are found by looking, not by a list kept on this document: a stored array would need
  // every rework write to remember to update the original, and one that forgot would be wrong
  // for good. Previous repairs match on the device itself (IMEI, else serial), which is the only
  // identifier that survives a customer changing their phone number.
  const { data: allJobs = [] } = useJobCards()
  const reworkedAs = allJobs.filter((j) => j.reworkOfJobCardId === job.id)
  const deviceKey = job.imei || job.serialNo
  const previousRepairs = deviceKey
    ? allJobs.filter(
        (j) =>
          j.id !== job.id &&
          j.reworkOfJobCardId !== job.id &&
          j.id !== job.reworkOfJobCardId &&
          (j.imei || j.serialNo) === deviceKey
      )
    : []
  const jobAttributeRows = attributeRows(attributesFor(allAttributes, 'jobCard'), job.attributes, {
    yes: t('common.yes'),
    no: t('common.no'),
  })
  const {
    data: timeline = [],
    error: timelineError,
    refetch: refetchTimeline,
  } = useJobTimeline(job.id)
  const { canPerform, canViewMoney } = useJobActionGating(job)
  const applyAction = useApplyJobAction(job)
  const { data: items = [] } = useItems()
  const { data: receipts = [] } = useReceipts()
  // Newest last, so the row reads in the order the money actually moved.
  const jobReceipts = receipts.filter((r) => r.jobCardId === job.id)

  const [notesOpen, setNotesOpen] = useState(true)
  const [addPartOpen, setAddPartOpen] = useState(false)

  /**
   * Parts can be added right up until the bill is generated, and not after.
   *
   * `canPerform` answers a different question — whether this role is allowed to add a part at
   * all — and returns true for an owner at every status, so on its own it offered "Add Part" on
   * a job that was billed, delivered and closed. Adding one there raised `partsCost` and left
   * `finalAmount` untouched, which is the shop paying for a part it never charged for.
   */
  const canAddParts = actionAppliesTo('addPart', job.status) && canPerform('addPart')
  const [partItemId, setPartItemId] = useState<string | null>(null)
  const [partRate, setPartRate] = useState(0)
  const [partQty, setPartQty] = useState(1)
  /** Ticked to fit a part the shop does not have enough of. Reset whenever the part changes, so
   *  an override granted for one part is never carried silently to the next. */
  const [stockOverride, setStockOverride] = useState(false)
  /** The name typed into the parts picker before pressing Add. */
  const [addingPart, setAddingPart] = useState<string | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  const partOptions = items.filter((i) => i.type === 'part' || i.type === 'service')

  // On-hand is derived from purchases minus what jobs have consumed — see `useStock`. An item
  // with no row here is untracked (every service, and any part the shop chose not to count), and
  // is deliberately never blocked.
  // Only an owner can fit what the shop does not have. A block with no way past it does not stop
  // the part being fitted — it stops it being *recorded*, which is strictly worse than a
  // negative number, because then nobody knows either.
  const { isOwner } = usePermissions()
  const canOverrideStock = isOwner

  const stock = useStock()
  const stockPositions = stockByItemId(stock.rows)
  const partFit = fitCheck(partItemId ? stockPositions.get(partItemId) : undefined, partQty)
  const stockLabels = {
    inStock: (n: number) => t('pages.service.jobCardDetailContent.nInStock', { count: n }),
    outOfStock: t('pages.service.jobCardDetailContent.outOfStock'),
    low: (n: number) => t('pages.service.jobCardDetailContent.onlyNLeft', { count: n }),
  }
  // Not a bare `Date.now()` in a render body — the React Compiler treats it as impure.
  const warrantyState = jobWarrantyState(
    warrantyLinesOf(job, new Date(new Date().getTime()), t('pages.service.warranty.wholeBill'))
  )

  const balance = (job.finalAmount ?? job.estimatedCost) - job.paidAmount

  async function handleAddImage(file: File) {
    const url = await uploadJobCardImage(profile!.companyId, job.id, file)
    applyAction.mutate({ action: 'addImage', url })
  }

  return (
    // `@container`, not viewport breakpoints. This same component is the full page *and* the
    // drawer, and `lg:grid-cols-3` looked at the window rather than the space it actually had —
    // so in the drawer it laid out three columns inside a sheet, wrapping "RCP-1509-00001" over
    // three lines and "Keypad Phone" over two. Container queries ask the right question.
    <div className="@container space-y-4">
      {/* One band carrying what anyone asks first: which job, for whom, which device, and what
       * is still owed. It was four lines of plain text on white. */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-gradient-to-br from-muted/60 to-card px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Wrench className="size-5 text-teal-600" />
            <span className="text-lg font-bold">#{job.jobNumber}</span>
            <StatusBadge status={statusLabel(job.status)} dot />
            {/* The one warranty question anyone asks, answered without opening another screen.
             * `billWarranty` and the per-part warranties were written and read by nothing. */}
            {warrantyState !== 'none' && (
              <span
                className={
                  'rounded-full px-2 py-0.5 text-xs font-semibold ' +
                  (warrantyState === 'live'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : warrantyState === 'expired'
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400')
                }
              >
                {t(`pages.service.warranty.state.${warrantyState}`)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{formatDateOnly(job)}</span>
            {onExpand && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={onExpand}
              >
                <Expand className="size-4" />
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
              {job.customerName.slice(0, 2).toUpperCase()}
            </span>
            <span className="font-medium">{job.customerName}</span>
            <a
              href={`tel:${job.customerMobile}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <Phone className="size-3.5" />
              {job.customerMobile}
            </a>
            {(job.brandName || job.model) && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Smartphone className="size-3.5" />
                {[job.brandName, job.model].filter(Boolean).join(' ')}
              </span>
            )}
          </div>
        </div>

        {/* The number the counter is actually asking about. */}
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {balance > 0 ? t('common.balance') : t('common.paid')}
          </p>
          <p
            className={
              'text-2xl font-bold tabular-nums ' +
              (balance > 0 ? 'text-amber-600' : 'text-teal-600')
            }
          >
            {balance > 0 ? `₹${balance}` : `₹${job.paidAmount}`}
          </p>
        </div>
      </div>

      {addingPart !== null && (
        <CreateItemPage
          defaultName={addingPart}
          onCancel={() => setAddingPart(null)}
          onSaved={(item) => {
            setPartItemId(item.id)
            setAddingPart(null)
          }}
        />
      )}

      <ActionButtons job={job} />

      {/* The link reads in both directions. Opening either card without knowing about the other
       * is the failure the whole rework feature exists to prevent. */}
      {(job.reworkOfJobCardNumber || reworkedAs.length > 0 || previousRepairs.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <History className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          {job.reworkOfJobCardId && (
            <Link
              to={`${buildPath('service', 'job-cards')}/${job.reworkOfJobCardId}`}
              className="font-medium text-amber-900 underline dark:text-amber-300"
            >
              {t('pages.service.rework.reworkOf', { job: job.reworkOfJobCardNumber })}
            </Link>
          )}
          {job.isWarrantyJob && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
              {t('pages.service.rework.warrantyJob')}
            </span>
          )}
          {reworkedAs.map((r) => (
            <Link
              key={r.id}
              to={`${buildPath('service', 'job-cards')}/${r.id}`}
              className="font-medium text-amber-900 underline dark:text-amber-300"
            >
              {t('pages.service.rework.cameBackAs', { job: r.jobNumber })}
            </Link>
          ))}
          {previousRepairs.length > 0 && (
            <span className="text-xs text-amber-900/80 dark:text-amber-300/80">
              {t('pages.service.rework.previousRepairs')}:{' '}
              {previousRepairs.map((p) => p.jobNumber).join(', ')}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        <div className="space-y-4">
          <DetailPanel
            icon={ClipboardList}
            title={t('pages.service.jobCardDetailContent.itemsAtIntake')}
          >
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground uppercase">
                  {t('pages.service.jobCardDetailContent.receivedAtIntake')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.itemsReceived.length === 0 && <EmptyDash />}
                  {job.itemsReceived.map((label) => (
                    <StatusBadge key={label} status={label} tone="warning" />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground uppercase">
                  {t('pages.service.jobCardDetailContent.returnedAtIntake')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.itemsReturned.length === 0 && <EmptyDash />}
                  {job.itemsReturned.map((label) => (
                    <StatusBadge key={label} status={label} tone="success" />
                  ))}
                </div>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel icon={Smartphone} title={t('common.device')}>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground uppercase">{t('common.type')}</dt>
                <dd>{job.deviceTypeName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">{t('common.brand')}</dt>
                <dd>{job.brandName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">{t('common.model')}</dt>
                <dd>{job.model ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">{t('shared.imei')}</dt>
                <dd>{job.imei ?? '—'}</dd>
              </div>
              {job.devicePinPattern && (
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">
                    {t('shared.pinPattern')}
                  </dt>
                  <dd>{job.devicePinPattern}</dd>
                </div>
              )}
            </dl>
          </DetailPanel>

          {jobAttributeRows.length > 0 && (
            <DetailPanel icon={Tags} title={t('pages.masters.createItem.sections.attributes')}>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {jobAttributeRows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs text-muted-foreground uppercase">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </DetailPanel>
          )}

          <DetailPanel
            icon={AlertTriangle}
            title={t('pages.service.jobCardDetailContent.problemReported')}
          >
            <div className="flex flex-wrap gap-1.5">
              {job.problemLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                >
                  {label}
                </span>
              ))}
            </div>
            {job.remark && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase">{t('common.remark')}</p>
                <p className="text-sm">{job.remark}</p>
              </div>
            )}
          </DetailPanel>

          <DetailPanel icon={UserRound} title={t('pages.service.jobCardDetailContent.assignment')}>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                {(job.assignedToName ?? '—').slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium">
                  {job.assignedToName ?? t('shared.unassigned')}
                </p>
                <p className="text-xs text-muted-foreground">{t('common.technician')}</p>
              </div>
            </div>
            <dl className="space-y-1 pt-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('common.receivedBy')}</dt>
                <dd>{job.receivedByName}</dd>
              </div>
              {job.deliveredByName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('shared.deliveredBy')}</dt>
                  <dd>{job.deliveredByName}</dd>
                </div>
              )}
              {job.cancelledByName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('shared.cancelledBy')}</dt>
                  <dd>{job.cancelledByName}</dd>
                </div>
              )}
            </dl>
          </DetailPanel>
        </div>

        <div className="space-y-4">
          {canViewMoney && (
            <DetailPanel icon={IndianRupee} title={t('common.payment')} tone="accent">
              {/* Money reads down a column, right-aligned and tabular, the way a bill does.
               * Four label-over-value pairs in a 2×2 grid made ₹500 owed look like a field. */}
              <dl className="text-sm">
                <MoneyRow
                  label={t('pages.service.jobCardDetailContent.estimated')}
                  amount={job.estimatedCost}
                />
                <MoneyRow
                  label={t('pages.service.jobCardDetailContent.partsCost')}
                  amount={job.partsCost}
                />
                {job.finalAmount != null && (
                  <MoneyRow label={t('common.finalAmount')} amount={job.finalAmount} strong />
                )}
                <MoneyRow label={t('common.advance')} amount={job.advanceReceived} muted />
                <MoneyRow label={t('common.paid')} amount={job.paidAmount} muted />
                <div className="mt-1 flex items-baseline justify-between border-t pt-2">
                  <dt className="font-semibold">{t('common.balance')}</dt>
                  <dd
                    className={
                      balance <= 0
                        ? 'font-semibold text-teal-600'
                        : 'text-base font-bold text-amber-600 tabular-nums'
                    }
                  >
                    {balance <= 0 ? (
                      <span className="flex items-center gap-1">
                        <Check className="size-3.5" aria-hidden />
                        {t('pages.service.jobCardDetailContent.paid')}
                      </span>
                    ) : (
                      `₹${balance}`
                    )}
                  </dd>
                </div>
              </dl>
              {/* What was actually taken, and how. The panel showed totals but never the
               * receipts behind them, so "Paid ₹250" could not be traced to anything — and a
               * refund on a bill edit was invisible here entirely. */}
              {jobReceipts.length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  <p className="text-xs text-muted-foreground uppercase">
                    {t('pages.service.jobCardDetailContent.receipts')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {jobReceipts.map((r) => (
                      <span
                        key={r.id}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs',
                          r.voided && 'line-through opacity-60',
                          r.direction === 'out'
                            ? 'border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-400'
                            : 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400'
                        )}
                      >
                        <span className="font-medium">{r.receiptNumber}</span>
                        <span>
                          {r.direction === 'out' ? '−' : ''}₹{r.amount}
                        </span>
                        <span className="rounded-full bg-muted px-1.5 capitalize">{r.mode}</span>
                        {r.purpose === 'advance' && (
                          <span className="rounded-full bg-amber-100 px-1.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                            {t('pages.service.jobCardDetailContent.adv')}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </DetailPanel>
          )}

          <DetailPanel
            icon={Cog}
            title={t('pages.service.jobCardDetailContent.partsUsed')}
            action={<CountChip n={job.partsUsed.length} />}
          >
            <div className="space-y-1.5">
              {job.partsUsed.map((p) => {
                // Parts added before Edit Bill existed have no `itemCode`, so it is looked up
                // from Item Master by id for those. Newer ones carry the code they were sold
                // under, which is the one that belongs on a bill.
                const code = p.itemCode ?? items.find((i) => i.id === p.itemId)?.itemCode
                return (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.itemName}</p>
                      {code && <p className="text-xs text-muted-foreground">{code}</p>}
                    </div>
                    {canViewMoney && (
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">₹{p.rate * p.qty}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{p.rate} × {p.qty}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
              {job.partsUsed.length === 0 && (
                <p className="text-sm text-muted-foreground/70">
                  {t('pages.service.jobCardDetailContent.noPartsUsedYet')}
                </p>
              )}
              {/* Every row carried its own total and the panel none, so the one number anyone
               * adds up by hand — what the parts came to — was the one not shown. */}
              {canViewMoney && job.partsUsed.length > 1 && (
                <div className="flex items-baseline justify-between border-t pt-2 text-sm font-semibold">
                  <span>{t('pages.service.jobCardDetailContent.partsTotal')}</span>
                  <span className="tabular-nums">
                    ₹{job.partsUsed.reduce((sum, part) => sum + part.rate * part.qty, 0)}
                  </span>
                </div>
              )}
            </div>
            {canAddParts &&
              (addPartOpen ? (
                <div className="space-y-2 rounded-md border border-dashed p-2">
                  <SearchSelect
                    options={partOptions.map((i) => {
                      const stockText = stockHelperText(stockPositions.get(i.id), stockLabels)
                      const price = i.sellingPrice ? `₹${i.sellingPrice}` : undefined
                      return {
                        id: i.id,
                        label: i.name,
                        // Price and stock together: the number is needed while choosing, not on
                        // a separate screen after the part is already on the job.
                        helper: [price, stockText].filter(Boolean).join(' · ') || undefined,
                      }
                    })}
                    value={partItemId}
                    onChange={(id) => {
                      setPartItemId(id)
                      setStockOverride(false)
                      const item = partOptions.find((i) => i.id === id)
                      if (item?.sellingPrice) setPartRate(item.sellingPrice)
                    }}
                    placeholder={t('pages.service.jobCardDetailContent.searchPart')}
                    onCreateNew={setAddingPart}
                  />
                  {partFit.blocked && (
                    <div className="space-y-2 rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                      <p>
                        {t('pages.service.jobCardDetailContent.notEnoughStock', {
                          onHand: partFit.onHand,
                          qty: partQty,
                          short: partFit.shortfall,
                        })}
                      </p>
                      {canOverrideStock && (
                        <label className="flex items-start gap-2">
                          <Checkbox
                            checked={stockOverride}
                            onCheckedChange={(v) => setStockOverride(v === true)}
                            className="mt-0.5"
                          />
                          <span>{t('pages.service.jobCardDetailContent.fitItAnyway')}</span>
                        </label>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={partRate}
                      onChange={(e) => setPartRate(Number(e.target.value) || 0)}
                      placeholder={t('common.rate')}
                      className="w-24 rounded-md border px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      value={partQty}
                      onChange={(e) => setPartQty(Number(e.target.value) || 1)}
                      placeholder={t('shared.qty')}
                      className="w-20 rounded-md border px-2 py-1 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!partItemId || (partFit.blocked && !stockOverride)}
                      onClick={() => {
                        const item = partOptions.find((i) => i.id === partItemId)
                        if (!item) return
                        applyAction.mutate({
                          action: 'addPart',
                          itemId: item.id,
                          itemName: item.name,
                          rate: partRate,
                          qty: partQty,
                          ...(partFit.blocked
                            ? {
                                stockOverride: {
                                  onHand: partFit.onHand,
                                  shortfall: partFit.shortfall,
                                },
                              }
                            : {}),
                        })
                        setAddPartOpen(false)
                        setPartItemId(null)
                        setPartRate(0)
                        setPartQty(1)
                        setStockOverride(false)
                      }}
                    >
                      {t('common.add')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAddPartOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddPartOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-teal-700 hover:underline dark:text-teal-400"
                >
                  <Plus className="size-3.5" />
                  {t('pages.service.jobCardDetailContent.addPart')}
                </button>
              ))}
          </DetailPanel>

          <DetailPanel
            icon={ImageIcon}
            title={t('pages.service.jobCardDetailContent.images')}
            action={job.imageUrls.length > 0 ? <CountChip n={job.imageUrls.length} /> : undefined}
          >
            {job.imageUrls.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">
                {t('pages.service.jobCardDetailContent.noImagesUploaded')}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {job.imageUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt={t('common.job')}
                    className="aspect-square rounded-md object-cover"
                  />
                ))}
              </div>
            )}
            {canPerform('addImage') && (
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-teal-700 hover:underline dark:text-teal-400">
                <Plus className="size-3.5" />
                {t('pages.service.jobCardDetailContent.addImage')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleAddImage(f)
                  }}
                />
              </label>
            )}
          </DetailPanel>

          {/* The toggle was a full-width button containing nothing but a chevron, which read as
           * an empty row under the heading. It is a control on the heading, so it sits there. */}
          <DetailPanel
            icon={StickyNote}
            title={t('common.notes')}
            action={
              <div className="flex items-center gap-1.5">
                <CountChip n={job.notes.length} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setNotesOpen((o) => !o)}
                  aria-expanded={notesOpen}
                >
                  <span className="sr-only">
                    {t('pages.service.jobCardDetailContent.toggleNotes')}
                  </span>
                  {notesOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </div>
            }
          >
            {notesOpen && (
              <div className="space-y-2">
                {job.notes.map((n) => (
                  <div key={n.id} className="rounded-md bg-muted/40 p-2 text-sm">
                    <p>{n.text}</p>
                    <p className="text-xs text-muted-foreground">{n.userName}</p>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-teal-700 hover:underline dark:text-teal-400"
                >
                  <Plus className="size-3.5" />
                  {t('pages.service.jobCardDetailContent.addNote')}
                </button>
              </div>
            )}
          </DetailPanel>
        </div>

        <div>
          <TimelinePanel
            events={timeline}
            error={timelineError}
            onRetry={() => void refetchTimeline()}
          />
        </div>
      </div>

      <FormModal
        open={noteOpen}
        onOpenChange={(o) => {
          setNoteOpen(o)
          if (!o) setNoteText('')
        }}
        title={t('pages.service.jobCardDetailContent.addNote')}
        submitLabel={t('pages.service.jobCardDetailContent.addNote')}
        isSubmitting={applyAction.isPending}
        error={
          applyAction.error
            ? t('pages.service.actionButtons.actionFailed', {
                reason: applyAction.error.message,
              })
            : null
        }
        onSubmit={async (e) => {
          e.preventDefault()
          if (!noteText.trim()) return
          // Waits for the write before closing. Firing and closing is how a note that Firestore
          // refused outright still looked like it had saved — the dialog shut, the panel stayed
          // empty, and nothing anywhere said why. Every other action on this job card already
          // awaits its mutation; this was the one that did not.
          try {
            await applyAction.mutateAsync({ action: 'note', text: noteText.trim() })
          } catch {
            return // stays open, with `error` above saying what happened
          }
          setNoteOpen(false)
          setNoteText('')
        }}
      >
        <div className="space-y-1.5">
          <Label>{t('pages.service.jobCardDetailContent.note')}</Label>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>
      </FormModal>
    </div>
  )
}

function formatDateOnly(job: JobCardWithId) {
  return job.createdAt?.toDate
    ? job.createdAt.toDate().toLocaleDateString('en-IN', { dateStyle: 'medium' })
    : ''
}
