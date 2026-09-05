import { cn } from '@/lib/utils'

const TONES = {
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', icon: 'text-purple-600 dark:text-purple-400' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', icon: 'text-teal-600 dark:text-teal-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', icon: 'text-amber-600 dark:text-amber-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', icon: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: 'text-emerald-600 dark:text-emerald-400' },
} as const

export type DetailBlockTone = keyof typeof TONES

/** A titled, tinted group inside a detail drawer. The tint is what makes a long drawer scannable
 * — sections separate by colour before you read a word of them. */
export function DetailBlock({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  tone: DetailBlockTone
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className={cn('size-4', TONES[tone].icon)} />
        {title}
      </h3>
      <div className={cn('rounded-xl p-4', TONES[tone].bg)}>{children}</div>
    </section>
  )
}

/** One label/value line. `trailing` is for the tick or badge that sits opposite the value. */
export function DetailValue({
  label,
  value,
  trailing,
  divider,
}: {
  label: string
  value: React.ReactNode
  trailing?: React.ReactNode
  divider?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 py-2', divider && 'border-b border-black/5 dark:border-white/10')}>
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
      {trailing}
    </div>
  )
}

/** The standalone explanatory callout — the "this is the active financial year" note. */
export function DetailNote({
  icon: Icon,
  title,
  children,
  tone = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  tone?: DetailBlockTone
}) {
  return (
    <div className={cn('flex gap-3 rounded-xl p-4 text-sm', TONES[tone].bg)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', TONES[tone].icon)} />
      <div>
        <p className={cn('font-semibold', TONES[tone].icon)}>{title}</p>
        <p className="mt-0.5 text-foreground/80">{children}</p>
      </div>
    </div>
  )
}
