import type { LucideIcon } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export interface DetailSectionRow {
  label: string
  value: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  /** Give this field the whole row — a long address, a note, an ID. */
  wide?: boolean
}

export interface DetailSection {
  title: string
  icon?: LucideIcon
  /** Tints the section's heading icon. Purely presentational; groups read apart at a glance. */
  tone?: 'teal' | 'purple' | 'blue' | 'amber' | 'emerald' | 'rose'
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
 * Branch, Session, Job Card, second-hand device, and eighteen more.
 *
 * What this replaced read as a form printout: a small icon, then flat grey blocks of
 * label-on-the-left / value-right-aligned pairs. Two things were wrong with it. Right-aligning
 * the value puts a ragged column down the middle of every panel, so nothing lines up and the eye
 * has to travel; and at two columns per row a long value — an address, a device name — wrapped
 * under a label that was still trying to sit beside it.
 *
 * Fields are cards now: a small upper-case label with the value beneath it, laid out two-up and
 * separated by hairlines, so every value starts at the same left edge and a long one simply takes
 * the whole row (`wide`). It is the shape the client's own Role Details panel uses.
 *
 * The API is unchanged — twenty-three screens pass the same `sections` array — with `tone` and
 * `wide` added as optional refinements.
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
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 text-teal-700 dark:from-teal-500/20 dark:to-teal-500/5 dark:text-teal-400">
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
        {badges && <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>}
      </div>
    </div>
  )

  const actionsNode = actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null

  const bodyNode = (
    <>
      {sections?.map((section, i) => (
        <section key={i} className={cn('space-y-2', section.className)}>
          <div className="flex items-center gap-2">
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
            <h3 className="text-sm font-semibold">{section.title}</h3>
          </div>

          {section.rows && section.rows.length > 0 && (
            // Hairlines come from the container's background showing through a 1px gap — one
            // rule instead of border-bottom-except-the-last on every cell, and it stays correct
            // when a `wide` row breaks the two-up rhythm.
            <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
              {section.rows.map((row, j) => (
                <div
                  key={j}
                  className={cn(
                    'min-w-0 bg-card px-3 py-2.5',
                    // A lone final field spans the row. Otherwise the grid's background shows
                    // through the empty half as a grey block that reads as a broken field.
                    (row.wide || (j === section.rows!.length - 1 && j % 2 === 0)) && 'sm:col-span-2'
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
              ))}
            </dl>
          )}
          {section.children}
        </section>
      ))}

      {children}

      {timeline && timeline.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-md',
                SECTION_TONE_STYLES.blue
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
            </span>
            <h3 className="text-sm font-semibold">{t('common.timeline')}</h3>
          </div>
          <ol className="space-y-0 rounded-xl border p-3">
            {timeline.map((event, i) => (
              <li key={i} className="flex gap-3">
                {/* The dot and the line under it are one column, so the thread runs unbroken
                 * however tall a row's text grows. The last row draws no line. */}
                <div className="flex flex-col items-center">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                    {event.icon ? (
                      <event.icon className="size-3.5" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  {i < timeline.length - 1 && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className={cn('min-w-0 flex-1', i < timeline.length - 1 && 'pb-4')}>
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
