import { useState } from 'react'
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Lock,
  LockOpen,
  Star,
  XCircle,
  RefreshCw,
  Plus,
  Filter,
  Eye,
  MoreVertical,
  Pencil,
  CircleX,
  Info,
  Clock,
  Layers,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatPill, StatPillRow } from '@/components/shared/stat-pill'
import { DetailBlock, DetailValue, DetailNote } from '@/components/shared/detail-block'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, toDateInputValue } from '@/lib/utils'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormError } from '@/components/shared/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useFinancialYears,
  useCreateFinancialYear,
  useActivateFinancialYear,
  useSetFinancialYearLock,
  useUpdateFinancialYear,
  type FinancialYearWithId,
} from '@/hooks/use-financial-years'
import { getNextFinancialYear, formatFinancialYearDuration } from '@/lib/financial-year'
import { formatDateShort, formatDateTimeLong } from '@/lib/utils'

export function FinancialYearsPage() {
  const { data: fys = [], isLoading, error: loadError, refetch } = useFinancialYears()
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<FinancialYearWithId | null>(null)
  const [confirming, setConfirming] = useState<'activate' | 'lock' | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<FinancialYearWithId | null>(null)
  const [showLockedOnly, setShowLockedOnly] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')

  const createFy = useCreateFinancialYear()
  const activateFy = useActivateFinancialYear()
  const setLock = useSetFinancialYearLock()
  const updateFy = useUpdateFinancialYear()

  const filtered = fys
    .filter((f) => (showLockedOnly ? f.isLocked : true))
    .filter((f) => (search.trim() ? f.name.toLowerCase().includes(search.toLowerCase()) : true))
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
    setFormError(null)
    if (!nameInput.trim() || !startInput || !endInput) {
      setFormError('Name, start date and end date are all required.')
      return
    }
    const startDate = new Date(`${startInput}T00:00:00`)
    const endDate = new Date(`${endInput}T00:00:00`)
    if (endDate <= startDate) {
      setFormError('The end date must be after the start date.')
      return
    }
    try {
      if (editing) {
        await updateFy.mutateAsync({
          id: editing.id,
          name: nameInput.trim(),
          startDate,
          endDate,
          isLocked: editing.isLocked,
        })
      } else {
        await createFy.mutateAsync({ name: nameInput.trim(), startDate, endDate })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save this financial year.')
      return
    }
    setCreating(false)
    setEditing(null)
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
        <span className="inline-flex items-center gap-2">
          <Star
            className={cn(
              'size-4 shrink-0',
              f.isCurrent ? 'fill-amber-400 text-amber-400' : 'text-transparent'
            )}
          />
          <span className={cn('font-medium', f.isCurrent && 'text-teal-700 dark:text-teal-400')}>
            {f.name}
          </span>
          {f.isCurrent && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              Current
            </span>
          )}
        </span>
      ),
    },
    { key: 'start', header: 'Start Date', render: (f) => formatDateShort(f.startDate) },
    {
      key: 'end',
      header: 'End Date',
      hideOnMobile: true,
      render: (f) => formatDateShort(f.endDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) =>
        f.isLocked ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" />
            Locked
          </span>
        ) : f.isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
            <CheckCircle2 className="size-3.5" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <XCircle className="size-3.5" />
            Inactive
          </span>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      hideOnMobile: true,
      render: (f) => formatDateShort(f.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${f.name}`}
            className="text-teal-600 dark:text-teal-400"
            onClick={(e) => {
              e.stopPropagation()
              setViewing(f)
            }}
          >
            <Eye className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${f.name}`}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* "Close" is the accounting sense of the word — lock the year so nothing further
               * can be posted into it. Named as the reference names it, with Unlock shown when
               * it is already closed so the action is never a one-way door. */}
              <DropdownMenuItem
                onClick={() => {
                  setViewing(f)
                  setConfirming('lock')
                }}
              >
                {f.isLocked ? <LockOpen /> : <CircleX />}
                {f.isLocked ? 'Reopen' : 'Close'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditing(f)
                  setNameInput(f.name)
                  setStartInput(toDateInputValue(f.startDate.toDate()))
                  setEndInput(toDateInputValue(f.endDate.toDate()))
                }}
              >
                <Pencil />
                Edit
              </DropdownMenuItem>
              {!f.isCurrent && !f.isLocked && (
                <DropdownMenuItem
                  onClick={() => {
                    setViewing(f)
                    setConfirming('activate')
                  }}
                >
                  <Star />
                  Make Current
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Calendar}
        title="Financial Years"
        subtitle="Manage financial year periods and transitions"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Create FY
            </Button>
          </>
        }
      />

      <StatPillRow>
        <StatPill label="Total" count={fys.length} />
        <StatPill
          icon={CheckCircle2}
          label="Active"
          count={fys.filter((f) => f.isActive).length}
          tone="success"
        />
        <StatPill icon={Lock} label="Locked" count={fys.filter((f) => f.isLocked).length} />
        <StatPill
          icon={XCircle}
          label="Inactive"
          count={fys.filter((f) => !f.isActive).length}
          tone="danger"
        />
      </StatPillRow>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCreateNext}
          disabled={isLoading || createFy.isPending || !mostRecent}
        >
          <CalendarPlus className="size-4" />
          {createFy.isPending ? 'Creating…' : 'Create Next FY'}
        </Button>
        {/* The reference shows this hint whenever nothing is marked current; it explains why
         * Create Next FY has nothing to count forward from. */}
        <p className="text-sm text-muted-foreground">
          {currentFy ? `Current: ${currentFy.name}` : 'Activate a financial year first'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search financial years..."
          className="h-10 max-w-md flex-1 rounded-full"
        />
        <Button
          type="button"
          variant={showLockedOnly ? 'secondary' : 'outline'}
          className="h-10"
          aria-pressed={showLockedOnly}
          onClick={() => setShowLockedOnly((v) => !v)}
        >
          <Filter className="size-4" />
          Filters
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        // The current year is tinted so it is findable in a list of many without reading
        // the Status column — the same treatment the default company gets.
        rowClassName={(f) => (f.isCurrent ? 'bg-amber-50/70 dark:bg-amber-500/10' : undefined)}
        emptyState={<EmptyState icon={Calendar} title="No financial years found" />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Calendar}
          title={viewing.name}
          subtitle={`${formatDateShort(viewing.startDate)} – ${formatDateShort(viewing.endDate)}`}
          badges={
            <>
              {viewing.isCurrent && <StatusBadge status="Current" tone="warning" />}
              <StatusBadge
                status={viewing.isActive ? 'Active' : 'Inactive'}
                tone={viewing.isActive ? 'success' : 'neutral'}
                dot
              />
              {viewing.isLocked && <StatusBadge status="Locked" icon={Lock} />}
            </>
          }
          actions={
            <>
              {!viewing.isCurrent && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setConfirming('activate')}
                  disabled={activateFy.isPending || viewing.isLocked}
                >
                  Activate
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirming('lock')}
              >
                {viewing.isLocked ? 'Unlock' : 'Lock'}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <DetailBlock icon={Info} title="State Flags" tone="purple">
              <DetailValue
                label="Active Status"
                value={viewing.isActive ? 'Yes' : 'No'}
                divider
                trailing={
                  viewing.isActive ? (
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="size-6 text-muted-foreground" />
                  )
                }
              />
              <DetailValue
                label="Locked Status"
                value={viewing.isLocked ? 'Yes' : 'No'}
                trailing={
                  viewing.isLocked ? (
                    <Lock className="size-6 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  )
                }
              />
            </DetailBlock>

            {viewing.isCurrent && (
              <DetailNote icon={CheckCircle2} title="Active Financial Year">
                This is the currently active financial year. All new transactions will be recorded
                under this period. Only one financial year can be active at a time.
              </DetailNote>
            )}

            {viewing.isLocked && (
              <DetailNote icon={Lock} title="Closed Period" tone="amber">
                This year is closed. Existing records stay readable; it is reopened from the Actions
                menu.
              </DetailNote>
            )}

            <DetailBlock icon={Layers} title="Period Details" tone="teal">
              <DetailValue label="Financial Year Name" value={viewing.name} divider />
              <DetailValue label="Start Date" value={formatDateShort(viewing.startDate)} divider />
              <DetailValue label="End Date" value={formatDateShort(viewing.endDate)} divider />
              <DetailValue
                label="Duration"
                value={formatFinancialYearDuration(
                  viewing.startDate.toDate(),
                  viewing.endDate.toDate()
                )}
              />
            </DetailBlock>

            <DetailBlock icon={Clock} title="Timeline" tone="amber">
              <DetailValue label="Created" value={formatDateTimeLong(viewing.createdAt)} divider />
              <DetailValue label="Last Updated" value={formatDateTimeLong(viewing.updatedAt)} />
            </DetailBlock>
          </div>
        </DetailDrawer>
      )}

      <FormModal
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (open) return
          setCreating(false)
          setEditing(null)
          setFormError(null)
        }}
        title={editing ? 'Edit Financial Year' : 'Create Financial Year'}
        description={
          editing
            ? 'Rename this period or correct its dates.'
            : 'Add a new financial year for your organization'
        }
        onSubmit={handleManualCreate}
        submitLabel={editing ? 'Save Changes' : 'Create Financial Year'}
        isSubmitting={createFy.isPending || updateFy.isPending}
      >
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value.slice(0, 20))}
            placeholder="e.g., FY 2025-26"
            autoFocus
          />
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
        {formError && <FormError message={formError} />}
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
          confirmLabel={
            confirming === 'activate' ? 'Activate' : viewing.isLocked ? 'Unlock' : 'Lock'
          }
          destructive={confirming === 'activate' || viewing.isLocked}
          isPending={confirming === 'activate' ? activateFy.isPending : setLock.isPending}
          onConfirm={() => {
            if (confirming === 'activate') {
              activateFy.mutate(
                { target: viewing, allFYs: fys },
                {
                  onSuccess: () => {
                    setConfirming(null)
                    setViewing(null)
                  },
                }
              )
            } else {
              setLock.mutate(
                { id: viewing.id, isLocked: !viewing.isLocked, name: viewing.name },
                {
                  onSuccess: () => {
                    setConfirming(null)
                    setViewing(null)
                  },
                }
              )
            }
          }}
        />
      )}
    </div>
  )
}
