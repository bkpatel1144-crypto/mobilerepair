import { Link } from 'react-router-dom'
import { Wrench, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

// Module scope, so these hold keys rather than text — see filter-bar.tsx for why.
const LINKS = [
  { labelKey: 'components.marketing.marketingNav.workflow', href: '/#workflow' },
  { labelKey: 'components.marketing.marketingNav.features', href: '/#features' },
  { labelKey: 'components.marketing.marketingNav.pricing', href: '/pricing' },
  { labelKey: 'components.marketing.marketingNav.faq', href: '/#faq' },
]

export function MarketingNav() {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Wrench className="size-4.5" />
          </span>
          <span className="text-lg font-bold">aim</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <a
              key={link.labelKey}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Button variant="ghost" render={<Link to="/login" />}>
            Login
          </Button>
          <Button
            className="rounded-full bg-teal-600 hover:bg-teal-700"
            render={<Link to="/signup" />}
          >
            {t('components.marketing.marketingNav.signUpFree')}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          // The icon is `size-5`, so without an explicit box this button was a 20x20 tap target —
          // and it is the *only* way to open the nav on a phone. Sized to 44px here rather than
          // left to index.css's coarse-pointer rule, since this one is worth guaranteeing on
          // every pointer type.
          className="-mr-2 ml-auto inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted sm:hidden"
          aria-label={t('components.marketing.marketingNav.toggleMenu')}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {LINKS.map((link) => (
              <a key={link.labelKey} href={link.href} onClick={() => setMobileOpen(false)}>
                {t(link.labelKey)}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" render={<Link to="/login" />}>
              Login
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" render={<Link to="/signup" />}>
              {t('components.marketing.marketingNav.signUpFree')}
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
