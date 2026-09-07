import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, RefreshCw, Search, Download, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  usePartyLedgerSummaries,
  usePartyLedgerDetail,
  type PartyLedgerSummary,
} from '@/hooks/use-party-ledger'
import { partiesQueryKey } from '@/hooks/use-parties'
import { receiptsQueryKey } from '@/hooks/use-receipts'
import { jobCardsQueryKey } from '@/hooks/use-job-cards'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from 'react-i18next'

function balanceLabel(balance: number) {
  if (balance === 0) return <span className="font-medium text-emerald-600">Settled ✓</span>
  if (balance < 0)
    return <span className="font-medium text-emerald-600">₹{Math.abs(balance)} Cr</span>
  return <span className="font-medium text-red-600">₹{balance}</span>
}

export function PartyLedgerPage() {
  const { t } = useTranslation()
  const { data: summaries = [], isLoading, error: loadError, refetch } = usePartyLedgerSummaries()
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
      header: t('common.party'),
      render: (s) => (
        <div>
          <p className="font-medium">{s.party.name}</p>
          <p className="text-xs text-muted-foreground">
            {s.party.mobile} · {s.party.partyNumber}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('common.type'),
      render: (s) => <StatusBadge status={s.party.type === 'customer' ? 'Customer' : 'Supplier'} />,
    },
    {
      key: 'jobs',
      header: t('common.jobs'),
      sortValue: (s) => s.jobsCount,
      render: (s) => s.jobsCount,
    },
    {
      key: 'billed',
      header: t('shared.billed'),
      hideOnMobile: true,
      sortValue: (s) => s.billed,
      render: (s) => `₹${s.billed}`,
    },
    {
      key: 'paid',
      header: t('common.paid'),
      hideOnMobile: true,
      sortValue: (s) => s.paid,
      render: (s) => `₹${s.paid}`,
    },
    {
      key: 'balance',
      header: t('common.balance'),
      sortValue: (s) => s.balance,
      render: (s) => balanceLabel(s.balance),
    },
    {
      key: 'chevron',
      header: '',
      render: () => <ChevronRight className="size-4 text-muted-foreground" />,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={BookOpen}
        title={t('pages.finance.partyLedger.partyLedger')}
        subtitle={t('pages.finance.partyLedger.partyWiseAccountsClickToView')}
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

      <StatCardGrid>
        <StatCard
          label={t('pages.finance.partyLedger.totalParties')}
          value={summaries.length}
          sublabel="With job card activity"
        />
        <StatCard
          label={t('shared.totalBilled')}
          value={`₹${totalBilled}`}
          sublabel="Active jobs only"
          tone="purple"
        />
        <StatCard
          label={t('shared.totalCollected')}
          value={`₹${totalCollected}`}
          sublabel="Incl. advance on unbilled jobs"
          tone="success"
        />
        <StatCard
          label={t('shared.totalOutstanding')}
          value={`₹${totalOutstanding}`}
          sublabel="Pending collection"
          tone="danger"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search party name, mobile, code..."
      >
        <div className="flex gap-1">
          {(['all', 'customer', 'supplier'] as const).map((tab) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={typeFilter === tab ? 'default' : 'outline'}
              onClick={() => setTypeFilter(tab)}
            >
              {tab === 'all' ? 'All' : tab === 'customer' ? 'Customers' : 'Suppliers'}
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
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={Search}
            title={t('pages.finance.partyLedger.noPartiesYet')}
            description={t('pages.finance.partyLedger.partiesAppearHereOnceAJob')}
          />
        }
      />

      <PartyLedgerDetailSheet
        party={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
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
  const { t } = useTranslation()
  const { data, isLoading, error: loadError, refetch } = usePartyLedgerDetail(party?.party.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="xl" className="w-full overflow-y-auto">
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
              <StatCard label={t('shared.totalBilled')} value={`₹${data?.totalBilled ?? 0}`} />
              <StatCard
                label={t('shared.totalPaid')}
                value={`₹${data?.totalPaid ?? 0}`}
                tone="success"
              />
              <StatCard
                label={t('common.balance')}
                value={data ? balanceLabel(data.closingBalance) : '—'}
              />
              <StatCard label={t('shared.entries')} value={data?.rows.length ?? 0} />
            </div>

            <div className="flex items-center justify-end px-4">
              <Button type="button" variant="outline" size="sm">
                <Download className="size-3.5" />
                Export
              </Button>
            </div>

            <div className="overflow-x-auto px-4 pb-4">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : loadError ? (
                <ErrorState error={loadError} onRetry={() => void refetch()} />
              ) : !data || data.rows.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={t('pages.finance.partyLedger.noActivityYet')}
                  description={t('pages.finance.partyLedger.thisPartySJobCardsAnd')}
                />
              ) : (
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="p-2 text-left">{t('common.date')}</th>
                      <th className="p-2 text-left">{t('shared.particulars')}</th>
                      <th className="p-2 text-right">Debit (Dr)</th>
                      <th className="p-2 text-right">Credit (Cr)</th>
                      <th className="p-2 text-right">{t('common.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 align-top whitespace-nowrap text-muted-foreground">
                          {row.date.toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-2 align-top">
                          <p className="font-medium">{row.title}</p>
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                          {row.jobCardNumber && row.kind !== 'jobCreated' && (
                            <p className="text-xs text-teal-600">{row.jobCardNumber}</p>
                          )}
                        </td>
                        <td className="p-2 text-right align-top text-red-600">
                          {row.debit > 0 ? `₹${row.debit}` : ''}
                        </td>
                        <td className="p-2 text-right align-top text-emerald-600">
                          {row.credit > 0 ? `₹${row.credit}` : ''}
                        </td>
                        <td className="p-2 text-right align-top">
                          {balanceLabel(row.runningBalance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-semibold">
                      <td className="p-2" colSpan={2}>
                        Closing Balance
                      </td>
                      <td className="p-2 text-right text-red-600">₹{data.totalBilled}</td>
                      <td className="p-2 text-right text-emerald-600">₹{data.totalPaid}</td>
                      <td className="p-2 text-right">{balanceLabel(data.closingBalance)}</td>
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
