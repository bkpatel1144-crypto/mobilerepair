/**
 * The 8 accordion sections on the Service Options page (`preview (73)`) — each backed by
 * `serviceOptionsCollection(companyId, type)`. `brands` and `models` are the two with extra
 * structure (brands nest under device types, can be shared across several until "Split shared
 * brands"; models nest under one owning brand) — everything else is a flat labeled list.
 */
export type ServiceOptionType =
  | 'brands'
  | 'cancelReasons'
  | 'customerItems'
  | 'deviceTypes'
  | 'holdReasons'
  | 'models'
  | 'outstandingReasons'
  | 'problems'

export interface ServiceOptionSectionSpec {
  type: ServiceOptionType
  label: string
  addLabel: string
}

export const SERVICE_OPTION_SECTIONS: ServiceOptionSectionSpec[] = [
  { type: 'brands', label: 'Brands', addLabel: 'Add brand' },
  { type: 'cancelReasons', label: 'Cancel Reasons', addLabel: 'Add reason' },
  { type: 'customerItems', label: 'Customer Items', addLabel: 'Add item' },
  { type: 'deviceTypes', label: 'Device Types', addLabel: 'Add device type' },
  { type: 'holdReasons', label: 'Hold Reasons', addLabel: 'Add reason' },
  { type: 'models', label: 'Models', addLabel: 'Add model' },
  { type: 'outstandingReasons', label: 'Outstanding Reasons', addLabel: 'Add reason' },
  { type: 'problems', label: 'Problems', addLabel: 'Add problem' },
]

import { Smartphone, Phone, Tablet, Watch, Headphones, Laptop, Package, type LucideIcon } from 'lucide-react'

/** Which icon a Device Type's own search/select dropdown shows next to it (`preview (9)`'s
 * Device Type combobox) — purely presentational, matched by label since `ServiceOptionDoc`
 * itself has no icon field (an Owner-renamed device type falls back to `Package`, not an error
 * state). Every seeded default from `default-service-options.json` has an entry here. */
export const DEVICE_TYPE_ICONS: Record<string, LucideIcon> = {
  Mobile: Smartphone,
  'Keypad Phone': Phone,
  Tablet: Tablet,
  'Smart Watch': Watch,
  'Earbuds / TWS': Headphones,
  Laptop: Laptop,
}

export function deviceTypeIcon(label: string): LucideIcon {
  return DEVICE_TYPE_ICONS[label] ?? Package
}
