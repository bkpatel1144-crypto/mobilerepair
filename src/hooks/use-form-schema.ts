import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formSchemaDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { JOB_CARD_FIELDS, JOB_CARD_SECTIONS } from '@/config/job-card-form-fields'
import { LEAD_FIELDS, LEAD_SECTIONS } from '@/config/lead-form-fields'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { FormFieldConfig, FormSchemaDoc } from '@/types/firestore'

export type FormType = 'jobCard' | 'lead'

export function formSchemaQueryKey(companyId: string | undefined, formType: FormType) {
  return ['formSchema', companyId, formType] as const
}

/** The field/section list a `FormType` is built from — never redeclared at a call site. */
export function fieldsAndSectionsFor(formType: FormType) {
  return formType === 'jobCard'
    ? { fields: JOB_CARD_FIELDS, sections: JOB_CARD_SECTIONS }
    : { fields: LEAD_FIELDS, sections: LEAD_SECTIONS }
}

/** A schema doc that has never been saved yet — every non-locked field starts at whichever
 * visible/required default `job-card-form-fields.ts`/`lead-form-fields.ts` ships, every section
 * expanded, standard layout. */
export function blankFormSchema(formType: FormType): FormSchemaDoc {
  const { fields, sections } = fieldsAndSectionsFor(formType)
  const fieldConfig: Record<string, FormFieldConfig> = {}
  for (const field of fields) {
    if (field.structurallyLocked) continue
    fieldConfig[field.key] = {
      visible: field.defaultVisible,
      required: field.defaultRequired,
      locked: false,
      deviceOnly: false,
    }
  }
  return {
    layout: 'standard',
    templateName: null,
    expandedSections: Object.fromEntries(sections.map((s) => [s.key, true])),
    fields: fieldConfig,
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
  }
}

export function useFormSchema(formType: FormType) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: formSchemaQueryKey(companyId, formType),
    queryFn: async () => {
      const snap = await getDoc(doc(db, formSchemaDoc(companyId!, formType)))
      return snap.exists() ? (snap.data() as FormSchemaDoc) : null
    },
    enabled: !!companyId,
  })
}

export function useSaveFormSchema(formType: FormType) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (schema: FormSchemaDoc) => {
      const batch = writeBatch(db)
      batch.set(doc(db, formSchemaDoc(companyId, formType)), {
        ...schema,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'Form Schema',
        entityId: formType,
        entityLabel: formType === 'jobCard' ? 'Job Card Form' : 'Lead Form',
      })
      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formSchemaQueryKey(companyId, formType) })
    },
  })
}
