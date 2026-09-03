import { useState } from 'react'
import { Calendar, CalendarPlus, CheckCircle2, Lock, AlertTriangle, Star } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useFinancialYears,
  useCreateFinancialYear,
  useActivateFinancialYear,
  useSetFinancialYearLock,
  type FinancialYearWithId,
} from '@/hooks/use-financial-years'
import { getNextFinancialYear, formatFinancialYearDuration } from '@/lib/financial-year'
import { formatTimestamp } from '@/lib/utils'

export function FinancialYearsPage() {
  const { data: fys = [], isLoading } = useFinancialYears()
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<FinancialYearWithId | null>(null)
  const [confirming, setConfirming] = useState<'activate' | 'lock' | null>(null)
  const [creating, setCreating] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')

  const createFy = useCreateFinancialYear()
  const activateFy = useActivateFinancialYear()
  const setLock = useSetFinancialYearLock()

  const filtered = fys.filter((f) => (search.trim() ? f.name.toLowerCase().includes(search.toLowerCase()) : true))
  const currentFy = fys.find((f) => f.isCurrent)
  const mostRecent = fys[0] // sorted newest-startDate-first

  async function handleCreateNext() {
    const base = mostRecent ?? currentFy
    const next = base ? getNextFinancialYear({ startDate: base.startDate.toDate() }) : null
    if (!next) return
    await createFy.mutateAsync(next)
  }

  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim() || !startInput || !endInput) return
    await createFy.mutateAsync({ name: nameInput.trim(), startDate: new Date(`${startInput}T00:00:00`), endDate: new Date(`${endInput}T00:00:00`) })
    setCreating(false)
    setNameInput('')
    setStartInput('')
    setEndInput('')
  }

  const columns: DataTableColumn<FinancialYearWithId>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (f) => f.startDate.toMillis(),
      render: (f) => (
        <span className="inline-flex items-center gap-1.5">
          {f.isCurrent && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
          <span className="font-medium">{f.name}</span>
          {f.isCurrent && <StatusBadge status="Current" tone="warning" />}
        </span>
      ),
    },
    { key: 'start', header: 'Start Date', render: (f) => formatTimestamp(f.startDate, false) },
    { key: 'end', header: 'End Date', hideOnMobile: true, render: (f) => formatTimestamp(f.endDate, false) },
    {
      key: 'status',
      header: 'Status',
      render: (f) => (f.isLocked ? <StatusBadge status="Locked" tone="neutral" icon={Lock} /> : <StatusBadge status={f.isActive ? 'Active' : 'Inactive'} tone={f.isActive ? 'success' : 'neutral'} dot />),
    },
    { key: 'created', header: 'Created', hideOnMobile: true, render: (f) => formatTimestamp(f.createdAt, false) },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Calendar}
        title="Financial Years"
        subtitle="Manage financial year periods and transitions"
        actions={
          <Button type="button" onClick={() => setCreating(true)}>
            + Create FY
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-xl">
        <StatCard label="Total" value={fys.length} icon={Calendar} />
        <StatCard label="Active" value={fys.filter((f) => f.isActive).length} icon={CheckCircle2} tone="success" />
        <StatCard label="Locked" value={fys.filter((f) => f.isLocked).length} icon={Lock} />
        <StatCard label="Inactive" value={fys.filter((f) => !f.isActive).length} tone="warning" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={handleCreateNext} disabled={isLoading || createFy.isPending}>
          <CalendarPlus className="size-4" />
          Create Next FY
        </Button>
        {currentFy && <p className="text-sm text-muted-foreground">Current: {currentFy.name}</p>}
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search financial years..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Calendar} title="No financial years found" />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Calendar}
          title={viewing.name}
          subtitle={`${formatTimestamp(viewing.startDate, false)} – ${formatTimestamp(viewing.endDate, false)}`}
          badges={
            <>
              {viewing.isCurrent && <StatusBadge status="Current" tone="warning" />}
              <StatusBadge status={viewing.isActive ? 'Active' : 'Inactive'} tone={viewing.isActive ? 'success' : 'neutral'} dot />
              {viewing.isLocked && <StatusBadge status="Locked" icon={Lock} />}
            </>
          }
          actions={
            <>
              {!viewing.isCurrent && (
                <Button type="button" size="sm" onClick={() => setConfirming('activate')} disabled={activateFy.isPending || viewing.isLocked}>
                  Activate
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirming('lock')}>
                {viewing.isLocked ? 'Unlock' : 'Lock'}
              </Button>
            </>
          }
          sections={[
            {
              title: '✓ STATUS INFORMATION',
              children: viewing.isCurrent ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
                  <p className="font-medium text-emerald-800 dark:text-emerald-400">CURRENT STATUS: Active</p>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80">This is the currently active financial year for all transactions</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not the current financial year.</p>
              ),
            },
            {
              title: '📅 PERIOD DETAILS',
              rows: [
                { label: 'Financial Year Name', value: viewing.name },
                { label: 'Start Date', value: formatTimestamp(viewing.startDate, false) },
                { label: 'End Date', value: formatTimestamp(viewing.endDate, false) },
                { label: 'Duration', value: formatFinancialYearDuration(viewing.startDate.toDate(), viewing.endDate.toDate()) },
              ],
            },
            {
              title: '🏳 STATE FLAGS',
              rows: [
                { label: 'Active Status', value: viewing.isActive ? 'Yes' : 'No', tone: viewing.isActive ? 'success' : 'default' },
                { label: 'Locked Status', value: viewing.isLocked ? 'Yes' : 'No', tone: viewing.isLocked ? 'warning' : 'default' },
              ],
            },
            ...(viewing.isCurrent
              ? [{
                  title: '',
                  children: (
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-500/10">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-blue-700 dark:text-blue-400" />
                      <p className="text-blue-800 dark:text-blue-400">
                        This is the currently active financial year. Only one financial year can be active at a time.
                      </p>
                    </div>
                  ),
                }]
              : []),
          ]}
          timeline={[{ title: 'Created', timestamp: formatTimestamp(viewing.createdAt) }]}
        />
      )}

      <FormModal
        open={creating}
        onOpenChange={setCreating}
        title="Create Financial Year"
        description="Add a new financial year for your organization"
        onSubmit={handleManualCreate}
        submitLabel="Create Financial Year"
        isSubmitting={createFy.isPending}
      >
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={nameInput} onChange={(e) => setNameInput(e.target.value.slice(0, 20))} placeholder="e.g., FY 2025-26" autoFocus />
          <p className="text-xs text-muted-foreground">{nameInput.length}/20 characters</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start Date *</Label>
            <Input type="date" value={startInput} onChange={(e) => setStartInput(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date *</Label>
            <Input type="date" value={endInput} onChange={(e) => setEndInput(e.target.value)} />
          </div>
        </div>
        <p className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
          Note: Use "Create Next FY" for sequential years. This form is for manual creation only.
        </p>
      </FormModal>

      {viewing && confirming && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirming(null)}
          title={
            confirming === 'activate'
              ? `Make "${viewing.name}" the current financial year?`
              : `${viewing.isLocked ? 'Unlock' : 'Lock'} "${viewing.name}"?`
          }
          message={
            confirming === 'activate'
              ? `This deactivates "${currentFy?.name ?? 'the current FY'}" and makes this one current instead. Only one financial year can be active at a time.`
              : viewing.isLocked
                ? 'Unlocking reopens this period — a closed accounting period becomes editable again.'
                : 'Locking this period is advisory in this build — no other feature currently checks it before posting a new transaction.'
          }
          confirmLabel={confirming === 'activate' ? 'Activate' : viewing.isLocked ? 'Unlock' : 'Lock'}
          destructive={confirming === 'activate' || viewing.isLocked}
          isPending={confirming === 'activate' ? activateFy.isPending : setLock.isPending}
          onConfirm={() => {
            if (confirming === 'activate') {
              activateFy.mutate({ target: viewing, allFYs: fys }, { onSuccess: () => { setConfirming(null); setViewing(null) } })
            } else {
              setLock.mutate({ id: viewing.id, isLocked: !viewing.isLocked, name: viewing.name }, { onSuccess: () => { setConfirming(null); setViewing(null) } })
            }
          }}
        />
      )}
    </div>
  )
}
