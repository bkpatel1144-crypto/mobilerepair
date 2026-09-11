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
  /**
   * Are the prices people type already inclusive of GST?
   *
   * Optional and true by default: a walk-in repair shop quotes "₹500 to fix it" and means ₹500
   * out of the customer's pocket. Exclusive pricing is a B2B habit and has to be chosen. Only
   * consulted when `gstRegistration` is `Regular`.
   */
  pricesIncludeGst?: boolean
  /** The single rate this shop bills at. 18% covers phone repair; kept settable rather than
   *  hard-coded because rates move and a shop should not need a deploy to follow them. */
  gstRate?: number
  pan: string | null
  email: string
  phone: string
  currency: string // e.g. "INR"
  timezone: string // e.g. "Asia/Kolkata"
  protected: boolean // the default company created at signup — cannot be disabled/deleted
  status: EntityStatus
  /**
   * Who created it. Absent on companies made before multi-company existed.
   *
   * Load-bearing, not informational: `firestore.rules` uses it to decide whether a user may add
   * this company's id to their own `companyIds`. Without it a user could write any company id
   * into their profile and `belongsToCompany()` would then wave them into another shop's data.
   */
  createdById?: string
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

/** Per-permission grants, keyed exactly as the client's export keys them —
 *  `SALES_INVOICES_CREATE`, `SERVICE_JOB_CARDS_ASSIGN`. See `permission-catalogue.ts`, which is
 *  generated from that export, and `permission-legacy.ts` for how a role saved in the older
 *  `sales.invoices.create` format is still read correctly. */
export type ActionPermissions = Record<string, boolean>

export interface RoleDashboardConfig {
  /** Where this role lands after login — a value from `src/config/nav.ts` (`"dashboard"` or a
   * `menuKey()`-shaped leaf key the role can also `canView`). */
  defaultLandingRoute: string
  /** Which Dashboard stat tiles/charts this role sees — keyed by `src/config/dashboard-widgets.ts`. */
  visibleWidgets: Record<string, boolean>
  /**
   * The order widgets appear in, as a list of widget keys.
   *
   * Optional, and partial by design: a key not in the list falls back to the catalogue's own
   * order, *after* everything that is listed. That means a widget added to the product later
   * appears at the end of an existing role's dashboard rather than vanishing from it — the same
   * reasoning as `visibleWidgets` treating an absent key as visible.
   */
  widgetOrder?: string[]
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
  /**
   * The company this account was created under, and the fallback for everything below. Never
   * changes; it is what `firestore.rules` can always fall back to when `companyIds` is absent.
   */
  companyId: string
  /**
   * Every company this user can open. Optional and absent on accounts created before
   * multi-company existed, where it reads as `[companyId]` — the same set, written differently.
   * Adding a company appends here; there is no removal path yet, deliberately, because a user
   * dropped from a company mid-session would keep a stale `activeCompanyId`.
   */
  companyIds?: string[]
  /**
   * Per-company role and branch, keyed by company id.
   *
   * Necessary because `roleId`/`branchId` below are single values that belong to exactly one
   * company: a role document lives at `companies/{id}/roles/{roleId}`, so carrying one across a
   * switch would resolve against a company that has no such role and leave the user with no
   * permissions at all. `auth-provider.tsx` swaps these in when it resolves the active company.
   *
   * Absent on single-company accounts, where the top-level `roleId`/`branchId` are already
   * correct for the only company there is.
   */
  memberships?: Record<
    string,
    { roleId: string; roleName: string; roleCode: RoleCode; branchId: string }
  >
  /**
   * Which of `companyIds` the app is currently showing. Absent means `companyId`.
   *
   * Resolved once in `auth-provider.tsx`, which overwrites the `companyId` it hands to the rest
   * of the app with this value. That is the whole switcher: every hook, path helper and audit
   * entry already reads `profile.companyId`, so none of them needed to learn about switching.
   */
  activeCompanyId?: string
  /** Set by `auth-provider.tsx` when it resolves the active company — the original
   * `companyId` before it was overwritten. Never persisted. */
  homeCompanyId?: string
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

/** The GST band an item is billed at. `taxCategory` in the client's export, where every row reads
 *  `GST_18`; the rest are the standard Indian slabs plus the two zero-rate distinctions, which are
 *  not the same thing on a GSTR-1 (exempt supplies are reported, nil-rated are not). */
export type TaxCategory =
  'GST_0' | 'GST_5' | 'GST_12' | 'GST_18' | 'GST_28' | 'EXEMPT' | 'NIL_RATED'

/** How stock of this item is identified. `trackingType` in the export (`NONE` on every row there),
 *  and the item-level counterpart of `ItemCategorySettings`'s batch/serial toggles. */
export type TrackingType = 'NONE' | 'BATCH' | 'SERIAL' | 'BATCH_SERIAL'

/** A UOM as an item stores it. Denormalised deliberately — the export embeds
 *  `{ uomCode, uomName, symbol }` on the item, and a list of 500 items must not become 500 reads
 *  of the UOM collection to render its Unit column. `id` is the `uom` document it came from, so a
 *  rename can be followed back to source. */
export interface ItemUomRef {
  id: string | null
  code: string // "NOS"
  name: string // "Numbers"
  symbol: string // "nos"
}

/** Split GST rates. The export carries all four alongside `taxCategory`; they are stored rather
 *  than derived because an inter-state invoice charges `igst` where an intra-state one charges
 *  `cgst` + `sgst`, and `cess` is levied on top of either. */
export interface ItemGstRates {
  cgst: number
  sgst: number
  igst: number
  cess: number
}

export interface ItemReorderSettings {
  minStock: number
  reorderPoint: number
  reorderQty: number
  maxStock: number
}

/** Which lines of business an item participates in, and the terms for each. Replaces the four
 *  loose `enabledIn*` booleans, which could not express "sellable, discount capped at 20%" or a
 *  purchase lead time — both of which the export carries per item. */
export interface ItemLobConfig {
  sales: { isActive: boolean; allowDiscount: boolean; maxDiscountPercent: number }
  purchase: { isActive: boolean; leadTimeDays: number }
  production: { isActive: boolean; isBomItem: boolean }
  /** `pos` in the export — the counter-sale screen. */
  servicePos: { isActive: boolean }
  ecommerce: { isActive: boolean }
}

/** A secondary unit this item can be transacted in, with its conversion to the primary.
 *
 *  `alternateUOMs` is an empty array on every row of the export, so the element shape is not
 *  copied from it — it mirrors `UomDoc`'s own `baseUomId`/`conversionFactor` pair, which is the
 *  conversion this app already models. Worth knowing if a record is ever exchanged with the
 *  reference system. */
export interface ItemAlternateUom {
  uomCode: string
  /** How many primary units one of this unit is — "1 Box = 12 nos" is `12`. */
  conversionFactor: number
}

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

  // ---- Everything below is from the client's `itemmaster` export -----------------------------
  //
  // All optional, and all read through `normalizeItem()` in `use-items.ts` rather than directly.
  // This collection has been live since Phase 5, so documents written before this exist in every
  // production tenant and carry none of these keys; a required field would make every one of them
  // fail to satisfy `ItemDoc`, and — worse, because nothing would report it — a component reading
  // `item.gstRates.igst` would throw on exactly those records.
  //
  // The four `enabledIn*` booleans above are kept in step with `lob` on every write, so a screen
  // still reading them is not silently wrong. They are the older, narrower spelling of the same
  // thing.

  /** Sub-category, a second level under `categoryId`. `subCategoryId` is null on every export row. */
  subCategoryId?: string | null
  subCategoryName?: string | null

  /** The unit the item is stocked and priced in. `uom` above is this one's `symbol`. */
  primaryUom?: ItemUomRef
  /** Defaults to the primary when a purchase order is raised in the same unit. */
  purchaseUom?: ItemUomRef | null
  salesUom?: ItemUomRef | null
  alternateUoms?: ItemAlternateUom[]

  taxCategory?: TaxCategory
  gstRates?: ItemGstRates

  trackingType?: TrackingType
  /** Days from receipt to expiry, for a batch-tracked consumable. Null where it does not expire. */
  shelfLifeDays?: number | null
  reorder?: ItemReorderSettings

  hasVariants?: boolean
  /** Attribute names a variant is defined by — "Colour", "Capacity". Empty on every export row,
   *  so the element type is this app's own choice; see `ItemAlternateUom` for the same caveat. */
  variantAttributes?: string[]
  /** Storage download URLs, same convention as `JobCardDoc.imageUrls`. */
  images?: string[]

  lob?: ItemLobConfig

  /** Seeded with the tenant rather than added by the shopkeeper. `isSystem` in the export; a
   *  system item is editable but its code is not, so a re-seed can still find it. */
  isSystem?: boolean
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

/** How long a part is guaranteed for, as the reference app records it: a number, the unit that
 *  number is in, and the date it runs to. The date is kept rather than derived because a shop
 *  often writes the supplier's own expiry on the slip, which is not always `today + value`. */
export interface PartWarranty {
  value: number
  unit: 'days' | 'months' | 'years'
  /** `YYYY-MM-DD`, or null when only a duration was given. */
  until: string | null
}

export interface PartUsed {
  id: string
  itemId: string
  itemName: string
  rate: number
  qty: number
  /**
   * The four below are optional because parts recorded before Edit Bill existed do not have
   * them, and a required field would make every one of those documents invalid.
   *
   * `itemCode` is copied from the item at the moment the part is added rather than looked up on
   * read: the code shown on a bill should be the code the item had when it was sold, even if the
   * item is renumbered afterwards.
   */
  itemCode?: string
  supplierId?: string | null
  supplierName?: string | null
  warranty?: PartWarranty | null
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
  /** A flat charge for the work itself, on top of the parts. Optional: bills generated before
   *  Edit Bill existed have neither this nor a discount, and 0 is the right reading for both. */
  serviceCharge?: number
  discount?: number
  /** Warranty on the job as a whole, distinct from any one part's. */
  billWarranty?: { value: number; unit: 'days' | 'months' | 'years' } | null
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
  lastActionUndo: {
    beforePatch: Record<string, unknown>
    timelineEventId: string
    actionLabel: string
  } | null

  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  deliveredAt: Timestamp | null
  /** Set when the `generateBill` action runs. Null for jobs that have never been billed, and
   * also for jobs billed before this field existed — the Sales Invoices list falls back to
   * `updatedAt` for those rather than inventing a date. */
  billGeneratedAt: Timestamp | null
  closedAt: Timestamp | null
  cancelledAt: Timestamp | null
}

/** `companies/{companyId}/jobCards/{jobId}/timeline/{eventId}` — every entry in the detail
 * page's right-hand Timeline (`preview (72)`). Written once, at the moment of the real action —
 * never synthesized/backfilled after the fact, per BUILD_PLAN.md's explicit instruction. */
export interface JobTimelineEventDoc {
  type:
    | 'created'
    | 'assigned'
    | 'advanceReceived'
    | 'partAdded'
    | 'statusChange'
    | 'note'
    | 'repairDone'
    | 'billGenerated'
    | 'billEdited'
    | 'paymentReceived'
    | 'delivered'
    | 'cancelled'
    | 'handover'
    | 'fieldVisit'
    | 'undone'
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
  /**
   * What kind of cash movement this is, for the cash-basis Profit & Loss.
   *
   * Optional, and absent on every receipt written before Expenses and Supplier Payables existed
   * — which is correct rather than a gap: all of those are customer money (job advances, final
   * payments, refunds), so `undefined` reads as `'customer'`. Only the two new writers set it.
   *
   * P&L needs this because a cash-basis report has to split `direction: 'out'` three ways
   * (operating expense, payment to a supplier, refund to a customer) and they land in different
   * lines. Deriving it from the note text would work until someone edited a note.
   */
  kind?: 'customer' | 'expense' | 'supplierPayment'
  amount: number
  mode: 'cash' | 'upi' | 'card'
  notes: string | null
  voided: boolean
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** `companies/{companyId}/expenseCategories/{id}` — Rent, Salary, Electricity and so on.
 * Seeded with a usable starting set, same convention as Payment Modes and Party Categories,
 * and extendable inline from the expense form rather than needing its own Masters page. */
export interface ExpenseCategoryDoc {
  name: string
  displayOrder: number
  protected: boolean
  status: EntityStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * `companies/{companyId}/expenses/{id}` — shop running costs, the thing Profit & Loss subtracts
 * from gross profit.
 *
 * Every expense also writes a paired `receipts` document with `direction: 'out'`, in the same
 * batch. That is deliberate: Cash Book and Party Ledger are both built on `receipts`, and if an
 * expense lived only here then the cash book's closing balance would disagree with the actual
 * till by exactly the shop's running costs. `receiptId` records the pairing so voiding one can
 * void the other.
 */
export interface ExpenseDoc {
  expenseNumber: string // "EXP-2026-27-00001"
  /** The day the money actually left, which is not always the day it was entered. */
  expenseDate: Timestamp
  categoryId: string
  categoryName: string // denormalized so a renamed category never rewrites history
  amount: number
  mode: 'cash' | 'upi' | 'card'
  /** Optional — rent has a landlord, tea usually doesn't. */
  paidToPartyId: string | null
  paidToPartyName: string | null
  branchId: string
  notes: string | null
  /** The `receipts` doc written alongside this one. */
  receiptId: string
  voided: boolean
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * `companies/{companyId}/supplierBills/{id}` — what the shop owes a supplier.
 *
 * The gap this fills: `jobCosting.costItems[].supplier` is a free-text *name* with no paid/unpaid
 * state, so parts bought on credit were invisible to the app (see `use-payables.ts`, which says
 * so). A bill here references a real supplier Party, carries a due date, and is settled by
 * `receipts` with `direction: 'out'` — so payment history lives in one place across the app
 * rather than being re-implemented per screen.
 *
 * `amountPaid` is maintained on the document rather than summed from receipts on read: the
 * aging buckets sort by it, and recomputing a sum per bill per render is the kind of thing that
 * quietly turns a payables page into a slow one.
 */
export interface SupplierBillDoc {
  billNumber: string // "SB-2026-27-00001" — our own reference
  /** The supplier's own invoice number, if they gave one. */
  supplierRef: string | null
  supplierId: string
  supplierName: string
  billDate: Timestamp
  dueDate: Timestamp | null
  amount: number
  amountPaid: number
  notes: string | null
  status: 'open' | 'paid' | 'void'
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
/**
 * Category tracking flags. Mirror the reference app's `settings` object one-for-one, because a
 * category is where an item inherits its defaults from — a battery category that enables expiry
 * tracking is how every battery item gets it without being told individually.
 */
export interface ItemCategorySettings {
  enableBatchTracking: boolean
  enableExpiryTracking: boolean
  enableSerialTracking: boolean
  /** Days. `null` where the category does not imply one. */
  defaultShelfLifeDays: number | null
}

/**
 * The four kinds of category the client's export uses: `RAW_MATERIAL`, `FINISHED_GOODS`,
 * `CONSUMABLES` and `SERVICES`.
 *
 * This was `'Raw Material' | 'Service'` while only the first page of the export was in the repo —
 * ten records, all `RAW_MATERIAL` bar one. The full export has all four, so every Accessories,
 * Mobile Phones and Consumables category was being written as Raw Material.
 */
export type ItemCategoryType = 'Raw Material' | 'Finished Goods' | 'Consumables' | 'Service'

export interface ItemCategoryDoc {
  name: string
  code: string // "SPARE_PARTS"
  type: ItemCategoryType
  parentId: string | null // null = root
  description: string | null
  source: 'system' | 'custom'
  status: EntityStatus

  /**
   * Depth in the tree: 0 for a root, 1 for its child, and so on.
   *
   * Stored rather than derived so a query can filter by depth without loading the whole tree.
   * Deliberately *correct*, which the reference data is not: all ten of its records carry
   * `level: 0`, including the eight whose `parentCategory` is Spare Parts — which is why its own
   * UI shows "Level: Root" directly beside "Under: Spare Parts". Copying that was considered and
   * rejected; a sub-category labelled Root is a defect, not a spec.
   */
  level: number
  /**
   * Slash-joined ancestry, e.g. `SPARE_PARTS/SPARE_BATTERIES`.
   *
   * Also corrected: the reference stores the bare code, so its `path` cannot be used to find
   * everything beneath a category. With the ancestry included, a prefix match does it.
   */
  path: string

  /** Seeded with the tenant rather than added by the shopkeeper — `isSystem` in the export.
   *  Optional because categories written before this field existed carry no value; `source`
   *  already said the same thing for those, and the two agree for everything seeded since. */
  isSystem?: boolean

  /** Presentation, carried through from the reference so the UI can match it. */
  icon: string | null
  color: string | null
  displayOrder: number
  /** Attribute names items in this category are expected to carry. Empty in the seed data. */
  applicableAttributes: string[]
  settings: ItemCategorySettings

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

export type AuditResult = 'success' | 'unauthorized' | 'blocked' | 'failed'

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

/** One positioned line in a *v1* template — kept only so `migratePrintTemplate()` can read
 * documents written before the canvas designer existed. Nothing writes this shape any more.
 *
 * The original doc comment said "positioned here means *ordered top-to-bottom*, not
 * pixel-coordinates … the same functional, not pixel-perfect call". v2 reverses that call: the
 * designer places elements at real mm coordinates inside a band. See `PrintElement`.
 * @deprecated read-only; migrated to `PrintElement[]` on load.
 */
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

/** Bill-like documents flow Header → Detail → Footer down a roll; labels are a single fixed
 * area. `category` drives which chrome the designer shows (a label has no bands to switch). */
export type PrintTemplateCategory = 'bill' | 'label'

/** The three stacked areas of a bill template. A label template uses `detail` only. */
export type PrintBand = 'header' | 'detail' | 'footer'

export const PRINT_BANDS: PrintBand[] = ['header', 'detail', 'footer']

/** Element palette, matching the designer's own "Add Element" buttons. `field` is the one type
 * bound to live record data — everything else is static chrome the user draws. */
export type PrintElementType =
  'field' | 'text' | 'image' | 'logo' | 'barcode' | 'qrcode' | 'line' | 'shape'

export interface PrintElementStyle {
  /** Points, like every other print tool — converted to mm only at render time. */
  fontSize: number
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
  /** Hex. Thermal printers are monochrome, so anything non-black renders as a grey on paper. */
  color: string
  /** `line`/`shape` only. */
  strokeWidth: number
  fill: string | null
  borderStyle: 'solid' | 'dashed' | 'none'
}

/**
 * One element on the canvas, positioned in **millimetres relative to its band's content box**
 * (paper width minus left/right margins) — not pixels, and not relative to the page. Storing mm
 * is what lets one template render identically at 100% zoom on screen and at real size on a
 * 58mm roll; a pixel coordinate would silently depend on whatever zoom it was drawn at.
 */
export interface PrintElement {
  id: string
  band: PrintBand
  type: PrintElementType
  x: number
  y: number
  w: number
  h: number
  /** Stacking order within the band. The Layers panel reorders by rewriting this. */
  z: number
  /** `field` only — a key from `src/config/print-fields.ts`. */
  fieldKey: string | null
  /** Literal content for `text`; the caption for a `field` when `showLabel` is on. Also holds
   * the source url for `image`. */
  text: string | null
  /** `field` only. The reference prints rows as "Name        Rahul Sharma" — one element with a
   * muted caption pinned left and the live value right — rather than two elements the user has
   * to keep aligned by hand. */
  showLabel: boolean
  /** `barcode`/`qrcode` only. */
  symbology: string | null
  /** Degrees clockwise. Rotating on the canvas rather than in the print CSS keeps what you see
   * and what prints identical — both apply the same transform about the element's centre. */
  rotation: number
  /**
   * Optional print-time condition. `null` means always printed.
   *
   * Exists because a template is one layout serving every record: a GSTIN line on a bill is
   * correct for a registered shop and an empty labelled row for everyone else. Rather than
   * maintain two templates, the row hides itself when the value it depends on is absent. Only
   * emptiness is testable — a client-side template engine has no business encoding business
   * rules beyond "is there anything to show".
   */
  visibleWhen: { fieldKey: string; op: 'notEmpty' | 'empty' } | null
  style: PrintElementStyle
  /** Hidden in the designer only — still prints. Distinct from `visibleWhen`, which is a
   * print-time rule; this one is the Layers panel's eye toggle for getting something out of the
   * way while you work. */
  hidden: boolean
  locked: boolean
}

export interface PrintPaper {
  width: number
  height: number
  unit: 'mm'
  orientation: 'portrait' | 'landscape'
}

export interface PrintMargins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Output settings.
 *
 * `copies`, `duplicateCopy` and `duplicateCopyDirection` are honoured by the renderer — they
 * only affect what HTML gets produced. `ups`, `gapMm`, `printSpeed` and `printDensity` are
 * **stored but not applied**: they are ESC-POS/ZPL commands sent to a thermal printer over a
 * local connection, and this app prints through `window.open()` + `window.print()`, i.e. the
 * browser's own dialog, which has no channel to a printer's firmware. They are kept so a
 * template carries the same configuration the shop's printer is set to, and so a future local
 * print bridge could consume them without a migration. The designer labels them as such rather
 * than implying they take effect — same treatment as the advisory-only IP whitelist and the
 * self-triggering-backup limits already documented in PROGRESS.md.
 */
export interface PrintSettings {
  copies: number
  duplicateCopy: boolean
  duplicateCopyDirection: 'stacked' | 'side-by-side'
  ups: number
  gapMm: number
  printSpeed: number
  printDensity: number
}

/** `companies/{companyId}/printTemplates/{id}` — one company can have several templates per
 * `documentType` (a 58mm, an 80mm and an A4 Job Card Bill), exactly one of which is `isDefault`
 * at a time. Seeded at signup so no company ever hits a real print action with nothing to
 * render, matching the "seed real usable defaults, not an empty shelf" call already made for
 * Service Options and Masters.
 *
 * `schemaVersion` is read by `migratePrintTemplate()`: v1 documents (a flat `blocks` array, no
 * `elements`) are converted on read rather than in a migration script, because this app has no
 * server to run one — see that function's doc comment. */
export interface PrintTemplateDoc {
  schemaVersion: 2
  name: string
  documentType: PrintDocumentType
  category: PrintTemplateCategory
  /** Which stock this template was created for — `'58mm'`, `'80mm'`, `'a4'`, `'a4-duplicate'`,
   * or null for label stock, which has no preset family. Purely informational: `paper` is the
   * authority on actual dimensions. */
  presetKey: string | null
  paper: PrintPaper
  margins: PrintMargins
  settings: PrintSettings
  /** Band heights in mm. A label template still carries all three; only `detail` is used. */
  bandHeights: Record<PrintBand, number>
  elements: PrintElement[]
  isDefault: boolean
  isActive: boolean
  /** Bumped on every save, so a print run can record which revision produced it. */
  version: number
  protected: boolean // a seeded default — cannot be deleted
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * `companies/{companyId}/printTemplates/{templateId}/versions/{version}` — one superseded
 * revision of a template.
 *
 * Written in the same batch as the update that replaces it, holding the state being *overwritten*
 * rather than the new state. That ordering is deliberate: `version` is bumped with
 * `increment(1)`, so the client never learns the resulting number and could not address a
 * snapshot of the new state. The outgoing version number is known exactly, so history is keyed
 * by it and the live document is always the current revision.
 *
 * Only the design payload is kept. `isDefault`, `isActive` and `protected` are properties of the
 * template's role in the shop rather than of a design, and restoring an old layout should not
 * also resurrect which document type was the default three weeks ago.
 */
export interface PrintTemplateVersionDoc {
  version: number
  name: string
  presetKey: string | null
  paper: PrintPaper
  margins: PrintMargins
  settings: PrintSettings
  bandHeights: Record<PrintBand, number>
  elements: PrintElement[]
  /** Who made the change that *superseded* this revision, and when — which is the question a
   * history list is actually asked ("who changed this, and when did it stop being live?"). */
  supersededById: string
  supersededByName: string
  supersededAt: Timestamp
}

/** What a v1 document looks like on disk, for the migration path only. */
export interface PrintTemplateDocV1 {
  schemaVersion?: undefined
  name: string
  documentType: PrintDocumentType
  paperWidth: '58mm' | '80mm' | 'a4'
  blocks: PrintTemplateBlock[]
  isDefault: boolean
  protected: boolean
  createdById: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * `companies/{companyId}/printDevices/{id}` — one shop PC running the Print Agent.
 *
 * Browsers cannot address a USB or network thermal printer, and cannot send ESC-POS/ZPL at all.
 * The agent is a small program installed on the shop PC that can: the browser writes a print job
 * here, the agent picks it up and drives the printer directly, which is what makes a template's
 * `printSpeed`/`printDensity`/`ups`/`gapMm` mean anything.
 *
 * Pairing is code-based rather than credential-based: the browser mints a short-lived code, the
 * shopkeeper types it into the agent, and the agent claims this document. That way the agent
 * never holds a password, and a lost PC is revoked by deleting one row rather than rotating
 * anything.
 */
export interface PrintDeviceDoc {
  /** Null until an agent claims the code and reports its own machine name. */
  name: string | null
  status: 'pending' | 'paired' | 'revoked'
  /** Shown to the user to type into the agent. Cleared once claimed. */
  pairingCode: string
  /** Codes are deliberately short-lived — an unused one left lying around is a way in. */
  codeExpiresAt: Timestamp
  pairedAt: Timestamp | null
  /** Heartbeat from the agent; drives the online/offline dot. */
  lastSeenAt: Timestamp | null
  platform: string | null
  agentVersion: string | null
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
