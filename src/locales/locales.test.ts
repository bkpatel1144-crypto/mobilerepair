import { describe, it, expect } from 'vitest'
import en from './en.json'
import hi from './hi.json'
import gu from './gu.json'
import { LANGUAGES } from '@/lib/i18n'

type Tree = { [key: string]: unknown }

/** Every leaf key path, so a nested gap is caught as precisely as a top-level one. */
function keyPaths(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    return v && typeof v === 'object' && !Array.isArray(v) ? keyPaths(v as Tree, path) : [path]
  })
}

function at(obj: Tree, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc as Tree)?.[k], obj)
}

const enPaths = keyPaths(en as Tree)
const translations = [
  ['hi', hi],
  ['gu', gu],
] as const

describe('locale files', () => {
  it('covers every language the picker offers', () => {
    // A code in LANGUAGES with no resource bundle renders every string as its raw dotted key.
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual(['en', 'gu', 'hi'])
  })

  it('has a non-trivial number of keys', () => {
    // Guards against an accidental truncation of en.json going unnoticed because the
    // comparisons below only check the three files agree with *each other*.
    expect(enPaths.length).toBeGreaterThan(150)
  })

  it.each(translations)('%s has every key English has', (_code, dict) => {
    const missing = enPaths.filter((p) => at(dict as Tree, p) === undefined)
    expect(missing).toEqual([])
  })

  it.each(translations)('%s has no key English lacks', (_code, dict) => {
    // An extra key is dead weight, but more importantly it usually means a rename landed in one
    // file and not the others.
    const extra = keyPaths(dict as Tree).filter((p) => at(en as Tree, p) === undefined)
    expect(extra).toEqual([])
  })

  it.each(translations)('%s leaves no string empty', (_code, dict) => {
    const blank = enPaths.filter((p) => {
      const v = at(dict as Tree, p)
      return typeof v === 'string' && v.trim() === ''
    })
    expect(blank).toEqual([])
  })

  it.each(translations)('%s keeps the same interpolation placeholders', (_code, dict) => {
    // `showingRange` carries {{from}}, {{to}} and {{total}}. Dropping one in translation renders
    // a sentence with a hole in it; renaming one renders the literal `{{from}}` to the user.
    const placeholders = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort()
    const mismatched: string[] = []
    for (const p of enPaths) {
      const source = at(en as Tree, p)
      const target = at(dict as Tree, p)
      if (typeof source !== 'string' || typeof target !== 'string') continue
      const a = placeholders(source)
      const b = placeholders(target)
      if (a.join(',') !== b.join(',')) mismatched.push(`${p}: [${a}] vs [${b}]`)
    }
    expect(mismatched).toEqual([])
  })

  it.each(translations)('%s has twelve month names in both lengths', (_code, dict) => {
    const months = (dict as Tree).months as { short: string[]; long: string[] }
    expect(months.short).toHaveLength(12)
    expect(months.long).toHaveLength(12)
  })

  it.each(translations)('%s actually translates — it is not a copy of English', (_code, dict) => {
    // Catches a locale file created by copying en.json and never filled in. Some values are
    // *meant* to stay identical (GSTIN, PAN, WhatsApp, the app name), so this asserts that the
    // overwhelming majority differ rather than that all of them do.
    const strings = enPaths.filter((p) => typeof at(en as Tree, p) === 'string')
    const identical = strings.filter((p) => at(dict as Tree, p) === at(en as Tree, p))
    expect(identical.length / strings.length).toBeLessThan(0.1)
  })
})
