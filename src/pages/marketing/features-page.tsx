import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Wrench,
  IndianRupee,
  Smartphone,
  Boxes,
  ShieldCheck,
  Settings2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { Aurora } from '@/components/marketing/aurora'
import { Section, SectionHeading } from '@/components/marketing/section'
import { useTranslation } from 'react-i18next'

/**
 * Every module, grouped the way the app's own sidebar groups them.
 *
 * Deliberately mirrors the in-app navigation rather than inventing marketing categories: someone
 * who reads this page and then signs up should recognise where things are. The old site had no
 * features page at all — the nav's "Features" link was an anchor to six cards on the home page.
 */
const GROUPS = [
  {
    icon: Wrench,
    key: 'service',
    items: ['jobCards', 'intakeForms', 'timeline', 'costing', 'options', 'whatsapp'],
  },
  {
    icon: IndianRupee,
    key: 'finance',
    items: ['receipts', 'ledger', 'cashBook', 'receivables', 'payables', 'expenses'],
  },
  {
    icon: Smartphone,
    key: 'secondHand',
    items: ['purchase', 'refurbish', 'sale', 'profit'],
  },
  {
    icon: Boxes,
    key: 'masters',
    items: ['parties', 'items', 'categories', 'uom', 'paymentModes'],
  },
  {
    icon: ShieldCheck,
    key: 'administration',
    items: ['roles', 'users', 'sessions', 'audit', 'ipWhitelist', 'loginReport'],
  },
  {
    icon: Settings2,
    key: 'settings',
    items: ['company', 'branches', 'financialYears', 'workflow', 'printFormats', 'backup'],
  },
]

export function FeaturesPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.nav.features')}
        title={t('marketing.features.title')}
        lead={t('marketing.features.lead')}
      >
        <Button className="gap-2 rounded-full px-6" size="lg" render={<Link to="/signup" />}>
          {t('marketing.home.hero.primaryCta')}
          <ArrowRight className="size-4" />
        </Button>
      </PageHero>

      {/* Two columns of groups on a wide screen rather than one long list — six groups stacked
       * single-file is 4000px of page with half the width unused. */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          {GROUPS.map((group) => (
            <article
              key={group.key}
              className="mk-surface mk-lift rounded-2xl bg-mk-paper p-6 sm:p-8"
            >
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <group.icon className="size-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-title">
                    {t(`marketing.features.groups.${group.key}.title`)}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {t(`marketing.features.groups.${group.key}.body`)}
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="leading-snug">
                      {t(`marketing.features.items.${group.key}.${item}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="dark" size="sm" reveal={false} className="overflow-hidden">
        <Aurora className="opacity-75" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <SectionHeading
              tone="dark"
              title={t('marketing.features.ctaTitle')}
              lead={t('marketing.features.ctaLead')}
            />
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
              render={<Link to="/pricing" />}
            >
              {t('marketing.nav.pricing')}
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
