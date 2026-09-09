import { PageHero } from '@/components/marketing/page-hero'
import { Prose, Section } from '@/components/marketing/section'
import { COMPANY, mailto } from '@/config/company'
import { useTranslation } from 'react-i18next'

/**
 * Privacy policy and terms of use.
 *
 * These pages exist because no shop owner is going to type their customers' names and phone
 * numbers into a web app that has neither, and the old site had neither.
 *
 * The statements here are written to be true of what this app actually does — data lives in the
 * project's own Firestore database, there is no server of ours in the path, nothing is sold, and
 * an export is available from Backup & Restore. That is deliberately narrow: it is far better to
 * say less and have it be accurate than to paste a generic template making claims the software
 * does not honour.
 *
 * They are still not a substitute for review by someone qualified, and the specifics a lawyer
 * will ask for — the registered entity's details, jurisdiction, GST particulars — are the
 * `TODO(contact)` placeholders in `src/config/company.ts`. Flagged in WEB_PLAN.md.
 */

const PRIVACY_SECTIONS = [
  'collect',
  'use',
  'storage',
  'sharing',
  'retention',
  'rights',
  'cookies',
  'children',
  'changes',
]

const TERMS_SECTIONS = [
  'acceptance',
  'service',
  'account',
  'acceptableUse',
  'yourData',
  'availability',
  'warranty',
  'liability',
  'termination',
  'governing',
  'changes',
]

function LegalDocument({ docKey, sections }: { docKey: 'privacy' | 'terms'; sections: string[] }) {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.legal.eyebrow')}
        title={t(`marketing.legal.${docKey}.title`)}
        lead={t(`marketing.legal.${docKey}.lead`)}
      >
        <p className="text-sm text-muted-foreground">
          {t('marketing.legal.lastUpdated', { date: t('marketing.legal.lastUpdatedDate') })}
        </p>
      </PageHero>

      <Section>
        {/* A numbered document, with the text held to a reading measure — the one place on this
         * site where narrowing is right, because this is dense prose nobody wants to read across
         * 1400px. The list itself still starts at the page's left edge. */}
        <Prose className="max-w-[72ch]">
          <ol className="space-y-10">
            {sections.map((section, index) => (
              <li key={section} id={section} className="scroll-mt-24">
                <h2 className="text-xl font-semibold">
                  <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                  {t(`marketing.legal.${docKey}.sections.${section}.title`)}
                </h2>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">
                  {t(`marketing.legal.${docKey}.sections.${section}.body`)}
                </p>
              </li>
            ))}
            <li id="contact" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">
                <span className="mr-2 text-muted-foreground">{sections.length + 1}.</span>
                {t('marketing.legal.contactTitle')}
              </h2>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">
                {t('marketing.legal.contactBody', { company: COMPANY.legalName })}
              </p>
              <p className="mt-3">
                <a
                  className="font-medium text-primary underline underline-offset-4"
                  href={mailto(COMPANY.supportEmail)}
                >
                  {COMPANY.supportEmail}
                </a>
              </p>
            </li>
          </ol>
        </Prose>
      </Section>
    </>
  )
}

export function PrivacyPage() {
  return <LegalDocument docKey="privacy" sections={PRIVACY_SECTIONS} />
}

export function TermsPage() {
  return <LegalDocument docKey="terms" sections={TERMS_SECTIONS} />
}
