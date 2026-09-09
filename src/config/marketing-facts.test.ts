import { describe, expect, it } from 'vitest'
import { FACTS, SEEDED_BRANDS } from './marketing-facts'
import { LANGUAGES } from '@/lib/i18n'
import seedData from '@/data/default-service-options.json'
import en from '@/locales/en.json'

/**
 * Checks every factual claim on the public site against the thing it describes.
 *
 * A marketing page is the one place in a codebase where a wrong number breaks nothing and can
 * therefore stay wrong indefinitely. "91 models seeded" silently becoming false after somebody
 * trims the seed file is precisely the claim a prospective customer would check — and this
 * product leads with these numbers instead of customer logos, because it has real numbers and no
 * customers to name yet. So they have to hold.
 *
 * Counts that can only grow are asserted as floors and rendered with a "+", so adding a model or
 * a translation key never turns the site into a liar or this suite red. Counts stated exactly are
 * asserted exactly.
 */

type Group = { group: string; options: { label: string }[] }
const groups = (seedData as { data: { groups: Group[] } }).data.groups
const optionsFor = (name: string) => groups.find((g) => g.group === name)?.options ?? []

/** Recursively counts leaf strings in a locale file. */
function countKeys(node: unknown): number {
  if (typeof node !== 'object' || node === null) return 1
  return Object.values(node).reduce<number>((total, value) => total + countKeys(value), 0)
}

describe('marketing facts are true', () => {
  it('device brands', () => {
    const brands = optionsFor('brand')
    expect(brands.length).toBeGreaterThanOrEqual(FACTS.deviceBrands)
  })

  it('device models', () => {
    expect(optionsFor('model').length).toBeGreaterThanOrEqual(FACTS.deviceModels)
  })

  it('device types', () => {
    expect(optionsFor('device_type').length).toBeGreaterThanOrEqual(FACTS.deviceTypes)
  })

  it('languages is exact — "3 languages" cannot be a floor', () => {
    expect(LANGUAGES.length).toBe(FACTS.languages)
  })

  it('translated strings', () => {
    expect(countKeys(en)).toBeGreaterThanOrEqual(FACTS.translatedStrings)
  })

  it('app screens, counted from the navigation config', async () => {
    // Imported here rather than at the top: `nav.ts` pulls in lucide icons, and the other
    // assertions in this file should not pay for that.
    const { NAV_SECTIONS } = await import('@/config/nav')
    // The sections' leaves, plus the Dashboard, which sits outside them in the config.
    const screens = NAV_SECTIONS.reduce((total, s) => total + s.children.length, 0) + 1
    expect(screens).toBeGreaterThanOrEqual(FACTS.appScreens)
  })

  it('every marquee brand is genuinely seeded', () => {
    // The specific failure this prevents: a plausible brand nobody actually seeded getting added
    // to the marquee because it looked good in the row.
    const seeded = new Set(optionsFor('brand').map((o) => o.label))
    const invented = SEEDED_BRANDS.filter((brand) => !seeded.has(brand))
    expect(invented, 'these are on the site but not in the seed data').toEqual([])
  })
})
