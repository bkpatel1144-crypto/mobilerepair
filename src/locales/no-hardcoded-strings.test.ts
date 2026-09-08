import { describe, it, expect } from 'vitest'

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
])

function isDisplayString(s: string): boolean {
  const t = s.trim()
  if (t.length < 2) return false
  if (!/[A-Za-z]/.test(t)) return false
  if (/^[a-z0-9-]+$/.test(t) && !t.includes(' ')) return false
  if (t.startsWith('/') || t.startsWith('#') || t.startsWith('http')) return false
  if (/^[a-z]+[A-Z]/.test(t) && !t.includes(' ')) return false
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
    ([path]) => !/\.test\.tsx?$/.test(path) && !path.includes('/ui/')
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
      for (const m of raw.matchAll(/>\s*\n\s*([A-Z][^<>{}]{10,300}?)\s*\n\s*</g)) {
        const text = m[1].replace(/\s+/g, ' ').trim()
        if (!/[a-z]/.test(text)) continue
        if (text.includes('&') && /&[a-z]+;/.test(text)) continue
        found.push(`${path}: ${JSON.stringify(text.slice(0, 60))}`)
      }
    }
    expect(found).toEqual([])
  })
})
