import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Users2,
  Bell,
  Receipt,
  ShieldCheck,
  Smartphone,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { JobCardMockup } from '@/components/marketing/job-card-mockup'
import { useTranslation } from 'react-i18next'

const FEATURES = [
  {
    icon: ClipboardList,
    titleKey: 'pages.landing.landing.jobCardsThatRunThemselves',
    descriptionKey: 'pages.landing.landing.dynamicIntakeFormsStatusGatedActions',
  },
  {
    icon: Users2,
    titleKey: 'pages.landing.landing.technicianWorkflowsNotJustTasks',
    descriptionKey: 'pages.landing.landing.whoCanSeeWhatAndDo',
  },
  {
    icon: Bell,
    titleKey: 'pages.landing.landing.customersStayInTheLoop',
    descriptionKey: 'pages.landing.landing.automaticWhatsappUpdatesWhenADevice',
  },
  {
    icon: Receipt,
    titleKey: 'pages.landing.landing.billingPaymentsConnected',
    descriptionKey: 'pages.landing.landing.advancesPartialPaymentsAndFinalBills',
  },
  {
    icon: Smartphone,
    titleKey: 'pages.landing.landing.secondHandDeviceTrading',
    descriptionKey: 'pages.landing.landing.buyRefurbishAndSellUsedDevices',
  },
  {
    icon: ShieldCheck,
    titleKey: 'pages.landing.landing.realRoleBasedAccess',
    descriptionKey: 'pages.landing.landing.everyMenuEveryActionGatedBy',
  },
]

const WORKFLOW_STEPS = [
  {
    titleKey: 'pages.landing.landing.intake',
    descriptionKey: 'pages.landing.landing.scanOrSearchTheCustomerCapture',
  },
  {
    titleKey: 'pages.landing.landing.assignRepair',
    descriptionKey: 'pages.landing.landing.aTechnicianTakesTheJobStatus',
  },
  {
    titleKey: 'pages.landing.landing.billCollect',
    descriptionKey: 'pages.landing.landing.generateTheBillCollectPaymentAnd',
  },
  {
    titleKey: 'pages.landing.landing.deliverWarranty',
    descriptionKey: 'pages.landing.landing.handOverTheDeviceWithA',
  },
]

const FAQS = [
  {
    q: 'Is this really free?',
    a: 'Yes — every feature in aim is free, forever. No card required, no plan tiers, no feature paywalls.',
  },
  {
    q: 'Can I bring my existing data?',
    a: 'Yes — we offer free data migration to get your customers, devices, and history into aim.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes — aim is installable as a mobile app and built mobile-first from the ground up.',
  },
  {
    q: 'Can different staff see different things?',
    a: 'Yes — the Workflow Designer lets you control exactly what each role can see and do, at every job status.',
  },
]

export function LandingPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNav />

      {/* Hero — plain inline-style gradients rather than Tailwind arbitrary-value bracket
       * syntax: the old v3-style `bg-[radial-gradient(...,var(--tw-gradient-stops))] from-*`
       * combo silently fails to resolve under Tailwind v4's engine, leaving the section
       * transparent (verified via a real browser screenshot — the "dark navy hero" was
       * rendering near-white with unreadable text). Inline styles sidestep that class-parsing
       * risk entirely for a one-off decorative background. */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 55%, #020617 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(13,148,136,0.35), transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Run your repair shop with <span className="text-teal-400">aim</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Manage repairs from customer intake to delivery — job cards, technician workflows,
            customer updates, billing, payments and warranty in one connected system.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="gap-2 rounded-full bg-teal-600 hover:bg-teal-700"
              render={<Link to="/signup" />}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
              render={<a href="mailto:hello@kiwikitservice.com?subject=Book%20a%20demo" />}
            >
              Book a demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            No card required · Free forever · Free data migration
          </p>
        </div>
      </section>

      {/* Floating browser mockup, straddling the hero/features boundary */}
      <section className="relative -mt-12 px-4 pb-16 sm:-mt-16 sm:px-6">
        <JobCardMockup />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Not another billing tool. A complete system for running your repair business.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={t(feature.titleKey)} className="rounded-xl border p-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{t(feature.titleKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              From intake to delivery, one workflow
            </h2>
            <p className="mt-2 text-muted-foreground">
              Every job follows the same connected path — no spreadsheets in between.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.titleKey} className="rounded-xl border bg-card p-5">
                <span className="flex size-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{t(step.titleKey)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(step.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          {t('pages.landing.landing.frequentlyAskedQuestions')}
        </h2>
        <div className="mt-8 divide-y rounded-xl border">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group p-4 sm:p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                {faq.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t bg-teal-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t('pages.landing.landing.readyToRunYourShopOn')}
          </h2>
          <p className="mt-2 text-teal-50">
            {t('pages.landing.landing.freeForeverNoCardRequired')}
          </p>
          <Button
            size="lg"
            className="mt-6 gap-2 rounded-full bg-white text-teal-700 hover:bg-teal-50"
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
