import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { ScrollRow } from '@/components/shared/scroll-row'

export type DateRangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

// The option list is module scope, so it stores the translation *key* rather than the text —
// `t()` only exists inside a component, and a label resolved once at module load would freeze
// in whichever language happened to be active at import time and never follow a language switch.
const RANGE_OPTIONS: { key: DateRangeKey; labelKey: string }[] = [
  { key: 'today', labelKey: 'components.shared.filterBar.today' },
  { key: 'yesterday', labelKey: 'components.shared.filterBar.yesterday' },
  { key: 'week', labelKey: 'components.shared.filterBar.thisWeek' },
  { key: 'month', labelKey: 'components.shared.filterBar.thisMonth' },
  { key: 'year', labelKey: 'components.shared.filterBar.thisYear' },
]

interface FilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  dateRange?: DateRangeKey
  onDateRangeChange?: (value: DateRangeKey) => void
  showCustomRange?: boolean
  customFrom?: string
  customTo?: string
  onCustomFromChange?: (value: string) => void
  onCustomToChange?: (value: string) => void
  /** Extra filter controls (dropdowns, etc.) slotted in after the built-in ones. */
  children?: React.ReactNode
  className?: string
}

/** The search-box + date-quick-chip filter row that appears at the top of nearly every list
 * and report page in the reference app (see SCREENS_NOTES.md — "Filter bar" appears dozens of
 * times with this exact shape). Composable: pass only the props a given page needs. */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  dateRange,
  onDateRangeChange,
  showCustomRange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  children,
  className,
}: FilterBarProps) {
  const { t } = useTranslation()
  return (
    // A column on a phone, the original wrapping row from `sm` up. The search field wants the
    // full width on a narrow screen; the chips want a single scrolling line rather than three
    // ragged wrapped ones.
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {onSearchChange && (
        <div className="relative w-full sm:min-w-[200px] sm:flex-none sm:basis-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder ?? t('shared.search')}
            className="pl-8"
          />
        </div>
      )}

      {/* Chips and any extra controls share one scrolling line on a phone.
       *
       * `sm:contents` is what keeps the desktop layout byte-for-byte as it was: from `sm` up the
       * wrapper stops being a box at all, so its children become direct flex items of the bar
       * above and wrap exactly as they did before this was introduced. Without it, 35 pages'
       * filter bars would each gain a nesting level and a slightly different wrap point.
       *
       * `children` is included deliberately — the Dashboard passes its "All Time" chip in that
       * way, and leaving it outside the row was what stranded it alone on a third line. */}
      {(onDateRangeChange || children) && (
        <ScrollRow className="gap-1.5 sm:contents">
          {onDateRangeChange &&
            RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                type="button"
                size="sm"
                variant={dateRange === opt.key ? 'default' : 'outline'}
                onClick={() => onDateRangeChange(opt.key)}
              >
                {t(opt.labelKey)}
              </Button>
            ))}
          {onDateRangeChange && showCustomRange && (
            <Button
              type="button"
              size="sm"
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              onClick={() => onDateRangeChange('custom')}
            >
              {t('shared.custom')}
            </Button>
          )}
          {children}
        </ScrollRow>
      )}

      {dateRange === 'custom' && showCustomRange && (
        // The two date fields share the width on a phone: at a fixed 150px each plus the
        // separator they came to 316px, which fits a 390px screen only until the gutter is
        // subtracted.
        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="min-w-0 flex-1 sm:w-[150px] sm:flex-none"
          />
          <span className="shrink-0 text-sm text-muted-foreground">{t('shared.to')}</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="min-w-0 flex-1 sm:w-[150px] sm:flex-none"
          />
        </div>
      )}
    </div>
  )
}
