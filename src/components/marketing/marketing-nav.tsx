import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Languages, Check, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/marketing/section'
import { Wordmark } from '@/components/marketing/wordmark'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/use-language'
import { useTheme } from '@/hooks/use-theme'
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
  const { theme, toggleTheme } = useTheme()
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

  // The capsule stands down while the mobile drawer is open: the drawer hangs off the bar's
  // bottom edge, and a rounded, inset bar leaves it visibly detached with the page showing
  // through the gap on both sides.
  const capsule = scrolled && !mobileOpen

  // At rest on the home page the bar sits *over* the dark hero, so it has to invert.
  //
  // The hero pulls itself up under the header (see landing-page.tsx) rather than starting below
  // it, because a white strip above a dark hero is the single clearest sign of a page assembled
  // from a template. That only works if the nav knows what is behind it: dark-on-dark text is
  // invisible. Route-based rather than a prop threaded through the layout — the home page is the
  // only one with a dark hero, and once scrolled the capsule brings its own background so the
  // normal colours apply again.
  const overDark = pathname === '/' && !capsule && !mobileOpen

  return (
    <header
      className={cn('sticky top-0 z-50 transition-all duration-300', capsule && 'pt-3 sm:pt-4')}
    >
      <Container className={cn('transition-all duration-300', capsule && 'px-3 sm:px-6 lg:px-8')}>
        {/* Two states in one element rather than two elements, so width, height, radius and
         * padding animate between them instead of swapping.
         *
         * Glass in both: `backdrop-blur` with no colour wash at the top of the page, because a
         * tinted bar there would either be a white strip across the dark hero or a dark strip
         * across the light interior heroes — the blur alone reads as glass over both. Once
         * scrolled it gains the tint, a border and a shadow, which it needs to separate itself
         * from whatever content is now passing underneath. */}
        <div
          className={cn(
            'flex items-center gap-3 transition-all duration-300',
            // 90% opaque, not 70%. The backdrop under this capsule is not predictable — the hero
            // is dark and everything below it is light, and the bar crosses that boundary while
            // scrolling. At 70% in the light theme it came out a mid-grey slab wherever the dark
            // hero was behind it, and `text-muted-foreground` on mid-grey is unreadable. The blur
            // is what reads as glass; the opacity only has to keep the text legible, so it wins.
            capsule
              ? 'h-14 rounded-full border bg-background/90 px-4 shadow-lg shadow-black/5 backdrop-blur-2xl sm:px-5 lg:h-16 dark:shadow-black/20'
              : 'h-16 backdrop-blur-md lg:h-18',
            mobileOpen && 'border-b bg-background'
          )}
        >
          <Link to="/" className="shrink-0" aria-label={t('marketing.nav.home')}>
            <Wordmark tone={overDark ? 'inverse' : 'default'} />
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
                    overDark
                      ? active
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white'
                      : active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
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
            <div
              className={cn(
                'hidden items-center rounded-full border p-0.5 md:flex',
                overDark && 'border-white/20'
              )}
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => void setLanguage(l.code)}
                  aria-current={language === l.code ? 'true' : undefined}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    language === l.code
                      ? overDark
                        ? 'bg-white text-slate-900'
                        : 'bg-foreground text-background'
                      : overDark
                        ? 'text-slate-300 hover:text-white'
                        : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {l.nativeLabel}
                </button>
              ))}
            </div>

            {/* The public site had no theme control at all, so a visitor whose machine was in
             * dark mode saw the dark palette as their first impression with no way out of it.
             * The site is designed around the light palette — warm paper, lit interior heroes —
             * so light is now the default and this is how someone chooses otherwise. */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={t('shell.toggleTheme')}
              className={cn(overDark && 'text-slate-200 hover:bg-white/10 hover:text-white')}
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>

            <Button
              variant="ghost"
              className={cn(
                'hidden sm:inline-flex',
                overDark && 'text-slate-200 hover:bg-white/10 hover:text-white'
              )}
              render={<Link to="/login" />}
            >
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
              className={cn(
                '-mr-1.5 inline-flex size-11 items-center justify-center rounded-xl lg:hidden',
                overDark ? 'text-white hover:bg-white/10' : 'hover:bg-muted'
              )}
              aria-label={t('marketing.nav.toggleMenu')}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </Container>

      {mobileOpen && (
        /* `top-full`, not `top-16`. The bar is 64px at the top of the page, 56px as a capsule and
         * 72px at `lg`, so any fixed offset detaches the drawer from it at one of those sizes.
         * Anchoring to the header's own bottom edge tracks all three. */
        <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background lg:hidden">
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

            {/* Labelled in the drawer rather than an icon on its own: an unlabelled glyph in a
             * list of text rows is a guess. */}
            <div className="mt-8">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex min-h-11 w-full items-center justify-between border-b text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {t('shell.toggleTheme')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(theme === 'dark' ? 'shell.themeDark' : 'shell.themeLight')}
                </span>
              </button>
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
