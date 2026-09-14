/**
 * The business's own details, in one place.
 *
 * Exists because "Book a demo" on the live landing page opened
 * `mailto:hello@kiwikitservice.com` — a different company's address entirely, pasted into a
 * button and shipped. A single constant makes that class of mistake a one-line fix instead of a
 * grep, and gives the footer, the contact page and every mailto link the same source.
 *
 * Values marked TODO(contact) are placeholders and must be replaced before launch. They are
 * deliberately obvious rather than plausible: a wrong-but-believable phone number is worse than a
 * visibly empty one, because nothing will ever prompt anyone to fix it.
 */
export const COMPANY = {
  /** Legal entity, as it should appear in the footer and legal pages. */
  legalName: 'AIM ENTERPRISE',
  /** Product name. Lowercase is deliberate — it is the wordmark. */
  productName: 'aim',

  /** Who a caller should ask for. */
  contactPerson: 'Kintesh Vasoya',

  // One address for both, which is what a single-shop business actually has. Kept as two fields
  // so support and sales can be split later without touching every page that links to them.
  supportEmail: 'kintesh@aimenterprise.in',
  salesEmail: 'kintesh@aimenterprise.in',
  /** Spaced for display; `tel:` links strip the spaces themselves. */
  phone: '+91 99981 81685',
  /** Bare digits with the country code and no `+` — what `wa.me` expects. */
  whatsapp: '919998181685',

  // TODO(contact): registered address.
  address: {
    line1: 'Address line 1',
    line2: 'Address line 2',
    city: 'City',
    state: 'Gujarat',
    postalCode: '000000',
    country: 'India',
  },

  /** Working hours as a translation key, since this is displayed copy rather than data. */
  hoursKey: 'marketing.contact.hoursValue',
} as const

/** `wa.me` link with an optional prefilled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${COMPANY.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** `mailto:` link with an optional subject. */
export function mailto(address: string, subject?: string): string {
  return subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`
}
