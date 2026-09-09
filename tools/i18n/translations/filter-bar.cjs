/**
 * Two strings in the shared filter bar that were still hardcoded English — the custom-range
 * chip and the "to" between the two date fields. Both sat as bare JSX text, the same shape that
 * `no-hardcoded-strings.test.ts` misses.
 */
module.exports = {
  shared: {
    custom: { en: 'Custom', hi: 'कस्टम', gu: 'કસ્ટમ' },
    to: { en: 'to', hi: 'से', gu: 'થી' },
  },
}
