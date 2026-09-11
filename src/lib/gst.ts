import type { CompanyDoc } from '@/types/firestore'

/**
 * What GST a bill carries, if any.
 *
 * Optional by design. `gstRegistration` defaults to `Unregistered` at signup and plenty of
 * small repair shops never change it — for them a bill is simply parts plus labour, and adding
 * a tax line they never charge would make the bill wrong rather than more complete. Nothing
 * here fires unless the shop has said it is registered.
 *
 * `Composition` is registered but bills without GST: a composition dealer pays tax out of their
 * own turnover and is barred from collecting it from the customer, so their invoice shows no
 * tax line. Treating "registered" as "charges GST" would put a line on their bill that the law
 * says must not be there.
 */
export interface GstConfig {
  /** Does this shop charge GST on its bills? */
  enabled: boolean
  /** Are the prices people type already inclusive of tax? */
  inclusive: boolean
  /** The single rate applied to the bill, as a percentage. */
  rate: number
}

export function gstConfigFor(
  company: Pick<CompanyDoc, 'gstRegistration'> & { pricesIncludeGst?: boolean; gstRate?: number } | null | undefined
): GstConfig {
  return {
    enabled: company?.gstRegistration === 'Regular',
    // Inclusive by default: a walk-in repair shop quotes "₹500 to fix it" and means ₹500 out of
    // the customer's pocket. Exclusive pricing is a B2B habit and has to be chosen.
    inclusive: company?.pricesIncludeGst !== false,
    rate: company?.gstRate ?? 18,
  }
}

export interface GstBreakdown {
  /** What the goods and services are worth before tax. */
  taxable: number
  cgst: number
  sgst: number
  tax: number
  /** What the customer pays. */
  gross: number
}

/**
 * Splits an amount into taxable value and GST.
 *
 * Rounded to paise at the end rather than per component, and CGST/SGST are halves of one
 * rounded total — splitting first and rounding twice can leave the two halves failing to add
 * back up to the tax line printed above them, which is exactly the sort of one-paise
 * disagreement an accountant will ask about.
 *
 * An intra-state sale is CGST + SGST, which is what a repair shop billing walk-in customers
 * does all day. IGST would need the customer's state, which this app does not collect.
 */
export function splitGst(amount: number, config: GstConfig): GstBreakdown {
  const round = (n: number) => Math.round(n * 100) / 100
  if (!config.enabled || config.rate <= 0 || amount <= 0) {
    return { taxable: round(Math.max(0, amount)), cgst: 0, sgst: 0, tax: 0, gross: round(Math.max(0, amount)) }
  }
  const taxable = config.inclusive ? amount / (1 + config.rate / 100) : amount
  const tax = round(taxable * (config.rate / 100))
  const half = round(tax / 2)
  return {
    taxable: round(config.inclusive ? amount - tax : amount),
    // The second half absorbs the rounding so the two always sum to `tax`.
    cgst: half,
    sgst: round(tax - half),
    tax,
    gross: round(config.inclusive ? amount : amount + tax),
  }
}
