import { doc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { counterDoc } from '@/lib/firestore-paths'
import type { CounterDoc } from '@/types/firestore'

/**
 * Atomically increments and returns the next sequence number for `docType` within a company —
 * the only safe way to generate human-readable IDs like `JC-2026-27-00001`. A plain
 * "read the last doc, add 1, write" pattern race-conditions the moment two job cards get
 * created within the same second; a transaction against a dedicated counter doc can't.
 *
 * Not yet called from anywhere — Phase 5 (Job Cards, `JC-...`), Phase 6 (Receipts, `RCP-...`),
 * and Phase 7 (Parties `PTY-...`, Second Hand `SHDP-.../SHDS-...`) are its first real callers.
 * Written now, alongside the rest of the Phase 2 data-model infrastructure, per BUILD_PLAN.md.
 */
export async function getNextSequence(companyId: string, docType: string): Promise<number> {
  const ref = doc(db, counterDoc(companyId, docType))
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? (snap.data() as CounterDoc).lastSeq : 0
    const next = current + 1
    tx.set(ref, { lastSeq: next } satisfies CounterDoc, { merge: true })
    return next
  })
}

function pad(n: number, width: number) {
  return String(n).padStart(width, '0')
}

/** `JC-2026-27-00001` — financial-year-scoped, e.g. from `getCurrentFinancialYear().name`
 * ("FY 2026-27") with the "FY " prefix stripped. */
export function formatJobCardId(fyLabel: string, seq: number) {
  return `JC-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `PTY-2026-27-00001` */
export function formatPartyId(fyLabel: string, seq: number) {
  return `PTY-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `SHDP-2026-27-00001` (Second Hand Device Purchase) */
export function formatSecondHandPurchaseId(fyLabel: string, seq: number) {
  return `SHDP-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `SHDS-2026-27-00001` (Second Hand Device Sale) */
export function formatSecondHandSaleId(fyLabel: string, seq: number) {
  return `SHDS-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `RCP-2609-00001` — ddMM-scoped (day+month of the receipt date), not financial-year-scoped,
 * matching the exact format observed in SCREENS_NOTES.md (e.g. "RCP-2609-00001" for 26 Sept). */
export function formatReceiptId(receiptDate: Date, seq: number) {
  const dd = pad(receiptDate.getDate(), 2)
  const mm = pad(receiptDate.getMonth() + 1, 2)
  return `RCP-${dd}${mm}-${pad(seq, 5)}`
}
