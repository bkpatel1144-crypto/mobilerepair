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

/** `device-purchase-register` -> `DEVICE_PURCHASE_REGISTER`. */
const upper = (slug) => slug.toUpperCase().replace(/-/g, '_')

/**
 * Modules and permissions the client's *menu* export declares but `permotion-sample.json` does
 * not carry — that permission export predates them.
 *
 * Their menu file names one permission per row (`PURCHASE_GENERAL_PURCHASE_VIEW`,
 * `INVENTORY_STOCK_VIEW`, `MASTERS_ATTRIBUTES_VIEW`) and a `*_MODULE_ACCESS` per module. The
 * write permissions below are not in any file: they follow the same naming rule the other 185
 * use, and are here because a master you can only view is not a master. `MASTERS_ATTRIBUTES_*`
 * is the exception — all four appear in `managerpermition.json`, so those are theirs.
 */
const EXTRA_MODULES = [
  {
    sectionKey: 'purchase',
    label: 'Purchase',
    moduleAccess: {
      key: 'PURCHASE_MODULE_ACCESS',
      label: 'Access Purchase Module',
      action: 'access',
      kind: 'module',
    },
    features: [
      {
        navSlug: 'general',
        refSlug: 'general-purchase',
        permissions: [
          { key: 'PURCHASE_GENERAL_PURCHASE_VIEW', label: 'View General Purchase', action: 'view', kind: 'crud' },
          { key: 'PURCHASE_GENERAL_PURCHASE_CREATE', label: 'Create General Purchase', action: 'create', kind: 'crud' },
          { key: 'PURCHASE_GENERAL_PURCHASE_UPDATE', label: 'Update General Purchase', action: 'update', kind: 'crud' },
          { key: 'PURCHASE_GENERAL_PURCHASE_DELETE', label: 'Delete General Purchase', action: 'delete', kind: 'crud' },
        ],
      },
    ],
  },
  {
    sectionKey: 'inventory',
    label: 'Inventory',
    moduleAccess: {
      key: 'INVENTORY_MODULE_ACCESS',
      label: 'Access Inventory Module',
      action: 'access',
      kind: 'module',
    },
    features: [
      {
        navSlug: 'stock',
        refSlug: 'stock',
        permissions: [
          { key: 'INVENTORY_STOCK_VIEW', label: 'View Stock', action: 'view', kind: 'crud' },
          { key: 'INVENTORY_STOCK_EXPORT', label: 'Export Stock', action: 'export', kind: 'custom' },
        ],
      },
    ],
  },
]

/** Attributes belongs to Masters, which the permission export does carry — so it is merged into
 *  that module rather than added as one. All four keys are the client's own, from
 *  `managerpermition.json`. */
const EXTRA_FEATURES = {
  masters: [
    {
      navSlug: 'attributes',
      refSlug: 'attributes',
      permissions: [
        { key: 'MASTERS_ATTRIBUTES_VIEW', label: 'View Attributes', action: 'view', kind: 'crud' },
        { key: 'MASTERS_ATTRIBUTES_CREATE', label: 'Create Attributes', action: 'create', kind: 'crud' },
        { key: 'MASTERS_ATTRIBUTES_UPDATE', label: 'Update Attributes', action: 'update', kind: 'crud' },
        { key: 'MASTERS_ATTRIBUTES_DELETE', label: 'Delete Attributes', action: 'delete', kind: 'crud' },
      ],
    },
  ],
}

const granted = new Set(ref.permissions)
const modules = []
let total = 0

for (const node of ref.menuHierarchy) {
  if (node.type !== 'module') continue
  const featureMap = { ...FEATURE_MAP[node.key] }
  if (!Object.keys(featureMap).length) continue
  // Features declared only by the menu export are added after the hierarchy walk.
  for (const extra of EXTRA_FEATURES[node.key] ?? []) delete featureMap[extra.navSlug]

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

// Features the menu export adds to a module the permission export already has.
for (const [sectionKey, features] of Object.entries(EXTRA_FEATURES)) {
  const module = modules.find((m) => m.sectionKey === sectionKey)
  if (!module) throw new Error(`no module ${sectionKey} to attach extra features to`)
  const order = Object.keys(FEATURE_MAP[sectionKey])
  module.features.push(...features)
  module.features.sort((a, b) => order.indexOf(a.navSlug) - order.indexOf(b.navSlug))
  total += features.reduce((n, f) => n + f.permissions.length, 0)
}

// Whole modules the permission export predates.
for (const extra of EXTRA_MODULES) {
  modules.push(extra)
  total += 1 + extra.features.reduce((n, f) => n + f.permissions.length, 0)
}

// The export's own OWNER grant. If this ever disagrees, either a feature was added to the nav
// without a mapping or the export changed — both worth stopping for.
const keys = modules.flatMap((m) => [
  m.moduleAccess.key,
  ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
])
const declaredElsewhere = new Set([
  ...EXTRA_MODULES.flatMap((m) => [
    m.moduleAccess.key,
    ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
  ]),
  ...Object.values(EXTRA_FEATURES)
    .flat()
    .flatMap((f) => f.permissions.map((p) => p.key)),
])
const missing = [...granted].filter((k) => !keys.includes(k))
const extra = keys.filter((k) => !granted.has(k) && !declaredElsewhere.has(k))
if (missing.length || extra.length) {
  throw new Error(
    'catalogue does not match the export: missing ' +
      (missing.join(', ') || 'none') +
      '; unexpected ' +
      (extra.join(', ') || 'none')
  )
}
if (total !== ref.permissions.length + declaredElsewhere.size) {
  throw new Error(
    'counted ' +
      total +
      ', expected ' +
      ref.permissions.length +
      ' from the permission export plus ' +
      declaredElsewhere.size +
      ' declared only by the menu export'
  )
}

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
  /** Every module has exactly one "access this module" permission. */
  moduleAccess: PermissionSpec
  features: PermissionFeatureSpec[]
}

export const PERMISSION_CATALOGUE: PermissionModuleSpec[] = ${JSON.stringify(
  modules.map((m) => ({
    sectionKey: m.sectionKey,
    label: m.label,
    // `kind` either comes from the hierarchy's `type` or is already set on an EXTRA_* entry.
    moduleAccess: {
      key: m.moduleAccess.key,
      label: m.moduleAccess.label,
      action: m.moduleAccess.action,
      kind: m.moduleAccess.kind ?? m.moduleAccess.type,
    },
    features: m.features.map((f) => ({
      navSlug: f.navSlug,
      refSlug: f.refSlug,
      permissions: f.permissions.map((p) => ({
        key: p.key,
        label: p.label,
        action: p.action,
        kind: p.kind ?? p.type,
      })),
    })),
  })),
  (k, v) => (v === undefined ? undefined : v),
  2
).replace(/"([A-Za-z]\\w*)":/g, '$1:')}

/**
 * Every menu slug this app has, in the reference's own vocabulary — its 8 module slugs plus the
 * 44 feature slugs, 52 in all.
 *
 * Emitted here rather than kept only in \`reference-menu-map.cjs\` so a test can compare it with
 * \`data/menus.json\` without importing an untyped CommonJS module.
 */
export const REFERENCE_MENU_SLUGS: string[] = ${JSON.stringify(
  [
    ...modules.map((m) => m.sectionKey),
    ...modules.flatMap((m) => m.features.map((f) => f.refSlug)),
  ].sort()
)}

/** Every permission key in the catalogue. */
export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATALOGUE.flatMap((m) => [
  m.moduleAccess.key,
  ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
])

/** The module a permission key belongs to, or undefined for a key that is not in the catalogue. */
export function moduleForPermission(key: string): PermissionModuleSpec | undefined {
  return PERMISSION_CATALOGUE.find(
    (m) =>
      m.moduleAccess.key === key ||
      m.features.some((f) => f.permissions.some((p) => p.key === key))
  )
}

/** Every key one module contributes, for its "select all" and its count badge. */
export function keysForModule(m: PermissionModuleSpec): string[] {
  return [m.moduleAccess.key, ...m.features.flatMap((f) => f.permissions.map((p) => p.key))]
}
`

fs.writeFileSync(OUT, header)
console.log(`${OUT}: ${total} permissions, ${modules.length} modules, ${modules.reduce((n, m) => n + m.features.length, 0)} features`)
