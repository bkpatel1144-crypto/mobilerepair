import { Link } from 'react-router-dom'
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react'
import { Container } from '@/components/marketing/section'
import { Wordmark } from '@/components/marketing/wordmark'
import { COMPANY, mailto, whatsappLink } from '@/config/company'
import { useTranslation } from 'react-i18next'

/**
 * The footer this replaced was a wordmark, one sentence, and five links repeating the nav — which
 * told a visitor nothing the header had not already said.
 *
 * A footer on a business site does specific work: it proves the company is real (a name, an
 * address, a phone number someone answers), it carries the legal pages nobody will enter customer
 * data without, and it catches the visitor who scrolled to the bottom looking for a way to ask a
 * question. That is what these four columns are for, and why contact details are their own group
 * rather than a line of small print.
 */
const COLUMNS = [
  {
    titleKey: 'marketing.footer.product',
    links: [
      { labelKey: 'marketing.nav.features', to: '/features' },
      { labelKey: 'marketing.nav.solutions', to: '/solutions' },
      { labelKey: 'marketing.nav.pricing', to: '/pricing' },
      { labelKey: 'marketing.nav.faq', to: '/faq' },
    ],
  },
  {
    titleKey: 'marketing.footer.company',
    links: [
      { labelKey: 'marketing.nav.about', to: '/about' },
      { labelKey: 'marketing.nav.contact', to: '/contact' },
      { labelKey: 'marketing.nav.login', to: '/login' },
      { labelKey: 'marketing.nav.signUpFree', to: '/signup' },
    ],
  },
  {
    titleKey: 'marketing.footer.legal',
    links: [
      { labelKey: 'marketing.footer.privacy', to: '/privacy' },
      { labelKey: 'marketing.footer.terms', to: '/terms' },
    ],
  },
]

export function MarketingFooter() {
  const { t } = useTranslation()
  const { address } = COMPANY

  return (
    <footer className="border-t bg-muted/30">
      <Container className="py-(--spacing-section-sm)">
        {/* The brand column is wider than the link columns — it carries a sentence, not a list,
         * and equal columns left it wrapping every three words on a tablet. */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)] lg:gap-8 xl:gap-12">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t('marketing.footer.tagline')}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.titleKey} aria-label={t(column.titleKey)}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                {t(column.titleKey)}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 grid gap-6 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <FooterDetail icon={MapPin} label={t('marketing.footer.address')}>
            {address.line1}, {address.line2}
            <br />
            {address.city}, {address.state} {address.postalCode}
          </FooterDetail>
          <FooterDetail icon={Phone} label={t('marketing.footer.phone')}>
            <a className="hover:text-foreground" href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}>
              {COMPANY.phone}
            </a>
          </FooterDetail>
          <FooterDetail icon={MessageCircle} label={t('marketing.footer.whatsapp')}>
            <a
              className="hover:text-foreground"
              href={whatsappLink(t('marketing.contact.whatsappPrefill'))}
              target="_blank"
              rel="noreferrer"
            >
              {t('marketing.footer.chatWithUs')}
            </a>
          </FooterDetail>
          <FooterDetail icon={Mail} label={t('marketing.footer.email')}>
            <a className="hover:text-foreground" href={mailto(COMPANY.supportEmail)}>
              {COMPANY.supportEmail}
            </a>
          </FooterDetail>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('marketing.footer.copyright', {
              year: new Date().getFullYear(),
              company: COMPANY.legalName,
            })}
          </p>
          <p>{t('marketing.footer.builtIn')}</p>
        </div>
      </Container>
    </footer>
  )
}

function FooterDetail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}
