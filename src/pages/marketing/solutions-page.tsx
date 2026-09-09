import { Link } from 'react-router-dom'
import { ArrowRight, Store, Recycle, Building2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { Section } from '@/components/marketing/section'
import { useTranslation } from 'react-i18next'

/**
 * Three shapes of business, each with the problem it actually has.
 *
 * Not three copies of the feature list with different headings. A single-counter shop and a
 * three-branch operation want opposite things from the same software — one wants to type less,
 * the other wants to know what the branch it cannot see is doing — and saying so is what makes a
 * visitor recognise themselves.
 */
const AUDIENCES = [
  { icon: Store, key: 'singleShop', points: ['speed', 'noTraining', 'phone', 'walkIn'] },
  { icon: Recycle, key: 'dealer', points: ['perUnit', 'refurbish', 'margin', 'stock'] },
  {
    icon: Building2,
    key: 'multiBranch',
    points: ['branchScope', 'consolidated', 'roles', 'audit'],
  },
]

export function SolutionsPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.nav.solutions')}
        title={t('marketing.solutions.title')}
        lead={t('marketing.solutions.lead')}
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-7">
          {AUDIENCES.map((audience) => (
            <article
              key={audience.key}
              className="flex flex-col mk-surface mk-lift rounded-2xl bg-mk-paper p-6 sm:p-8"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <audience.icon className="size-6" />
              </span>
              <h2 className="text-title mt-6">
                {t(`marketing.solutions.audiences.${audience.key}.title`)}
              </h2>
              <p className="mt-2 text-sm font-medium text-primary">
                {t(`marketing.solutions.audiences.${audience.key}.who`)}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {t(`marketing.solutions.audiences.${audience.key}.body`)}
              </p>
              {/* `mt-auto` pins the list to the bottom, so three cards of different prose lengths
               * still line their lists up with each other. */}
              <ul className="mt-6 space-y-2.5 border-t pt-6">
                {audience.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="leading-snug">
                      {t(`marketing.solutions.points.${audience.key}.${point}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="muted" divide size="sm">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-title text-balance">{t('marketing.solutions.ctaTitle')}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {t('marketing.solutions.ctaLead')}
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0 gap-2 rounded-full px-6"
            render={<Link to="/contact" />}
          >
            {t('marketing.solutions.ctaButton')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Section>
    </>
  )
}
