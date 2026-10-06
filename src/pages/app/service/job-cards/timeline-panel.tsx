import {
  Plus,
  UserPlus,
  IndianRupee,
  PackagePlus,
  ArrowRightLeft,
  StickyNote,
  Wrench,
  Receipt,
  CreditCard,
  Truck,
  Ban,
  Users,
  MapPin,
  Undo2,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { formatTimestamp } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import type { TimelineEventWithId } from '@/hooks/use-job-cards'
import { useTranslation } from 'react-i18next'
import { DetailPanel, CountChip } from './detail-panel'

const EVENT_ICONS: Record<string, LucideIcon> = {
  created: Plus,
  assigned: UserPlus,
  advanceReceived: IndianRupee,
  partAdded: PackagePlus,
  statusChange: ArrowRightLeft,
  note: StickyNote,
  repairDone: Wrench,
  billGenerated: Receipt,
  paymentReceived: CreditCard,
  delivered: Truck,
  cancelled: Ban,
  handover: Users,
  fieldVisit: MapPin,
  undone: Undo2,
}

function statusLabel(key?: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

/** The right-hand vertical Timeline in `preview (72)` — every entry here was written by a real
 * action at the moment it happened (`use-job-actions.ts`), never synthesized after the fact. */
export function TimelinePanel({
  events,
  error,
  onRetry,
}: {
  events: TimelineEventWithId[]
  error?: unknown
  onRetry?: () => void
}) {
  const { t } = useTranslation()
  return (
    <DetailPanel
      icon={Clock}
      title={t('common.timeline')}
      action={events.length > 0 ? <CountChip n={events.length} /> : undefined}
    >
      {error ? (
        // Every job card has at least a "Created" event written at intake, so an empty timeline
        // is only ever truthful when the read succeeded — "No activity yet" on a failed read
        // would claim a history that demonstrably exists never happened.
        <ErrorState
          error={error}
          onRetry={onRetry}
          title={t('pages.service.timelinePanel.couldnTLoadTheTimeline')}
          className="py-6"
        />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">
          {t('pages.service.timelinePanel.noActivityYet')}
        </p>
      ) : (
        /* `pl-6` with the marker at `-left-9`, so the 24px badge sits centred on the rail with
         * a real gap before the text.
         *
         * It was `pl-4` with `-left-[21.5px]`: the badge spans 24px from 21.5px left of the
         * text, so its right edge landed 2.5px *past* where the text began and clipped the
         * first letter of every single entry. Close enough to look deliberate, wrong on every
         * row. */
        <ol className="space-y-5 border-l pl-6">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type] ?? Clock
            return (
              <li key={event.id} className="relative">
                {/* `ring-card` rather than a bare circle: in dark mode the badge fill is
                 * translucent, so without it the rail line draws straight through the icon. */}
                <span className="absolute top-0.5 -left-9 flex size-6 items-center justify-center rounded-full bg-teal-100 text-teal-700 ring-4 ring-card dark:bg-teal-500/15 dark:text-teal-400">
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.fromStatus && event.toStatus && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <StatusBadge status={statusLabel(event.fromStatus) ?? ''} dot />
                    <span className="text-xs text-muted-foreground">→</span>
                    <StatusBadge status={statusLabel(event.toStatus) ?? ''} dot />
                  </div>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.userName} · {formatTimestamp(event.createdAt)}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </DetailPanel>
  )
}
