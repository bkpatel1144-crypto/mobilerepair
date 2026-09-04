import { Link } from 'react-router-dom'
import {
  CreditCard,
  CheckCircle2,
  Building2,
  Users,
  GitBranch,
  Infinity as InfinityIcon,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCompany } from '@/hooks/use-company'
import { useUsers } from '@/hooks/use-users'
import { useBranches } from '@/hooks/use-branches'
import { usePermissions } from '@/hooks/use-permissions'
import { NAV_SECTIONS, buildPath } from '@/config/nav'
import { formatTimestamp } from '@/lib/utils'

/**
 * There is no paid tier, per BUILD_PLAN.md — "plainly free forever, zero plan-tier UI." So this
 * page deliberately has no plan picker, invoice table or payment method: inventing that chrome
 * would be fabricating a billing relationship that does not exist.
 *
 * What it does instead is answer the questions someone actually opens a billing page to ask —
 * what am I on, what does it cover, what is my account — using only real data already in the
 * tenant. Every number here is counted live; none of it is illustrative.
 */
function StatTile({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <p className="text-xs font-medium tracking-wide uppercase">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      )}
    </div>
  )
}

export function BillingPage() {
  const { data: company, isLoading, error: loadError, refetch } = useCompany()
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const { data: branches = [], isLoading: branchesLoading } = useBranches()
  const { canView } = usePermissions()

  const activeUsers = users.filter((u) => u.status === 'active').length
  const activeBranches = branches.filter((b) => b.status === 'active').length
  // The module list is the nav itself, so it can never drift from what the app actually ships.
  const includedModules = NAV_SECTIONS.map((s) => s.label)

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        icon={CreditCard}
        title="Billing & Subscription"
        subtitle="Your plan and billing details"
      />

      {loadError ? (
        <ErrorState error={loadError} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            {/* Plan */}
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-wrap items-center gap-4 border-b bg-teal-50/60 p-6 dark:bg-teal-500/5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                  <CheckCircle2 className="size-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">You're on the Free plan</h2>
                    <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Every feature in this app is free, forever. No plan tiers, no upgrade
                    prompts, nothing to pay for.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">₹0</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>

              <div className="grid gap-3 p-6 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]">
                {[
                  ['Users', 'Unlimited — add as many teammates as you need'],
                  ['Branches', 'Unlimited — every location, one account'],
                  ['Job cards & invoices', 'Unlimited, with no monthly cap'],
                  ['Data & backups', 'Yours, exportable at any time'],
                ].map(([title, detail]) => (
                  <div key={title} className="flex gap-2.5">
                    <InfinityIcon className="mt-0.5 size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modules — read straight off the nav config, so it can't claim a module the app
             * doesn't have. */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-sm font-semibold">Included modules</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                All {includedModules.length} modules are enabled on this account.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {includedModules.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                  >
                    <CheckCircle2 className="size-3.5 text-teal-600 dark:text-teal-400" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-5">
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))]">
              <StatTile icon={Users} label="Users" value={activeUsers} loading={usersLoading} />
              <StatTile
                icon={GitBranch}
                label="Branches"
                value={activeBranches}
                loading={branchesLoading}
              />
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="size-4 text-muted-foreground" />
                Account
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                {(
                  [
                    ['Organization', company?.name],
                    ['Code', company?.code],
                    ['Billing contact', company?.email],
                    ['Currency', company?.currency],
                    ['Customer since', company && formatTimestamp(company.createdAt, false)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-muted-foreground">{label}</dt>
                    {isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <dd className="truncate text-right font-medium">{value || '—'}</dd>
                    )}
                  </div>
                ))}
              </dl>

              {canView('settings/company') && (
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  render={<Link to={buildPath('settings', 'company')} />}
                >
                  Edit company details
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
