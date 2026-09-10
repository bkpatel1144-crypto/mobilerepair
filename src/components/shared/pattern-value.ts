/**
 * What a stored device-unlock value *is*, with no component attached.
 *
 * Split out of `pattern-lock.tsx` because Fast Refresh only works when a component file exports
 * components and nothing else — editing the pattern dialog was remounting every screen that reads
 * a stored PIN.
 */
/** The nine dots, in reading order. */
export const DOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export function parsePattern(value: string): number[] {
  return value
    .split('-')
    .map((n) => Number(n))
    .filter((n) => DOTS.includes(n as (typeof DOTS)[number]))
}

/**
 * Is this stored value a drawn pattern rather than a typed PIN?
 *
 * Derived from the string instead of carried alongside it as a boolean. Both are written to the
 * same `devicePinPattern` field, and a separate flag is only correct until something reads the
 * record back — the Buy Mobile form kept no flag at all, and the Create Job Card form kept one in
 * its draft that no reader of a *saved* job card had access to. A pattern is dash-joined dot
 * indices, so the value says what it is: `"1-2-5-8"` is a pattern, `"1258"` is a PIN.
 */
export function isPatternValue(value: string | null | undefined): boolean {
  return !!value && value.includes('-') && parsePattern(value).length >= 2
}
