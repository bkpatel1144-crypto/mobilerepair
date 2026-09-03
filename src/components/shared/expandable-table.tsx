import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface ExpandableTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
  /** Secondary columns can be hidden in the mobile stacked-card view, same convention as
   * `DataTable` — the first column is always the card's own title. */
  hideOnMobile?: boolean
}

interface ExpandableTableProps<T> {
  columns: ExpandableTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  /** The sub-panel shown when a row's chevron is toggled — Details/Parts/Timeline for Service
   * Reports, a job breakdown for Period Summary/Technician/Supplier Report, etc. */
  renderExpanded: (row: T) => React.ReactNode
  isLoading?: boolean
  emptyState?: React.ReactNode
  pageSizeOptions?: number[]
  defaultPageSize?: number
  className?: string
}

/** A `DataTable` sibling for the reference app's other real table pattern — a plain (unsorted)
 * table whose rows expand in place via a leading chevron, matching `preview (33)`/`(34)`/`(35)`/
 * `(38)`'s own row → rich sub-panel behavior. Kept as its own component rather than folding
 * expand support into `DataTable` itself: that component is already reused by a dozen+ existing
 * pages with its own sort/pagination contract, and this one deliberately has no column sorting
 * (none of the reference's own expandable-row report tables sort by column either). */
export function ExpandableTable<T>({
  columns,
  data,
  rowKey,
  renderExpanded,
  isLoading,
  emptyState,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  className,
}: ExpandableTableProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize)

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage))
  const clampedPage = Math.min(page, totalPages)
  const start = (clampedPage - 1) * rowsPerPage
  const pageRows = data.slice(start, start + rowsPerPage)

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Desktop / tablet: real table, chevron-expandable rows */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const key = rowKey(row)
              const isOpen = expanded.has(key)
              return (
                <Fragment key={key}>
                  <TableRow onClick={() => toggle(key)} className="cursor-pointer">
                    <TableCell className="w-8">
                      {isOpen ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                  {isOpen && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length + 1} className="bg-muted/30 p-0">
                        {renderExpanded(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards, same tap-to-expand */}
      <div className="space-y-2 md:hidden">
        {pageRows.map((row) => {
          const key = rowKey(row)
          const isOpen = expanded.has(key)
          const [titleCol, ...restCols] = columns
          const visibleRest = restCols.filter((c) => !c.hideOnMobile)
          return (
            <div key={key} className="rounded-lg border bg-card">
              <div onClick={() => toggle(key)} className="cursor-pointer p-3 active:bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 font-medium">{titleCol.render(row)}</div>
                  {isOpen ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  {visibleRest.map((col) => (
                    <div key={col.key} className="contents">
                      <dt className="text-muted-foreground">{col.header}</dt>
                      <dd className="text-right">{col.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {isOpen && <div className="border-t bg-muted/30">{renderExpanded(row)}</div>}
            </div>
          )
        })}
      </div>

      {/* Pagination footer — same shape as DataTable's own, for visual consistency. */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Showing {data.length === 0 ? 0 : start + 1}–{Math.min(start + rowsPerPage, data.length)} of{' '}
          {data.length}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => {
                setRowsPerPage(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" disabled={clampedPage <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="px-1 tabular-nums">
              Page {clampedPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={clampedPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
