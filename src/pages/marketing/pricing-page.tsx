import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

const INCLUDED = [
  'Unlimited job cards, technicians, and customers',
  'Full role-based access control & Workflow Designer',
  'Finance: receipts, ledgers, receivables & payables',
  'Second-hand device purchase & sale tracking',
  'All reports, dashboards, and CSV/Excel exports',
  'Free data migration from your current system',
]

/** Deliberately has no plan-tier UI, no payment form, and no "trial" language — this product
 * is free for every user, permanently. See BUILD_PLAN.md's quality bar. */
export function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="text-3xl font-bold sm:text-4xl">Simple pricing: free.</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          aim is free for every repair shop, forever — no tiers, no card required, no feature
          paywalls.
        </p>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border-2 border-teal-600 bg-card p-8 text-left shadow-sm">
          <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
            Everyone
          </p>
          <p className="mt-2 text-4xl font-bold">
            ₹0<span className="text-base font-normal text-muted-foreground"> / forever</span>
          </p>
          <ul className="mt-6 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                {item}
              </li>
            ))}
          </ul>
          <Button
            className="mt-7 w-full gap-2 rounded-full bg-teal-600 hover:bg-teal-700"
            render={<Link to="/signup" />}
          >
            Get Started
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
