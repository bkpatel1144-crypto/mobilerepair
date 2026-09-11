import type { LucideIcon } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export interface DetailSectionRow {
  label: string
  value: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  /** Give this field the whole row. For a note, an address, a long id — anything that reads
   *  badly squeezed into half the width. */
  wide?: boolean
}

export interface DetailSection {
  title: string
  icon?: LucideIcon
  rows?: DetailSectionRow[]
  /** For sections that don't fit the label/value row shape (e.g. a parts table, a JSON blob). */
  children?: React.ReactNode
  /** Colours this section's icon, so a long drawer can be scanned by eye rather than read. */
  tone?: 'teal' | 'purple' | 'blue' | 'amber' | 'emerald' | 'rose'
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

// Literal class strings: Tailwind's compiler reads source, so `bg-${tone}-100` generates nothing.
const SECTION_TONE_STYLES: Record<NonNullable<DetailSection['tone']>, string> = {
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
}

interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon?: LucideIcon
  title: React.ReactNode
  subtitle?: React.ReactNode
  badges?: React.ReactNode
  /** Replaces the default icon/title/subtitle/badges block outright, for a header that doesn't
   * fit that shape (a large icon tile, chips on their own line). `title` is still used as the
   * accessible name, so pass it either way. */
  header?: React.ReactNode
  /** Keeps the header and action row fixed while only the sections scroll. Worth it on a drawer
   * whose actions are the point of opening it — scrolling to read the details shouldn't push
   * Configure/Delete out of reach. */
  pinHeader?: boolean
  /** Buttons row rendered right under the header (Edit/Delete/Print/etc.) */
  actions?: React.ReactNode
  sections?: DetailSection[]
  timeline?: TimelineEvent[]
  /** Escape hatch for a fully custom body instead of `sections`/`timeline`. */
  children?: React.ReactNode
  className?: string
}

/**
 * The right-side slide-over used for every entity detail view in the app — Party, Item, Role,
 * Branch, Session, Job Card, Second-hand device, and twenty more. Generic on purpose: pass a
 * `sections` array rather than hand-building a layout per entity.
 *
 * Fields are cards rather than a two-column `dt`/`dd` grid, and that is the whole redesign.
 * Right-aligning the value put a ragged edge down the middle of every panel, and at two pairs
 * per row a long value wrapped underneath a label that was still trying to sit beside it. Here
 * the label sits above its value, every value starts at the same left edge, and a long one can
 * take the whole row. A lone field at the end of an odd-numbered section spans rather than
 * leaving a dead grey half-cell.
 *
 * Full-screen on mobile, a fixed-width panel from `sm` up, per BUILD_PLAN.md's mobile-first rule.
 */
export function DetailDrawer({
  open,
  onOpenChange,
  icon: Icon,
  title,
  subtitle,
  badges,
  header,
  pinHeader,
  actions,
  sections,
  timeline,
  children,
  className,
}: DetailDrawerProps) {
  const { t } = useTranslation()

  const headerNode = header ?? (
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
          <Icon className="size-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-xl leading-tight font-bold break-words">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
    </div>
  )

  const actionsNode = actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null

  const bodyNode = (
    <>
      {sections?.map((section, i) => (
        <section key={i} className={cn('space-y-2', section.className)}>
          <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {section.icon && (
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md',
                  SECTION_TONE_STYLES[section.tone ?? 'teal']
                )}
              >
                <section.icon className="size-3.5" />
              </span>
            )}
            {section.title}
          </h3>

          {section.rows && section.rows.length > 0 && (
            // `gap-px` over a `bg-border` parent draws hairlines between the cards without a
            // border on each one doubling up where two meet.
            <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
              {section.rows.map((row, j) => {
                const isLastAndOdd = j === section.rows!.length - 1 && j % 2 === 0
                return (
                  <div
                    key={j}
                    className={cn(
                      'min-w-0 bg-card px-3 py-2.5',
                      (row.wide || isLastAndOdd) && 'sm:col-span-2'
                    )}
                  >
                    <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {row.label}
                    </dt>
                    <dd
                      className={cn(
                        'mt-0.5 text-sm font-medium break-words',
                        row.tone && ROW_TONE_STYLES[row.tone]
                      )}
                    >
                      {row.value}
                    </dd>
                  </div>
                )
              })}
            </dl>
          )}
          {section.children}
        </section>
      ))}

      {children}

      {timeline && timeline.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('common.timeline')}
          </h3>
          {/* A thread runs behind the icons so the events read as one sequence rather than a
           * stack of unrelated rows. It stops at the last icon rather than running past it. */}
          <ol className="relative space-y-4 pl-1">
            {timeline.map((event, i) => (
              <li key={i} className="relative flex gap-3">
                {i < timeline.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-7 left-[13px] h-[calc(100%+0.25rem)] w-px bg-border"
                  />
                )}
                <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 ring-4 ring-card dark:bg-teal-500/15 dark:text-teal-400">
                  {event.icon ? (
                    <event.icon className="size-3.5" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pb-0.5">
                  <p className="text-sm font-semibold">{event.title}</p>
                  {event.description && (
                    <p className="text-sm break-words text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  {event.timestamp && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.timestamp}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className={cn('flex w-full flex-col gap-0 p-0', className)}>
        {pinHeader ? (
          <>
            <div className="space-y-4 border-b bg-muted/30 p-5 pr-12">
              {headerNode}
              {actionsNode}
            </div>
            {/* `min-h-0` is load-bearing: a flex child's `min-height` defaults to `auto`, so
             * `flex-1` alone lets this grow past the sheet instead of scrolling inside it. */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 p-5 pr-8">{bodyNode}</div>
            </ScrollArea>
          </>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 border-b bg-muted/30 p-5 pr-12">
              {headerNode}
              {actionsNode}
            </div>
            <div className="space-y-5 p-5 pr-8">{bodyNode}</div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}
