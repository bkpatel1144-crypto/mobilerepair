// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import gu from '@/locales/gu.json'

import { LandingPage } from './landing-page'
import { FeaturesPage } from './features-page'
import { SolutionsPage } from './solutions-page'
import { PricingPage } from './pricing-page'
import { AboutPage } from './about-page'
import { ContactPage } from './contact-page'
import { FaqPage } from './faq-page'
import { PrivacyPage, TermsPage } from './legal-page'

/**
 * Every public page, rendered in all three languages.
 *
 * This replaces a test that covered the landing page alone, and widening it was not optional: the
 * rebuild went from two public pages to nine, and every one of them is built almost entirely out
 * of `t()` calls driven by arrays of key fragments — `marketing.features.items.${group}.${item}`.
 * A typo in one of those fragments is a perfectly valid string, so tsc and eslint see nothing and
 * the only symptom is a dotted path appearing on screen where a label should be. That has already
 * shipped to users three times in this project.
 *
 * The dynamic-key style is also why the `keys-used` test cannot help here: it can only check keys
 * it can read statically, and a template literal is invisible to it. Rendering the page is the
 * only thing that resolves those, which makes this the sole check standing between a mistyped
 * fragment and a live page.
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

const PAGES = [
  ['home', LandingPage],
  ['features', FeaturesPage],
  ['solutions', SolutionsPage],
  ['pricing', PricingPage],
  ['about', AboutPage],
  ['contact', ContactPage],
  ['faq', FaqPage],
  ['privacy', PrivacyPage],
  ['terms', TermsPage],
] as const

const LANGUAGES = ['en', 'hi', 'gu'] as const

/** A raw key leaking to the screen — `marketing.home.hero.badge` instead of the sentence. */
const DOTTED_KEY =
  /\b(marketing|pages|components|shared|common|nav|shell|errors|a11y)\.[a-zA-Z]+\.[a-zA-Z.]+/

function renderPage(Page: (typeof PAGES)[number][1]) {
  cleanup()
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>
  )
}

describe('public pages render', () => {
  it.each(PAGES.map(([name]) => name))('%s mounts without throwing', (name) => {
    const Page = PAGES.find(([n]) => n === name)![1]
    expect(() => renderPage(Page)).not.toThrow()
  })

  // The cross product on purpose: a key can exist in English and be missing in Gujarati, which
  // renders as the key itself in exactly one of the three languages.
  it.each(
    PAGES.flatMap(([name, Page]) =>
      LANGUAGES.map((lng) => [`${name} in ${lng}`, Page, lng] as const)
    )
  )('%s leaks no translation key', async (_label, Page, lng) => {
    await i18next.changeLanguage(lng)
    const { container } = renderPage(Page)
    const leaked = (container.textContent ?? '').match(DOTTED_KEY)
    expect(leaked?.[0] ?? null).toBeNull()
  })

  // A missing key renders as the key (caught above); a key present but empty renders as nothing,
  // which leaves a silently short page. Both are translation bugs, so both need an assertion.
  it.each(
    PAGES.flatMap(([name, Page]) =>
      LANGUAGES.map((lng) => [`${name} in ${lng}`, Page, lng] as const)
    )
  )('%s has real content', async (_label, Page, lng) => {
    await i18next.changeLanguage(lng)
    const { container } = renderPage(Page)
    expect((container.textContent ?? '').length).toBeGreaterThan(400)
  })
})

describe('home page copy', () => {
  it('shows real English sentences, not keys', async () => {
    await i18next.changeLanguage('en')
    renderPage(LandingPage)
    expect(screen.getByText('Job cards that run themselves')).toBeTruthy()
    expect(screen.getByText(/Free forever\. Not a trial/)).toBeTruthy()
  })

  it('translates the headline, which used to be hardcoded English', async () => {
    // The specific regression this guards: `<h1>Run your repair shop with aim</h1>` was raw JSX
    // text, so the largest text on the site stayed English in every language. Asserting on the
    // Gujarati rendering is what makes that impossible to reintroduce.
    await i18next.changeLanguage('gu')
    renderPage(LandingPage)
    expect(screen.getByText(/તમારી આખી રિપેર શોપ ચલાવો/)).toBeTruthy()
  })
})
