import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Users2,
  Bell,
  Receipt,
  ShieldCheck,
  Smartphone,
  Check,
  Languages,
  NotebookPen,
  FileSpreadsheet,
  MessageSquareDashed,
  Calculator,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobCardMockup } from '@/components/marketing/job-card-mockup'
import { ProductFrame } from '@/components/marketing/product-frame'
import { Container, Section, SectionHeading } from '@/components/marketing/section'
import { Aurora } from '@/components/marketing/aurora'
import { Reveal } from '@/components/marketing/reveal'
import { Marquee } from '@/components/marketing/marquee'
import { COMPANY, mailto } from '@/config/company'
import { FACTS, SEEDED_BRANDS } from '@/config/marketing-facts'
import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

/** What a shop is using today, and which part of `aim` replaces it. */
const REPLACES = [
  { icon: NotebookPen, labelKey: 'marketing.home.replaces.notebook' },
  { icon: MessageSquareDashed, labelKey: 'marketing.home.replaces.whatsapp' },
  { icon: FileSpreadsheet, labelKey: 'marketing.home.replaces.spreadsheet' },
  { icon: Calculator, labelKey: 'marketing.home.replaces.billingApp' },
]

/**
 * The six capabilities, with a `span` deciding how much of the grid each takes.
 *
 * Spans sum to 9 across three columns, so three rows tile exactly. An earlier set summed to 8 and
 * left a one-column hole beside the last card — the kind of gap that reads as a bug.
 */
const CAPABILITIES = [
  { icon: ClipboardList, key: 'jobCards', span: 'lg:col-span-2' },
  { icon: Users2, key: 'workflows', span: '' },
  { icon: Bell, key: 'updates', span: '' },
  { icon: Receipt, key: 'money', span: 'lg:col-span-2' },
  { icon: Smartphone, key: 'secondHand', span: '' },
  { icon: ShieldCheck, key: 'access', span: 'lg:col-span-2' },
]

const WORKFLOW_STEPS = ['intake', 'assign', 'bill', 'deliver']

const PLAN_INCLUDES = [
  'marketing.pricing.includes.unlimited',
  'marketing.pricing.includes.rbac',
  'marketing.pricing.includes.finance',
  'marketing.pricing.includes.secondHand',
  'marketing.pricing.includes.reports',
  'marketing.pricing.includes.migration',
]

export function LandingPage() {
  const { t } = useTranslation()

  /** The numbers the page leads with — real, and asserted against source by
   *  `marketing-facts.test.ts`. This is the slot a template fills with invented growth
   *  statistics; there are none to quote yet, so it states what the software actually ships. */
  const STATS = [
    { value: `${FACTS.deviceBrands}`, labelKey: 'marketing.home.stats.brands' },
    { value: `${FACTS.deviceModels}`, labelKey: 'marketing.home.stats.models' },
    { value: `${FACTS.appScreens}`, labelKey: 'marketing.home.stats.screens' },
    { value: `${FACTS.languages}`, labelKey: 'marketing.home.stats.languages' },
  ]

  return (
    <>
      {/* ---- Hero ---------------------------------------------------------------------------- */}
      {/* Pulled up under the sticky header, and padded back down by the same amount.
       *
       * Without this the hero starts *below* the bar, leaving a white strip across the top of the
       * page above a dark hero — the clearest single sign of a page assembled from a template.
       * The nav inverts its own colours over this section (see `overDark` in marketing-nav) so
       * the text stays legible once the dark field is behind it. */}
      <Section
        reveal={false}
        tone="dark"
        size="none"
        bleed
        className="-mt-16 overflow-hidden pt-16 lg:-mt-18 lg:pt-18"
      >
        <Aurora />
        <Container className="relative py-(--spacing-section) lg:py-32 xl:py-40">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <div className="min-w-0">
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
                  <Sparkles className="size-3.5 text-mk-accent-soft" />
                  {t('marketing.home.hero.badge')}
                </p>
              </Reveal>

              {/* The brand word carries a gradient. A headline set in one weight and one colour
               * is the commonest reason a hero reads as flat, and this is the one word on the
               * page that should catch the eye. */}
              <Reveal delay={60}>
                <h1 className="text-display mt-6 text-balance text-white">
                  {t('marketing.home.hero.titleLead')}{' '}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        'linear-gradient(100deg, var(--color-mk-accent-soft), var(--color-mk-warm) 70%)',
                    }}
                  >
                    {COMPANY.productName}
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="text-lead mt-6 max-w-xl text-slate-300">
                  {t('marketing.home.hero.subtitle')}
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="mk-lift gap-2 rounded-full px-6 shadow-lg shadow-black/30"
                    render={<Link to="/signup" />}
                  >
                    {t('marketing.home.hero.primaryCta')}
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/25 bg-white/5 px-6 text-white backdrop-blur hover:bg-white/10 hover:text-white"
                    render={
                      <a href={mailto(COMPANY.salesEmail, t('marketing.home.hero.demoSubject'))} />
                    }
                  >
                    {t('marketing.home.hero.secondaryCta')}
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={240}>
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                  {['freeForever', 'noCard', 'migration'].map((key) => (
                    <li key={key} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-mk-accent-soft" />
                      {t(`marketing.home.hero.trust.${key}`)}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={140} className="min-w-0 lg:-mr-6 xl:-mr-12">
              <ProductFrame url="app.aimenterprise.in/service/job-cards/JC-2026-0143">
                <JobCardMockup />
              </ProductFrame>
            </Reveal>
          </div>
        </Container>

        {/* Real seeded brands along the bottom of the hero.
         *
         * This is the row a template fills with borrowed customer logos. There are no customers
         * to name yet, so it answers the question a repair shop actually has instead — will it
         * already know my devices? Every name is asserted against the seed data by
         * `marketing-facts.test.ts`, so it cannot drift into being untrue. */}
        <div className="relative border-t border-white/10 py-6">
          <Container>
            <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t('marketing.home.brands.eyebrow', { count: FACTS.deviceModels })}
            </p>
          </Container>
          <Marquee className="mt-5" duration={46}>
            {SEEDED_BRANDS.map((brand) => (
              <span
                key={brand}
                className="px-6 text-lg font-semibold text-slate-400/80 sm:px-8 sm:text-xl"
              >
                {brand}
              </span>
            ))}
          </Marquee>
        </div>
      </Section>

      {/* ---- Numbers ------------------------------------------------------------------------- */}
      <Section reveal={false} size="sm" tone="muted">
        <div className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/70">
          {STATS.map((stat, i) => (
            <Reveal key={stat.labelKey} delay={i * 70} className="lg:px-8 lg:first:pl-0">
              <p className="text-headline tabular-nums text-mk-accent">{stat.value}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(stat.labelKey)}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- What it replaces ---------------------------------------------------------------- */}
      <Section reveal={false} size="sm">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <Reveal>
            <h2 className="text-title max-w-md">{t('marketing.home.replaces.title')}</h2>
          </Reveal>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-5">
            {REPLACES.map((item, i) => (
              <Reveal as="li" key={item.labelKey} delay={i * 70}>
                <div className="mk-surface mk-lift flex h-full flex-col gap-3 rounded-2xl bg-mk-paper p-4 sm:p-5">
                  <item.icon className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium leading-snug">{t(item.labelKey)}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---- Capabilities -------------------------------------------------------------------- */}
      <Section reveal={false} id="features" tone="muted" divide>
        <Reveal>
          <SectionHeading
            eyebrow={t('marketing.home.capabilities.eyebrow')}
            title={t('marketing.home.capabilities.title')}
            lead={t('marketing.home.capabilities.lead')}
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {CAPABILITIES.map((item, i) => (
            <Reveal as="article" key={item.key} delay={(i % 3) * 70} className={cn(item.span)}>
              <div className="mk-surface mk-lift flex h-full flex-col rounded-2xl bg-mk-paper p-6 sm:p-7">
                <span className="flex size-11 items-center justify-center rounded-xl bg-mk-accent/10 text-mk-accent ring-1 ring-mk-accent/15">
                  <item.icon className="size-5.5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  {t(`marketing.home.capabilities.${item.key}.title`)}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {t(`marketing.home.capabilities.${item.key}.body`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- Workflow ------------------------------------------------------------------------ */}
      <Section reveal={false}>
        <Reveal>
          <SectionHeading
            eyebrow={t('marketing.home.workflow.eyebrow')}
            title={t('marketing.home.workflow.title')}
            lead={t('marketing.home.workflow.lead')}
          />
        </Reveal>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {WORKFLOW_STEPS.map((step, i) => (
            <Reveal as="li" key={step} delay={i * 90} className="relative">
              {/* The rail fades out rather than stopping at a hard edge, so it reads as a
               * connection rather than a border. */}
              {i < WORKFLOW_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-11 right-0 top-5 hidden h-px lg:block"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, color-mix(in oklab, var(--color-mk-accent) 40%, transparent), transparent)',
                  }}
                />
              )}
              <span className="relative flex size-10 items-center justify-center rounded-full bg-mk-accent text-sm font-bold text-white shadow-lg shadow-mk-accent/25">
                {i + 1}
              </span>
              <h3 className="mt-5 font-semibold">{t(`marketing.home.workflow.${step}.title`)}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground lg:pr-6">
                {t(`marketing.home.workflow.${step}.body`)}
              </p>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ---- Trilingual ---------------------------------------------------------------------- */}
      <Section reveal={false} tone="dark" className="overflow-hidden">
        <Aurora className="opacity-60" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal>
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-mk-accent-soft ring-1 ring-white/10">
              <Languages className="size-6" />
            </span>
            <SectionHeading
              tone="dark"
              title={t('marketing.home.language.title')}
              lead={t('marketing.home.language.lead')}
              className="mt-6"
            />
            <p className="mt-6 text-sm text-slate-400">
              {t('marketing.home.language.stringCount', { count: FACTS.translatedStrings })}
            </p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-3">
            {LANGUAGES.map((language, i) => (
              <Reveal key={language.code} delay={i * 90}>
                <div className="mk-surface-dark mk-lift rounded-2xl bg-white/5 p-5 text-center backdrop-blur">
                  <p className="text-2xl font-semibold text-white">{language.nativeLabel}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                    {t(`marketing.home.language.names.${language.code}`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- Pricing summary ----------------------------------------------------------------- */}
      <Section reveal={false} id="pricing">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={t('marketing.home.pricing.eyebrow')}
              title={t('marketing.home.pricing.title')}
              lead={t('marketing.home.pricing.lead')}
            />
            <Button
              size="lg"
              variant="outline"
              className="mt-8 gap-2 rounded-full"
              render={<Link to="/pricing" />}
            >
              {t('marketing.home.pricing.cta')}
              <ArrowRight className="size-4" />
            </Button>
          </Reveal>
          <Reveal delay={90}>
            {/* Lit from behind rather than given a heavier border. The price is the one element on
             * this page worth drawing the eye deliberately. */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-mk-accent) 30%, transparent), transparent)',
                }}
              />
              <div className="mk-surface relative rounded-2xl bg-mk-paper p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mk-accent">
                  {t('marketing.pricing.planName')}
                </p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-headline">{t('marketing.pricing.amount')}</span>
                  <span className="text-muted-foreground">{t('marketing.pricing.period')}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {PLAN_INCLUDES.map((key) => (
                    <li key={key} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-mk-accent" />
                      <span className="leading-relaxed">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---- Final CTA ----------------------------------------------------------------------- */}
      <Section reveal={false} tone="dark" size="sm" className="overflow-hidden">
        <Aurora className="opacity-75" />
        <Reveal className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-headline text-balance text-white">
              {t('marketing.home.cta.title')}
            </h2>
            <p className="text-lead mt-3 text-slate-300">{t('marketing.home.cta.lead')}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="mk-lift gap-2 rounded-full px-6 shadow-lg shadow-black/30"
              render={<Link to="/signup" />}
            >
              {t('marketing.home.hero.primaryCta')}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/25 bg-white/5 px-6 text-white backdrop-blur hover:bg-white/10 hover:text-white"
              render={<Link to="/contact" />}
            >
              {t('marketing.nav.contact')}
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
