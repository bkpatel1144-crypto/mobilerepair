import { collection, doc, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { serviceOptionsCollection } from '@/lib/firestore-paths'
import type { ServiceOptionDoc } from '@/types/firestore'
import type { ServiceOptionType } from '@/config/service-options'
import rawSeed from '@/data/default-service-options.json'

/**
 * The default Service Options dataset every new company starts with (device types, brands
 * shared across the device types they actually apply to, models scoped to their brand, cancel/
 * hold/outstanding reasons, customer items) — provided as a real-world export
 * (`data/service-options.json`, copied into `src/data/` so Vite can bundle it) rather than the
 * much smaller placeholder list this file used to hardcode. An Owner can rename, reorder, add,
 * or delete anything from here afterward via the Service Options page — this only seeds the
 * *starting* point, exactly like the 5 default roles or the seeded Main Branch.
 */

interface RawOption {
  label: string
  order: number
  meta: { deviceType?: string[]; brand?: string; identifierType?: string }
}
interface RawGroup {
  group: string
  options: RawOption[]
}

const GROUPS = (rawSeed as { data: { groups: RawGroup[] } }).data.groups
const RAW_GROUP_TO_TYPE: Record<string, ServiceOptionType> = {
  device_type: 'deviceTypes',
  brand: 'brands',
  model: 'models',
  cancel_reason: 'cancelReasons',
  customer_item: 'customerItems',
  hold_reason: 'holdReasons',
  outstanding_reason: 'outstandingReasons',
  problems: 'problems',
}

/** The groups whose options are just a label — no device type, no brand to resolve. */
const FLAT_GROUPS: RawGroup['group'][] = [
  'cancel_reason',
  'customer_item',
  'hold_reason',
  'outstanding_reason',
  'problems',
]

function optionsFor(rawGroup: string): RawOption[] {
  return GROUPS.find((g) => g.group === rawGroup)?.options ?? []
}

/**
 * Adds every default Service Options document to `batch` (does not commit it — the caller,
 * `seedTenantForUser()`, commits everything together with the rest of signup). Device types are
 * created first so brands can resolve `deviceTypeIds` from their `meta.deviceType` label list,
 * and brands are created before models for the same reason (`meta.brand` → `brandId`).
 */
export function addDefaultServiceOptionsToBatch(
  batch: WriteBatch,
  companyId: string,
  now: unknown
) {
  const deviceTypeIdByLabel = new Map<string, string>()
  for (const opt of optionsFor('device_type')) {
    const ref = doc(collection(db, serviceOptionsCollection(companyId, 'deviceTypes')))
    deviceTypeIdByLabel.set(opt.label, ref.id)
    const data: ServiceOptionDoc = {
      label: opt.label,
      order: opt.order - 1,
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }

  const brandIdByLabel = new Map<string, string>()
  for (const opt of optionsFor('brand')) {
    const ref = doc(collection(db, serviceOptionsCollection(companyId, 'brands')))
    brandIdByLabel.set(opt.label, ref.id)
    const deviceTypeIds = (opt.meta.deviceType ?? [])
      .map((label) => deviceTypeIdByLabel.get(label))
      .filter((id): id is string => !!id)
    const data: ServiceOptionDoc = {
      label: opt.label,
      order: opt.order - 1,
      deviceTypeIds,
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }

  for (const opt of optionsFor('model')) {
    const brandId = opt.meta.brand ? brandIdByLabel.get(opt.meta.brand) : undefined
    if (!brandId) continue // a model with no resolvable brand has nothing to group under
    const ref = doc(collection(db, serviceOptionsCollection(companyId, 'models')))
    const data: ServiceOptionDoc = {
      label: opt.label,
      order: opt.order - 1,
      brandId,
      status: 'active',
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }

  for (const rawGroup of FLAT_GROUPS) {
    const type = RAW_GROUP_TO_TYPE[rawGroup]
    for (const opt of optionsFor(rawGroup)) {
      const ref = doc(collection(db, serviceOptionsCollection(companyId, type)))
      const data: ServiceOptionDoc = {
        label: opt.label,
        order: opt.order - 1,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      batch.set(ref, data)
    }
  }
}

/**
 * The same flat defaults, for a company that already exists and has none of them.
 *
 * The signup seed runs exactly once. Any shop created before a group had defaults keeps the
 * empty group forever — and one of those groups, Problems, is the only *mandatory* field on
 * Create Job Card. A shop in that state could pick a customer, a device, a brand and a model and
 * still be told "Select at least one problem" with an empty list in front of them. Fixing the
 * seed did nothing for any company already signed up, which at the time was all of them.
 *
 * Only groups that are currently empty are touched. A shop that has written its own problem list
 * is never given a second, longer one on top of it, and nothing existing is edited or removed.
 * Returns how many documents were added so the caller can say so rather than guess.
 */
export function addMissingFlatServiceOptionsToBatch(
  batch: WriteBatch,
  companyId: string,
  now: unknown,
  /** Types that currently hold no options — the caller reads the live counts. */
  emptyTypes: ServiceOptionType[]
): number {
  let added = 0
  for (const [rawGroup, type] of Object.entries(RAW_GROUP_TO_TYPE)) {
    if (!FLAT_GROUPS.includes(rawGroup)) continue
    if (!emptyTypes.includes(type)) continue
    for (const opt of optionsFor(rawGroup)) {
      const ref = doc(collection(db, serviceOptionsCollection(companyId, type)))
      const data: ServiceOptionDoc = {
        label: opt.label,
        order: opt.order - 1,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      batch.set(ref, data)
      added += 1
    }
  }
  return added
}
