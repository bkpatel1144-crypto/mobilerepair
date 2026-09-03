import {
  FolderOpen, Clock, ListOrdered, Wrench, Pause, CheckCircle2,
  BookOpen, Truck, Lock, XCircle, Undo2, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Icon + tone per status pill on the Job Cards list — matches `preview (69)`'s
 * "📁 Total / 🕐 Pending / ☰ In Queue / 🔧 In Progress / ⏸ On Hold / ✓ Tech Done / 📗 Ready /
 * 🚚 Delivered / 🔒 Closed / ⊗ Cancelled / ↩ Pending Return" row exactly — a horizontal strip of
 * compact icon pills, not the app's usual big `StatCard` tiles (which stay as-is everywhere
 * else; this is the one list that renders its filters this way in the reference app). */
const PILL_STYLE: Record<string, { icon: LucideIcon; tone: string }> = {
  total: { icon: FolderOpen, tone: 'text-foreground border-border' },
  pending: { icon: Clock, tone: 'text-amber-600 border-amber-200 dark:border-amber-500/30' },
  inQueue: { icon: ListOrdered, tone: 'text-orange-600 border-orange-200 dark:border-orange-500/30' },
  inProgress: { icon: Wrench, tone: 'text-blue-600 border-blue-200 dark:border-blue-500/30' },
  onHold: { icon: Pause, tone: 'text-yellow-600 border-yellow-200 dark:border-yellow-500/30' },
  techDone: { icon: CheckCircle2, tone: 'text-teal-600 border-teal-200 dark:border-teal-500/30' },
  ready: { icon: BookOpen, tone: 'text-green-600 border-green-200 dark:border-green-500/30' },
  delivered: { icon: Truck, tone: 'text-purple-600 border-purple-200 dark:border-purple-500/30' },
  closed: { icon: Lock, tone: 'text-slate-600 border-slate-200 dark:border-slate-500/30' },
  cancelled: { icon: XCircle, tone: 'text-red-600 border-red-200 dark:border-red-500/30' },
  pendingReturn: { icon: Undo2, tone: 'text-amber-600 border-amber-200 dark:border-amber-500/30' },
}

export function StatusPill({
  statusKey,
  label,
  value,
  selected,
  onClick,
}: {
  statusKey: string
  label: string
  value: number
  selected: boolean
  onClick: () => void
}) {
  const style = PILL_STYLE[statusKey] ?? PILL_STYLE.total
  const Icon = style.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-muted/50',
        style.tone,
        selected && 'border-teal-600 bg-teal-50 ring-1 ring-teal-600 dark:bg-teal-500/10'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="font-medium text-foreground/80">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </button>
  )
}
