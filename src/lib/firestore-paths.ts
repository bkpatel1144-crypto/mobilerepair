/**
 * Every Firestore collection path in the app is built through one of these functions — never
 * a hand-typed template string at the call site. Keeps the tenant-scoping shape
 * (`companies/{companyId}/...`) from BUILD_PLAN.md Phase 2 consistent everywhere, and makes it
 * possible to grep for "every place that touches jobCards" reliably.
 */

export const usersCollection = () => 'users'
export const userDoc = (uid: string) => `users/${uid}`

export const companyDoc = (companyId: string) => `companies/${companyId}`

export const branchesCollection = (companyId: string) => `companies/${companyId}/branches`
export const branchDoc = (companyId: string, branchId: string) =>
  `${branchesCollection(companyId)}/${branchId}`

export const rolesCollection = (companyId: string) => `companies/${companyId}/roles`
export const roleDoc = (companyId: string, roleId: string) =>
  `${rolesCollection(companyId)}/${roleId}`

export const workflowConfigCollection = (companyId: string) =>
  `companies/${companyId}/workflowConfig`
export const workflowConfigDoc = (companyId: string, roleId: string) =>
  `${workflowConfigCollection(companyId)}/${roleId}`

/** Company-wide, not per-role — see `FormSchemaDoc`'s doc comment. `formType` is always
 * `'jobCard'` or `'lead'`, used as the literal doc ID (two fixed docs per company, never more). */
export const formSchemasCollection = (companyId: string) => `companies/${companyId}/formSchemas`
export const formSchemaDoc = (companyId: string, formType: 'jobCard' | 'lead') =>
  `${formSchemasCollection(companyId)}/${formType}`

export const financialYearsCollection = (companyId: string) =>
  `companies/${companyId}/financialYears`
export const financialYearDoc = (companyId: string, fyId: string) =>
  `${financialYearsCollection(companyId)}/${fyId}`

export const partiesCollection = (companyId: string) => `companies/${companyId}/parties`
export const partyDoc = (companyId: string, partyId: string) =>
  `${partiesCollection(companyId)}/${partyId}`

export const partyCategoriesCollection = (companyId: string) =>
  `companies/${companyId}/partyCategories`

export const partyCategoryDoc = (companyId: string, id: string) =>
  `${partyCategoriesCollection(companyId)}/${id}`

export const itemsCollection = (companyId: string) => `companies/${companyId}/items`
export const itemDoc = (companyId: string, itemId: string) => `${itemsCollection(companyId)}/${itemId}`
export const itemCategoriesCollection = (companyId: string) =>
  `companies/${companyId}/itemCategories`
export const itemCategoryDoc = (companyId: string, id: string) =>
  `${itemCategoriesCollection(companyId)}/${id}`
export const uomCollection = (companyId: string) => `companies/${companyId}/uom`
export const uomDoc = (companyId: string, id: string) => `${uomCollection(companyId)}/${id}`
export const paymentModesCollection = (companyId: string) => `companies/${companyId}/paymentModes`
export const paymentModeDoc = (companyId: string, id: string) =>
  `${paymentModesCollection(companyId)}/${id}`

export const serviceOptionsCollection = (
  companyId: string,
  type:
    | 'deviceTypes'
    | 'brands'
    | 'models'
    | 'problems'
    | 'cancelReasons'
    | 'holdReasons'
    | 'outstandingReasons'
    | 'customerItems'
) => `companies/${companyId}/serviceOptions/${type}/items`

export const jobCardsCollection = (companyId: string) => `companies/${companyId}/jobCards`
export const jobCardDoc = (companyId: string, jobId: string) =>
  `${jobCardsCollection(companyId)}/${jobId}`
export const jobTimelineCollection = (companyId: string, jobId: string) =>
  `${jobCardDoc(companyId, jobId)}/timeline`
export const jobTimelineEventDoc = (companyId: string, jobId: string, eventId: string) =>
  `${jobTimelineCollection(companyId, jobId)}/${eventId}`

export const jobCostingCollection = (companyId: string) => `companies/${companyId}/jobCosting`
export const jobCostingDoc = (companyId: string, jobId: string) =>
  `${jobCostingCollection(companyId)}/${jobId}`
export const receiptsCollection = (companyId: string) => `companies/${companyId}/receipts`
export const receiptDoc = (companyId: string, receiptId: string) =>
  `${receiptsCollection(companyId)}/${receiptId}`

export const secondHandPurchasesCollection = (companyId: string) =>
  `companies/${companyId}/secondHandPurchases`
export const secondHandPurchaseDoc = (companyId: string, id: string) =>
  `${secondHandPurchasesCollection(companyId)}/${id}`
export const secondHandSalesCollection = (companyId: string) =>
  `companies/${companyId}/secondHandSales`
export const secondHandSaleDoc = (companyId: string, id: string) =>
  `${secondHandSalesCollection(companyId)}/${id}`

export const auditLogCollection = (companyId: string) => `companies/${companyId}/auditLog`
export const sessionsCollection = (companyId: string) => `companies/${companyId}/sessions`
export const sessionDoc = (companyId: string, id: string) => `${sessionsCollection(companyId)}/${id}`
export const ipWhitelistCollection = (companyId: string) => `companies/${companyId}/ipWhitelist`
export const ipWhitelistDoc = (companyId: string, id: string) => `${ipWhitelistCollection(companyId)}/${id}`
export const printTemplatesCollection = (companyId: string) =>
  `companies/${companyId}/printTemplates`
export const printTemplateDoc = (companyId: string, id: string) =>
  `${printTemplatesCollection(companyId)}/${id}`
export const backupsCollection = (companyId: string) => `companies/${companyId}/backups`
export const backupDoc = (companyId: string, id: string) => `${backupsCollection(companyId)}/${id}`
export const archivesCollection = (companyId: string) => `companies/${companyId}/archives`
export const archiveDoc = (companyId: string, id: string) => `${archivesCollection(companyId)}/${id}`

// Single fixed-id docs — same "one company-wide doc, not a collection" pattern as
// `formSchemaDoc`'s `jobCard`/`lead` — no separate collection helper needed for either.
export const whatsappConfigDoc = (companyId: string) => `companies/${companyId}/whatsappConfig/config`
export const backupSettingsDoc = (companyId: string) => `companies/${companyId}/backupSettings/config`

export const companiesCollection = () => 'companies'

export const countersCollection = (companyId: string) => `companies/${companyId}/counters`
export const counterDoc = (companyId: string, docType: string) =>
  `${countersCollection(companyId)}/${docType}`

export const fieldVisitsCollection = (companyId: string) => `companies/${companyId}/fieldVisits`
export const fieldVisitDoc = (companyId: string, id: string) => `${fieldVisitsCollection(companyId)}/${id}`
