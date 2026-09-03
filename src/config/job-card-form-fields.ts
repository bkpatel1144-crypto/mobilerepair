/**
 * The exact Job Card form field list from BUILD_PLAN.md Phase 4 / `SCREENS_NOTES.md`
 * `preview (9)`–`(10)` — this is the single source of truth the Workflow Designer's "Job Card
 * Form" builder tab edits (per-field visible/required/locked/deviceOnly flags persisted to
 * `formSchemas/jobCard`) and that Phase 5's real Create Job Card form renders from. Neither
 * page hand-declares its own field list — both import this.
 *
 * A field marked `structurallyLocked` can never be reconfigured (no icon row — a static amber
 * "Locked" badge instead, matching the reference app exactly) and is never stored in a role's
 * saved field-override map; it's always visible + required. Every other field ships a sensible
 * *default* below, which `formSchemas/jobCard` overrides once a company saves changes.
 */

export type JobCardFieldType =
  | 'search' // single-select search-with-add, e.g. Customer / Device Type / Brand / Model
  | 'text'
  | 'scanText' // text input with a barcode/IMEI-scan icon
  | 'multiSelect' // tag-style multi-select with inline "+ add new"
  | 'currency' // ₹ input with quick-amount chips
  | 'pinPattern' // text input + "⊞ Draw" pattern-grid button
  | 'userPicker'
  | 'textarea'
  | 'imageDropzone'

export interface JobCardFieldSpec {
  key: string
  label: string
  section: string
  type: JobCardFieldType
  structurallyLocked?: boolean
  /** Only meaningful when not structurally locked — the field's state the very first time a
   * company opens the builder, before they've ever saved their own overrides. */
  defaultVisible: boolean
  defaultRequired: boolean
  placeholder?: string
  helperText?: string
  /** `currency` fields only — the quick-amount chip values, ₹0 always first if present. */
  quickAmounts?: number[]
}

export interface JobCardSectionSpec {
  key: string
  label: string
}

export const JOB_CARD_SECTIONS: JobCardSectionSpec[] = [
  { key: 'customerInformation', label: 'Customer Information' },
  { key: 'deviceInformation', label: 'Device Information' },
  { key: 'repairInformation', label: 'Repair Information' },
  { key: 'financial', label: 'Financial' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'internalDetails', label: 'Internal Details' },
  { key: 'images', label: 'Images' },
]

export const JOB_CARD_FIELDS: JobCardFieldSpec[] = [
  {
    key: 'customer',
    label: 'Customer',
    section: 'customerInformation',
    type: 'search',
    structurallyLocked: true,
    defaultVisible: true,
    defaultRequired: true,
    placeholder: 'Search customer by name or mobile...',
  },
  {
    key: 'alternativeMobile',
    label: 'Alternative Mobile',
    section: 'customerInformation',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
    placeholder: 'Alternate number (optional)',
  },
  {
    key: 'deviceType',
    label: 'Device Type',
    section: 'deviceInformation',
    type: 'search',
    structurallyLocked: true,
    defaultVisible: true,
    defaultRequired: true,
    placeholder: 'Search device type...',
  },
  {
    key: 'brand',
    label: 'Brand',
    section: 'deviceInformation',
    type: 'search',
    defaultVisible: true,
    defaultRequired: true,
    placeholder: 'Select brand...',
  },
  {
    key: 'model',
    label: 'Model',
    section: 'deviceInformation',
    type: 'text',
    defaultVisible: true,
    defaultRequired: true,
    placeholder: 'Enter model name...',
  },
  {
    key: 'imei',
    label: 'IMEI',
    section: 'deviceInformation',
    type: 'scanText',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: '15-digit IMEI (optional)',
  },
  {
    key: 'imei2',
    label: 'IMEI 2',
    section: 'deviceInformation',
    type: 'scanText',
    defaultVisible: false,
    defaultRequired: false,
    placeholder: 'Second IMEI (optional)',
  },
  {
    key: 'serialNo',
    label: 'Serial No',
    section: 'deviceInformation',
    type: 'scanText',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Serial number (optional)',
  },
  {
    key: 'devicePinPattern',
    label: 'Device PIN / Pattern',
    section: 'deviceInformation',
    type: 'pinPattern',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'e.g. 1234 or tap Draw',
  },
  {
    key: 'problems',
    label: 'Problems',
    section: 'repairInformation',
    type: 'multiSelect',
    structurallyLocked: true,
    defaultVisible: true,
    defaultRequired: true,
    placeholder: 'Select problems...',
  },
  {
    key: 'serviceItems',
    label: 'Service Items',
    section: 'repairInformation',
    type: 'search',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Add items from catalog',
    helperText: 'Optional — adds to estimated cost',
  },
  {
    key: 'estimatedCost',
    label: 'Estimated Cost',
    section: 'financial',
    type: 'currency',
    defaultVisible: true,
    defaultRequired: false,
    quickAmounts: [200, 500, 1000, 1500, 2000, 3000, 5000],
  },
  {
    key: 'advanceReceived',
    label: 'Advance Received',
    section: 'financial',
    type: 'currency',
    defaultVisible: true,
    defaultRequired: false,
    quickAmounts: [0, 100, 200, 500, 1000],
  },
  {
    key: 'itemsReceived',
    label: 'Items received',
    section: 'accessories',
    type: 'multiSelect',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Select items received with device...',
  },
  {
    key: 'itemsReturned',
    label: 'Items returned',
    section: 'accessories',
    type: 'multiSelect',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Select items returned to customer...',
  },
  {
    key: 'receivedBy',
    label: 'Received By',
    section: 'internalDetails',
    type: 'userPicker',
    structurallyLocked: true,
    defaultVisible: true,
    defaultRequired: true,
    helperText: 'Defaults to the current user',
  },
  {
    key: 'assignTo',
    label: 'Assign To',
    section: 'internalDetails',
    type: 'userPicker',
    defaultVisible: true,
    defaultRequired: false,
  },
  {
    key: 'remark',
    label: 'Remark',
    section: 'internalDetails',
    type: 'textarea',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Any additional note about the device / job...',
  },
  {
    key: 'images',
    label: 'Add Images',
    section: 'images',
    type: 'imageDropzone',
    defaultVisible: true,
    defaultRequired: false,
    helperText: 'They will be uploaded when you create the job card.',
  },
]
