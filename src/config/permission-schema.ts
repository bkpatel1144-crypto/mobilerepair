/**
 * Per-module entity/action definitions the Role Configure "Menus & Permissions" tree renders
 * from (BUILD_PLAN.md Phase 3, matching preview (21)/(22): a module's permission count badge
 * is `entities.length * 4 (create/view/update/delete) + specialActions.length` — verified
 * against the reference screenshot's Sales module, which shows exactly 1 entity × 4 CRUD + 7
 * special actions = "⚿ 11/11").
 *
 * This is necessarily some informed modeling ahead of the modules themselves being built
 * (Phase 5+) — entity/action names here are chosen to match what those phases will actually
 * implement, not invented arbitrarily. Phases 5-10 should reuse these exact keys rather than
 * inventing parallel ones when they wire real enforcement.
 */

export type CrudOp = 'create' | 'view' | 'update' | 'delete'
export const CRUD_OPS: CrudOp[] = ['create', 'delete', 'update', 'view']

export interface EntitySpec {
  key: string
  label: string
}

export interface SpecialActionSpec {
  key: string
  label: string
}

export interface ModulePermissionSchema {
  sectionKey: string
  entities: EntitySpec[]
  specialActions: SpecialActionSpec[]
}

export const PERMISSION_SCHEMA: ModulePermissionSchema[] = [
  {
    sectionKey: 'sales',
    entities: [{ key: 'invoices', label: 'Invoices' }],
    specialActions: [
      { key: 'approveInvoice', label: 'Approve Invoice' },
      { key: 'cancelInvoice', label: 'Cancel Invoice' },
      { key: 'emailInvoice', label: 'Email Invoice' },
      { key: 'exportData', label: 'Export Data' },
      { key: 'recordPayment', label: 'Record Payment' },
      { key: 'printInvoice', label: 'Print Invoice' },
      { key: 'accessModule', label: 'Access Sales Module' },
    ],
  },
  {
    sectionKey: 'service',
    entities: [
      { key: 'jobCards', label: 'Job Cards' },
      { key: 'serviceOptions', label: 'Service Options' },
      { key: 'jobCosting', label: 'Job Costing' },
      { key: 'serviceItems', label: 'Service Items' },
    ],
    specialActions: [
      { key: 'printJobCard', label: 'Print Job Card' },
      { key: 'printBill', label: 'Print Bill' },
      { key: 'printLabel', label: 'Print Label' },
      { key: 'exportData', label: 'Export Data' },
      { key: 'accessModule', label: 'Access Service Module' },
    ],
  },
  {
    sectionKey: 'finance',
    entities: [
      { key: 'receipts', label: 'Receipts & Payments' },
      { key: 'partyLedger', label: 'Party Ledger' },
      { key: 'cashBook', label: 'Cash Book' },
      { key: 'receivables', label: 'Receivables' },
      { key: 'payables', label: 'Payables' },
    ],
    specialActions: [
      { key: 'voidReceipt', label: 'Void Receipt' },
      { key: 'exportData', label: 'Export Data' },
      { key: 'accessModule', label: 'Access Finance Module' },
    ],
  },
  {
    sectionKey: 'masters',
    entities: [
      { key: 'uom', label: 'Units of Measure' },
      { key: 'itemCategories', label: 'Item Categories' },
      { key: 'items', label: 'Item Master' },
      { key: 'paymentModes', label: 'Payment Modes' },
      { key: 'partyCategories', label: 'Party Categories' },
      { key: 'parties', label: 'Parties' },
    ],
    specialActions: [
      { key: 'exportData', label: 'Export Data' },
      { key: 'accessModule', label: 'Access Masters Module' },
    ],
  },
  {
    sectionKey: 'second-hand-device',
    entities: [
      { key: 'purchases', label: 'Device Purchase' },
      { key: 'sales', label: 'Device Sale' },
      { key: 'stock', label: 'Device Stock' },
    ],
    specialActions: [
      { key: 'sendToRefurb', label: 'Send to Refurb' },
      { key: 'returnToSeller', label: 'Return to Seller' },
      { key: 'printReceipt', label: 'Print Receipt' },
      { key: 'printLabel', label: 'Print Label' },
      { key: 'exportData', label: 'Export Data' },
      { key: 'accessModule', label: 'Access Second Hand Device Module' },
    ],
  },
  {
    sectionKey: 'reports',
    entities: [
      { key: 'serviceReports', label: 'Service Reports' },
      { key: 'jobWiseProfit', label: 'Job-wise Profit' },
      { key: 'supplierReport', label: 'Supplier Report' },
      { key: 'technicianReport', label: 'Technician Report' },
      { key: 'periodSummary', label: 'Period Summary' },
      { key: 'fieldVisitReport', label: 'Field Visit Report' },
    ],
    specialActions: [
      { key: 'exportData', label: 'Export Data' },
      { key: 'accessModule', label: 'Access Reports Module' },
    ],
  },
  {
    sectionKey: 'administration',
    entities: [
      { key: 'users', label: 'Users' },
      { key: 'roles', label: 'Roles' },
      { key: 'ipWhitelist', label: 'IP Whitelist' },
    ],
    specialActions: [
      { key: 'viewSessions', label: 'View Active Sessions' },
      { key: 'viewLoginReport', label: 'View Login Report' },
      { key: 'viewAuditLog', label: 'View System Audit' },
      { key: 'exportData', label: 'Export Data' },
      { key: 'accessModule', label: 'Access Administration Module' },
    ],
  },
  {
    sectionKey: 'settings',
    entities: [
      { key: 'branches', label: 'Branches' },
      { key: 'financialYears', label: 'Financial Years' },
      { key: 'printFormats', label: 'Print Formats' },
      { key: 'company', label: 'Company' },
    ],
    specialActions: [
      { key: 'configureWorkflow', label: 'Configure Workflow Designer' },
      { key: 'manageBackup', label: 'Manage Backup & Restore' },
      { key: 'manageWhatsapp', label: 'Manage WhatsApp Templates' },
      { key: 'accessModule', label: 'Access Settings Module' },
    ],
  },
]

export function schemaForSection(sectionKey: string): ModulePermissionSchema | undefined {
  return PERMISSION_SCHEMA.find((m) => m.sectionKey === sectionKey)
}

/** The `actionPermissions` key for one entity's CRUD op — e.g. `"sales.invoices.create"`. */
export function crudKey(sectionKey: string, entityKey: string, op: CrudOp) {
  return `${sectionKey}.${entityKey}.${op}`
}

/** The `actionPermissions` key for a module-level special action — e.g. `"sales.approveInvoice"`. */
export function specialActionKey(sectionKey: string, actionKey: string) {
  return `${sectionKey}.${actionKey}`
}

/** Every `actionPermissions` key a module contributes (used for counting + "Select All"/"Clear"). */
export function allKeysForModule(schema: ModulePermissionSchema): string[] {
  const crud = schema.entities.flatMap((e) =>
    CRUD_OPS.map((op) => crudKey(schema.sectionKey, e.key, op))
  )
  const special = schema.specialActions.map((a) => specialActionKey(schema.sectionKey, a.key))
  return [...crud, ...special]
}

export function totalPermissionCount(schema: ModulePermissionSchema): number {
  return schema.entities.length * CRUD_OPS.length + schema.specialActions.length
}
