/**
 * Generates `src/config/permission-catalogue.ts` from the client's `permotion-sample.json`.
 *
 *   node tools/data/build-permission-catalogue.cjs
 *
 * The permission catalogue this replaces was modelled by hand: each module listed a few
 * "entities" that every one of the four CRUD ops was applied to, plus a flat list of module-wide
 * special actions. That shape cannot express what the reference actually has —
 * `MASTERS_ITEMS_IMPORT`, `SERVICE_JOB_CARDS_ASSIGN`, a per-feature `EXPORT` — and it invents
 * combinations the reference does not have, such as deleting a report. It came to 174 keys in a
 * format (`sales.invoices.create`) that the reference system cannot read at all.
 *
 * Here the keys ARE the reference's: `SALES_INVOICES_CREATE`. A role document written by one
 * system is now readable by the other, which is the whole point of matching a storage format.
 *
 * Only the features this app actually has a menu for are included. The export's hierarchy
 * describes 316 permissions across features like Departments, Delivery Notes and Sales Returns
 * that this product does not have; the export's own OWNER grant is the 185 that remain, and the
 * generator asserts it lands on exactly that number.
 */
const fs = require('node:fs')

const OUT = 'src/config/permission-catalogue.ts'
const ref = JSON.parse(fs.readFileSync('data/permotion-sample.json', 'utf8'))

const { FEATURE_MAP } = require('./reference-menu-map.cjs')

/**
 * The Purchase module, transcribed from the client's Role Configure screen.
 *
 * It is in none of the six exports they supplied: across all of them there are 316 distinct
 * permission keys and not one begins with `PURCHASE_`. Every one of those files carries its own
 * summary reading 52 menus / 185 permissions / 8 modules, so the exports are simply older than
 * the app they came from — which now reads 57 and 190, and 190 - 185 is exactly the five below.
 *
 * Two details come from the screenshot rather than from assumption. There is no "Access Purchase
 * Module" chip where Sales has one inside its own eleven, so this module has no module-access
 * permission — which is also the only way the total lands on 190 instead of 191. And all five
 * render as chips rather than in the create/update/delete/view grid, so they are `custom`.
 *
 * Labels are the screenshot's, word for word. Of the keys, `PURCHASE_GENERAL_PURCHASE_VIEW` is
 * confirmed by the client's own `data/menu-structure.json`; the other four follow the
 * reference's `{MODULE}_{FEATURE}_{ACTION}` rule using action words it already uses elsewhere —
 * and "Print Purchase Receipt" is word for word the label it gives
 * `SECOND_HAND_DEVICE_DEVICE_PURCHASE_PRINT`.
 */
const EXTRA_MODULES = [
  {
    sectionKey: 'purchase',
    label: 'Purchase',
    moduleAccess: null,
    features: [
      {
        navSlug: 'general',
        refSlug: 'general-purchase',
        permissions: [
          { key: 'PURCHASE_GENERAL_PURCHASE_VIEW', label: 'View General Purchase (Parts & Stock)', action: 'view', type: 'custom' },
          { key: 'PURCHASE_GENERAL_PURCHASE_CREATE', label: 'Create General Purchase (Parts & Stock)', action: 'create', type: 'custom' },
          { key: 'PURCHASE_GENERAL_PURCHASE_CANCEL', label: 'Cancel Purchase Entry', action: 'cancel', type: 'custom' },
          { key: 'PURCHASE_GENERAL_PURCHASE_PRINT', label: 'Print Purchase Receipt', action: 'print', type: 'custom' },
          { key: 'PURCHASE_GENERAL_PURCHASE_PAYMENT', label: 'Pay Supplier', action: 'payment', type: 'custom' },
        ],
      },
    ],
  },
]

/** `device-purchase-register` -> `DEVICE_PURCHASE_REGISTER`. */
const upper = (slug) => slug.toUpperCase().replace(/-/g, '_')

const granted = new Set(ref.permissions)
const modules = []
let total = 0

for (const node of ref.menuHierarchy) {
  if (node.type !== 'module') continue
  const featureMap = FEATURE_MAP[node.key]
  if (!featureMap) continue

  const all = node.permissions ?? []
  const moduleAccess = all.find((p) => p.type === 'module')
  if (!moduleAccess) throw new Error(`${node.key} has no module-access permission`)

  // Longest prefix first: `SECOND_HAND_DEVICE_DEVICE_PURCHASE_REGISTER_` also starts with
  // `SECOND_HAND_DEVICE_DEVICE_PURCHASE_`, so a shortest-first match would file every register
  // permission under Device Purchase.
  const features = Object.entries(featureMap)
    .map(([navSlug, refSlug]) => ({
      navSlug,
      refSlug,
      prefix: `${upper(node.key)}_${upper(refSlug)}_`,
    }))
    .sort((a, b) => b.prefix.length - a.prefix.length)

  const claimed = new Set()
  for (const feature of features) {
    feature.permissions = all
      .filter((p) => p.type !== 'module')
      .filter((p) => p.key.startsWith(feature.prefix) && !claimed.has(p.key))
      .map((p) => {
        claimed.add(p.key)
        return { key: p.key, label: p.label, action: p.action, type: p.type }
      })
  }

  const ordered = Object.entries(featureMap).map(([navSlug]) =>
    features.find((f) => f.navSlug === navSlug)
  )

  const kept = ordered.filter((f) => f.permissions.length > 0)
  for (const f of ordered) {
    if (!f.permissions.length) {
      throw new Error(`${node.key}/${f.navSlug} matched no permissions (prefix ${f.prefix})`)
    }
  }

  total += 1 + kept.reduce((n, f) => n + f.permissions.length, 0)
  modules.push({
    sectionKey: node.key,
    label: node.label,
    moduleAccess: {
      key: moduleAccess.key,
      label: moduleAccess.label,
      action: moduleAccess.action,
      type: moduleAccess.type,
    },
    features: kept.map((f) => ({
      navSlug: f.navSlug,
      refSlug: f.refSlug,
      permissions: f.permissions,
    })),
  })
}

// The export's own OWNER grant. If this ever disagrees, either a feature was added to the nav
// without a mapping or the export changed — both worth stopping for.
const keys = modules.flatMap((m) => [
  m.moduleAccess.key,
  ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
])
const missing = [...granted].filter((k) => !keys.includes(k))
const extra = keys.filter((k) => !granted.has(k))
if (missing.length || extra.length) {
  throw new Error(
    `catalogue does not match the export's granted set.\n  missing: ${missing.join(', ')}\n  extra: ${extra.join(', ')}`
  )
}
if (total !== ref.permissions.length) {
  throw new Error(`counted ${total}, export grants ${ref.permissions.length}`)
}

// Now the module the export predates. Appended after the check above rather than folded into
// it, so "the export is reproduced exactly" and "these five were read off a screenshot" stay
// two separate, separately checkable claims.
for (const m of EXTRA_MODULES) {
  if (modules.some((existing) => existing.sectionKey === m.sectionKey)) {
    throw new Error(`${m.sectionKey} is in the export now — remove it from EXTRA_MODULES`)
  }
  if (!FEATURE_MAP[m.sectionKey]) throw new Error(`${m.sectionKey} has no FEATURE_MAP entry`)
  total += (m.moduleAccess ? 1 : 0) + m.features.reduce((n, f) => n + f.permissions.length, 0)
  modules.push(m)
}

// The number on the client's own Role Configure screen. Asserted rather than printed, because
// 185 was also "correct" — against data a version behind the app it came from.
if (total !== 190) throw new Error(`counted ${total} permissions, the reference reads 190`)

const header = `// GENERATED by tools/data/build-permission-catalogue.cjs — do not edit by hand.
//
// Source: data/permotion-sample.json (${total} permissions across ${modules.length} modules and
// ${modules.reduce((n, m) => n + m.features.length, 0)} features).
//
// The keys are the reference system's own — \`SALES_INVOICES_CREATE\`, not \`sales.invoices.create\`
// — because a role's \`actionPermissions\` map is a storage format, and two systems that spell it
// differently cannot read each other's roles.

export type PermissionKind = 'module' | 'crud' | 'custom'

export interface PermissionSpec {
  /** The stored key, e.g. \`SERVICE_JOB_CARDS_ASSIGN\`. */
  key: string
  /** The reference's own wording, e.g. "Assign Job Card". */
  label: string
  /** \`view\`, \`create\`, \`export\`, \`assign\`… — what the permission lets you do. */
  action: string
  kind: PermissionKind
}

export interface PermissionFeatureSpec {
  /** The nav leaf slug this feature is reached through — see \`nav.ts\`. */
  navSlug: string
  /** What the reference calls it, kept so a key can be traced back to the export. */
  refSlug: string
  permissions: PermissionSpec[]
}

export interface PermissionModuleSpec {
  sectionKey: string
  label: string
  /**
   * The module's "access this module" permission, where it has one.
   *
   * Optional because Purchase does not: the reference's Role Configure lists five Purchase
   * permissions and none is "Access Purchase Module", where Sales counts "Access Sales Module"
   * inside its eleven.
   */
  moduleAccess?: PermissionSpec
  features: PermissionFeatureSpec[]
}

export const PERMISSION_CATALOGUE: PermissionModuleSpec[] = ${JSON.stringify(
  modules.map((m) => ({
    sectionKey: m.sectionKey,
    label: m.label,
    moduleAccess: m.moduleAccess
      ? { ...m.moduleAccess, kind: m.moduleAccess.type, type: undefined }
      : undefined,
    features: m.features.map((f) => ({
      navSlug: f.navSlug,
      refSlug: f.refSlug,
      permissions: f.permissions.map((p) => ({
        key: p.key,
        label: p.label,
        action: p.action,
        kind: p.type,
      })),
    })),
  })),
  (k, v) => (v === undefined ? undefined : v),
  2
).replace(/"([A-Za-z]\\w*)":/g, '$1:')}

/** Every permission key in the catalogue. */
export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATALOGUE.flatMap((m) => [
  ...(m.moduleAccess ? [m.moduleAccess.key] : []),
  ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
])

/** The module a permission key belongs to, or undefined for a key that is not in the catalogue. */
export function moduleForPermission(key: string): PermissionModuleSpec | undefined {
  return PERMISSION_CATALOGUE.find(
    (m) =>
      m.moduleAccess?.key === key ||
      m.features.some((f) => f.permissions.some((p) => p.key === key))
  )
}

/** Every key one module contributes, for its "select all" and its count badge. */
export function keysForModule(m: PermissionModuleSpec): string[] {
  return [
    ...(m.moduleAccess ? [m.moduleAccess.key] : []),
    ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
  ]
}
`

fs.writeFileSync(OUT, header)
console.log(`${OUT}: ${total} permissions, ${modules.length} modules, ${modules.reduce((n, m) => n + m.features.length, 0)} features`)
