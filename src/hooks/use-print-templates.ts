import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { printTemplatesCollection, printTemplateDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { printDocumentTypeLabel } from '@/config/print-fields'
import type { PrintDocumentType, PrintTemplateBlock, PrintTemplateDoc } from '@/types/firestore'

export interface PrintTemplateWithId extends PrintTemplateDoc {
  id: string
}

export function printTemplatesQueryKey(companyId: string | undefined) {
  return ['printTemplates', companyId] as const
}

export function usePrintTemplates() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: printTemplatesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, printTemplatesCollection(companyId!)))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PrintTemplateDoc) }))
    },
    enabled: !!companyId,
  })
}

/** Every non-`archived` template for one `documentType`, whichever is `isDefault` first — the
 * lookup every real "Print X" button in the app uses to find what to actually render. Returns
 * `null` only if a company somehow has zero templates for that type at all (shouldn't happen
 * given the seeded defaults, but a print action must never crash over it). */
export function usePrintTemplatesFor(documentType: PrintDocumentType) {
  const { data: all = [], isLoading } = usePrintTemplates()
  const templates = all.filter((t) => t.documentType === documentType)
  const defaultTemplate = templates.find((t) => t.isDefault) ?? templates[0] ?? null
  return { templates, defaultTemplate, isLoading }
}

export interface PrintTemplateInput {
  name: string
  documentType: PrintDocumentType
  paperWidth: PrintTemplateDoc['paperWidth']
  blocks: PrintTemplateBlock[]
}

export function useCreatePrintTemplate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PrintTemplateInput) => {
      const ref = doc(collection(db, printTemplatesCollection(companyId)))
      const now = serverTimestamp()
      const data: PrintTemplateDoc = {
        ...input,
        isDefault: false,
        protected: false,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'settings',
        entityType: 'Print Template',
        entityId: ref.id,
        entityLabel: data.name,
        targetLabel: printDocumentTypeLabel(input.documentType),
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) }),
  })
}

export function useUpdatePrintTemplate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PrintTemplateInput & { id: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, printTemplateDoc(companyId, input.id)), {
        name: input.name,
        paperWidth: input.paperWidth,
        blocks: input.blocks,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'Print Template',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) }),
  })
}

/** Atomically unsets `isDefault` on every other template of the same `documentType` and sets it
 * on the target — exactly one default per document type, same "only one X at a time" invariant
 * pattern as Financial Years' own activation. */
export function useSetDefaultPrintTemplate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { target: PrintTemplateWithId; siblings: PrintTemplateWithId[] }) => {
      const batch = writeBatch(db)
      for (const t of input.siblings) {
        if (t.id === input.target.id || t.documentType !== input.target.documentType || !t.isDefault) continue
        batch.update(doc(db, printTemplateDoc(companyId, t.id)), { isDefault: false, updatedAt: serverTimestamp() })
      }
      batch.update(doc(db, printTemplateDoc(companyId, input.target.id)), { isDefault: true, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Set Default',
        module: 'settings',
        entityType: 'Print Template',
        entityId: input.target.id,
        entityLabel: input.target.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) }),
  })
}

/** Only a non-`protected` template may ever reach this — the UI hides Delete on every seeded
 * default, and `firestore.rules` backs that up server-side. */
export function useDeletePrintTemplate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: PrintTemplateWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, printTemplateDoc(companyId, template.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'settings',
        entityType: 'Print Template',
        entityId: template.id,
        entityLabel: template.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) }),
  })
}
