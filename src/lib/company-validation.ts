import type { CompanyDoc } from '@/types/firestore'

/**
 * The company form's shape, options and validation — kept out of `company-form.tsx` so that file
 * exports only a component (the `react-refresh/only-export-components` rule), and so the rules
 * can be tested without rendering anything.
 */
export interface CompanyFormValues {
  name: string
  code: string
  legalName: string
  gstRegistration: CompanyDoc['gstRegistration']
  gstin: string
  pan: string
  email: string
  phone: string
  currency: string
  timezone: string
}

export const BLANK_COMPANY: CompanyFormValues = {
  name: '',
  code: '',
  legalName: '',
  gstRegistration: 'Unregistered',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
}

export const CURRENCIES = [
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'AED', label: 'AED - UAE Dirham (د.إ)' },
  { value: 'GBP', label: 'GBP - Pound Sterling (£)' },
]

export const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'UTC', label: 'UTC' },
]

/** GSTIN embeds the PAN as characters 3–12, so a mismatch is a typo that would otherwise print
 * onto every bill. Checked rather than assumed — this is the one cross-field rule GST actually
 * defines, and it costs nothing to enforce. */
export function gstinContainsPan(gstin: string, pan: string): boolean {
  const g = gstin.trim().toUpperCase()
  const p = pan.trim().toUpperCase()
  if (g.length !== 15 || p.length !== 10) return true // shape errors are reported separately
  return g.slice(2, 12) === p
}

export function validateCompany(v: CompanyFormValues): string | null {
  if (!v.name.trim()) return 'Company name is required.'
  if (!v.code.trim()) return 'Company code is required.'
  if (!v.legalName.trim()) return 'Legal name is required.'
  if (!v.email.trim()) return 'Email is required.'
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) return 'That email does not look right.'
  // Optional, but checked when given. It used to be required, which made the *first* edit of
  // every company impossible: signup never asks for a phone and seeds `phone: ''`, so opening
  // Edit and changing anything else failed on a field the user had never been offered. A shop
  // contact number is useful on a printed bill, not a precondition for renaming the company.
  if (v.phone.trim() && !/^\d{10}$/.test(v.phone.trim()))
    return 'Phone should be a 10-digit mobile number.'

  // GSTIN and PAN are only required for a registered company — an unregistered shop has neither,
  // and demanding them would make the form impossible to complete honestly.
  if (v.gstRegistration !== 'Unregistered') {
    if (!v.gstin.trim()) return 'GSTIN is required for a registered company.'
    if (v.gstin.trim().length !== 15) return 'A GSTIN is 15 characters.'
    if (!v.pan.trim()) return 'PAN is required for a registered company.'
    if (v.pan.trim().length !== 10) return 'A PAN is 10 characters.'
    if (!gstinContainsPan(v.gstin, v.pan))
      return 'The GSTIN does not contain that PAN — check both.'
  }
  return null
}
