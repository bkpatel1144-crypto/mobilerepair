import { Link } from 'react-router-dom'
import { ArrowRight, Check, HeartHandshake, Database, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { Aurora } from '@/components/marketing/aurora'
import { Section, SectionHeading } from '@/components/marketing/section'
import { useTranslation } from 'react-i18next'

/**
 * One plan, stated with some conviction.
 *
 * The page this replaces was a single 400px card floating in 1010px of empty white, which made
 * "free forever" look like a placeholder someone had not finished. The claim is unusual enough
 * that the interesting question is not *what* it costs but *why* — so the page answers that, and
 * answers the two follow-ups a shop owner actually has: what happens to my data, and what is the
 * catch.
 */
const INCLUDES = [
  'marketing.pricing.includes.unlimited',
  'marketing.pricing.includes.rbac',
  'marketing.pricing.includes.finance',
  'marketing.pricing.includes.secondHand',
  'marketing.pricing.includes.reports',
  'marketing.pricing.includes.migration',
  'marketing.pricing.includes.languages',
  'marketing.pricing.includes.branches',
  'marketing.pricing.includes.print',
  'marketing.pricing.includes.updates',
]

const ASSURANCES = [
  { icon: HeartHandshake, key: 'why' },
  { icon: Database, key: 'data' },
  { icon: Lock, key: 'noLockIn' },
]

export function PricingPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.nav.pricing')}
        title={t('marketing.pricing.title')}
        lead={t('marketing.pricing.lead')}
      />

      <Section>
        {/* The plan and the inclusions sit side by side, so the price is never alone on the page
         * the way it was before. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* Lit from behind, matching the summary card on the home page. The price is the one
           * element on this page worth drawing the eye deliberately, and the two pages showing
           * it differently was the kind of detail that makes a site feel assembled. */}
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl"
              style={{
                background:
                  'radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-mk-accent) 32%, transparent), transparent)',
              }}
            />
            <div className="mk-surface relative rounded-2xl border-2 border-primary bg-mk-paper p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {t('marketing.pricing.planName')}
              </p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-display">{t('marketing.pricing.amount')}</span>
                <span className="text-lg text-muted-foreground">
                  {t('marketing.pricing.period')}
                </span>
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {t('marketing.pricing.planNote')}
              </p>
              <Button
                size="lg"
                className="mt-8 w-full gap-2 rounded-full"
                render={<Link to="/signup" />}
              >
                {t('marketing.home.hero.primaryCta')}
                <ArrowRight className="size-4" />
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t('marketing.home.hero.trust.noCard')}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-title">{t('marketing.pricing.includedTitle')}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {INCLUDES.map((key) => (
                <li key={key} className="flex gap-3 mk-surface rounded-xl bg-mk-paper p-4">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-sm leading-snug">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---- The three questions a free product has to answer ------------------------------- */}
      <Section tone="muted" divide>
        <SectionHeading
          eyebrow={t('marketing.pricing.assuranceEyebrow')}
          title={t('marketing.pricing.assuranceTitle')}
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-7">
          {ASSURANCES.map((item) => (
            <article
              key={item.key}
              className="mk-surface mk-lift rounded-2xl bg-mk-paper p-6 sm:p-7"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-5.5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                {t(`marketing.pricing.assurances.${item.key}.title`)}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {t(`marketing.pricing.assurances.${item.key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="dark" size="sm" reveal={false} className="overflow-hidden">
        <Aurora className="opacity-75" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeading
            tone="dark"
            title={t('marketing.pricing.ctaTitle')}
            lead={t('marketing.pricing.ctaLead')}
            className="max-w-2xl"
          />
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
              render={<Link to="/faq" />}
            >
              {t('marketing.nav.faq')}
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
