import { PERMISSION_CATALOGUE } from '@/config/permission-catalogue'

/**
 * Reads a role's `actionPermissions` map whichever spelling it was written in.
 *
 * Every role document already in production was written with the old key format —
 * `sales.invoices.create`, `finance.voidReceipt` — because that is what this app's hand-modelled
 * catalogue produced. Switching to the reference's `SALES_INVOICES_CREATE` without this would
 * make every one of those keys unrecognised, and `canDo` would answer false for all of them: a
 * Manager who could raise an invoice yesterday could not today. `actionPermissions` is a
 * `Record<string, boolean>`, so nothing would have reported it.
 *
 * There is no server and no Admin SDK here, so the documents cannot be migrated in place. They
 * are translated on read instead, and rewritten in the new format the next time someone saves
 * the role — at which point the old keys simply stop being consulted.
 *
 * The mapping is deliberately one-directional and lossy in one place: the old catalogue had a
 * single module-wide `exportData` action where the reference has a per-feature `..._EXPORT`. An
 * old role that could export anything in a module is granted every export in it, which is what
 * that flag meant.
 */

/** `sales` -> `SALES`, and the one module whose access key does not follow from its name. */
const MODULE_ACCESS_BY_SECTION = new Map(
  // Purchase is absent rather than mapped to a placeholder: the reference gives it no
  // module-access permission, and inventing one would be a key no reference role could hold.
  PERMISSION_CATALOGUE.flatMap((m) =>
    m.moduleAccess ? [[m.sectionKey, m.moduleAccess.key] as const] : []
  )
)

/** Old `{section}.{entity}.{op}` -> new key, built from the catalogue so it cannot drift. */
function buildCrudMap(): Map<string, string> {
  const map = new Map<string, string>()
  // The old catalogue's entity keys against the nav slug the new one is keyed by. Only the ones
  // that were spelled differently need an entry; the rest match on their own.
  const ENTITY_TO_NAV: Record<string, string> = {
    jobCards: 'job-cards',
    serviceOptions: 'options',
    jobCosting: 'costing',
    serviceItems: 'items',
    partyLedger: 'ledger',
    cashBook: 'cashbook',
    supplierPayables: 'supplier-payables',
    itemCategories: 'item-categories',
    paymentModes: 'payment-modes',
    partyCategories: 'party-categories',
    purchases: 'purchase',
    sales: 'sale',
    stock: 'stock',
    serviceReports: 'service',
    profitLoss: 'pnl',
    jobWiseProfit: 'job-profit',
    supplierReport: 'supplier',
    technicianReport: 'technician',
    periodSummary: 'period-summary',
    fieldVisitReport: 'field-visits',
    ipWhitelist: 'ip-whitelist',
    financialYears: 'financial-years',
    printFormats: 'print-formats',
  }

  for (const module of PERMISSION_CATALOGUE) {
    for (const feature of module.features) {
      const entity =
        Object.entries(ENTITY_TO_NAV).find(([, nav]) => nav === feature.navSlug)?.[0] ??
        feature.navSlug
      for (const op of ['create', 'view', 'update', 'delete'] as const) {
        const target = feature.permissions.find((p) => p.action === op)
        if (!target) continue
        map.set(`${module.sectionKey}.${entity}.${op}`, target.key)
      }
    }
  }
  return map
}

const CRUD_MAP = buildCrudMap()

/**
 * The old module-wide special actions, against the new keys they correspond to.
 *
 * One old key can map to several new ones — `service.printJobCard` and the reference's separate
 * print-receipt and print-label permissions, or an `exportData` that covered a whole module.
 */
const SPECIAL_MAP: Record<string, string[]> = {
  'sales.approveInvoice': ['SALES_INVOICES_APPROVE'],
  'sales.cancelInvoice': ['SALES_INVOICES_CANCEL'],
  'sales.emailInvoice': ['SALES_INVOICES_EMAIL'],
  'sales.recordPayment': ['SALES_INVOICES_PAYMENT'],
  'sales.printInvoice': ['SALES_INVOICES_PRINT'],
  'sales.exportData': ['SALES_INVOICES_EXPORT'],

  'service.printJobCard': ['SERVICE_JOB_CARDS_PRINT_RECEIPT'],
  'service.printBill': ['SERVICE_JOB_CARDS_INVOICE'],
  'service.printLabel': ['SERVICE_JOB_CARDS_PRINT_LABEL'],
  'service.exportData': [],

  'finance.voidReceipt': ['FINANCE_RECEIPTS_VOID'],
  'finance.exportData': [
    'FINANCE_CASHBOOK_EXPORT',
    'FINANCE_LEDGER_EXPORT',
    'FINANCE_PAYABLES_EXPORT',
    'FINANCE_RECEIVABLES_EXPORT',
    'FINANCE_SUPPLIER_PAYABLES_EXPORT',
  ],

  'masters.exportData': ['MASTERS_ITEMS_EXPORT'],

  'second-hand-device.sendToRefurb': [],
  'second-hand-device.returnToSeller': ['SECOND_HAND_DEVICE_DEVICE_PURCHASE_CANCEL'],
  'second-hand-device.printReceipt': ['SECOND_HAND_DEVICE_DEVICE_PURCHASE_PRINT'],
  'second-hand-device.printLabel': ['SECOND_HAND_DEVICE_DEVICE_SALE_PRINT'],
  'second-hand-device.exportData': [
    'SECOND_HAND_DEVICE_DEVICE_PURCHASE_EXPORT',
    'SECOND_HAND_DEVICE_DEVICE_SALE_EXPORT',
    'SECOND_HAND_DEVICE_DEVICE_STOCK_EXPORT',
    'SECOND_HAND_DEVICE_DEVICE_PURCHASE_REGISTER_EXPORT',
    'SECOND_HAND_DEVICE_DEVICE_SALE_REGISTER_EXPORT',
  ],

  'reports.exportData': [
    'REPORTS_PROFIT_LOSS_EXPORT',
    'REPORTS_PNL_REPORT_EXPORT',
    'REPORTS_SUPPLIER_REPORT_EXPORT',
    'REPORTS_TECHNICIAN_REPORT_EXPORT',
    'REPORTS_PERIOD_SUMMARY_EXPORT',
    'REPORTS_FIELD_VISIT_REPORT_EXPORT',
  ],

  'administration.viewSessions': ['ADMINISTRATION_SESSIONS_VIEW'],
  'administration.viewLoginReport': ['ADMINISTRATION_LOGIN_REPORT_VIEW'],
  'administration.viewAuditLog': ['ADMINISTRATION_SYSTEM_AUDIT_VIEW'],
  'administration.exportData': [
    'ADMINISTRATION_LOGIN_REPORT_EXPORT',
    'ADMINISTRATION_SYSTEM_AUDIT_EXPORT',
  ],

  'settings.configureWorkflow': ['SETTINGS_WORKFLOW_DESIGNER_MANAGE'],
  'settings.manageBackup': ['SETTINGS_BACKUP_BACKUP', 'SETTINGS_BACKUP_RESTORE'],
  'settings.manageWhatsapp': ['SETTINGS_WHATSAPP_SETTINGS_UPDATE'],
}

/**
 * Expands a role's stored `actionPermissions` into the current key format.
 *
 * A map already in the new format passes through untouched, so this costs nothing once a role has
 * been re-saved. Keys the mapping does not recognise are dropped rather than kept: an
 * unrecognised key can only be one this app no longer has a permission for.
 */
export function normalizeActionPermissions(
  stored: Record<string, boolean> | undefined | null
): Record<string, boolean> {
  if (!stored) return {}
  const out: Record<string, boolean> = {}
  for (const [key, granted] of Object.entries(stored)) {
    if (!granted) continue
    // Already current.
    if (key === key.toUpperCase()) {
      out[key] = true
      continue
    }
    const crud = CRUD_MAP.get(key)
    if (crud) {
      out[crud] = true
      continue
    }
    for (const mapped of SPECIAL_MAP[key] ?? []) out[mapped] = true
    // An old `{section}.accessModule` becomes the module's access permission.
    if (key.endsWith('.accessModule')) {
      const access = MODULE_ACCESS_BY_SECTION.get(key.slice(0, -'.accessModule'.length))
      if (access) out[access] = true
    }
  }
  return out
}

/** Is this an old-format map that would benefit from being re-saved? */
export function isLegacyPermissionMap(stored: Record<string, boolean> | undefined | null) {
  if (!stored) return false
  return Object.keys(stored).some((k) => k !== k.toUpperCase())
}
