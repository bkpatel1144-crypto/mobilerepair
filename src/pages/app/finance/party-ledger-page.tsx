import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, RefreshCw, Search, Download, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { usePartyLedgerSummaries, usePartyLedgerDetail, type PartyLedgerSummary } from '@/hooks/use-party-ledger'
import { partiesQueryKey } from '@/hooks/use-parties'
import { receiptsQueryKey } from '@/hooks/use-receipts'
import { jobCardsQueryKey } from '@/hooks/use-job-cards'
import { useAuth } from '@/hooks/use-auth'

function balanceLabel(balance: number) {
  if (balance === 0) return <span className="font-medium text-emerald-600">Settled ✓</span>
  if (balance < 0) return <span className="font-medium text-emerald-600">₹{Math.abs(balance)} Cr</span>
  return <span className="font-medium text-red-600">₹{balance}</span>
}

export function PartyLedgerPage() {
  const { data: summaries = [], isLoading } = usePartyLedgerSummaries()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all')
  const [selected, setSelected] = useState<PartyLedgerSummary | null>(null)

  const totalBilled = summaries.reduce((s, x) => s + x.billed, 0)
  const totalCollected = summaries.reduce((s, x) => s + x.paid, 0)
  const totalOutstanding = summaries.reduce((s, x) => s + Math.max(0, x.balance), 0)

  const filtered = summaries
    .filter((s) => typeFilter === 'all' || s.party.type === typeFilter)
    .filter((s) =>
      search.trim()
        ? `${s.party.name} ${s.party.mobile}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  const columns: DataTableColumn<PartyLedgerSummary>[] = [
    {
      key: 'party',
      header: 'Party',
      render: (s) => (
        <div>
          <p className="font-medium">{s.party.name}</p>
          <p className="text-xs text-muted-foreground">{s.party.mobile} · {s.party.partyNumber}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (s) => <StatusBadge status={s.party.type === 'customer' ? 'Customer' : 'Supplier'} />,
    },
    { key: 'jobs', header: 'Jobs', sortValue: (s) => s.jobsCount, render: (s) => s.jobsCount },
    { key: 'billed', header: 'Billed', hideOnMobile: true, sortValue: (s) => s.billed, render: (s) => `₹${s.billed}` },
    { key: 'paid', header: 'Paid', hideOnMobile: true, sortValue: (s) => s.paid, render: (s) => `₹${s.paid}` },
    { key: 'balance', header: 'Balance', sortValue: (s) => s.balance, render: (s) => balanceLabel(s.balance) },
    { key: 'chevron', header: '', render: () => <ChevronRight className="size-4 text-muted-foreground" /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={BookOpen}
        title="Party Ledger"
        subtitle="Party-wise accounts · Click to view full khata"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: partiesQueryKey(profile?.companyId) })
              queryClient.invalidateQueries({ queryKey: receiptsQueryKey(profile?.companyId) })
              queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(profile?.companyId) })
            }}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Parties" value={summaries.length} sublabel="With job card activity" />
        <StatCard label="Total Billed" value={`₹${totalBilled}`} sublabel="Active jobs only" tone="purple" />
        <StatCard label="Total Collected" value={`₹${totalCollected}`} sublabel="Incl. advance on unbilled jobs" tone="success" />
        <StatCard label="Total Outstanding" value={`₹${totalOutstanding}`} sublabel="Pending collection" tone="danger" />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search party name, mobile, code...">
        <div className="flex gap-1">
          {(['all', 'customer', 'supplier'] as const).map((t) => (
            <Button key={t} type="button" size="sm" variant={typeFilter === t ? 'default' : 'outline'} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'customer' ? 'Customers' : 'Suppliers'}
            </Button>
          ))}
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.party.id}
        onRowClick={setSelected}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Search} title="No parties yet" description="Parties appear here once a job card is created for them." />}
      />

      <PartyLedgerDetailSheet party={selected} open={!!selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}

function PartyLedgerDetailSheet({
  party,
  open,
  onOpenChange,
}: {
  party: PartyLedgerSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = usePartyLedgerDetail(party?.party.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {party && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {party.party.name}
                <StatusBadge status={party.party.type === 'customer' ? 'Customer' : 'Supplier'} />
              </SheetTitle>
              <SheetDescription>
                {party.party.mobile} · {party.party.partyNumber}
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
              <StatCard label="Total Billed" value={`₹${data?.totalBilled ?? 0}`} />
              <StatCard label="Total Paid" value={`₹${data?.totalPaid ?? 0}`} tone="success" />
              <StatCard label="Balance" value={data ? balanceLabel(data.closingBalance) : '—'} />
              <StatCard label="Entries" value={data?.rows.length ?? 0} />
            </div>

            <div className="flex items-center justify-end px-4">
              <Button type="button" variant="outline" size="sm">
                <Download className="size-3.5" />
                Export
              </Button>
            </div>

            <div className="overflow-x-auto px-4 pb-4">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : !data || data.rows.length === 0 ? (
                <EmptyState icon={BookOpen} title="No activity yet" description="This party's job cards and payments will appear here." />
              ) : (
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Particulars</th>
                      <th className="p-2 text-right">Debit (Dr)</th>
                      <th className="p-2 text-right">Credit (Cr)</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 align-top whitespace-nowrap text-muted-foreground">
                          {row.date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="p-2 align-top">
                          <p className="font-medium">{row.title}</p>
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                          {row.jobCardNumber && row.kind !== 'jobCreated' && (
                            <p className="text-xs text-teal-600">{row.jobCardNumber}</p>
                          )}
                        </td>
                        <td className="p-2 text-right align-top text-red-600">{row.debit > 0 ? `₹${row.debit}` : ''}</td>
                        <td className="p-2 text-right align-top text-emerald-600">{row.credit > 0 ? `₹${row.credit}` : ''}</td>
                        <td className="p-2 text-right align-top">{balanceLabel(-row.runningBalance)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-semibold">
                      <td className="p-2" colSpan={2}>
                        Closing Balance
                      </td>
                      <td className="p-2 text-right text-red-600">₹{data.totalBilled}</td>
                      <td className="p-2 text-right text-emerald-600">₹{data.totalPaid}</td>
                      <td className="p-2 text-right">{balanceLabel(-data.closingBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
