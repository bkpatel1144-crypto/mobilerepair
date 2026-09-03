import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Landmark,
  Database,
  Smartphone,
  BarChart3,
  ShieldCheck,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react'

/**
 * Single source of truth for the sidebar, the /app/* route tree, and breadcrumbs — this is
 * intentionally the *only* place the nav structure is declared (BUILD_PLAN.md's "no scattered
 * per-page logic" rule). Every page in Phases 5–10 gets its route generated from this file;
 * only the `element` a route renders changes as each module gets built for real.
 *
 * Structure mirrors SCREENS_NOTES.md exactly: section order, sub-item order, and which entries
 * are locked (🔒 "not available yet" nav items, e.g. Supplier Payables) are all taken directly
 * from the reference screenshots — do not reorder or rename without checking there first.
 */

export interface NavLeaf {
  label: string
  slug: string
  /** Rendered as a disabled, lock-icon nav item — matches the reference app's own convention
   * for gated features (e.g. Supplier Payables, Expenses, Profit & Loss). */
  locked?: boolean
  /** Which BUILD_PLAN.md phase builds this screen for real — shown on its placeholder page
   * until then. Falls back to the section's `phase` when omitted. */
  phase?: string
}

export interface NavSection {
  key: string
  label: string
  icon: LucideIcon
  /** Default phase label for this section's children — overridable per-leaf. */
  phase: string
  children: NavLeaf[]
}

export const DASHBOARD_NAV = { label: 'Dashboard', slug: 'dashboard', icon: LayoutDashboard }

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    phase: 'Phase 5 — Service module',
    children: [{ label: 'Sales Invoices', slug: 'invoices' }],
  },
  {
    key: 'service',
    label: 'Service',
    icon: Wrench,
    phase: 'Phase 5 — Service module',
    children: [
      { label: 'Job Cards', slug: 'job-cards' },
      { label: 'Service Options', slug: 'options' },
      { label: 'Job Costing', slug: 'costing' },
      { label: 'Service Items', slug: 'items' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Landmark,
    phase: 'Phase 6 — Finance module',
    children: [
      { label: 'Receipts & Payments', slug: 'receipts' },
      { label: 'Party Ledger', slug: 'ledger' },
      { label: 'Cash Book', slug: 'cashbook' },
      { label: 'Receivables', slug: 'receivables' },
      { label: 'Payables', slug: 'payables' },
      { label: 'Supplier Payables', slug: 'supplier-payables', locked: true },
      { label: 'Expenses', slug: 'expenses', locked: true },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    icon: Database,
    phase: 'Phase 7 — Masters & Second Hand Device',
    children: [
      { label: 'Units of Measure', slug: 'uom' },
      { label: 'Item Categories', slug: 'item-categories' },
      { label: 'Item Master', slug: 'items' },
      { label: 'Payment Modes', slug: 'payment-modes' },
      { label: 'Party Categories', slug: 'party-categories' },
      { label: 'Parties', slug: 'parties' },
    ],
  },
  {
    key: 'second-hand-device',
    label: 'Second Hand Device',
    icon: Smartphone,
    phase: 'Phase 7 — Masters & Second Hand Device',
    children: [
      { label: 'Device Purchase', slug: 'purchase' },
      { label: 'Device Sale', slug: 'sale' },
      { label: 'Device Stock', slug: 'stock' },
      { label: 'Purchase Register', slug: 'purchase-register' },
      { label: 'Sale Register', slug: 'sale-register' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
    phase: 'Phase 9 — Reports',
    children: [
      { label: 'Service Reports', slug: 'service' },
      { label: 'Profit & Loss', slug: 'pnl', locked: true },
      { label: 'Job-wise Profit', slug: 'job-profit' },
      { label: 'Supplier Report', slug: 'supplier' },
      { label: 'Technician Report', slug: 'technician' },
      { label: 'Period Summary', slug: 'period-summary' },
      { label: 'Field Visit Report', slug: 'field-visits' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: ShieldCheck,
    phase: 'Phase 8 — Administration deep dive',
    children: [
      { label: 'User Management', slug: 'users', phase: 'Phase 3 — RBAC engine' },
      { label: 'Role Management', slug: 'roles', phase: 'Phase 3 — RBAC engine' },
      { label: 'Active Sessions', slug: 'sessions' },
      { label: 'IP Whitelist', slug: 'ip-whitelist' },
      { label: 'Login Report', slug: 'login-report' },
      { label: 'System Audit', slug: 'audit' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    phase: 'Phase 10 — Remaining Settings',
    children: [
      { label: 'Branch Management', slug: 'branches' },
      { label: 'Workflow Designer', slug: 'workflow', phase: 'Phase 4 — Workflow Designer' },
      { label: 'Company Settings', slug: 'company' },
      { label: 'Financial Years', slug: 'financial-years' },
      { label: 'Billing & Subscription', slug: 'billing' },
      { label: 'Print Formats', slug: 'print-formats' },
      { label: 'WhatsApp', slug: 'whatsapp' },
      { label: 'Backup & Restore', slug: 'backup' },
    ],
  },
]

export function buildPath(sectionKey: string, slug: string) {
  return `/app/${sectionKey}/${slug}`
}

/** The `menuPermissions` storage key for a leaf — deliberately decoupled from the route path
 * (`buildPath`) so renaming a URL slug later doesn't silently orphan every role's stored
 * permissions. `"dashboard"` for the dashboard itself, `"<section>/<slug>"` otherwise. */
export function menuKey(sectionKey: string, slug: string) {
  return `${sectionKey}/${slug}`
}

export const DASHBOARD_MENU_KEY = 'dashboard'

/** Turns a raw URL segment into a readable breadcrumb crumb when a page hasn't set its own
 * (`useBreadcrumbExtra`) — "create" → "Create". A segment that looks like an opaque Firestore
 * auto-id (or any other long id-shaped token) is dropped rather than shown raw, since a raw doc
 * id in a breadcrumb reads as broken, not helpful. */
function humanizeSegment(segment: string): string | null {
  if (/^[a-zA-Z0-9]{15,}$/.test(segment)) return null
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Looks up { section, leaf, extraCrumbs } for a given pathname, so the top bar can render an
 * accurate "Dashboard > Section > Page [> ...]" breadcrumb without every page having to declare
 * the section/leaf part of its own. Matches nested routes too (e.g. `.../job-cards/create` or
 * `.../roles/:id/configure`) by falling back to a prefix match against the leaf's own path —
 * an exact-only match previously left every such sub-route showing just "Dashboard", since
 * `/app/service/job-cards/create` never equals `/app/service/job-cards`. */
export function findNavEntry(pathname: string) {
  if (pathname === '/app/dashboard') {
    return { section: null, leaf: DASHBOARD_NAV, extraCrumbs: [] as string[] }
  }
  for (const section of NAV_SECTIONS) {
    for (const leaf of section.children) {
      const leafPath = buildPath(section.key, leaf.slug)
      if (pathname === leafPath) {
        return { section, leaf, extraCrumbs: [] as string[] }
      }
      if (pathname.startsWith(`${leafPath}/`)) {
        const extraCrumbs = pathname
          .slice(leafPath.length + 1)
          .split('/')
          .filter(Boolean)
          .map(humanizeSegment)
          .filter((c): c is string => c !== null)
        return { section, leaf, extraCrumbs }
      }
    }
  }
  return null
}
