import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { HandCoins, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { usePayables } from '@/hooks/use-payables'
import { jobCardsQueryKey } from '@/hooks/use-job-cards'
import { useAuth } from '@/hooks/use-auth'
import { formatTimestamp } from '@/lib/utils'

type Tab = 'all' | 'refundDue' | 'unusedAdvance'

export function PayablesPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = usePayables()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = data.rows
    .filter((r) => tab === 'all' || r.kind === tab)
    .filter((r) =>
      search.trim()
        ? `${r.job.jobNumber} ${r.job.customerName}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={HandCoins}
        title="Payables"
        subtitle="Refunds due and unused advances the shop is currently holding"
        actions={
          <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(profile?.companyId) })}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Payable" value={`₹${data.totalPayable}`} tone="danger" />
        <StatCard label="Refund Due" value={`₹${data.refundDueTotal}`} tone="warning" />
        <StatCard label="Unused Advance" value={`₹${data.unusedAdvanceTotal}`} tone="info" />
        <StatCard label="Advance Credit" value={`₹${data.advanceCreditTotal}`} tone="purple" />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search job card, customer...">
        <div className="flex gap-1">
          {(['all', 'refundDue', 'unusedAdvance'] as const).map((t) => (
            <Button key={t} type="button" size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>
              {t === 'all' ? 'All' : t === 'refundDue' ? 'Refund Due' : 'Unused Advance'}
            </Button>
          ))}
        </div>
      </FilterBar>

      {isLoading ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Nothing payable right now" description="Refunds due and unused advances will appear here." />
      ) : (
        <div className="divide-y rounded-lg border">
          {filtered.map((row) => {
            const isOpen = expandedId === row.job.id
            return (
              <div key={row.job.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : row.job.id)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/40"
                >
                  {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{row.job.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.job.jobNumber} · {formatTimestamp(row.job.createdAt, false)}
                    </p>
                  </div>
                  <StatusBadge status={row.kind === 'refundDue' ? 'Refund Due' : 'Unused Advance'} tone={row.kind === 'refundDue' ? 'warning' : 'info'} />
                  <span className="font-semibold text-red-600">₹{row.amountDue}</span>
                </button>
                {isOpen && (
                  <div className="grid grid-cols-3 gap-3 border-t bg-muted/20 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Total Received</p>
                      <p className="font-medium">₹{row.totalReceived}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Already Refunded</p>
                      <p className="font-medium">₹{row.alreadyRefunded}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">
                        {row.kind === 'refundDue' ? 'Refund Due' : 'Unused Advance'}
                      </p>
                      <p className="font-medium text-red-600">₹{row.amountDue}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
