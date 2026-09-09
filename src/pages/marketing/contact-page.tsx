import { MessageCircle, Phone, Mail, Clock, MapPin, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { Section } from '@/components/marketing/section'
import { COMPANY, mailto, whatsappLink } from '@/config/company'
import { useTranslation } from 'react-i18next'

/**
 * Real contact routes, not a form that goes nowhere.
 *
 * This project is client-SDK-only — no server, no mail service — so a "send message" form would
 * either need a public Firestore collection anyone on the internet could write to, or it would
 * have to quietly do nothing. Both are worse than what a shop owner actually wants at this
 * moment, which is to reach a person: WhatsApp first, because that is where this audience
 * already is, then a phone number, then email.
 *
 * The one form here composes an email in the visitor's own mail client, so the message really
 * does leave and they keep a copy in their sent items.
 */
const CHANNELS = [
  {
    icon: MessageCircle,
    key: 'whatsapp',
    href: () => whatsappLink(),
    external: true,
    value: () => COMPANY.phone,
  },
  {
    icon: Phone,
    key: 'phone',
    href: () => `tel:${COMPANY.phone.replace(/\s/g, '')}`,
    external: false,
    value: () => COMPANY.phone,
  },
  {
    icon: Mail,
    key: 'support',
    href: () => mailto(COMPANY.supportEmail),
    external: false,
    value: () => COMPANY.supportEmail,
  },
  {
    icon: Mail,
    key: 'sales',
    href: () => mailto(COMPANY.salesEmail),
    external: false,
    value: () => COMPANY.salesEmail,
  },
]

export function ContactPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHero
        eyebrow={t('marketing.nav.contact')}
        title={t('marketing.contact.title')}
        lead={t('marketing.contact.lead')}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          <div>
            <h2 className="text-title">{t('marketing.contact.channelsTitle')}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {CHANNELS.map((channel) => (
                <a
                  key={channel.key}
                  href={channel.href()}
                  {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <channel.icon className="size-5" />
                  </span>
                  <span className="mt-4 font-semibold">
                    {t(`marketing.contact.channels.${channel.key}.title`)}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {t(`marketing.contact.channels.${channel.key}.note`)}
                  </span>
                  <span className="mt-3 truncate text-sm font-medium text-primary">
                    {channel.value()}
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border bg-muted/40 p-5">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{t('marketing.contact.hoursTitle')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t('marketing.contact.hoursValue')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl border bg-muted/40 p-5">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-semibold">{t('marketing.footer.address')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {COMPANY.address.line1}, {COMPANY.address.line2}
                    <br />
                    {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.postalCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Demo request. A short list of what to mention, then one button that opens the mail
           * client with a subject already set — no server, and nothing that can silently fail. */}
          <aside className="rounded-2xl border-2 border-primary/25 bg-card p-6 sm:p-8">
            <h2 className="text-title">{t('marketing.contact.demoTitle')}</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {t('marketing.contact.demoLead')}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {['shopName', 'staffCount', 'currentSystem', 'language'].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="leading-relaxed">
                    {t(`marketing.contact.demoPoints.${item}`)}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="mt-8 w-full gap-2 rounded-full"
              render={<a href={mailto(COMPANY.salesEmail, t('marketing.home.hero.demoSubject'))} />}
            >
              {t('marketing.home.hero.secondaryCta')}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full gap-2 rounded-full"
              render={
                <a
                  href={whatsappLink(t('marketing.contact.whatsappPrefill'))}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <MessageCircle className="size-4" />
              {t('marketing.footer.chatWithUs')}
            </Button>
          </aside>
        </div>
      </Section>

      <Section tone="muted" divide size="sm">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-title text-balance">{t('marketing.contact.selfServeTitle')}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {t('marketing.contact.selfServeLead')}
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0 gap-2 rounded-full px-6"
            render={<Link to="/signup" />}
          >
            {t('marketing.home.hero.primaryCta')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Section>
    </>
  )
}
