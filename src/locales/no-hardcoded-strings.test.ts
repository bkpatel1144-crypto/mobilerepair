import { describe, it, expect } from 'vitest'
import BASELINE from './hardcoded-baseline.json'

/**
 * Fails if any user-visible English string is added back into the source.
 *
 * The three translation passes each missed a whole shape of string, and each miss was invisible
 * until something went looking: attribute values were done while every ternary was still English,
 * then expressions were done while every multi-line sentence was still English. This test is the
 * thing that goes looking, so the next gap is caught on the commit that introduces it rather than
 * by a shopkeeper seeing English on a Gujarati screen.
 *
 * It mirrors `tools/i18n/audit.cjs`. That tool exists for the readable per-file report; this
 * exists so CI enforces the result.
 */
const sources = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Attribute names whose value is code, not copy. */
const CODE_ATTR =
  /\b(className|class|type|variant|size|key|value|name|id|htmlFor|to|href|src|path|align|side|role|slug|mode|direction|accept|autoComplete|inputMode|pattern|data-\w+)=\s*$/

/**
 * Strings that stay English deliberately — each is a stored value or a typed phrase, never copy.
 * `UomDoc.type`, `PaymentModeDoc.type` and `accessoriesIncluded` are persisted as these exact
 * strings and have a value-to-key map beside them so the *label* is still localised; `OVERWRITE`
 * is compared against CONFIRM_PHRASE and has to be typed exactly.
 */
const INTENTIONALLY_ENGLISH = new Set([
  'Quantity',
  'Length',
  'Weight',
  'Volume',
  'Time',
  'Other',
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Charger only',
  'Charger, box, cable',
  'Charger, box, cable, earphones',
  'Box only',
  'OVERWRITE',
  // `ItemDoc` values, written to Firestore and matched against on read. Translating one would
  // change what is stored, and an existing item would stop matching its own tax band or nature —
  // the same reason `Cash`/`UPI` above are here.
  'Goods',
  'Service',
  'NONE',
  // `ItemCategoryType` values, written to Firestore. Displayed through `CATEGORY_TYPE_LABEL`,
  // which resolves each to a translation key — these three literals are the stored form.
  'Raw Material',
  'Finished Goods',
  'Consumables',
])

function isDisplayString(s: string): boolean {
  const t = s.trim()
  if (t.length < 2) return false
  if (!/[A-Za-z]/.test(t)) return false
  if (/^[a-z0-9-]+$/.test(t) && !t.includes(' ')) return false
  if (t.startsWith('/') || t.startsWith('#') || t.startsWith('http')) return false
  if (/^[a-z]+[A-Z]/.test(t) && !t.includes(' ')) return false
  // SCREAMING_SNAKE with at least one underscore is an identifier, never a label: every
  // permission key (`SERVICE_JOB_CARDS_ASSIGN`) and every stored enum value (`GST_18`,
  // `BATCH_SERIAL`) looks like this. Requiring the underscore keeps short all-caps words that
  // genuinely are display text — "UPI", "GST" — subject to the check.
  if (/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(t)) return false
  if (/(^|\s)(bg|text|flex|grid|border|rounded|size|p|px|py|m|mx|my|w|h)-/.test(t)) return false
  if (
    /(^|\s)(cursor|ring|outline|shadow|opacity|gap|space|transition|duration|min|max|inset|top|left|right|bottom|z|overflow|whitespace|truncate|font|leading|tracking|justify|items|self|order|col|row|divide|placeholder|caret|accent|fill|stroke)-/.test(
      t
    )
  )
    return false
  if (
    /(^|\s)(hover|focus|focus-visible|active|disabled|group|peer|first|last|odd|even|sm|md|lg|xl|2xl|dark|print|data-\[|aria-\[):/.test(
      t
    )
  )
    return false
  if (/^[a-z]{2}(-[A-Za-z]{2,4})+$/.test(t)) return false
  if (/^__.*__$/.test(t) || /^_[a-z]+$/.test(t)) return false
  if (/^(linear-gradient|radial-gradient|url|rgba?|hsla?)\(/.test(t)) return false
  // CSS lengths, whole-value: `32px 32px` for a background-size, `0px 0px -12% 0px` for an
  // IntersectionObserver rootMargin. Every token is a number with a unit, so there is nothing in
  // it a translator could act on — and without this the design work added three false positives
  // that would have to be explained away in the allow-list instead.
  if (
    /^-?[\d.]+(px|rem|em|%|vh|vw|fr|deg|s|ms)?( +-?[\d.]+(px|rem|em|%|vh|vw|fr|deg|s|ms)?)*$/.test(
      t
    )
  )
    return false
  if (/^[a-z][a-z0-9-]*:$/.test(t)) return false
  if (/&&|\|\||=>|[=;${}[\]<>]/.test(t)) return false
  if (/\.\w/.test(t)) return false
  if (/^\W/.test(t) && !/^[("'“]/.test(t)) return false
  return true
}

function isCodeContext(before: string, after: string, text: string): boolean {
  if (/[A-Za-z0-9_]$/.test(before)) return true // apostrophe inside JSX text
  if (CODE_ATTR.test(before)) return true
  if (/\bt\(\s*$/.test(before)) return true
  if (/\bdefaultValue:\s*$/.test(before)) return true
  if (/\b(from|import|require\()\s*$/.test(before)) return true
  if (/^\s*:/.test(after)) return true
  if (
    /\b(queryKey|collection|doc|orderBy|where|field|fieldKey|eventKey|statusKey|CONFIRM_PHRASE)\b[^=]*$/.test(
      before
    )
  )
    return true
  if (/[=!]==?\s*$/.test(before)) return true
  if (/^\s*[=!]==?/.test(after)) return true
  if (/^[A-Za-z0-9:_-]+(\/[A-Za-z0-9:_-]+)+$/.test(text)) return true
  if (/^\s*(\||>|as\s+const)/.test(after)) return true
  if (/(?<!\|)\|\s*$/.test(before)) return true
  if (/<\s*$/.test(before)) return true
  if (!/[A-Za-z0-9_-]=\s*$/.test(before) && /^\s+[a-z]/.test(after)) return true
  if (
    /\.(includes|startsWith|endsWith|split|join|replace|replaceAll|match|test|indexOf|localeCompare)\(\s*$/.test(
      before
    )
  )
    return true
  return false
}

function blankComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

describe('no hardcoded display strings', () => {
  const files = Object.entries(sources).filter(
    ([path]) =>
      !/\.test\.tsx?$/.test(path) &&
      !path.includes('/ui/') &&
      // Test support: fixtures there are data for assertions, never rendered to a user.
      !path.includes('/test/')
  )

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('every user-visible string goes through t()', () => {
    const found: string[] = []
    for (const [path, raw] of files) {
      if (!/\.tsx$/.test(path)) continue
      const src = blankComments(raw)
      for (const m of src.matchAll(/'([^'\\\n]{2,120})'|"([^"\\\n]{2,120})"/g)) {
        const text = m[1] ?? m[2] ?? ''
        if (!isDisplayString(text)) continue
        const before = src.slice(Math.max(0, m.index - 120), m.index)
        const after = src.slice(m.index + m[0].length, m.index + m[0].length + 20)
        if (isCodeContext(before, after, text)) continue
        if (INTENTIONALLY_ENGLISH.has(text.trim())) continue
        found.push(`${path}: ${JSON.stringify(text)}`)
      }
    }
    expect(found).toEqual([])
  })

  it('no multi-line JSX text node is left untranslated', () => {
    const found: string[] = []
    for (const [path, raw] of files) {
      if (!/\.tsx$/.test(path)) continue
      // Terminates on a sibling element or an expression, not just on the closing tag.
      //
      // The original required the text node to be a tag's *only* child, matching all the way to
      // a newline and a closing bracket. That let through every label with a marker beside it,
      // which is the commonest shape in this codebase — a required-field asterisk or an
      // "(Optional)" hint in a sibling span. Three shipped bugs came through the hole: the
      // landing page's h1, the job-card mockup's warranty line, and eighteen field labels on
      // Create Job Card, the most-used form in the app, left entirely in English for Hindi and
      // Gujarati users. The minimum length drops to 3 for the same reason: "Brand" and "Model"
      // are labels, not noise.
      for (const m of raw.matchAll(/>\s*\n\s*([A-Z][^<>{}\n]{3,300}?)\s*(?:<|\{)/g)) {
        const text = m[1].replace(/\s+/g, ' ').trim()
        if (!/[a-z]/.test(text)) continue
        if (text.includes('&') && /&[a-z]+;/.test(text)) continue
        found.push(`${path}: ${JSON.stringify(text.slice(0, 60))}`)
      }
    }

    // A ratchet, not a clean assertion, and deliberately so.
    //
    // Relaxing the pattern above exposed 286 strings this test had never been able to see —
    // roughly forty files' worth of field labels, dialog copy and column headers that are still
    // English in Hindi and Gujarati. Asserting `[]` would leave the suite red for as long as that
    // backlog exists, and a permanently failing test is one nobody reads. Reverting the pattern
    // would hide the problem again.
    //
    // So the baseline is checked in, and the only rule enforced is that it cannot grow. A newly
    // hardcoded string fails immediately, which is the property that actually matters; the
    // backlog is visible in `hardcoded-baseline.json` and shrinks as it is worked through.
    //
    // Stale entries fail too, so fixing a string forces the baseline down rather than letting it
    // drift out of date. Regenerate with `node tools/i18n/baseline.cjs`.
    const baseline = new Set(BASELINE as string[])
    const added = found.filter((f) => !baseline.has(f))
    const fixed = [...baseline].filter((b) => !found.includes(b))

    expect(added, 'newly hardcoded English strings — wrap these in t()').toEqual([])
    expect(
      fixed,
      'these are fixed; run node tools/i18n/baseline.cjs to update the baseline'
    ).toEqual([])
  })
})
