import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  printTemplatesCollection,
  printTemplateDoc,
  printTemplateVersionsCollection,
  printTemplateVersionDoc,
} from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { printDocumentTypeLabel } from '@/config/print-fields'
import type {
  PrintDocumentType,
  PrintTemplateDoc,
  PrintTemplateDocV1,
  PrintTemplateVersionDoc,
} from '@/types/firestore'
import { migratePrintTemplate } from '@/lib/print-migrate'
import { buildTemplateFromPreset, missingPresets } from '@/lib/print-templates-seed'

export interface PrintTemplateWithId extends PrintTemplateDoc {
  id: string
}

export interface PrintTemplateVersionWithId extends PrintTemplateVersionDoc {
  id: string
}

export function printTemplateVersionsQueryKey(
  companyId: string | undefined,
  templateId: string | undefined
) {
  return ['printTemplateVersions', companyId, templateId] as const
}

/** Every superseded revision of one template, newest first. */
export function usePrintTemplateVersions(templateId: string | undefined) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: printTemplateVersionsQueryKey(companyId, templateId),
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, printTemplateVersionsCollection(companyId!, templateId!)),
          orderBy('version', 'desc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PrintTemplateVersionDoc) }))
    },
    enabled: !!companyId && !!templateId,
  })
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
      // Upgraded on read, not by a migration script — this project is client-SDK-only and has
      // no server that could sweep every tenant's collection. See `migratePrintTemplate`.
      return snap.docs.map((d) => ({
        id: d.id,
        ...migratePrintTemplate(d.data() as PrintTemplateDoc | PrintTemplateDocV1),
      }))
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

/** Everything the designer can change about a template. `documentType` is fixed at creation —
 * a template's field catalogue and print context both key off it, so retargeting an existing one
 * would silently invalidate every bound field on the canvas. */
export type PrintTemplateInput = Pick<
  PrintTemplateDoc,
  | 'name'
  | 'documentType'
  | 'category'
  | 'presetKey'
  | 'paper'
  | 'margins'
  | 'settings'
  | 'bandHeights'
  | 'elements'
>

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
        schemaVersion: 2,
        isActive: true,
        version: 1,
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
    mutationFn: async (
      input: PrintTemplateInput & { id: string; previous: PrintTemplateWithId }
    ) => {
      const batch = writeBatch(db)

      // Snapshot the outgoing revision in the same batch, so history can never record a version
      // that wasn't actually replaced — and never miss one that was.
      const previous = input.previous
      const snapshot: PrintTemplateVersionDoc = {
        version: previous.version,
        name: previous.name,
        presetKey: previous.presetKey,
        paper: previous.paper,
        margins: previous.margins,
        settings: previous.settings,
        bandHeights: previous.bandHeights,
        elements: previous.elements,
        supersededById: user!.uid,
        supersededByName: profile!.fullName,
        supersededAt: serverTimestamp() as never,
      }
      batch.set(doc(db, printTemplateVersionDoc(companyId, input.id, previous.version)), snapshot)

      batch.update(doc(db, printTemplateDoc(companyId, input.id)), {
        schemaVersion: 2,
        name: input.name,
        category: input.category,
        presetKey: input.presetKey,
        paper: input.paper,
        margins: input.margins,
        settings: input.settings,
        bandHeights: input.bandHeights,
        elements: input.elements,
        // Bumped on every save so a print run can record which revision produced it. Also the
        // moment a v1 document is rewritten in the v2 shape it was migrated into on read.
        version: increment(1),
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
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) })
      void queryClient.invalidateQueries({
        queryKey: printTemplateVersionsQueryKey(companyId, input.id),
      })
    },
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
        if (
          t.id === input.target.id ||
          t.documentType !== input.target.documentType ||
          !t.isDefault
        )
          continue
        batch.update(doc(db, printTemplateDoc(companyId, t.id)), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        })
      }
      batch.update(doc(db, printTemplateDoc(companyId, input.target.id)), {
        isDefault: true,
        updatedAt: serverTimestamp(),
      })
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

/**
 * Deletes a template, including a seeded default — `Add Missing Defaults` restores those from
 * the catalogue, so nothing here is unrecoverable. The UI refuses only the last format for a
 * document type, which would leave that type's print buttons with nothing to render.
 *
 * If the deleted one was the default, a sibling is promoted in the *same batch*. Otherwise the
 * document type would be left with formats but no default, and every print button for it would
 * silently fall back to whichever template happened to sort first.
 */
export function useDeletePrintTemplate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()
  const { data: all = [] } = usePrintTemplates()

  return useMutation({
    mutationFn: async (template: PrintTemplateWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, printTemplateDoc(companyId, template.id)))

      if (template.isDefault) {
        const heir = all.find(
          (t) => t.id !== template.id && t.documentType === template.documentType
        )
        if (heir) {
          batch.update(doc(db, printTemplateDoc(companyId, heir.id)), {
            isDefault: true,
            updatedAt: serverTimestamp(),
          })
        }
      }
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

/**
 * Adds any catalogue preset this company doesn't have yet — the "Add Missing Defaults" action.
 *
 * Exists because there is no server to run a migration: a company seeded before a preset joined
 * the catalogue, or one where a non-protected format was deleted, tops itself back up from the
 * client instead. Never touches an existing template, and never steals `isDefault` from one —
 * a preset marked default in the catalogue is only created as default if its document type has
 * no default at all right now.
 */
export function useAddMissingDefaults() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (existing: PrintTemplateWithId[]) => {
      const missing = missingPresets(existing)
      if (missing.length === 0) return 0

      const typesWithDefault = new Set(
        existing.filter((t) => t.isDefault).map((t) => t.documentType)
      )
      const batch = writeBatch(db)
      const now = serverTimestamp()

      for (const preset of missing) {
        const ref = doc(collection(db, printTemplatesCollection(companyId)))
        const data = buildTemplateFromPreset(preset, user!.uid, profile!.fullName, now)
        data.isDefault = preset.isDefault && !typesWithDefault.has(preset.documentType)
        if (data.isDefault) typesWithDefault.add(preset.documentType)
        batch.set(ref, data)
      }

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Add Missing Defaults',
        module: 'settings',
        entityType: 'Print Template',
        entityLabel: `${missing.length} template(s)`,
        details: { added: missing.map((m) => m.name) },
      })
      await batch.commit()
      return missing.length
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) }),
  })
}

/** Copies a template as a new, non-default, non-protected one. The copy is editable even when
 * the original is a protected seed — which is the point: it's how you customise a default
 * without losing the original to fall back on. */
export function useDuplicatePrintTemplate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (source: PrintTemplateWithId) => {
      const ref = doc(collection(db, printTemplatesCollection(companyId)))
      const now = serverTimestamp()
      const data: PrintTemplateDoc = {
        ...source,
        name: `${source.name} (Copy)`,
        isDefault: false,
        protected: false,
        version: 1,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      delete (data as Partial<PrintTemplateWithId>).id
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Duplicate',
        module: 'settings',
        entityType: 'Print Template',
        entityId: ref.id,
        entityLabel: data.name,
        targetLabel: source.name,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(companyId) }),
  })
}
