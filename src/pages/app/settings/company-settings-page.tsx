import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  Plus,
  RefreshCw,
  Crown,
  Star,
  Eye,
  MoreVertical,
  Pencil,
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  Settings as SettingsIcon,
  ShieldCheck,
  Wallet,
  Clock,
  ArrowLeftRight,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { FormModal } from '@/components/shared/form-modal'
import { FormError } from '@/components/shared/form-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCompany, useUpdateCompany } from '@/hooks/use-company'
import { useCompanies, useCreateCompany, useSwitchCompany } from '@/hooks/use-companies'
import { useAuth } from '@/hooks/use-auth'
import { buildPath } from '@/config/nav'
import { formatDateTimeLong, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CompanyForm } from './company-form'
import { BLANK_COMPANY, validateCompany, type CompanyFormValues } from '@/lib/company-validation'
import type { CompanyWithId } from '@/hooks/use-company'
import { useTranslation } from 'react-i18next'

/** The UI says "Inactive" (matching the reference) while the stored value is `disabled` —
 * `EntityStatus` is shared across every entity in the app, so it is the label that bends here,
 * not the data. */
type StatusFilter = 'active' | 'disabled' | 'deleted'

const STATUS_LABEL: Record<StatusFilter, string> = {
  active: 'Active',
  disabled: 'Inactive',
  deleted: 'Deleted',
}

function formValuesFrom(c: CompanyWithId): CompanyFormValues {
  return {
    name: c.name,
    code: c.code,
    legalName: c.legalName,
    gstRegistration: c.gstRegistration,
    gstin: c.gstin ?? '',
    pan: c.pan ?? '',
    email: c.email,
    phone: c.phone,
    currency: c.currency,
    timezone: c.timezone,
  }
}

function DetailBlock({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  tone: 'purple' | 'teal' | 'amber'
  children: React.ReactNode
}) {
  const tones = {
    purple: 'bg-purple-50 dark:bg-purple-500/10',
    teal: 'bg-teal-50 dark:bg-teal-500/10',
    amber: 'bg-amber-50 dark:bg-amber-500/10',
  }
  const iconTones = {
    purple: 'text-purple-600 dark:text-purple-400',
    teal: 'text-teal-600 dark:text-teal-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className={cn('size-4', iconTones[tone])} />
        {title}
      </h3>
      <div className={cn('space-y-3 rounded-xl p-4', tones[tone])}>{children}</div>
    </section>
  )
}

function DetailValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}

export function CompanySettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: active } = useCompany()
  const { data: companies = [], isLoading, error: loadError, refetch } = useCompanies()
  const createCompany = useCreateCompany()
  const switchCompany = useSwitchCompany()
  const updateCompany = useUpdateCompany()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [viewing, setViewing] = useState<CompanyWithId | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CompanyWithId | null>(null)
  const [form, setForm] = useState<CompanyFormValues>(BLANK_COMPANY)
  const [error, setError] = useState<string | null>(null)

  const counts = {
    active: companies.filter((c) => c.status === 'active').length,
    disabled: companies.filter((c) => c.status === 'disabled').length,
    deleted: companies.filter((c) => c.status === 'deleted').length,
  }

  const filtered = companies
    .filter((c) => c.status === statusFilter)
    .filter((c) =>
      search.trim()
        ? `${c.name} ${c.code} ${c.email}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  function startCreate() {
    setForm(BLANK_COMPANY)
    setError(null)
    setCreating(true)
  }

  function startEdit(c: CompanyWithId) {
    setForm(formValuesFrom(c))
    setError(null)
    setEditing(c)
    setViewing(null)
  }

  async function submitCreate() {
    const problem = validateCompany(form)
    if (problem) {
      setError(problem)
      return
    }
    try {
      await createCompany.mutateAsync({
        ...form,
        gstin: form.gstin.trim() || null,
        pan: form.pan.trim() || null,
      })
      setCreating(false)
      // The new company is now active and the whole cache was cleared — land on the dashboard so
      // nothing on screen is left showing the company that was just switched away from.
      navigate('/app/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this company.')
    }
  }

  async function submitEdit() {
    if (!editing) return
    const problem = validateCompany(form)
    if (problem) {
      setError(problem)
      return
    }
    try {
      await updateCompany.mutateAsync({
        ...form,
        gstin: form.gstin.trim() || null,
        pan: form.pan.trim() || null,
      })
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save these changes.')
    }
  }

  const columns: DataTableColumn<CompanyWithId>[] = [
    {
      key: 'name',
      header: 'Company Name',
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold',
              c.protected
                ? 'bg-amber-400 text-amber-950'
                : 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
            )}
          >
            {c.protected ? <Crown className="size-4" /> : getInitials(c.name)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 font-medium">
              <span className="truncate">{c.name}</span>
              {c.protected && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-700 dark:border-amber-500/40 dark:text-amber-400">
                  Default
                </span>
              )}
              {c.id === profile?.companyId && (
                <span className="shrink-0 rounded-full bg-teal-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                  Active
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{c.legalName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: t('common.code'),
      hideOnMobile: true,
      sortValue: (c) => c.code,
      render: (c) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{c.code}</code>
      ),
    },
    {
      key: 'gstin',
      header: t('common.gstin'),
      hideOnMobile: true,
      render: (c) =>
        c.gstRegistration === 'Unregistered' || !c.gstin ? (
          <span className="text-sm text-muted-foreground italic">Unregistered</span>
        ) : (
          <span className="font-mono text-xs">{c.gstin}</span>
        ),
    },
    {
      key: 'contact',
      header: 'Contact',
      hideOnMobile: true,
      render: (c) => (
        <div>
          <p className="truncate">{c.email}</p>
          <p className="text-xs text-muted-foreground">{c.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${c.name}`}
            className="text-teal-600 dark:text-teal-400"
            onClick={(e) => {
              e.stopPropagation()
              setViewing(c)
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
                  aria-label={`Actions for ${c.name}`}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {c.protected && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-2 font-normal text-amber-700 dark:text-amber-400">
                      <Crown className="size-4" />
                      Default Company
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              {c.id !== profile?.companyId && (
                <DropdownMenuItem onClick={() => switchCompany.mutate(c.id)}>
                  <ArrowLeftRight />
                  Switch to this company
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => startEdit(c)}>
                <Pencil />
                Edit Company
              </DropdownMenuItem>
              {c.protected && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <Shield />
                    Protected: Cannot disable/delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const statusCards: {
    key: StatusFilter
    label: string
    count: number
    icon: typeof CheckCircle2
    tone: string
  }[] = [
    {
      key: 'active',
      label: t('common.active'),
      count: counts.active,
      icon: CheckCircle2,
      tone: 'text-teal-600 dark:text-teal-400',
    },
    {
      key: 'disabled',
      label: t('common.inactive'),
      count: counts.disabled,
      icon: XCircle,
      tone: 'text-red-600',
    },
    {
      key: 'deleted',
      label: t('common.deleted'),
      count: counts.deleted,
      icon: Trash2,
      tone: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Store}
        title="Company Management"
        subtitle="Manage company information and settings"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button type="button" onClick={startCreate}>
              <Plus className="size-4" />
              Add Company
            </Button>
          </>
        }
      />

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
        {statusCards.map((s) => {
          const selected = statusFilter === s.key
          return (
            <button
              key={s.key}
              type="button"
              data-slot="button"
              aria-pressed={selected}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border p-4 text-left transition-colors',
                selected ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-500/10' : 'hover:bg-muted/50'
              )}
            >
              <s.icon className={cn('size-5 shrink-0', s.tone)} />
              <span className="font-medium">{s.label}</span>
              <span className="ml-auto text-lg font-bold tabular-nums">{s.count}</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="link"
          className="text-teal-600 dark:text-teal-400"
          render={<a href={buildPath('settings', 'branches')} />}
        >
          <SettingsIcon className="size-4" />
          Company Preferences (active company)
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, or email..."
          className="h-10 max-w-md flex-1 rounded-full"
        />
      </div>

      <p className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Viewing:</span>
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
          {STATUS_LABEL[statusFilter]} Companies ({filtered.length})
        </span>
      </p>

      {loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => void refetch()}
          title="Couldn't load your companies"
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(c) => c.id}
          onRowClick={setViewing}
          rowClassName={(c) => (c.protected ? 'bg-amber-50/70 dark:bg-amber-500/10' : undefined)}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Store}
              title={`No ${STATUS_LABEL[statusFilter].toLowerCase()} companies`}
              description={
                statusFilter === 'active'
                  ? 'Add a company to manage a second shop from this account.'
                  : 'Nothing here right now.'
              }
            />
          }
        />
      )}

      {/* ---- Details drawer ---- */}
      <DetailDrawer
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        icon={Store}
        title="Company Details"
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold',
                  viewing.protected
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                )}
              >
                {getInitials(viewing.name)}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  {viewing.protected && (
                    <Crown className="size-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="text-lg font-semibold">{viewing.name}</span>
                  {viewing.protected && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:text-amber-400">
                      <Star className="size-3 fill-current" />
                      Default
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{viewing.legalName}</p>
                <div className="mt-1">
                  <StatusBadge
                    status={viewing.status === 'active' ? 'Active' : 'Inactive'}
                    tone={viewing.status === 'active' ? 'success' : 'neutral'}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(viewing)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              {viewing.id !== profile?.companyId && (
                <Button type="button" size="sm" onClick={() => switchCompany.mutate(viewing.id)}>
                  <ArrowLeftRight className="size-3.5" />
                  Switch to this company
                </Button>
              )}
              {viewing.id === profile?.companyId && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                  <Check className="size-3.5" />
                  Currently active
                </span>
              )}
            </div>

            {viewing.protected && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                Default company — cannot be disabled or deleted.
              </p>
            )}

            <DetailBlock icon={ShieldCheck} title="GST Registration" tone="purple">
              <DetailValue
                label="GST Registration"
                value={
                  viewing.gstRegistration === 'Unregistered'
                    ? 'Unregistered (No GST)'
                    : `${viewing.gstRegistration} — ${viewing.gstin ?? '—'}`
                }
              />
              {viewing.pan && <DetailValue label={t('common.pan')} value={viewing.pan} />}
            </DetailBlock>

            <DetailBlock icon={Wallet} title="Financial Settings" tone="teal">
              <DetailValue label="Currency" value={viewing.currency} />
              <DetailValue label="Timezone" value={viewing.timezone} />
            </DetailBlock>

            <DetailBlock icon={Clock} title={t('common.timeline')} tone="amber">
              <DetailValue
                label={t('common.createdAt')}
                value={formatDateTimeLong(viewing.createdAt)}
              />
              <DetailValue label="Last updated" value={formatDateTimeLong(viewing.updatedAt)} />
            </DetailBlock>
          </div>
        )}
      </DetailDrawer>

      {/* ---- Create ---- */}
      <FormModal
        open={creating}
        onOpenChange={(o) => {
          if (!o) setError(null)
          setCreating(o)
        }}
        title="Create Company"
        description="A second shop under this account. It gets its own roles, branch, financial year, masters and print templates."
        submitLabel={createCompany.isPending ? 'Creating…' : 'Create Company'}
        isSubmitting={createCompany.isPending}
        onSubmit={submitCreate}
        className="sm:max-w-3xl"
      >
        <CompanyForm value={form} onChange={setForm} />
        {error && <FormError message={error} />}
      </FormModal>

      {/* ---- Edit ---- */}
      <FormModal
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setError(null)
          }
        }}
        title="Edit Company"
        description={
          editing && editing.id !== profile?.companyId
            ? 'Note: only the active company can be edited — switch to it first.'
            : 'Company information and settings.'
        }
        submitLabel={updateCompany.isPending ? 'Saving…' : 'Save Changes'}
        isSubmitting={updateCompany.isPending}
        submitDisabled={!!editing && editing.id !== profile?.companyId}
        onSubmit={submitEdit}
        className="sm:max-w-3xl"
      >
        <CompanyForm value={form} onChange={setForm} />
        {error && <FormError message={error} />}
      </FormModal>

      {/* Kept so the page still reflects the active company even before the list resolves. */}
      {!isLoading && companies.length === 0 && active && (
        <p className="text-sm text-muted-foreground">Active company: {active.name}</p>
      )}
    </div>
  )
}
