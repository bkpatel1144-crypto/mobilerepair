import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TONE_STYLES, TONE_DOT_STYLES, toneFromStatus, type BadgeTone } from '@/lib/status-tone'

interface StatusBadgeProps {
  status: string
  tone?: BadgeTone
  icon?: LucideIcon
  dot?: boolean
  className?: string
}

export function StatusBadge({ status, tone, icon: Icon, dot, className }: StatusBadgeProps) {
  const resolvedTone = tone ?? toneFromStatus(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_STYLES[resolvedTone],
        className
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', TONE_DOT_STYLES[resolvedTone])} />}
      {Icon && <Icon className="size-3" />}
      {status}
    </span>
  )
}
