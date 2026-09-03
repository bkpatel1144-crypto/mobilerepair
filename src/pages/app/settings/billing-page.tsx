import { CreditCard, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'

/** A genuinely static page, per BUILD_PLAN.md's own instruction — "plainly free forever, zero
 * plan-tier UI." Not a stub standing in for a real billing feature; there simply is no paid tier
 * to build a picker for. */
export function BillingPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader icon={CreditCard} title="Billing & Subscription" subtitle="Your plan and billing details" />

      <div className="max-w-md rounded-xl border bg-card p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-3 text-lg font-semibold">You're on the Free plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every feature in this app is free, forever. No plan tiers, no upgrade prompts, nothing to pay for.</p>
      </div>
    </div>
  )
}
