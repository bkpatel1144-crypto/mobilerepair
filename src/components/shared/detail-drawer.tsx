import type { LucideIcon } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface DetailSectionRow {
  label: string
  value: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
}

export interface DetailSection {
  title: string
  icon?: LucideIcon
  rows?: DetailSectionRow[]
  /** For sections that don't fit the label/value row shape (e.g. a parts table, a JSON blob). */
  children?: React.ReactNode
  className?: string
}

export interface TimelineEvent {
  title: string
  description?: string
  timestamp?: string
  icon?: LucideIcon
}

const ROW_TONE_STYLES: Record<NonNullable<DetailSectionRow['tone']>, string> = {
  default: '',
  success: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
  info: 'text-blue-700 dark:text-blue-400',
  purple: 'text-purple-700 dark:text-purple-400',
}

interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon?: LucideIcon
  title: React.ReactNode
  subtitle?: React.ReactNode
  badges?: React.ReactNode
  /** Buttons row rendered right under the header (Edit/Delete/Print/etc.) */
  actions?: React.ReactNode
  sections?: DetailSection[]
  timeline?: TimelineEvent[]
  /** Escape hatch for a fully custom body instead of `sections`/`timeline`. */
  children?: React.ReactNode
  className?: string
}

/** The right-side slide-over used for every entity detail view in the app — Party, Item,
 * Role, Branch, Session, Job Card, Second-hand device, etc. Generic on purpose: pass a
 * `sections` array rather than hand-building a one-off layout per entity. Full-screen on
 * mobile, a fixed-width panel from `sm` up, per BUILD_PLAN.md's mobile-first rule. */
export function DetailDrawer({
  open,
  onOpenChange,
  icon: Icon,
  title,
  subtitle,
  badges,
  actions,
  sections,
  timeline,
  children,
  className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('flex w-full flex-col gap-0 p-0 sm:max-w-lg', className)}>
        <ScrollArea className="flex-1">
          <div className="space-y-5 p-5 pr-8">
            <div>
              <div className="flex items-center gap-2">
                {Icon && (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                    <Icon className="size-4" />
                  </span>
                )}
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
              {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
            </div>

            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}

            {sections?.map((section, i) => (
              <div key={i} className={cn('space-y-2', section.className)}>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {section.icon && <section.icon className="size-4 text-muted-foreground" />}
                  {section.title}
                </div>
                {section.rows && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                    {section.rows.map((row, j) => (
                      <div key={j} className="contents">
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd
                          className={cn(
                            'text-right font-medium',
                            row.tone && ROW_TONE_STYLES[row.tone]
                          )}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {section.children}
              </div>
            ))}

            {children}

            {timeline && timeline.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Timeline</div>
                <Separator />
                <ol className="space-y-4">
                  {timeline.map((event, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                        {event.icon ? (
                          <event.icon className="size-3.5" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                        {event.timestamp && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{event.timestamp}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
