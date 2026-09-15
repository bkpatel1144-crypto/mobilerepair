import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Search, ArrowLeft, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/error-state'
import { useJobCards } from '@/hooks/use-job-cards'
import { buildPath } from '@/config/nav'
import {
  jobMatchesLookup,
  jobWarrantyState,
  warrantyLinesOf,
  type WarrantyWindow,
} from '@/lib/warranty'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * Service > Job Cards > Warranty Lookup — the screen for a customer standing at the counter with
 * a phone that has stopped working again.
 *
 * `billWarranty` and per-part warranties have been written since Edit Bill shipped and read by
 * nothing, which made recording them pointless. One search box rather than four fields, because
 * the customer brings whatever they have: a phone number, the device itself (IMEI), a printed
 * job card, or an invoice.
 *
 * Deliberately not a new sidebar entry — the menu structure is 57 items, matched deliberately,
 * and this belongs to Job Cards rather than beside it.
 */
const STATE_STYLES: Record<WarrantyWindow['state'], string> = {
  live: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  unknown: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  none: 'bg-muted text-muted-foreground',
}

export function WarrantyLookupPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading, error, refetch } = useJobCards()
  const [query, setQuery] = useState('')

  // Not a bare `Date.now()` in the render body — the React Compiler treats it as impure. Same
  // workaround as `use-job-cards.ts` and the dashboard widgets.
  const now = new Date(new Date().getTime())
  const billLabel = t('pages.service.warranty.wholeBill')

  const trimmed = query.trim()
  // Only jobs that were actually billed can carry a warranty; an unbilled one has nothing to
  // answer with, and listing it as "no warranty" would read as a denial rather than as "not yet".
  const matches = trimmed
    ? jobs
        .filter((j) => jobMatchesLookup(j, trimmed))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        .slice(0, 20)
    : []

  const stateLabel = (state: WarrantyWindow['state']) => t(`pages.service.warranty.state.${state}`)

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{t('pages.service.warranty.warrantyLookup')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.service.warranty.searchByAnything')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          render={<Link to={buildPath('service', 'job-cards')} />}
        >
          <ArrowLeft className="size-4" />
          {t('pages.service.warranty.backToJobCards')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('pages.service.warranty.searchPlaceholder')}
          className="h-11 pl-9"
          autoFocus
        />
      </div>

      {error && (
        <ErrorState
          error={error}
          title={t('pages.service.warranty.couldNotLoadJobCards')}
          onRetry={() => void refetch()}
        />
      )}

      {!trimmed && !isLoading && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('pages.service.warranty.typeSomethingToSearch')}
        </p>
      )}

      {trimmed && matches.length === 0 && !isLoading && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('pages.service.warranty.nothingMatched', { query: trimmed })}
        </p>
      )}

      <div className="space-y-3">
        {matches.map((job) => {
          const lines = warrantyLinesOf(job, now, billLabel)
          const overall = jobWarrantyState(lines)
          return (
            <div key={job.id} className="overflow-hidden rounded-xl border">
              <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {job.jobNumber}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {job.customerName}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[job.brandName, job.model, job.imei].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    STATE_STYLES[overall]
                  )}
                >
                  {stateLabel(overall)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  render={<Link to={`${buildPath('service', 'job-cards')}/${job.id}`} />}
                >
                  {t('pages.service.warranty.openJob')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>

              {lines.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  {t('pages.service.warranty.noWarrantyRecorded')}
                </p>
              ) : (
                <ul className="divide-y">
                  {lines.map((line, i) => (
                    <li
                      key={`${line.label}-${i}`}
                      className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{line.label}</span>
                      {line.window.expiresOn && (
                        <span className="text-xs text-muted-foreground">
                          {t('pages.service.warranty.until', { date: line.window.expiresOn })}
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          STATE_STYLES[line.window.state]
                        )}
                      >
                        {line.window.state === 'live' && line.window.daysLeft !== null
                          ? t('pages.service.warranty.nDaysLeft', { count: line.window.daysLeft })
                          : stateLabel(line.window.state)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
