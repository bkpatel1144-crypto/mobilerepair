import { describe, expect, it } from 'vitest'

/**
 * Every collection the signup batch writes to must allow `isBootstrapping()` on create.
 *
 * This exists because of a bug that broke every single signup in production. `seedTenantForUser()`
 * writes ~200 documents in ONE atomic batch: the tenant root (company, branch, financial year, 5
 * roles, the profile doc, the first login/session rows) *and* the starting datasets — 136 service
 * options, the Masters collections, the print template catalogue. Five of those collections had
 * create rules requiring `belongsToCompany() && hasMenuAccess()`, both of which are impossible
 * during signup: the profile doc `belongsToCompany()` reads is being written by that very same
 * batch, and the role doc `hasMenuAccess()` reads does not exist yet either.
 *
 * A batch is all-or-nothing, so one denied service option rejected the entire signup. The new
 * Owner was left holding an Auth account and nothing else, which the app surfaced as an empty
 * sidebar and "You don't have access to this page" on every route — a message about permissions
 * for what was really a tenant that had never been created.
 *
 * Three things let it survive review, and each is a reason to assert this in a test rather than
 * trust a reading of the rules:
 *
 *  1. It was invisible until the first real rules deploy. The database was still on its 30-day
 *     test-mode ruleset, which allows everything and therefore evaluates none of these functions,
 *     so signup worked right up until the rules meant to protect it shipped.
 *  2. A rejected batch reports one anonymous `permission-denied` and names none of the ~200
 *     documents responsible, so the error points at nothing.
 *  3. `seedTenantForUser()`'s own doc comment describes it as writing the tenant root — which is
 *     what it originally did. The seed datasets were added to the same batch by later phases, and
 *     each addition silently required a rules change that nothing connected it to.
 *
 * Source-level rather than emulator-backed on purpose: this has to fail on the commit that adds a
 * `batch.set()` for a new collection, with no network, no Java and no billed database.
 * `tools/firebase/probe-signup.mjs` is the companion that verifies the deployed rules for real.
 */

const rulesSource = Object.values(
  import.meta.glob('../../firestore.rules', { query: '?raw', eager: true, import: 'default' })
)[0] as string

const pathsSource = Object.values(
  import.meta.glob('../lib/firestore-paths.ts', { query: '?raw', eager: true, import: 'default' })
)[0] as string

/** These three files exist only to append to the signup batch, so all of their path helpers count. */
const seedSources = import.meta.glob(
  ['../lib/masters-seed.ts', '../lib/service-options-seed.ts', '../lib/print-templates-seed.ts'],
  { query: '?raw', eager: true, import: 'default' }
) as Record<string, string>

const authSource = Object.values(
  import.meta.glob('../lib/auth.ts', { query: '?raw', eager: true, import: 'default' })
)[0] as string

/**
 * Only `seedTenantForUser`'s own body, not all of `auth.ts` — `logIn()` further down the same file
 * *reads* `ipWhitelistCollection()` to check the whitelist, and a whole-file scan counted that as a
 * bootstrap write and demanded a rule that would wrongly let a half-onboarded account seed its own
 * whitelist.
 */
function seedFunctionBody(): string {
  const start = authSource.indexOf('async function seedTenantForUser')
  if (start === -1) throw new Error('seedTenantForUser() not found in auth.ts — has it moved?')
  // Its closing brace is the next one at column zero, since it's a top-level declaration.
  const end = authSource.indexOf('\n}', start)
  return authSource.slice(start, end === -1 ? undefined : end)
}

/** `foo/${bar}/baz` and `foo/{qux}/baz` both become `foo/*"/"baz`, so a path helper's template and
 *  a rules matcher compare as equal regardless of what either named its parameters. */
function normalize(segments: string[]): string {
  return segments.map((s) => (/^\{.*\}$/.test(s) || s.includes('${') ? '*' : s)).join('/')
}

/**
 * Resolves a path helper to the collection it addresses, following the one level of indirection
 * the module uses (`${fooCollection(companyId)}/${id}`). Null for anything that doesn't resolve to
 * a company-scoped or top-level path.
 */
function resolveCollection(helper: string, seen = new Set<string>()): string | null {
  if (seen.has(helper)) return null
  seen.add(helper)

  // Matches both the single-line and the wrapped declaration form, up to the closing backtick.
  const declaration = new RegExp(
    'export const ' + helper + ' = \\([^)]*\\)[\\s\\S]{0,400}?=>\\s*`([^`]+)`'
  )
  const match = pathsSource.match(declaration)
  if (!match) return null

  const template = match[1]
  const indirect = template.match(/^\$\{(\w+)\(companyId\)\}\/(.*)$/)
  if (indirect) {
    const parent = resolveCollection(indirect[1], seen)
    return parent === null ? null : parent
  }

  const segments = template.split('/')
  // A helper named `...Doc` addresses a document, so its collection is everything but the final
  // id segment; a `...Collection` helper is already the collection.
  const collectionSegments = helper.endsWith('Doc') ? segments.slice(0, -1) : segments
  // Drop the `companies/${companyId}` prefix — the rules matchers for these live inside the
  // `match /companies/{companyId}` block and are written relative to it.
  const scoped =
    collectionSegments[0] === 'companies' && (collectionSegments[1] ?? '').includes('${companyId}')
      ? collectionSegments.slice(2)
      : collectionSegments
  return scoped.length ? normalize(scoped) : null
}

/** Every collection reachable from a path helper used in the signup batch's source files. */
function seededCollections(): Map<string, string[]> {
  const byCollection = new Map<string, string[]>()
  const sources = { ...seedSources, 'lib/auth.ts': seedFunctionBody() }
  for (const [file, source] of Object.entries(sources)) {
    for (const [, helper] of source.matchAll(/\b(\w+(?:Collection|Doc))\(\s*companyId/g)) {
      const collection = resolveCollection(helper)
      if (!collection) continue
      const via = byCollection.get(collection) ?? []
      const label = `${helper} (${file.split('/').pop()})`
      if (!via.includes(label)) via.push(label)
      byCollection.set(collection, via)
    }
  }
  // Four the helper scan structurally cannot see, each written by the same batch:
  //  - `users`, via `userDoc(uid)` — takes a uid, not a companyId, and it is the single most
  //    important document in the batch.
  //  - `companies`, via a literal `collection(db, 'companies')`, since the id is being minted.
  //  - `auditLog`/`sessions`, via `addLoginAuditToBatch()`/`addSessionToBatch()` in other modules.
  //    These two are worth naming rather than dropping: they were an earlier instance of this
  //    exact bug, denied for the same reason and fixed the same way, and nothing but this list
  //    would notice if that regressed.
  for (const [collection, via] of [
    ['users', 'userDoc (auth.ts)'],
    ['companies', "collection(db, 'companies') (auth.ts)"],
    ['auditLog', 'addLoginAuditToBatch (audit-log.ts)'],
    ['sessions', 'addSessionToBatch (session-lifecycle.ts)'],
  ]) {
    byCollection.set(collection, [via])
  }
  return byCollection
}

/**
 * The `allow` clauses governing `create` for the matcher addressing this collection. A `write`
 * clause counts, since it covers create.
 */
function createRulesFor(collection: string): string[] | null {
  // `\S+` rather than one `/segment/{wildcard}` pair — a nested matcher like
  // `/serviceOptions/{optionType}/items/{id}` has several, and a regex that stopped at the first
  // wildcard silently found no matcher at all for exactly the collection this file was written for.
  for (const block of rulesSource.matchAll(/^([ \t]*)match (\/\S+)\s*\{[ \t]*$/gm)) {
    const segments = block[2].split('/').filter(Boolean)
    // The matcher addresses a document, so drop its final id segment to get the collection.
    if (normalize(segments.slice(0, -1)) !== collection) continue

    const rest = rulesSource.slice(block.index! + block[0].length)
    // The body ends at the first closing brace indented level with the `match` itself. Nested
    // subcollection matchers are indented deeper, so they don't truncate the search early.
    const end = rest.search(new RegExp('^' + block[1] + '\\}', 'm'))
    const body = end === -1 ? rest : rest.slice(0, end)

    return [...body.matchAll(/allow ([a-z, ]+):([^;]*);/g)]
      .filter(([, verbs]) => /\bcreate\b|\bwrite\b/.test(verbs))
      .map(([clause]) => clause.replace(/\s+/g, ' '))
  }
  return null
}

describe('firestore.rules — signup bootstrap', () => {
  const seeded = seededCollections()

  it('finds the collections the signup batch writes to', () => {
    // A guard on the scan itself. If the regexes above ever stop matching, every assertion below
    // would pass vacuously and the bug this file exists for could walk straight back in.
    expect(seeded.size).toBeGreaterThanOrEqual(12)
    expect([...seeded.keys()]).toContain('serviceOptions/*/items')
    expect([...seeded.keys()]).toContain('uom')
    expect([...seeded.keys()]).toContain('users')
  })

  it.each([...seeded.entries()].map(([collection, via]) => [collection, via.join(', ')]))(
    '%s allows isBootstrapping() on create (written by %s)',
    (collection) => {
      const rules = createRulesFor(collection)
      expect(rules, `no rules matcher addresses "${collection}"`).not.toBeNull()
      expect(rules!.length, `no create/write rule for "${collection}"`).toBeGreaterThan(0)
      expect(
        rules!.some((rule) => rule.includes('isBootstrapping()')),
        `"${collection}" is written during signup but its create rule never admits ` +
          `isBootstrapping(), so the whole atomic bootstrap batch is denied:\n  ` +
          rules!.join('\n  ')
      ).toBe(true)
    }
  )
})
