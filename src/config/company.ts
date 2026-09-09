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

  // TODO(contact): replace all four before launch.
  supportEmail: 'support@aimenterprise.in',
  salesEmail: 'sales@aimenterprise.in',
  /** E.164, for `tel:` and `wa.me` links. */
  phone: '+91 00000 00000',
  whatsapp: '910000000000',

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
