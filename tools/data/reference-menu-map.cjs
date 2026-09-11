/**
 * This app's nav (section key + leaf slug) against the reference export's feature slug.
 *
 * Shared by `build-permission-catalogue.cjs` and `build-role-seeds.cjs` so the two cannot
 * disagree about which of our menus is which of theirs.
 *
 * Where they differ it is only ever spelling — `options` here is `service-options` there. The two
 * report entries are worth pausing on: the export labels `REPORTS_PROFIT_LOSS_VIEW` as "View
 * Profit & Loss" and `REPORTS_PNL_REPORT_VIEW` as "View Job-wise Profit", which is the opposite of
 * what the key names suggest. The labels win — they are what a person reads.
 */
const FEATURE_MAP = {
  sales: { invoices: 'invoices' },
  purchase: { general: 'general-purchase' },
  service: {
    'job-cards': 'job-cards',
    options: 'service-options',
    costing: 'job-costing',
    items: 'service-items',
  },
  finance: {
    receipts: 'receipts',
    ledger: 'ledger',
    cashbook: 'cashbook',
    receivables: 'receivables',
    payables: 'payables',
    'supplier-payables': 'supplier-payables',
    expenses: 'expenses',
  },
  masters: {
    uom: 'uom',
    'item-categories': 'categories',
    items: 'items',
    'payment-modes': 'payment-modes',
    'party-categories': 'party-categories',
    parties: 'parties',
  },
  'second-hand-device': {
    purchase: 'device-purchase',
    sale: 'device-sale',
    stock: 'device-stock',
    'purchase-register': 'device-purchase-register',
    'sale-register': 'device-sale-register',
  },
  reports: {
    service: 'service-reports',
    pnl: 'profit-loss',
    'job-profit': 'pnl-report',
    supplier: 'supplier-report',
    technician: 'technician-report',
    'period-summary': 'period-summary',
    'field-visits': 'field-visit-report',
  },
  administration: {
    users: 'users',
    roles: 'roles',
    sessions: 'sessions',
    'ip-whitelist': 'ip-whitelist',
    'login-report': 'login-report',
    audit: 'system-audit',
  },
  settings: {
    branches: 'branches',
    workflow: 'workflow-designer',
    company: 'company',
    'financial-years': 'financial-years',
    billing: 'billing',
    'print-formats': 'print-formats',
    whatsapp: 'whatsapp-settings',
    backup: 'backup',
  },
}

module.exports = { FEATURE_MAP }
