import { Link } from 'react-router-dom'
import { Check, ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/marketing/wordmark'
import { AccessibilityWidget } from '@/components/a11y/accessibility-widget'
import { LANGUAGES } from '@/lib/i18n'
import { useLanguage } from '@/hooks/use-language'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * The shell for log in, sign up, forgot password and complete setup.
 *
 * Rebuilt from a 384px card centred on a grey field — which on a 1920px monitor was a small box
 * in a large empty space, and gave the four most important screens in the funnel nothing to say
 * for themselves. A split panel puts the reasons to sign up next to the form on a wide screen and
 * collapses to just the form on a phone, so neither size is compromised for the other.
 *
 * Only presentation changed. Every page passes the same `title`/`subtitle`/`children`/`footer`, so
 * the signup and login logic — repaired after a production outage where a batch rejection left
 * new owners with no tenant — is untouched by this, and `tools/firebase/e2e-signup.mjs` has to
 * stay green through it.
 *
 * The language switcher and the accessibility toolbar are both here on purpose: someone who
 * cannot read English or needs larger text hits that wall at the login screen, before they have
 * an account whose preferences could have been saved.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---- Brand panel. Hidden below `lg`, where the form should own the whole screen rather
       * than share it with a value proposition the visitor has usually already read. ---- */}
      <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-slate-100 lg:flex lg:flex-col xl:p-14">
        {/* Inline styles: Tailwind v4's engine silently fails to resolve the v3-style
         * `bg-[radial-gradient(...,var(--tw-gradient-stops))]`, which once shipped a "dark" hero
         * that rendered near-white with unreadable text. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60rem 34rem at 20% 0%, rgba(13,148,136,0.34), transparent 62%),' +
              'radial-gradient(40rem 28rem at 90% 90%, rgba(56,189,248,0.14), transparent 60%)',
          }}
        />
        <Link to="/" className="relative">
          <Wordmark tone="inverse" />
        </Link>

        <div className="relative mt-auto">
          <h2 className="text-headline max-w-xl text-balance text-white">
            {t('marketing.auth.panelTitle')}
          </h2>
          <ul className="mt-8 space-y-4">
            {['free', 'languages', 'noCard', 'migration'].map((key) => (
              <li key={key} className="flex gap-3 text-slate-300">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="size-3.5" />
                </span>
                <span className="leading-relaxed">{t(`marketing.auth.panelPoints.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-auto pt-10 text-xs text-slate-500">
          {t('marketing.footer.builtIn')}
        </p>
      </aside>

      {/* ---- Form panel ---- */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between gap-4 p-5 sm:p-6">
          {/* The wordmark appears here only when the brand panel is hidden, so it is never shown
           * twice on a wide screen. */}
          <Link to="/" className="lg:invisible">
            <Wordmark showCompany={false} />
          </Link>
          <div className="flex items-center rounded-full border p-0.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => void setLanguage(l.code)}
                aria-current={language === l.code ? 'true' : undefined}
                data-tap
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  language === l.code
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-5 pb-10 sm:p-6">
          {/* `max-w-md`, not the old `max-w-sm`: a 384px column made the two-field login form feel
           * cramped once the labels were translated into Hindi, where the strings run longer. */}
          <div className="w-full max-w-md">
            <h1 className="text-title">{title}</h1>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-sm text-muted-foreground">{footer}</p>
            <Link
              data-tap
              to="/"
              className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {t('marketing.auth.backToSite')}
            </Link>
          </div>
        </main>
      </div>

      <AccessibilityWidget />
    </div>
  )
}
