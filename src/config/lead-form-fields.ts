/**
 * The exact Lead form field list from BUILD_PLAN.md Phase 4 / `SCREENS_NOTES.md` `preview (8)`
 * — same role as `job-card-form-fields.ts`, for the Workflow Designer's "Lead Form" builder tab
 * and `formSchemas/lead`.
 */

export type LeadFieldType = 'search' | 'text' | 'select' | 'userPicker' | 'tags' | 'date' | 'textarea'

export interface LeadFieldSpec {
  key: string
  label: string
  section: string
  type: LeadFieldType
  structurallyLocked?: boolean
  defaultVisible: boolean
  defaultRequired: boolean
  placeholder?: string
  /** `select` fields only. */
  options?: string[]
  /** `date` fields only — quick relative-date chip labels. */
  quickDates?: string[]
}

export interface LeadSectionSpec {
  key: string
  label: string
}

export const LEAD_SECTIONS: LeadSectionSpec[] = [
  { key: 'contactInformation', label: 'Contact Information' },
  { key: 'location', label: 'Location' },
  { key: 'followUp', label: 'Follow-up' },
]

export const LEAD_FIELDS: LeadFieldSpec[] = [
  {
    key: 'customer',
    label: 'Customer',
    section: 'contactInformation',
    type: 'search',
    structurallyLocked: true,
    defaultVisible: true,
    defaultRequired: true,
    placeholder: 'Search customer by name or mobile...',
  },
  {
    key: 'name',
    label: 'Name',
    section: 'contactInformation',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'phoneNumber',
    label: 'Phone Number',
    section: 'contactInformation',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'alternativeMobile',
    label: 'Alternative Mobile',
    section: 'contactInformation',
    type: 'text',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Alternate number (optional)',
  },
  {
    key: 'businessName',
    label: 'Business Name',
    section: 'contactInformation',
    type: 'text',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Shop / farm name (optional)',
  },
  {
    key: 'district',
    label: 'District',
    section: 'location',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'taluka',
    label: 'Taluka',
    section: 'location',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'village',
    label: 'Village',
    section: 'location',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'city',
    label: 'City',
    section: 'location',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'address',
    label: 'Address',
    section: 'location',
    type: 'text',
    defaultVisible: false,
    defaultRequired: false,
  },
  {
    key: 'notes',
    label: 'Notes',
    section: 'contactInformation',
    type: 'textarea',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Any additional note about this lead...',
  },
  {
    key: 'source',
    label: 'Source',
    section: 'followUp',
    type: 'select',
    defaultVisible: true,
    defaultRequired: false,
    options: ['Cold Call', 'Walk-in', 'Referral', 'Website', 'Social Media', 'Advertisement'],
  },
  {
    key: 'assignTo',
    label: 'Assign To',
    section: 'followUp',
    type: 'userPicker',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Search user...',
  },
  {
    key: 'tags',
    label: 'Tags',
    section: 'followUp',
    type: 'tags',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'Add tags...',
  },
  {
    key: 'nextFollowUpDate',
    label: 'Next Follow-up Date',
    section: 'followUp',
    type: 'date',
    defaultVisible: true,
    defaultRequired: false,
    quickDates: ['Tomorrow', 'In 3 days', 'In a week'],
  },
  {
    key: 'followUpNote',
    label: 'Follow-up Note',
    section: 'followUp',
    type: 'textarea',
    defaultVisible: true,
    defaultRequired: false,
    placeholder: 'What to discuss next time...',
  },
]
