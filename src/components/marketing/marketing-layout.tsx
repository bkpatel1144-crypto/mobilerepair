import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { AccessibilityWidget } from '@/components/a11y/accessibility-widget'

/**
 * The public site's shell, as a layout route.
 *
 * A route rather than a wrapper each page imports: with nine pages, "remember to include the nav
 * and the footer" is a rule that eventually gets broken, and the one page that forgets is the one
 * nobody notices. Declaring it once in `App.tsx` makes it structural.
 *
 * `<main>` is a real landmark, not a div. Screen-reader users navigate by landmark, and the
 * accessibility toolbar's read-aloud needs a defined region to read — without it, "listen to
 * page" would start from the nav and recite every menu item before reaching the content.
 */
export function MarketingLayout() {
  const { t } = useTranslation()
  const { pathname, hash } = useLocation()

  // Restore the top of the page on navigation. React Router keeps the scroll position by
  // default, so following a footer link from halfway down one page lands halfway down the next.
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return (
    <div className="flex min-h-dvh flex-col">
      {/* First in the DOM and visible only when focused: a keyboard user should not have to tab
       * through the whole nav on every page to reach the content. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {t('marketing.nav.skipToContent')}
      </a>
      <MarketingNav />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
      <AccessibilityWidget />
    </div>
  )
}
