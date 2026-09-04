import { collection, doc, serverTimestamp, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { printTemplatesCollection } from '@/lib/firestore-paths'
import { PRINT_PRESETS, type PrintPresetDef } from '@/config/print-presets'
import { buildDefaultLayout } from '@/config/print-layouts'
import type { PrintTemplateDoc } from '@/types/firestore'

/**
 * Builds the document for one catalogue preset. Paper/margins/settings come from
 * `print-presets.ts` (transcribed from `data/document-templates.json`); the element content
 * comes from `print-layouts.ts`, because that export carries no layout data of its own.
 */
export function buildTemplateFromPreset(
  preset: PrintPresetDef,
  uid: string,
  userName: string,
  now: unknown
): PrintTemplateDoc {
  const layout = buildDefaultLayout(preset)
  return {
    schemaVersion: 2,
    name: preset.name,
    documentType: preset.documentType,
    category: preset.category,
    presetKey: preset.presetKey,
    paper: preset.paper,
    margins: preset.margins,
    settings: preset.settings,
    bandHeights: layout.bandHeights,
    elements: layout.elements,
    isDefault: preset.isDefault,
    isActive: true,
    version: 1,
    protected: true,
    createdById: uid,
    createdByName: userName,
    createdAt: now as never,
    updatedAt: now as never,
  }
}

/**
 * Adds the full default template catalogue to `batch` — called from `seedTenantForUser()`
 * alongside every other seeded dataset, so a fresh company's Print Formats page (and every real
 * print button elsewhere) has something to render from the very first signup.
 *
 * All 19 presets, not one per document type: a shop with a 58mm counter printer and an 80mm
 * back-office one needs both formats present to pick between, which is exactly why the source
 * catalogue ships several per type. Exactly one per document type is `isDefault`.
 */
export function addDefaultPrintTemplatesToBatch(
  batch: WriteBatch,
  companyId: string,
  uid: string,
  userName: string
): void {
  const now = serverTimestamp()
  for (const preset of PRINT_PRESETS) {
    const ref = doc(collection(db, printTemplatesCollection(companyId)))
    batch.set(ref, buildTemplateFromPreset(preset, uid, userName, now))
  }
}

/**
 * Which catalogue presets a company is missing, by (documentType, presetKey, name).
 *
 * Backs the "Add Missing Defaults" action: a company seeded before a preset was added to the
 * catalogue — or one where somebody deleted a non-protected format — can top itself back up
 * without a migration script, which this project has no server to run. Matching on name as well
 * as preset key keeps it from re-adding a format the user renamed.
 */
export function missingPresets(
  existing: { documentType: string; presetKey: string | null; name: string }[]
): PrintPresetDef[] {
  return PRINT_PRESETS.filter(
    (p) =>
      !existing.some(
        (e) =>
          e.documentType === p.documentType &&
          (e.presetKey === p.presetKey || e.name === p.name)
      )
  )
}
