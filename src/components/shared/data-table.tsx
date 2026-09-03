import { useMemo, useState } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
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

export interface DataTableColumn<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  /** Secondary columns can be hidden in the mobile stacked-card view to keep each card short —
   * the first column is always shown as the card's title. */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyState?: React.ReactNode
  pageSizeOptions?: number[]
  defaultPageSize?: number
  className?: string
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  isLoading,
  emptyState,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize)

  const sorted = useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return data
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [data, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const clampedPage = Math.min(page, totalPages)
  const start = (clampedPage - 1) * rowsPerPage
  const pageRows = sorted.slice(start, start + rowsPerPage)

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, direction: 'asc' }
      if (prev.direction === 'asc') return { key: col.key, direction: 'desc' }
      return null
    })
  }

  function cellValue(col: DataTableColumn<T>, row: T): React.ReactNode {
    if (col.render) return col.render(row)
    return String((row as Record<string, unknown>)[col.key] ?? '')
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
      {/* Desktop / tablet: real table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {cellValue(col, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards — first column is the card title, the rest are label/value rows. */}
      <div className="space-y-2 md:hidden">
        {pageRows.map((row) => {
          const [titleCol, ...restCols] = columns
          const visibleRest = restCols.filter((c) => !c.hideOnMobile)
          return (
            <div
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'rounded-lg border bg-card p-3',
                onRowClick && 'cursor-pointer active:bg-muted/50'
              )}
            >
              <div className="font-medium">{cellValue(titleCol, row)}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                {visibleRest.map((col) => (
                  <div key={col.key} className="contents">
                    <dt className="text-muted-foreground">{col.header}</dt>
                    <dd className="text-right">{cellValue(col, row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Showing {sorted.length === 0 ? 0 : start + 1}–
          {Math.min(start + rowsPerPage, sorted.length)} of {sorted.length}
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
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={clampedPage <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={clampedPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-1 tabular-nums">
              Page {clampedPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={clampedPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={clampedPage >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
