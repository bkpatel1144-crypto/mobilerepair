import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DateRangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
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
  searchPlaceholder = 'Search...',
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
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {onSearchChange && (
        <div className="relative min-w-[200px] flex-1 sm:flex-none sm:basis-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}

      {onDateRangeChange && (
        <div className="flex flex-wrap gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              type="button"
              size="sm"
              variant={dateRange === opt.key ? 'default' : 'outline'}
              onClick={() => onDateRangeChange(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
          {showCustomRange && (
            <Button
              type="button"
              size="sm"
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              onClick={() => onDateRangeChange('custom')}
            >
              Custom
            </Button>
          )}
        </div>
      )}

      {dateRange === 'custom' && showCustomRange && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="w-[150px]"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="w-[150px]"
          />
        </div>
      )}

      {children}
    </div>
  )
}
