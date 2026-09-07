import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Banknote, RefreshCw, Search, Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { Button } from '@/components/ui/button'
import { useCashBook, type CashBookRow } from '@/hooks/use-cash-book'
import { receiptsQueryKey } from '@/hooks/use-receipts'
import { useAuth } from '@/hooks/use-auth'
import { formatTimestamp } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function CashBookPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const { data, isLoading, error: loadError, refetch } = useCashBook(dateRange)

  const filtered = data.rows.filter((r) =>
    search.trim()
      ? `${r.receiptNumber} ${r.partyName} ${r.jobCardNumber ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true
  )

  const columns: DataTableColumn<CashBookRow>[] = [
    { key: 'date', header: t('common.date'), render: (r) => formatTimestamp(r.createdAt) },
    {
      key: 'particulars',
      header: t('shared.particulars'),
      render: (r) => (
        <div>
          <p className="font-medium">{r.partyName}</p>
          <p className="text-xs text-muted-foreground">
            {r.receiptNumber} · {r.jobCardNumber ?? 'Manual entry'} · {r.mode.toUpperCase()}
          </p>
        </div>
      ),
    },
    {
      key: 'in',
      header: 'Credit (IN)',
      render: (r) =>
        r.direction === 'in' ? <span className="text-emerald-600">₹{r.amount}</span> : '',
    },
    {
      key: 'out',
      header: 'Debit (OUT)',
      render: (r) =>
        r.direction === 'out' ? <span className="text-red-600">₹{r.amount}</span> : '',
    },
    { key: 'balance', header: t('common.balance'), render: (r) => `₹${r.runningBalance}` },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Banknote}
        title="Cash Book"
        subtitle="Running cash position across every receipt and payment"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: receiptsQueryKey(profile?.companyId) })
              }
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline">
              <Download className="size-4" />
              Export
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.opening')} value={`₹${data.opening}`} />
        <StatCard label="Total Credit (IN)" value={`₹${data.totalCredit}`} tone="success" />
        <StatCard label="Total Debit (OUT)" value={`₹${data.totalDebit}`} tone="danger" />
        <StatCard label={t('common.closing')} value={`₹${data.closing}`} tone="info" />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search receipt, party..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={Search}
            title="No entries in this range"
            description="Receipts and payments recorded here will appear in the cash book."
          />
        }
      />

      {filtered.length > 0 && (
        <p className="text-right text-sm font-medium text-muted-foreground">
          Closing Balance ({filtered.length} entry total):{' '}
          <span className="text-foreground">₹{data.closing}</span>
        </p>
      )}
    </div>
  )
}
