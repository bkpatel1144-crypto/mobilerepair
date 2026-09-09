import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Languages, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/marketing/section'
import { Wordmark } from '@/components/marketing/wordmark'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/use-language'
import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Real routes, not same-page anchors.
 *
 * The nav this replaced pointed "Workflow", "Features" and "FAQ" at `/#workflow`, `/#features`
 * and `/#faq` — three of its four links scrolled the home page rather than going anywhere. That
 * left nothing to send a customer, nothing for search to index, and a nav that did nothing at all
 * once you were on any other page.
 *
 * Module scope, so these hold keys rather than text — see filter-bar.tsx for why.
 */
const LINKS = [
  { labelKey: 'marketing.nav.features', to: '/features' },
  { labelKey: 'marketing.nav.solutions', to: '/solutions' },
  { labelKey: 'marketing.nav.pricing', to: '/pricing' },
  { labelKey: 'marketing.nav.about', to: '/about' },
  { labelKey: 'marketing.nav.contact', to: '/contact' },
]

export function MarketingNav() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Any navigation closes the drawer — without this, tapping a link left the panel open over the
  // page it had just moved to.
  //
  // Adjusted during render (react.dev's "resetting state when a prop changes"), not in an effect.
  // An effect here is a cascading render: the new page paints with the drawer still open, then
  // immediately repaints without it. The route is React state, not an external system, so there
  // is nothing to synchronise with.
  const [drawerForPath, setDrawerForPath] = useState(pathname)
  if (drawerForPath !== pathname) {
    setDrawerForPath(pathname)
    setMobileOpen(false)
  }

  // The bar starts transparent over the hero and gains its border and background once the page
  // moves, so the hero reads as full-bleed instead of starting under a grey strip.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The open drawer is full-height on a phone, so the page behind it must not scroll too.
  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-200',
        scrolled || mobileOpen
          ? 'border-b bg-background/85 backdrop-blur-xl'
          : 'border-b border-transparent'
      )}
    >
      <Container className="flex h-16 items-center gap-3 lg:h-18">
        <Link to="/" className="shrink-0" aria-label={t('marketing.nav.home')}>
          <Wordmark />
        </Link>

        <nav className="ml-4 hidden items-center lg:flex xl:ml-8">
          {LINKS.map((link) => {
            const active = pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(link.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Each language is named in its own script: someone who has landed in the wrong
           * language cannot read "Gujarati" to get back out of it, but can read ગુજરાતી. */}
          <div className="hidden items-center rounded-full border p-0.5 md:flex">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => void setLanguage(l.code)}
                aria-current={language === l.code ? 'true' : undefined}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  language === l.code
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>

          <Button variant="ghost" className="hidden sm:inline-flex" render={<Link to="/login" />}>
            {t('marketing.nav.login')}
          </Button>
          <Button className="rounded-full px-4 shadow-sm sm:px-5" render={<Link to="/signup" />}>
            {t('marketing.nav.signUpFree')}
          </Button>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            // The icon is `size-5`, so without an explicit box this was a 20x20 tap target — and
            // it is the only way to open the nav on a phone.
            className="-mr-1.5 inline-flex size-11 items-center justify-center rounded-xl hover:bg-muted lg:hidden"
            aria-label={t('marketing.nav.toggleMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t bg-background lg:hidden">
          <Container className="py-6">
            <nav className="flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex min-h-12 items-center border-b text-base font-medium"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>

            <div className="mt-6 flex flex-col gap-2.5">
              <Button size="lg" render={<Link to="/signup" />}>
                {t('marketing.nav.signUpFree')}
              </Button>
              <Button size="lg" variant="outline" render={<Link to="/login" />}>
                {t('marketing.nav.login')}
              </Button>
            </div>

            <div className="mt-8">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Languages className="size-3.5" />
                {t('marketing.nav.language')}
              </p>
              <div className="mt-2 flex flex-col">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => void setLanguage(l.code)}
                    className="flex min-h-11 items-center justify-between border-b text-sm"
                  >
                    {l.nativeLabel}
                    {language === l.code && <Check className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
