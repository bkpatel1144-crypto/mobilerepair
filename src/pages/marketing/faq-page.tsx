import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { Section } from '@/components/marketing/section'
import { useTranslation } from 'react-i18next'

/**
 * The full question set, grouped.
 *
 * The home page carried four questions in a 768px-wide box; this is the page that can answer the
 * rest. Grouped rather than one long list because the questions divide cleanly — money, data,
 * day-to-day use, staff and access — and someone worried about one of those should not have to
 * read the other three.
 *
 * `<details>` rather than a JS accordion: it opens without JavaScript, is keyboard-operable and
 * findable by the browser's own in-page search, which a `hidden`-div accordion is not.
 */
const GROUPS = [
  { key: 'money', questions: ['reallyFree', 'catch', 'futureCharge', 'hiddenLimits'] },
  { key: 'data', questions: ['migration', 'ownData', 'export', 'backup', 'security'] },
  { key: 'usage', questions: ['mobile', 'offline', 'training', 'printer', 'whatsapp'] },
  { key: 'staff', questions: ['permissions', 'staffCount', 'branches', 'languages'] },
]

export function FaqPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.nav.faq')}
        title={t('marketing.faq.title')}
        lead={t('marketing.faq.lead')}
      />

      <Section>
        {/* Two columns of groups on a wide screen. A single centred column of 18 questions is
         * exactly the narrow-column problem this rebuild set out to fix. */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {GROUPS.map((group) => (
            <section key={group.key}>
              <h2 className="text-title">{t(`marketing.faq.groups.${group.key}`)}</h2>
              <div className="mt-5 divide-y rounded-2xl border bg-card">
                {group.questions.map((question) => (
                  <details key={question} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {t(`marketing.faq.q.${group.key}.${question}.q`)}
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                      {t(`marketing.faq.q.${group.key}.${question}.a`)}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Section>

      <Section tone="muted" divide size="sm">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-title text-balance">{t('marketing.faq.ctaTitle')}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {t('marketing.faq.ctaLead')}
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0 gap-2 rounded-full px-6"
            render={<Link to="/contact" />}
          >
            {t('marketing.nav.contact')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Section>
    </>
  )
}
