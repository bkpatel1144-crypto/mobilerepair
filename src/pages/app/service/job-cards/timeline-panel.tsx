import {
  Plus, UserPlus, IndianRupee, PackagePlus, ArrowRightLeft, StickyNote,
  Wrench, Receipt, CreditCard, Truck, Ban, Users, MapPin, Undo2, Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatTimestamp } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import type { TimelineEventWithId } from '@/hooks/use-job-cards'

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
export function TimelinePanel({ events }: { events: TimelineEventWithId[] }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Clock className="size-4 text-muted-foreground" />
        Timeline
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="space-y-4 border-l pl-4">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type] ?? Clock
            return (
              <li key={event.id} className="relative">
                <span className="absolute top-0.5 -left-[21.5px] flex size-6 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
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
    </div>
  )
}
