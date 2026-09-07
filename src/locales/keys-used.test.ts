import { describe, it, expect } from 'vitest'
import en from './en.json'

/**
 * TypeScript cannot check a translation key: `t('shell.langauge')` is a valid string, compiles
 * fine, and renders the literal `shell.langauge` to the user. With hundreds of keys across 150
 * files, a typo is a matter of when rather than if — so this reads every source file and asserts
 * that each literal key a component asks for actually exists in en.json.
 *
 * Source is collected with `import.meta.glob` rather than `node:fs` so the file stays inside the
 * app's own tsconfig, which has no node types — the alternative was excluding the tests from
 * typechecking altogether, which costs more than it saves.
 *
 * Only literal keys can be checked. A computed one (`t(\`nav.items.${x}\`)`) is skipped by the
 * regex below, which is why `useNavLabels` passes an explicit `defaultValue` for those: a missed
 * dynamic key then falls back to the English label from nav.ts instead of rendering a dotted path.
 */
const sources = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

type Tree = { [key: string]: unknown }

function has(path: string): boolean {
  const value = path
    .split('.')
    .reduce<unknown>(
      (acc, k) => (acc && typeof acc === 'object' ? (acc as Tree)[k] : undefined),
      en
    )
  return value !== undefined
}

/** `t('a.b')` / `t("a.b")` — literal single-argument keys only. */
const T_CALL = /\bt\(\s*(['"])([^'"`]+?)\1/g

/** i18next appends these to a base key at lookup time, so `common.itemCount` is satisfied by
 * `common.itemCount_one` / `_other` in the JSON. */
const PLURAL_SUFFIXES = ['_one', '_other', '_zero', '_two', '_few', '_many']

function resolves(key: string): boolean {
  return has(key) || PLURAL_SUFFIXES.some((s) => has(key + s))
}

describe('translation keys used in source', () => {
  const files = Object.entries(sources).filter(([path]) => !/\.test\.tsx?$/.test(path))

  it('finds source files to scan', () => {
    // If the glob breaks, every assertion below passes vacuously — which is worse than failing,
    // because it looks like proof of correctness.
    expect(files.length).toBeGreaterThan(100)
  })

  it('every literal t() key exists in en.json', () => {
    const unknown: string[] = []
    for (const [path, text] of files) {
      for (const [, , key] of text.matchAll(T_CALL)) {
        // Dotted keys only. A bare word is almost always some other single-letter function
        // called `t`, not a translation lookup.
        if (!key.includes('.')) continue
        if (!resolves(key)) unknown.push(`${path}: ${key}`)
      }
    }
    expect(unknown).toEqual([])
  })
})
