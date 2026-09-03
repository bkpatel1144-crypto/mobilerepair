import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore document shapes — the concrete implementation of the collection list in
 * BUILD_PLAN.md Phase 2. Only the collections Phase 2 actually creates are fully typed here;
 * later phases add the rest (jobCards, receipts, parties, etc.) to this same file as they're
 * built, rather than scattering entity types across feature folders.
 */

export type RoleCode =
  'OWNER' | 'MANAGER' | 'SALESMAN' | 'TECHNICIAN' | 'ACCOUNTANT' | (string & {})
export type RoleType = 'owner' | 'custom'
export type EntityStatus = 'active' | 'disabled' | 'deleted'

export interface CompanyDoc {
  name: string
  code: string
  legalName: string
  gstRegistration: 'Regular' | 'Composition' | 'Unregistered'
  gstin: string | null
  pan: string | null
  email: string
  phone: string
  currency: string // e.g. "INR"
  timezone: string // e.g. "Asia/Kolkata"
  protected: boolean // the default company created at signup — cannot be disabled/deleted
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface BranchDoc {
  name: string
  code: string
  type: 'system' | 'custom'
  protected: boolean // true for the seeded "Main Branch" — cannot be deleted
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FinancialYearDoc {
  name: string // e.g. "FY 2026-27"
  startDate: Timestamp
  endDate: Timestamp
  isActive: boolean
  isLocked: boolean
  isCurrent: boolean // the one auto-seeded / auto-advanced FY, shown with a star badge
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Per-leaf menu visibility, keyed by `src/config/nav.ts`'s `menuKey()` (e.g. `"sales/invoices"`,
 * or the literal `"dashboard"`). A section with none of its leaves granted simply never shows
 * up in the sidebar — there's no separate standalone "module visible" flag to keep in sync. */
export type MenuPermissions = Record<string, boolean>

/** Per-entity/action grants — see `src/config/permission-schema.ts`'s `crudKey()` (e.g.
 * `"sales.invoices.create"`) and `specialActionKey()` (e.g. `"sales.approveInvoice"`). */
export type ActionPermissions = Record<string, boolean>

export interface RoleDashboardConfig {
  /** Where this role lands after login — a value from `src/config/nav.ts` (`"dashboard"` or a
   * `menuKey()`-shaped leaf key the role can also `canView`). */
  defaultLandingRoute: string
  /** Which Dashboard stat tiles/charts this role sees — keyed by `src/config/dashboard-widgets.ts`. */
  visibleWidgets: Record<string, boolean>
}

export interface RoleDoc {
  name: string
  code: RoleCode
  type: RoleType
  protected: boolean // true only for the Owner role — can't be edited except by another Owner
  status: EntityStatus
  /** When true, every menu and action is granted regardless of the maps below — this is the
   * "Grant Full Access" toggle observed throughout the reference app. Turning it off doesn't
   * clear the underlying maps, it just starts enforcing them again. */
  fullAccess: boolean
  menuPermissions: MenuPermissions
  actionPermissions: ActionPermissions
  dashboardConfig: RoleDashboardConfig
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserDoc {
  companyId: string
  branchId: string
  roleId: string
  /** Denormalized so the top bar / any list can render the role without a second read. Kept in
   * sync whenever the role is renamed (Phase 3). */
  roleName: string
  roleCode: RoleCode
  fullName: string
  email: string
  mobile: string | null
  protected: boolean // true for the signing-up Owner — cannot be deleted
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** One role's full Workflow Designer configuration — `src/config/workflow-statuses-actions.ts`
 * for the fixed status/action key sets this references. Phase 5's Job Cards module is the
 * actual consumer: every status-transition button gates on `statusActionMatrix`, the list's
 * default filtering on `jobAccess`/`statusFilter`, and so on — this doc only *stores* the
 * configuration, Phase 4 doesn't enforce any of it itself. */
export interface WorkflowConfigDoc {
  roleId: string
  roleName: string
  /** The top-right "Active" toggle — an inactive config is kept (not deleted) but Phase 5
   * should treat the role as if it had never been configured (falls back to whatever the
   * "unconfigured role" default behavior is) while off. */
  active: boolean
  jobAccess: 'all' | 'assigneeOpen' | 'assignedOnly'
  /** Subset of `JOB_STATUSES` keys this role's Job Cards list shows at all. */
  statusFilter: string[]
  /** `matrix[statusKey][actionKey]` — can this role perform this action while a job sits in
   * this status. */
  statusActionMatrix: Record<string, Record<string, boolean>>
  assignment: {
    assignToRoles: 'all' | string[]
    handoverRoles: 'all' | string[]
    defaultHandover: string | null
  }
  whoDidIt: {
    receivedBy: boolean
    deliveredBy: boolean
    cancelledBy: boolean
    returnedBy: boolean
    fieldVisitTechnician: boolean
    fieldVisitTechnicianRoles: 'all' | string[]
  }
  behavior: {
    collectPaymentWithGenerateBill: boolean
    printPromptAfterJobCardCreation: boolean
    requireDescriptionOnJobDone: boolean
    canViewPricesAndPaymentData: boolean
    allowUndoLastAction: boolean
    autoOpenPopups: {
      afterJobDone: { openGenerateBill: boolean; openHandover: boolean }
      afterGenerateBill: { openHandover: boolean }
      afterReceivePayment: { openHandover: boolean }
    }
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** One field's configuration within a `FormSchemaDoc` — never stored for a
 * `structurallyLocked` field (see `job-card-form-fields.ts`/`lead-form-fields.ts`), since those
 * can't be reconfigured at all. */
export interface FormFieldConfig {
  visible: boolean
  required: boolean
  /** The per-field "🔒" icon in the builder — distinct from `structurallyLocked`. Marks a field
   * read-only once it has a value, rather than hidden or optional. */
  locked: boolean
  /** The "📱" icon — field only appears in the mobile-optimized layout. */
  deviceOnly: boolean
}

export type FormLayout = 'standard' | 'compact' | 'twoColumn' | 'largeDesktop' | 'auto'

/** `formSchemas/jobCard` and `formSchemas/lead` — company-wide (not per-role, despite
 * `workflowConfig` being per-role — see PROGRESS.md Phase 4 for why the reference app's own
 * screenshots show these as global tabs, not nested under a selected role). Phase 5's real
 * Create Job Card form (and, later, a Lead form) renders directly from whichever of these two
 * docs applies — never a second hardcoded copy of the same field list. */
export interface FormSchemaDoc {
  layout: FormLayout
  templateName: string | null
  /** Which section headers are expanded in the *builder's own editing view* — purely a builder
   * UI convenience, not a master visibility switch (confirmed against `preview (10)`: the
   * Accessories section shows unchecked while its fields remain visible in the live-preview
   * pane below, each still governed by its own field-level `visible` flag). */
  expandedSections: Record<string, boolean>
  /** Keyed by field `key` — only ever contains entries for non-`structurallyLocked` fields. */
  fields: Record<string, FormFieldConfig>
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================================
// Phase 5 — Service module. Job Cards need a customer to attach to and a catalog to pick parts/
// service items from — both are properly "Masters" (Phase 7) concerns, but Phase 5 comes first
// in BUILD_PLAN.md's own ordering. `PartyDoc`/`ItemDoc` below are the minimal shape Job Cards
// need today; Phase 7 is expected to *extend* these (categories, ledger, purchase price, etc.),
// not replace them — every field here is one Phase 7's fuller Party/Item Master pages will
// still recognize. See PROGRESS.md Phase 5 for the full reasoning.
// ============================================================================================

/** `partyTypes` replaces the original single `type` field as of Phase 7 — `preview (52)`'s own
 * "Create Party" modal shows Customer/Supplier as independent checkboxes ("Both" is a real,
 * separately-filterable option in `preview (51)`'s own filter pills), not a mutually-exclusive
 * radio. `type` is kept, derived (`'customer'` unless `partyTypes` is supplier-only), purely so
 * every Phase 5/6 call site that reads `party.type` (job-card customer search, receipt party
 * search) keeps working unchanged — never written to directly by Phase 7 code. */
export interface PartyDoc {
  partyNumber: string // "PTY-2026-27-00001"
  name: string
  mobile: string
  /** @deprecated derived from `partyTypes` for Phase 5/6 backward-compatibility — see doc comment above. */
  type: 'customer' | 'supplier'
  partyTypes: ('customer' | 'supplier')[]
  categoryId: string | null
  categoryName: string | null
  email: string | null
  address: string | null
  gstNumber: string | null
  panNumber: string | null
  area: string | null
  village: string | null
  taluka: string | null
  district: string | null
  pincode: string | null
  creditLimit: number
  creditDays: number
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ItemType = 'service' | 'part' | 'product'
export type ItemNature = 'Service' | 'Goods'

export interface ItemDoc {
  itemCode: string // "SRV009" / "PRT001" — see `nextItemCode()` in `use-items.ts`
  name: string
  type: ItemType
  nature: ItemNature
  categoryId: string | null
  categoryName: string | null
  uom: string // "nos", matches the reference app's default
  gstPercent: number
  cgstPercent: number
  sgstPercent: number
  sellingPrice: number | null
  purchasePrice: number | null
  mrp: number | null
  stockTracked: boolean
  enabledInSales: boolean
  enabledInPurchase: boolean
  enabledInProduction: boolean
  enabledInServicePos: boolean
  description: string | null
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/serviceOptions/{optionType}/items/{id}` — the 8 accordion sections
 * on the Service Options page all share this one shape. `deviceTypeIds` (brands only) holds
 * more than one id while a brand is *shared* across device types; "Split shared brands" forks
 * a shared brand into one independent single-`deviceTypeIds`-entry row per device type it was
 * shared with. `brandId` (models only) scopes a model to its one owning brand. */
export interface ServiceOptionDoc {
  label: string
  order: number
  deviceTypeIds?: string[]
  brandId?: string
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PartUsed {
  id: string
  itemId: string
  itemName: string
  rate: number
  qty: number
}

export interface JobNote {
  id: string
  text: string
  userId: string
  userName: string
  createdAt: Timestamp
}

/** `companies/{companyId}/jobCards/{jobId}`. Every field a real Job Card actually needs to
 * function end-to-end — intake, assignment, payment, parts, delivery, cancellation — matching
 * `preview (69)`'s table columns and `preview (71)`/`(72)`'s detail panels exactly. Rendered
 * *from* `formSchemas/jobCard` (Phase 4) at creation time, not a second hardcoded field list. */
export interface JobCardDoc {
  jobNumber: string // "JC-2026-27-00001"
  status: string // a `JOB_STATUSES` key from `workflow-statuses-actions.ts`
  branchId: string

  customerId: string
  customerName: string
  customerMobile: string
  alternativeMobile: string | null

  deviceTypeId: string | null
  deviceTypeName: string | null
  brandId: string | null
  brandName: string | null
  model: string | null
  imei: string | null
  imei2: string | null
  serialNo: string | null
  devicePinPattern: string | null

  problemIds: string[]
  problemLabels: string[]
  remark: string | null

  serviceItems: { itemId: string; itemName: string; price: number }[]
  estimatedCost: number
  advanceReceived: number
  partsCost: number
  finalAmount: number | null
  paidAmount: number

  itemsReceived: string[]
  itemsReturned: string[]

  receivedById: string
  receivedByName: string
  assignedToId: string | null
  assignedToName: string | null
  deliveredById: string | null
  deliveredByName: string | null
  cancelledById: string | null
  cancelledByName: string | null
  returnedById: string | null
  returnedByName: string | null

  partsUsed: PartUsed[]
  imageUrls: string[]
  notes: JobNote[]

  cancelReason: string | null
  holdReason: string | null

  /** Single-level undo for the Behavior tab's "Allow undo last action" toggle — the *before*
   * values of whatever the most recent action patched, plus the timeline event it wrote, so
   * "Undo" can restore both in one step. Cleared after use or by the next action. Deliberately
   * not a full undo *stack* — the reference app's own copy says "Undo Last Action," singular. */
  lastActionUndo: { beforePatch: Record<string, unknown>; timelineEventId: string; actionLabel: string } | null

  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  deliveredAt: Timestamp | null
  closedAt: Timestamp | null
  cancelledAt: Timestamp | null
}

/** `companies/{companyId}/jobCards/{jobId}/timeline/{eventId}` — every entry in the detail
 * page's right-hand Timeline (`preview (72)`). Written once, at the moment of the real action —
 * never synthesized/backfilled after the fact, per BUILD_PLAN.md's explicit instruction. */
export interface JobTimelineEventDoc {
  type:
    | 'created' | 'assigned' | 'advanceReceived' | 'partAdded' | 'statusChange' | 'note'
    | 'repairDone' | 'billGenerated' | 'paymentReceived' | 'delivered' | 'cancelled'
    | 'handover' | 'fieldVisit' | 'undone'
  title: string
  description: string
  fromStatus?: string
  toStatus?: string
  /** `fieldVisit` events only — minutes the technician reported spending on-site. Optional since
   * it's a self-reported number with no start/end check-in of its own to derive it from. */
  durationMinutes?: number | null
  userId: string
  userName: string
  createdAt: Timestamp
}

/** `companies/{companyId}/fieldVisits/{id}` — a denormalized, flat sibling of the `fieldVisit`
 * timeline event `useApplyJobAction()` already writes onto the job itself (Phase 9, Field Visit
 * Report, `preview (32)`). Written in the same batch as that event, never a second source of
 * truth: this doc's job is purely to let the report page do one flat collection read instead of
 * fetching every job card's own `timeline` subcollection to find the handful that are field
 * visits — the same "denormalize for a report page's own convenience" call already made for
 * `sessions`/`auditLog` in Phase 8, not a new pattern. */
export interface FieldVisitDoc {
  jobCardId: string
  jobNumber: string
  customerName: string
  deviceTypeName: string | null
  brandName: string | null
  model: string | null
  jobStatus: string
  technicianId: string
  technicianName: string
  durationMinutes: number | null
  note: string | null
  createdAt: Timestamp
}

/** `companies/{companyId}/jobCosting/{jobId}` — one doc per Closed job that's had its actual
 * cost recorded (`preview (37)`/`(74)`). Keyed by the job's own id (1:1), not a separate
 * auto-id, so "has this job been costed yet" is a single `get()`. */
export interface JobCostingDoc {
  jobId: string
  jobNumber: string
  costItems: {
    id: string
    type: 'part' | 'labor' | 'overhead' | 'other'
    itemId: string | null
    itemName: string
    supplier: string | null
    rate: number | null // reference rate from the job's own PartUsed, read-only once linked
    cost: number
    qty: number
    linked: boolean // true when `itemId` ties back to one of the job's own `partsUsed` entries
  }[]
  totalCost: number
  billAmount: number
  profit: number
  notes: string | null
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/receipts/{receiptId}` — minimal shape Phase 5 needs to record a job
 * card's advance/payment; Phase 6 builds the full Receipts & Payments page (list, void, Party
 * Ledger / Cash Book rollups) on this exact same collection, not a second one. */
export interface ReceiptDoc {
  receiptNumber: string // "RCP-2609-00001"
  direction: 'in' | 'out'
  partyId: string
  partyName: string
  jobCardId: string | null
  jobCardNumber: string | null
  against: 'jobCard' | 'manualAdvance'
  purpose: 'advance' | 'final' | 'other'
  amount: number
  mode: 'cash' | 'upi' | 'card'
  notes: string | null
  voided: boolean
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Backs the transactional sequential-ID generator (`src/lib/sequences.ts`) — not itself a
 * BUILD_PLAN-listed collection, but required infrastructure for the `JC-2026-27-00001`-style
 * IDs Phase 5+ generates. One doc per `docType` per company. */
export interface CounterDoc {
  lastSeq: number
}

// ============================================================================================
// Phase 7 — Masters. `source: 'system'` marks a seeded default (matches `preview (58)`'s "System"
// badge on protected categories, `preview (59)`'s "System" source column) — a system row can be
// edited but never deleted, exactly like a `protected` Branch/Role from earlier phases; a
// company-created row is `'custom'` and fully manageable.
// ============================================================================================

/** `companies/{companyId}/uom/{id}` (`preview (59)`). */
export interface UomDoc {
  name: string
  code: string // "PCS" — auto-generated from name, editable
  type: string // "Quantity" | "Length" | "Weight" | "Volume" — free-ish, matches the dropdown's own options
  symbol: string | null // "pcs"
  decimalPlaces: number
  displayOrder: number
  baseUomId: string | null // conversion target, e.g. Inch → Meter
  conversionFactor: number | null // "1 Inch = X Meter"
  description: string | null
  source: 'system' | 'custom'
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/itemCategories/{id}` (`preview (58)`) — a flat table keyed by
 * `parentId` rather than a nested subcollection, so "which categories sit under X" is a single
 * `where('parentId','==',X)` query, and a category can be re-parented by writing one field. */
export interface ItemCategoryDoc {
  name: string
  code: string // "SPARE_PARTS"
  type: 'Raw Material' | 'Service'
  parentId: string | null // null = root
  description: string | null
  source: 'system' | 'custom'
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/paymentModes/{id}` (`preview (56)`) — Cash/UPI/Card seed every new
 * company (Cash flagged default); Job Cards' and Receipts & Payments' own Payment Mode pickers
 * (Phase 5/6) predate this master and stayed a fixed `'cash'|'upi'|'card'` union rather than
 * reading this collection, since retrofitting them isn't this phase's job — this page is the
 * real CRUD surface for the master list itself (add e.g. "Bank Transfer" going forward). */
export interface PaymentModeDoc {
  name: string
  code: string // "CASH"
  type: string // "Cash" | "UPI" | "Card" | "Bank Transfer" | "Other"
  description: string | null
  isDefault: boolean
  source: 'system' | 'custom'
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/partyCategories/{id}` (`preview (54)`/`(55)`) — `isDefaultForCustomer`/
 * `isDefaultForSupplier` back the star-icon columns; at most one category may hold each flag at a
 * time (enforced client-side in `use-party-categories.ts`, same "only one active FY" pattern as
 * Phase 2's Financial Years). */
export interface PartyCategoryDoc {
  name: string
  code: string // "GENERAL_SUPPLIER"
  defaultCreditDays: number
  isDefaultForCustomer: boolean
  isDefaultForSupplier: boolean
  source: 'system' | 'custom'
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================================
// Phase 7 — Second Hand Device. One purchase doc per device bought from a seller; a sale doc is
// created only once that same device is sold on, linked back by `purchaseId` — `status` on the
// purchase doc is the single source of truth for which list (Device Stock / Device Sale /
// Purchase Register) a device currently shows up in, exactly like `JobCardDoc.status` drives
// Job Cards' own pill filters.
// ============================================================================================

export type SecondHandPurchaseStatus = 'inStock' | 'inRefurb' | 'sold' | 'returnedToSeller'
export type ConditionGrade = 'A' | 'B' | 'C' | 'D'
export type AccountLockStatus = 'notChecked' | 'clean' | 'locked'

/** `companies/{companyId}/secondHandPurchases/{id}` (`preview (47)`–`(50)`). Reuses the exact
 * same `serviceOptions` Device Type/Brand/Model catalog Job Cards already picks from (`(50)`'s
 * combos look identical to the Job Card form's own) — one shared catalog, not a second one. */
export interface SecondHandPurchaseDoc {
  purchaseNumber: string // "SHDP-2026-27-00001"
  status: SecondHandPurchaseStatus

  deviceTypeId: string | null
  deviceTypeName: string | null
  brandId: string | null
  brandName: string | null
  model: string | null
  imei: string | null
  imei2: string | null
  devicePinPattern: string | null
  ram: string | null
  storage: string | null
  colour: string | null
  batteryHealthPercent: number | null
  network: string | null
  originalInvoiceDate: Timestamp | null
  warrantyLeftMonths: number | null
  dualSim: boolean
  hasBox: boolean
  hasBill: boolean
  conditionGrade: ConditionGrade
  accountLockStatus: AccountLockStatus
  accessoriesIncluded: string | null
  conditionNotes: string | null
  imageUrls: string[]

  sellerId: string
  sellerName: string
  idProofType: string | null
  idProofNumber: string | null
  idProofPhotoUrl: string | null
  imeiCheckedClean: boolean
  sellerDeclaredNotStolen: boolean

  purchasePrice: number
  purchaseDate: Timestamp
  paymentMode: 'cash' | 'upi' | 'card'
  amountPaid: number
  purchasedById: string
  purchasedByName: string
  expectedSalePrice: number | null
  refurbCost: number
  notes: string | null

  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/secondHandSales/{id}` (`preview (39)`/`(45)`/`(46)`) — `purchasePrice`/
 * `refurbCost`/`profit` are snapshotted at sale time (not recomputed live from the purchase doc
 * later), so a sale's own profit figure never silently drifts if the purchase doc is edited
 * afterward — same "snapshot at the moment of the real event" principle as every timeline entry
 * elsewhere in this app. */
export interface SecondHandSaleDoc {
  saleNumber: string // "SHDS-2026-27-00001"
  purchaseId: string
  purchaseNumber: string
  deviceLabel: string // "Samsung Galaxy S24 (Mobile)"

  buyerId: string
  buyerName: string
  salePrice: number
  paymentMode: 'cash' | 'upi' | 'card'
  warrantyDays: number
  accessoriesGiven: string | null
  notes: string | null

  purchasePrice: number
  refurbCost: number
  profit: number

  soldById: string
  soldByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================================
// Phase 8 — Administration deep dive: Active Sessions, IP Whitelist, Login Report, System Audit.
// ============================================================================================

/** `companies/{companyId}/sessions/{id}` (`preview (20)`) — one doc per signed-in browser
 * session, created at successful login/signup and kept alive by a periodic "heartbeat" (see
 * `useSessionHeartbeat` in `src/hooks/use-sessions.ts`) while the tab stays open. The doc's own
 * id is stashed client-side in `sessionStorage` (cleared when the tab closes, unlike
 * `localStorage`) — comparing it against the viewer's own stashed id is how "This is your
 * current session" is determined without a server-side session store. */
export interface SessionDoc {
  userId: string
  userName: string
  roleName: string
  branchName: string
  ip: string | null
  userAgent: string
  deviceLabel: string // parsed from userAgent — "Chrome on Windows", "Safari on iOS", etc.
  signedInAt: Timestamp
  lastActivityAt: Timestamp
  expiresAt: Timestamp
  endedAt: Timestamp | null // set on an explicit logout; null while still active/expired-by-time
}

/** `companies/{companyId}/ipWhitelist/{id}` (`preview (19)`). See `src/lib/ip-enforcement.ts`'s
 * own doc comment for why this can only ever be an advisory, client-side check in a project with
 * no server component — never a real security boundary. */
export interface IpWhitelistDoc {
  label: string
  ipOrCidr: string
  notes: string | null
  active: boolean
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type AuditResult = 'success' | 'unauthorized' | 'blocked'

/** `companies/{companyId}/auditLog/{id}` (`preview (16)`/`(17)`) — the one trail every mutation
 * in the app writes to, in the *same* batch as the real write it's recording (see
 * `src/lib/audit-log.ts`), so an audit entry exists iff the real write actually committed. Also
 * doubles as the Login Report's own data source (`entityType: 'Login'` rows) rather than a
 * second collection — see that file's doc comment for why a genuinely failed (wrong-password)
 * login can't be represented here. */
export interface AuditLogDoc {
  action: string // "Create" | "Update" | "Delete" | "Status Change" | "Void" | "Login" | ...
  module: string // matches `PERMISSION_SCHEMA` section keys, plus "auth" for login/signup events
  entityType: string // "Job Card", "Party", "Role", "Login", ...
  entityId: string | null
  entityLabel: string // denormalized human label — job number, party name, user's own email, ...
  targetLabel: string // shown in the table's own "Target" column; same as entityLabel unless the
  // action's real target differs (e.g. a role assignment's target is the *assigned* user)
  critical: boolean
  result: AuditResult
  details: Record<string, unknown> // pretty-printed JSON in the detail drawer's own section
  performedById: string
  performedByName: string
  performedByRole: string
  performedByBranch: string
  ip: string | null
  userAgent: string
  createdAt: Timestamp
}

/** The exact 11 document types `preview (2)` lists under Print Formats — every print button
 * across the app (Job Card, Job Card Bill, Payment Receipt, Second Hand Device receipts/labels,
 * …) resolves its template against this fixed set, never a freeform string. */
export type PrintDocumentType =
  | 'jobCard'
  | 'jobCardBill'
  | 'paymentReceipt'
  | 'purchaseReceipt'
  | 'secondHandPurchaseReceipt'
  | 'secondHandSaleInvoice'
  | 'secondHandDeviceLabel'
  | 'deviceTagLabel'
  | 'productLabel'
  | 'barcodeLabel'
  | 'customerLabel'

/** One positioned line in a template — "positioned" here means *ordered top-to-bottom*, not
 * pixel-coordinates; see `record-costing-modal` precedent (Phase 5's reorder-by-arrows, not
 * drag-and-drop) for the same "functional, not pixel-perfect" call applied to this builder.
 * `fieldKey` looks up `src/config/print-fields.ts`'s per-document-type field list; `label` is
 * denormalized so an existing template still renders sanely even if that config later renames
 * or removes the field it once pointed at. */
export interface PrintTemplateBlock {
  id: string
  kind: 'field' | 'text' | 'divider'
  fieldKey: string | null // set when kind === 'field'; null for 'text'/'divider'
  label: string
  text: string | null // literal text when kind === 'text' (e.g. a heading, "Thank you!")
  bold: boolean
  align: 'left' | 'center' | 'right'
  fontSize: 'sm' | 'md' | 'lg'
}

/** `companies/{companyId}/printTemplates/{id}` (`preview (1)`/`(2)`) — one company can have
 * several templates per `documentType` (e.g. an 80mm and a 58mm Job Card Bill), exactly one of
 * which is `isDefault` at a time. Seeded with one `protected` default per document type at
 * signup (`addDefaultPrintTemplatesToBatch`) so no company ever hits a real print action with
 * nothing to render — matches every other "seed real usable defaults, not an empty shelf"
 * decision already made for Service Options/Masters. */
export interface PrintTemplateDoc {
  name: string
  documentType: PrintDocumentType
  paperWidth: '58mm' | '80mm' | 'a4'
  blocks: PrintTemplateBlock[]
  isDefault: boolean
  protected: boolean // the seeded default for this documentType — cannot be deleted
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/whatsappConfig/config` — a single fixed doc (same "one company-wide
 * doc, not a collection" pattern as `formSchemas/jobCard`), backing the WhatsApp button already
 * shipped on the Job Card detail page since Phase 5 (previously a hardcoded message string). */
export interface WhatsAppTemplateDoc {
  event: 'jobCreated' | 'statusChanged' | 'billGenerated' | 'delivered' | 'paymentReceived'
  label: string
  enabled: boolean
  /** `{{customerName}}`, `{{jobNumber}}`, `{{status}}`, `{{amount}}`, `{{shopName}}` — resolved
   * against real job-card data at send time (`src/lib/whatsapp.ts`), never fabricated. */
  message: string
}

export interface WhatsAppConfigDoc {
  countryCode: string // e.g. "91" — prefixed to a bare 10-digit mobile before building a wa.me link
  templates: WhatsAppTemplateDoc[]
  updatedAt: Timestamp
}

/** `companies/{companyId}/backups/{id}` — metadata for one "Backup Now"/scheduled snapshot. The
 * actual JSON payload lives in Firebase Storage (`storagePath`), never inline here — a whole
 * tenant's data would routinely blow past Firestore's 1MB document limit. */
export interface BackupDoc {
  storagePath: string
  fileName: string
  sizeBytes: number
  collectionCounts: Record<string, number>
  createdById: string
  createdByName: string
  createdAt: Timestamp
}

/** `companies/{companyId}/archives/{id}` — the result of "Restore from File" → "Restore as
 * Archive" (the safe path: a separate read-only copy, live data untouched). Same storage-pointer
 * shape as `BackupDoc`, kept as its own type since an archive's provenance (`sourceFileName`,
 * who restored it) differs from a backup's own creation metadata. */
export interface ArchiveDoc {
  label: string
  storagePath: string
  sizeBytes: number
  collectionCounts: Record<string, number>
  sourceFileName: string
  createdById: string
  createdByName: string
  createdAt: Timestamp
}

/** `companies/{companyId}/backupSettings/config` — a single fixed doc for the "Daily automatic
 * backup" scheduler preference. Persists the preference only — see this doc's own field comment
 * and `PROGRESS.md`'s Phase 10 notes for why it can't actually fire itself unattended in a
 * client-SDK-only project with no server/Cloud Function/cron. */
export interface BackupSettingsDoc {
  dailyAutoBackupEnabled: boolean
  timeOfDay: string // "HH:mm", 24h
  keepForDays: number
  updatedAt: Timestamp
}
