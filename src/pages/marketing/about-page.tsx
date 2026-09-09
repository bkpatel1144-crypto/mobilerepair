import { Link } from 'react-router-dom'
import { ArrowRight, Target, Users, Wrench, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { Prose, Section, SectionHeading } from '@/components/marketing/section'
import { COMPANY } from '@/config/company'
import { useTranslation } from 'react-i18next'

/**
 * Who is behind the software.
 *
 * The site had no such page, which for a product asking a shop to keep its books in someone
 * else's web app is the more serious omission of the two. Nothing here claims a team size,
 * a funding round or a customer count — there is no honest number to give yet, and an invented
 * one is the fastest way to lose the reader who checks.
 */
const PRINCIPLES = [
  { icon: Target, key: 'oneSystem' },
  { icon: Users, key: 'everyone' },
  { icon: Wrench, key: 'realShops' },
  { icon: ShieldCheck, key: 'yourData' },
]

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.nav.about')}
        title={t('marketing.about.title')}
        lead={t('marketing.about.lead')}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16 xl:gap-20">
          <div>
            <h2 className="text-title">{t('marketing.about.storyTitle')}</h2>
            <Prose className="mt-5 space-y-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
              <p>{t('marketing.about.story1')}</p>
              <p>{t('marketing.about.story2')}</p>
              <p>{t('marketing.about.story3')}</p>
            </Prose>
          </div>

          <div className="mk-surface rounded-2xl bg-mk-paper-2 p-6 sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {t('marketing.about.detailsTitle')}
            </h2>
            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-semibold">{t('marketing.about.legalName')}</dt>
                <dd className="mt-1 text-muted-foreground">{COMPANY.legalName}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t('marketing.footer.address')}</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  {COMPANY.address.line1}, {COMPANY.address.line2}
                  <br />
                  {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.postalCode}
                  <br />
                  {COMPANY.address.country}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">{t('marketing.about.builtFor')}</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  {t('marketing.about.builtForValue')}
                </dd>
              </div>
            </dl>
            <Button
              variant="outline"
              className="mt-8 w-full gap-2 rounded-full"
              render={<Link to="/contact" />}
            >
              {t('marketing.nav.contact')}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="muted" divide>
        <SectionHeading
          eyebrow={t('marketing.about.principlesEyebrow')}
          title={t('marketing.about.principlesTitle')}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {PRINCIPLES.map((item) => (
            <article key={item.key} className="mk-surface mk-lift rounded-2xl bg-mk-paper p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-5.5" />
              </span>
              <h3 className="mt-5 font-semibold">
                {t(`marketing.about.principles.${item.key}.title`)}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {t(`marketing.about.principles.${item.key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </Section>
    </>
  )
}
