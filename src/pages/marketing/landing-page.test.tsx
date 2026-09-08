// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LandingPage } from './landing-page'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import gu from '@/locales/gu.json'

/**
 * The first test in this project that actually renders a page.
 *
 * Everything else is compile-time — tsc, eslint, the pure-function suites — and this session
 * found nine translation bugs in code that type-checked and built cleanly, three of which shipped
 * a visible `t('...')` call to the user. A page that renders is the only thing that catches that
 * class: a wrong key is a valid string, so the only tell is the dotted path appearing on screen.
 *
 * The landing page is the one worth doing first: it is public, it needs no Firebase, and it is
 * what a prospective shop sees before anything else.
 */
beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      gu: { translation: gu },
    },
    interpolation: { escapeValue: false },
  })
})

function renderLanding() {
  cleanup()
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

/** A raw key leaking to the screen — `pages.landing.landing.intake` instead of "Intake". */
const DOTTED_KEY = /\b(pages|components|shared|common|nav|shell|errors)\.[a-zA-Z]+\.[a-zA-Z.]+/

describe('LandingPage renders', () => {
  it('mounts without throwing', () => {
    expect(() => renderLanding()).not.toThrow()
  })

  it('shows real English copy, not translation keys', async () => {
    await i18next.changeLanguage('en')
    renderLanding()
    expect(screen.getByText('Job cards that run themselves')).toBeTruthy()
    expect(screen.getByText('Frequently asked questions')).toBeTruthy()
  })

  it.each([
    ['en', 'Job cards that run themselves'],
    ['hi', 'जॉब कार्ड जो खुद चलते हैं'],
    ['gu', 'જોબ કાર્ડ જે જાતે ચાલે છે'],
  ])('renders in %s', async (lng, expected) => {
    await i18next.changeLanguage(lng)
    renderLanding()
    expect(screen.getByText(expected)).toBeTruthy()
  })

  it.each(['en', 'hi', 'gu'])('leaks no translation key in %s', async (lng) => {
    await i18next.changeLanguage(lng)
    const { container } = renderLanding()
    const leaked = (container.textContent ?? '').match(DOTTED_KEY)
    // This is the assertion that would have caught the three pages shipping
    // `t('pages.settings.financialYears.createNextFy')` as visible text.
    expect(leaked?.[0] ?? null).toBeNull()
  })

  it('has no empty text node where a translation should be', async () => {
    await i18next.changeLanguage('gu')
    const { container } = renderLanding()
    // A missing key with `returnNull: false` renders as the key; a missing *value* renders empty.
    // Either way the page would be visibly short, so assert it has real content.
    expect((container.textContent ?? '').length).toBeGreaterThan(500)
  })
})
