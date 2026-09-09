/**
 * The factual claims the public site makes about the product.
 *
 * Every number here is checked against the thing it describes by `marketing-facts.test.ts`. That
 * matters more than it sounds: a marketing page is the one place in a codebase where a number can
 * be wrong for a year without anything breaking, and "136 device models" quietly becoming false
 * after someone trims the seed data is exactly the kind of claim a prospective customer checks.
 *
 * The site has no customers to name and no revenue to quote, so these are what it leads with
 * instead of borrowed logos or invented testimonials. They are unglamorous and true, which on a
 * page a shop owner is deciding whether to trust is the better trade.
 *
 * Kept as literals rather than derived from the seed JSON at runtime: that file is ~136 records
 * with metadata, and pulling it into the marketing bundle to count its rows would cost every
 * visitor a payload they gain nothing from. The test does the deriving instead.
 */
export const FACTS = {
  /** Device brands seeded into every new company. */
  deviceBrands: 20,
  /** Individual handset models seeded. */
  deviceModels: 91,
  /** Device categories: Mobile, Keypad Phone, Tablet, Smart Watch, Earbuds/TWS, Laptop. */
  deviceTypes: 6,
  /** Screens in the application: the navigation's 44 leaves plus the Dashboard.
   *
   * Was 46 in the first draft of this file, from a grep that counted `slug:` occurrences and so
   * picked up the interface declaration too. The test below caught it before it ever rendered,
   * which is the entire reason these numbers are asserted rather than written down. */
  appScreens: 45,
  /** English, Hindi, Gujarati. */
  languages: 3,
  /** Strings translated into every language. A floor, rendered with a "+". */
  translatedStrings: 1900,
} as const

/**
 * The seeded brands, in the order a new company gets them.
 *
 * Real names from `default-service-options.json`, asserted against it in the test. "Other" is
 * omitted deliberately — it is a genuine seeded option but reads as filler in a marquee.
 */
export const SEEDED_BRANDS = [
  'Samsung',
  'Xiaomi',
  'Redmi',
  'Realme',
  'Vivo',
  'Oppo',
  'OnePlus',
  'Apple',
  'Poco',
  'iQOO',
  'Motorola',
  'Nokia',
  'Infinix',
  'Tecno',
  'Google',
  'Honor',
  'Lava',
  'itel',
  'Jio',
] as const
