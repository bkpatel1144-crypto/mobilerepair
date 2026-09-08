// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { initTestI18n, renderPage, LEAKED_KEY } from '@/test/render-page'

/**
 * Renders every list page in all three languages and fails if a translation key reaches the
 * screen.
 *
 * This is the check nothing else performs. A wrong or unwrapped key compiles, lints and builds
 * cleanly — the only symptom is `pages.masters.uom.unitsOfMeasure` appearing where "Units of
 * Measure" belongs. Rendering just the landing page found two such places after every static
 * check had passed, so the rest of the app gets the same treatment.
 *
 * Firebase is mocked at the module boundary: these pages import it transitively through their
 * hooks, and the point here is the rendered text, not the data.
 */
vi.mock('@/lib/firebase', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
}))

// The Firestore functions the hooks call. Each returns something inert so a hook can run its
// query, fail fast, and let the page render its empty/error state — which is where the labels are.
vi.mock('firebase/firestore', () => {
  const noop = () => ({})
  return {
    collection: noop,
    doc: noop,
    query: noop,
    where: noop,
    orderBy: noop,
    limit: noop,
    getDocs: async () => ({ docs: [], empty: true }),
    getDoc: async () => ({ exists: () => false, data: () => undefined }),
    onSnapshot: () => () => {},
    writeBatch: () => ({ set: noop, update: noop, delete: noop, commit: async () => {} }),
    runTransaction: async () => 1,
    serverTimestamp: noop,
    increment: noop,
    Timestamp: { now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }) },
    initializeFirestore: noop,
    persistentLocalCache: noop,
    persistentMultipleTabManager: noop,
    deleteField: noop,
    arrayUnion: noop,
    arrayRemove: noop,
  }
})

vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: async () => ({}),
  signOut: async () => {},
  createUserWithEmailAndPassword: async () => ({}),
  sendPasswordResetEmail: async () => {},
  updatePassword: async () => {},
  reauthenticateWithCredential: async () => ({}),
  EmailAuthProvider: { credential: () => ({}) },
  updateProfile: async () => {},
}))

vi.mock('firebase/storage', () => ({
  getStorage: () => ({}),
  ref: () => ({}),
  uploadBytes: async () => ({}),
  getDownloadURL: async () => '',
  deleteObject: async () => {},
}))

beforeAll(async () => {
  await initTestI18n('en')
  // jsdom has no matchMedia, which the theme hook reads.
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as never
})

afterEach(() => cleanup())

/** Every list page that renders from hooks alone — no route param, no wizard step. */
const PAGES: [
  name: string,
  load: () => Promise<{ default?: unknown } & Record<string, unknown>>,
][] = [
  ['Dashboard', () => import('./dashboard-page')],
  ['Job Cards', () => import('./service/job-cards-page')],
  ['Job Costing', () => import('./service/job-costing-page')],
  ['Service Items', () => import('./service/service-items-page')],
  ['Service Options', () => import('./service/service-options-page')],
  ['Receipts & Payments', () => import('./finance/receipts-payments-page')],
  ['Party Ledger', () => import('./finance/party-ledger-page')],
  ['Cash Book', () => import('./finance/cash-book-page')],
  ['Receivables', () => import('./finance/receivables-page')],
  ['Payables', () => import('./finance/payables-page')],
  ['Supplier Payables', () => import('./finance/supplier-payables-page')],
  ['Expenses', () => import('./finance/expenses-page')],
  ['UOM', () => import('./masters/uom-page')],
  ['Item Categories', () => import('./masters/item-categories-page')],
  ['Item Master', () => import('./masters/item-master-page')],
  ['Payment Modes', () => import('./masters/payment-modes-page')],
  ['Party Categories', () => import('./masters/party-categories-page')],
  ['Parties', () => import('./masters/parties-page')],
  ['Device Purchase', () => import('./second-hand-device/device-purchase-page')],
  ['Device Sale', () => import('./second-hand-device/device-sale-page')],
  ['Device Stock', () => import('./second-hand-device/device-stock-page')],
  ['Purchase Register', () => import('./second-hand-device/purchase-register-page')],
  ['Sale Register', () => import('./second-hand-device/sale-register-page')],
  ['Service Reports', () => import('./reports/service-reports-page')],
  ['Profit & Loss', () => import('./reports/profit-loss-page')],
  ['Job-wise Profit', () => import('./reports/job-wise-profit-page')],
  ['Supplier Report', () => import('./reports/supplier-report-page')],
  ['Technician Report', () => import('./reports/technician-report-page')],
  ['Period Summary', () => import('./reports/period-summary-page')],
  ['Field Visit Report', () => import('./reports/field-visit-report-page')],
  ['User Management', () => import('./administration/user-management-page')],
  ['Role Management', () => import('./administration/role-management-page')],
  ['Active Sessions', () => import('./administration/active-sessions-page')],
  ['IP Whitelist', () => import('./administration/ip-whitelist-page')],
  ['Login Report', () => import('./administration/login-report-page')],
  ['System Audit', () => import('./administration/system-audit-page')],
  ['Branch Management', () => import('./settings/branch-management-page')],
  ['Company Settings', () => import('./settings/company-settings-page')],
  ['Financial Years', () => import('./settings/financial-years-page')],
  ['Billing', () => import('./settings/billing-page')],
  ['Print Formats', () => import('./settings/print-formats-page')],
  ['WhatsApp', () => import('./settings/whatsapp-page')],
  ['Backup & Restore', () => import('./settings/backup-restore-page')],
  ['Sales Invoices', () => import('../app/sales/sales-invoices-page')],
  // The form pages, which take no route param. These carry the most labels per screen and the
  // most validation copy, so they are the likeliest place for a key to slip through.
  ['Create Job Card', () => import('./service/job-cards/create-job-card-page')],
  ['Create Purchase', () => import('./second-hand-device/create-purchase-page')],
  ['Create User', () => import('./administration/create-user-page')],
  ['Create Role', () => import('./administration/create-role-page')],
  ['Workflow Designer', () => import('./settings/workflow-designer-page')],
]

/** The page component is the module's only exported component. */
function componentOf(mod: Record<string, unknown>): React.ComponentType {
  const found = Object.values(mod).find(
    (v) => typeof v === 'function' && /^[A-Z]/.test((v as { name?: string }).name ?? '')
  )
  if (!found) throw new Error('no component export found')
  return found as React.ComponentType
}

describe.each(['en', 'hi', 'gu'] as const)('pages render in %s', (lng) => {
  it.each(PAGES)(
    '%s leaks no translation key',
    async (_name, load) => {
      await initTestI18n(lng)
      const Page = componentOf(await load())
      const { container } = renderPage(<Page />)
      const text = container.textContent ?? ''
      const leaked = text.match(LEAKED_KEY)
      expect(leaked?.[0] ?? null).toBeNull()
      // Generous, because the first case in the file pays for compiling the chart library and any
      // other heavy import a page pulls in. The assertion itself is instant.
    },
    30_000
  )
})
