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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchSelect } from '@/components/shared/search-select'
import { useJobTimeline, type JobCardWithId } from '@/hooks/use-job-cards'
import { useApplyJobAction } from '@/hooks/use-job-actions'
import { useJobActionGating } from '@/hooks/use-job-action-gating'
import { useItems, useCreateItem, nextItemCode } from '@/hooks/use-items'
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

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </div>
      {children}
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
  const {
    data: timeline = [],
    error: timelineError,
    refetch: refetchTimeline,
  } = useJobTimeline(job.id)
  const { canPerform, canViewMoney } = useJobActionGating(job)
  const applyAction = useApplyJobAction(job)
  const { data: items = [] } = useItems()
  const createItem = useCreateItem()

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
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  const partOptions = items.filter((i) => i.type === 'part' || i.type === 'service')
  const balance = (job.finalAmount ?? job.estimatedCost) - job.paidAmount

  async function handleAddImage(file: File) {
    const url = await uploadJobCardImage(profile!.companyId, job.id, file)
    applyAction.mutate({ action: 'addImage', url })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Wrench className="size-5 text-teal-600" />
            <span className="text-lg font-bold">#{job.jobNumber}</span>
            <StatusBadge status={statusLabel(job.status)} dot />
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
          <div className="mt-1 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
              {job.customerName.slice(0, 2).toUpperCase()}
            </span>
            <span className="font-medium">{job.customerName}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {job.customerMobile}
            </span>
          </div>
        </div>
      </div>

      <ActionButtons job={job} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Panel icon={ClipboardList} title={t('pages.service.jobCardDetailContent.itemsAtIntake')}>
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground uppercase">
                  {t('pages.service.jobCardDetailContent.receivedAtIntake')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.itemsReceived.length === 0 && (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
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
                  {job.itemsReturned.length === 0 && (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                  {job.itemsReturned.map((label) => (
                    <StatusBadge key={label} status={label} tone="success" />
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel icon={Smartphone} title={t('common.device')}>
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
          </Panel>

          <Panel
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
          </Panel>

          <Panel icon={UserRound} title={t('pages.service.jobCardDetailContent.assignment')}>
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
          </Panel>
        </div>

        <div className="space-y-4">
          {canViewMoney && (
            <Panel icon={IndianRupee} title={t('common.payment')}>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">
                    {t('pages.service.jobCardDetailContent.estimated')}
                  </dt>
                  <dd>₹{job.estimatedCost}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">{t('common.advance')}</dt>
                  <dd>₹{job.advanceReceived}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">{t('common.paid')}</dt>
                  <dd>₹{job.paidAmount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">{t('common.balance')}</dt>
                  <dd
                    className={
                      balance <= 0 ? 'font-medium text-teal-600' : 'font-medium text-amber-600'
                    }
                  >
                    {balance <= 0 ? 'Paid ✓' : `₹${balance}`}
                  </dd>
                </div>
              </dl>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground">
                  {t('pages.service.jobCardDetailContent.partsCost')}
                </span>
                <span>₹{job.partsCost}</span>
              </div>
              {job.finalAmount != null && (
                <div className="flex justify-between text-sm font-medium">
                  <span>{t('common.finalAmount')}</span>
                  <span>₹{job.finalAmount}</span>
                </div>
              )}
            </Panel>
          )}

          <Panel icon={Cog} title={`Parts Used (${job.partsUsed.length})`}>
            <div className="space-y-1.5">
              {job.partsUsed.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm"
                >
                  <span>{p.itemName}</span>
                  {canViewMoney && (
                    <span className="text-muted-foreground">
                      ₹{p.rate} · {p.qty}
                    </span>
                  )}
                </div>
              ))}
              {job.partsUsed.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('pages.service.jobCardDetailContent.noPartsUsedYet')}
                </p>
              )}
            </div>
            {canAddParts &&
              (addPartOpen ? (
                <div className="space-y-2 rounded-md border border-dashed p-2">
                  <SearchSelect
                    options={partOptions.map((i) => ({
                      id: i.id,
                      label: i.name,
                      helper: i.sellingPrice ? `₹${i.sellingPrice}` : undefined,
                    }))}
                    value={partItemId}
                    onChange={(id) => {
                      setPartItemId(id)
                      const item = partOptions.find((i) => i.id === id)
                      if (item?.sellingPrice) setPartRate(item.sellingPrice)
                    }}
                    placeholder={t('pages.service.jobCardDetailContent.searchPart')}
                    onCreateNew={(name) =>
                      createItem.mutate(
                        { name, type: 'part', itemCode: nextItemCode(items, 'part') },
                        { onSuccess: (item) => setPartItemId(item.id!) }
                      )
                    }
                  />
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
                      disabled={!partItemId}
                      onClick={() => {
                        const item = partOptions.find((i) => i.id === partItemId)
                        if (!item) return
                        applyAction.mutate({
                          action: 'addPart',
                          itemId: item.id,
                          itemName: item.name,
                          rate: partRate,
                          qty: partQty,
                        })
                        setAddPartOpen(false)
                        setPartItemId(null)
                        setPartRate(0)
                        setPartQty(1)
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAddPartOpen(false)}
                    >
                      Cancel
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
                  Add Part
                </button>
              ))}
          </Panel>

          <Panel icon={ImageIcon} title={t('pages.service.jobCardDetailContent.images')}>
            {job.imageUrls.length === 0 ? (
              <p className="text-sm text-muted-foreground">
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
                Add Image
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
          </Panel>

          <Panel icon={StickyNote} title={`Notes (${job.notes.length})`}>
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="sr-only">{t('pages.service.jobCardDetailContent.toggleNotes')}</span>
              {notesOpen ? (
                <ChevronUp className="ml-auto size-4" />
              ) : (
                <ChevronDown className="ml-auto size-4" />
              )}
            </button>
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
                  Add Note
                </button>
              </div>
            )}
          </Panel>
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
        onSubmit={(e) => {
          e.preventDefault()
          if (!noteText.trim()) return
          applyAction.mutate({ action: 'note', text: noteText.trim() })
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
