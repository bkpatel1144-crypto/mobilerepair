import {
  branchesCollection,
  financialYearsCollection,
  rolesCollection,
  workflowConfigCollection,
  formSchemasCollection,
  partiesCollection,
  partyCategoriesCollection,
  itemsCollection,
  itemCategoriesCollection,
  uomCollection,
  paymentModesCollection,
  jobCardsCollection,
  jobCostingCollection,
  receiptsCollection,
  secondHandPurchasesCollection,
  secondHandSalesCollection,
  printTemplatesCollection,
  fieldVisitsCollection,
  ipWhitelistCollection,
} from '@/lib/firestore-paths'

/**
 * Every per-company "data" collection a backup/restore walks — deliberately excludes
 * `auditLog`/`sessions` (operational trails, not business data worth restoring — restoring old
 * sessions/audit rows over live ones would be actively misleading) and `backups`/`archives`
 * themselves (backing up backup metadata would grow unboundedly). `users` is handled separately
 * in `src/lib/backup.ts` (it's a top-level collection filtered by `companyId`, not nested under
 * `companies/{companyId}`); `serviceOptions` is handled separately too (8 named sub-collections,
 * not one path). `jobCards` gets its own `timeline` subcollection folded in per-document at
 * backup/restore time rather than listed here as a flat collection.
 */
export const BACKUP_COLLECTIONS: { key: string; label: string; path: (companyId: string) => string }[] = [
  { key: 'branches', label: 'Branches', path: branchesCollection },
  { key: 'financialYears', label: 'Financial Years', path: financialYearsCollection },
  { key: 'roles', label: 'Roles', path: rolesCollection },
  { key: 'workflowConfig', label: 'Workflow Config', path: workflowConfigCollection },
  { key: 'formSchemas', label: 'Form Schemas', path: formSchemasCollection },
  { key: 'parties', label: 'Parties', path: partiesCollection },
  { key: 'partyCategories', label: 'Party Categories', path: partyCategoriesCollection },
  { key: 'items', label: 'Items', path: itemsCollection },
  { key: 'itemCategories', label: 'Item Categories', path: itemCategoriesCollection },
  { key: 'uom', label: 'Units of Measure', path: uomCollection },
  { key: 'paymentModes', label: 'Payment Modes', path: paymentModesCollection },
  { key: 'jobCards', label: 'Job Cards', path: jobCardsCollection },
  { key: 'jobCosting', label: 'Job Costing', path: jobCostingCollection },
  { key: 'receipts', label: 'Receipts & Payments', path: receiptsCollection },
  { key: 'secondHandPurchases', label: 'Second Hand Purchases', path: secondHandPurchasesCollection },
  { key: 'secondHandSales', label: 'Second Hand Sales', path: secondHandSalesCollection },
  { key: 'printTemplates', label: 'Print Templates', path: printTemplatesCollection },
  { key: 'fieldVisits', label: 'Field Visits', path: fieldVisitsCollection },
  { key: 'ipWhitelist', label: 'IP Whitelist', path: ipWhitelistCollection },
]

/** The 8 `serviceOptions/{type}/items` sub-collections — same fixed list `use-service-options.ts`
 * already iterates for the Service Options page itself. */
export const SERVICE_OPTION_TYPES = [
  'deviceTypes',
  'brands',
  'models',
  'problems',
  'cancelReasons',
  'holdReasons',
  'outstandingReasons',
  'customerItems',
] as const
