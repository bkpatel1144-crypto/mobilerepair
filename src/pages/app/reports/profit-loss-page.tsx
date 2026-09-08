import { useState } from 'react'
import { TrendingUp, IndianRupee, TrendingDown, Percent, Download, Info } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { usePnl } from '@/hooks/use-pnl'
import { downloadCsv } from '@/lib/csv-export'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

function Row({
  label,
  amount,
  sublabel,
  emphasis,
  negative,
  indent,
}: {
  label: string
  amount: number
  sublabel?: string
  emphasis?: 'total' | 'grand'
  negative?: boolean
  indent?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-between gap-2 py-2.5',
        indent && 'pl-4',
        emphasis === 'total' && 'border-t font-semibold',
        emphasis === 'grand' && 'border-t-2 text-base font-bold'
      )}
    >
      <span className={cn(!emphasis && 'text-muted-foreground')}>
        {label}
        {sublabel && <span className="ml-2 text-xs text-muted-foreground">{sublabel}</span>}
      </span>
      <span
        className={cn(
          'tabular-nums',
          negative && amount > 0 && 'text-red-600',
          emphasis === 'grand' &&
            (amount >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600')
        )}
      >
        {negative && amount > 0 ? '−' : ''}₹{Math.abs(amount).toLocaleString('en-IN')}
      </span>
    </div>
  )
}

/**
 * Cash-basis Profit & Loss — see `usePnl` for why cash rather than accrual, and for how a
 * payment out is split three ways. Everything on this page is counted from real cash movements;
 * there is no estimated or annualised figure anywhere on it.
 */
export function ProfitLossPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRangeKey | 'all'>('month')
  const { data, isLoading, error: loadError, refetch } = usePnl(range)

  const rangeLabel =
    range === 'all'
      ? 'All time'
      : {
          today: t('common.today'),
          yesterday: t('common.yesterday'),
          week: 'This week',
          month: 'This month',
          year: 'This year',
          custom: t('common.custom'),
        }[range]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={TrendingUp}
        title={t('pages.reports.profitLoss.profitLoss')}
        subtitle={t('pages.reports.profitLoss.cashBasisMoneyActuallyReceivedAnd')}
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || data.entryCount === 0}
            onClick={() =>
              downloadCsv('profit-and-loss.csv', [
                { Line: t('pages.reports.profitLoss.revenueReceived'), Amount: data.revenue },
                { Line: 'Less: refunds', Amount: -data.refunds },
                { Line: t('pages.reports.profitLoss.netRevenue'), Amount: data.netRevenue },
                { Line: 'Less: direct cost (supplier payments)', Amount: -data.directCost },
                { Line: t('pages.reports.profitLoss.grossProfit'), Amount: data.grossProfit },
                ...data.expenseLines.map((l) => ({
                  Line: `Expense — ${l.label}`,
                  Amount: -l.amount,
                })),
                {
                  Line: t('pages.reports.profitLoss.totalOperatingExpenses'),
                  Amount: -data.operatingExpenses,
                },
                { Line: t('pages.reports.profitLoss.netProfit'), Amount: data.netProfit },
              ])
            }
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <FilterBar dateRange={range === 'all' ? undefined : range} onDateRangeChange={setRange}>
        <Button
          type="button"
          size="sm"
          variant={range === 'all' ? 'default' : 'outline'}
          onClick={() => setRange('all')}
        >
          All Time
        </Button>
      </FilterBar>

      {loadError ? (
        <ErrorState error={loadError} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : data.entryCount === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t('pages.reports.profitLoss.noCashMovementsInThisPeriod')}
          description={t('pages.reports.profitLoss.profitLossIsBuiltFromReceipts')}
        />
      ) : (
        <>
          <StatCardGrid>
            <StatCard
              label={t('pages.reports.profitLoss.netRevenue')}
              value={`₹${data.netRevenue}`}
              icon={IndianRupee}
              tone="success"
            />
            <StatCard
              label={t('shared.grossProfit')}
              value={`₹${data.grossProfit}`}
              sublabel={`${data.grossMarginPct}% margin`}
              icon={TrendingUp}
              tone={data.grossProfit >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              label={t('common.expensesLabel')}
              value={`₹${data.operatingExpenses}`}
              icon={TrendingDown}
              tone="warning"
            />
            <StatCard
              label={t('shared.netProfit')}
              value={`₹${data.netProfit}`}
              sublabel={`${data.netMarginPct}% margin`}
              icon={Percent}
              tone={data.netProfit >= 0 ? 'success' : 'danger'}
            />
          </StatCardGrid>

          <div className="rounded-xl border bg-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b p-4">
              <h2 className="font-semibold">{t('pages.reports.profitLoss.statement')}</h2>
              <p className="text-sm text-muted-foreground">
                {rangeLabel} · {data.entryCount} cash entries
              </p>
            </div>

            <div className="divide-y-0 px-4 pb-4">
              <Row label={t('pages.reports.profitLoss.revenueReceived')} amount={data.revenue} />
              {data.refunds > 0 && (
                <Row
                  label={t('pages.reports.profitLoss.lessRefundsToCustomers')}
                  amount={data.refunds}
                  negative
                  indent
                />
              )}
              <Row
                label={t('pages.reports.profitLoss.netRevenue2')}
                amount={data.netRevenue}
                emphasis="total"
              />

              <Row
                label={t('pages.reports.profitLoss.directCost')}
                sublabel="paid to suppliers"
                amount={data.directCost}
                negative
              />
              <Row
                label={t('pages.reports.profitLoss.grossProfit')}
                sublabel={`${data.grossMarginPct}%`}
                amount={data.grossProfit}
                emphasis="total"
              />

              {data.expenseLines.length > 0 && (
                <p className="pt-4 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Operating expenses
                </p>
              )}
              {data.expenseLines.map((line) => (
                <Row key={line.label} label={line.label} amount={line.amount} negative indent />
              ))}
              <Row
                label={t('pages.reports.profitLoss.totalOperatingExpenses')}
                amount={data.operatingExpenses}
                negative
                emphasis="total"
              />

              <Row
                label={t('pages.reports.profitLoss.netProfit')}
                sublabel={`${data.netMarginPct}%`}
                amount={data.netProfit}
                emphasis="grand"
              />
            </div>
          </div>

          <p className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Cash basis: a job billed but not yet paid is not revenue here until the money arrives,
              and a supplier bill entered but unpaid is not a cost until it is settled. Outstanding
              amounts on both sides live on Receivables and Supplier Payables.
            </span>
          </p>
        </>
      )}
    </div>
  )
}
