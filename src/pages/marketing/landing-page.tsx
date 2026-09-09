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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobCardMockup } from '@/components/marketing/job-card-mockup'
import { ProductFrame } from '@/components/marketing/product-frame'
import { Container, Section, SectionHeading } from '@/components/marketing/section'
import { COMPANY, mailto } from '@/config/company'
import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

/** What a shop is using today, and which part of `aim` replaces it. Concrete tools rather than
 *  invented statistics — this product has no customer numbers worth quoting yet, and made-up
 *  ones on a real business site are a liability. */
const REPLACES = [
  { icon: NotebookPen, labelKey: 'marketing.home.replaces.notebook' },
  { icon: MessageSquareDashed, labelKey: 'marketing.home.replaces.whatsapp' },
  { icon: FileSpreadsheet, labelKey: 'marketing.home.replaces.spreadsheet' },
  { icon: Calculator, labelKey: 'marketing.home.replaces.billingApp' },
]

/**
 * The six capabilities, with a `span` deciding how much of the grid each takes.
 *
 * Not six identical boxes: the page it replaced gave every feature the same card, so nothing said
 * which of them mattered. Job cards and role-based access are the two things that actually
 * distinguish this from a billing app, so they get the wide cells.
 */
const CAPABILITIES = [
  {
    icon: ClipboardList,
    titleKey: 'marketing.home.capabilities.jobCards.title',
    bodyKey: 'marketing.home.capabilities.jobCards.body',
    span: 'lg:col-span-2',
  },
  {
    icon: Users2,
    titleKey: 'marketing.home.capabilities.workflows.title',
    bodyKey: 'marketing.home.capabilities.workflows.body',
    span: '',
  },
  {
    icon: Bell,
    titleKey: 'marketing.home.capabilities.updates.title',
    bodyKey: 'marketing.home.capabilities.updates.body',
    span: '',
  },
  {
    icon: Receipt,
    titleKey: 'marketing.home.capabilities.money.title',
    bodyKey: 'marketing.home.capabilities.money.body',
    span: 'lg:col-span-2',
  },
  {
    icon: Smartphone,
    titleKey: 'marketing.home.capabilities.secondHand.title',
    bodyKey: 'marketing.home.capabilities.secondHand.body',
    span: '',
  },
  {
    icon: ShieldCheck,
    titleKey: 'marketing.home.capabilities.access.title',
    bodyKey: 'marketing.home.capabilities.access.body',
    span: 'lg:col-span-2',
  },
]

const WORKFLOW_STEPS = [
  {
    titleKey: 'marketing.home.workflow.intake.title',
    bodyKey: 'marketing.home.workflow.intake.body',
  },
  {
    titleKey: 'marketing.home.workflow.assign.title',
    bodyKey: 'marketing.home.workflow.assign.body',
  },
  {
    titleKey: 'marketing.home.workflow.bill.title',
    bodyKey: 'marketing.home.workflow.bill.body',
  },
  {
    titleKey: 'marketing.home.workflow.deliver.title',
    bodyKey: 'marketing.home.workflow.deliver.body',
  },
]

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

  return (
    <>
      {/* ---- Hero ----------------------------------------------------------------------------
       * The product shot lives *inside* the dark band rather than straddling its lower edge. The
       * previous hero floated the mockup on a negative margin across the boundary, so the hard
       * horizontal seam between the dark section and the white one cut straight through the
       * image — visible in any screenshot of the page.
       *
       * Inline styles for the gradients, not Tailwind arbitrary values: the v3-style
       * `bg-[radial-gradient(...,var(--tw-gradient-stops))]` combo silently fails to resolve
       * under Tailwind v4's engine and leaves the section transparent, which once shipped a
       * "dark navy hero" that rendered near-white with unreadable text. */}
      <Section tone="dark" size="none" bleed className="overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70rem 40rem at 15% -10%, rgba(13,148,136,0.32), transparent 60%),' +
              'radial-gradient(50rem 30rem at 95% 10%, rgba(56,189,248,0.16), transparent 60%)',
          }}
        />
        <Container className="relative py-(--spacing-section)">
          {/* Text and product side by side from `lg` up, so a wide screen is filled by content
           * instead of by margins around a centred column. Below that they stack, text first. */}
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {t('marketing.home.hero.badge')}
              </p>
              {/* Was hardcoded English, so Hindi and Gujarati visitors read English in the
               * largest text on the site. `<Trans>`-free by design: the brand word is a separate
               * element, so the sentence is split into two keys the translator can reorder. */}
              <h1 className="text-display mt-6 text-white text-balance">
                {t('marketing.home.hero.titleLead')}{' '}
                <span className="text-primary">{COMPANY.productName}</span>
              </h1>
              <p className="text-lead mt-6 max-w-xl text-slate-300">
                {t('marketing.home.hero.subtitle')}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="gap-2 rounded-full px-6"
                  render={<Link to="/signup" />}
                >
                  {t('marketing.home.hero.primaryCta')}
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                  render={
                    <a href={mailto(COMPANY.salesEmail, t('marketing.home.hero.demoSubject'))} />
                  }
                >
                  {t('marketing.home.hero.secondaryCta')}
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                {['freeForever', 'noCard', 'migration'].map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-emerald-400" />
                    {t(`marketing.home.hero.trust.${key}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nudged slightly wider than its column on large screens so the frame reaches toward
             * the edge — the shot is the most persuasive thing here and shouldn't sit small in
             * the middle of a dark field. */}
            <div className="lg:-mr-6 xl:-mr-12">
              <ProductFrame url="app.aimenterprise.in/service/job-cards/JC-2026-0143">
                <JobCardMockup />
              </ProductFrame>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- What it replaces ---------------------------------------------------------------- */}
      <Section size="sm" tone="muted">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <h2 className="text-title max-w-md">{t('marketing.home.replaces.title')}</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
            {REPLACES.map((item) => (
              <li
                key={item.labelKey}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5"
              >
                <item.icon className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium leading-snug">{t(item.labelKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---- Capabilities ------------------------------------------------------------------- */}
      <Section id="features">
        <SectionHeading
          eyebrow={t('marketing.home.capabilities.eyebrow')}
          title={t('marketing.home.capabilities.title')}
          lead={t('marketing.home.capabilities.lead')}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {CAPABILITIES.map((item) => (
            <article
              key={item.titleKey}
              className={cn(
                'flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md sm:p-7',
                item.span
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-5.5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{t(item.titleKey)}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {t(item.bodyKey)}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---- Workflow ------------------------------------------------------------------------
       * A connected rail rather than four separate cards, because the claim is that the steps are
       * joined up. Four bordered boxes in a row said the opposite. */}
      <Section tone="muted" divide>
        <SectionHeading
          eyebrow={t('marketing.home.workflow.eyebrow')}
          title={t('marketing.home.workflow.title')}
          lead={t('marketing.home.workflow.lead')}
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {WORKFLOW_STEPS.map((step, i) => (
            <li key={step.titleKey} className="relative">
              {/* The rail runs between the markers, hidden on the last step and on stacked
               * layouts where there is nothing beside it to connect to. */}
              {i < WORKFLOW_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-11 right-0 top-5 hidden h-px bg-border lg:block"
                />
              )}
              <span className="relative flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-5 font-semibold">{t(step.titleKey)}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground lg:pr-6">
                {t(step.bodyKey)}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---- Trilingual ---------------------------------------------------------------------
       * Its own section because it is the rarest thing here. Most Indian shop software is English
       * only, and the person actually typing at the counter often is not comfortable in English. */}
      <Section tone="dark">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-primary">
              <Languages className="size-6" />
            </span>
            <SectionHeading
              tone="dark"
              title={t('marketing.home.language.title')}
              lead={t('marketing.home.language.lead')}
              className="mt-6"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {LANGUAGES.map((language) => (
              <div
                key={language.code}
                className="rounded-xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur"
              >
                <p className="text-2xl font-semibold text-white">{language.nativeLabel}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                  {t(`marketing.home.language.names.${language.code}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- Pricing summary ----------------------------------------------------------------- */}
      <Section id="pricing">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
          <div>
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
          </div>
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {t('marketing.pricing.planName')}
            </p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-headline">{t('marketing.pricing.amount')}</span>
              <span className="text-muted-foreground">{t('marketing.pricing.period')}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {PLAN_INCLUDES.map((key) => (
                <li key={key} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="leading-relaxed">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---- Final CTA ----------------------------------------------------------------------- */}
      <Section tone="brand" size="sm">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-headline text-balance">{t('marketing.home.cta.title')}</h2>
            <p className="text-lead mt-3 text-primary-foreground/85">
              {t('marketing.home.cta.lead')}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="gap-2 rounded-full bg-white px-6 text-primary hover:bg-white/90"
              render={<Link to="/signup" />}
            >
              {t('marketing.home.hero.primaryCta')}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              render={<Link to="/contact" />}
            >
              {t('marketing.nav.contact')}
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
