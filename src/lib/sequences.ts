import { doc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { counterDoc } from '@/lib/firestore-paths'
import { i18next } from '@/lib/i18n'
import { isOffline } from '@/lib/connection'
import type { CounterDoc } from '@/types/firestore'

/**
 * Thrown instead of hanging when there is no connection.
 *
 * Every human-readable id in this app comes from `getNextSequence`, and a `runTransaction`
 * cannot complete offline — it retries until it gives up, which at a counter looks like a save
 * that froze and then did nothing. Eleven hooks call this, and each one reports `err.message`
 * to the user, so failing fast here gives all eleven a real explanation for the price of one.
 *
 * The message is translated at throw time through the i18next instance directly: this is a
 * module, not a component, and the alternative was threading `t` through eleven call sites.
 */
export class OfflineError extends Error {
  readonly code = 'offline'
  constructor() {
    super(i18next.t('shared.offlineCannotCreate'))
    this.name = 'OfflineError'
  }
}

export { isOffline } from '@/lib/connection'

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
  // Checked before the transaction rather than left to fail: `navigator.onLine` is pessimistic
  // (it can say "online" on a network with no route out), so this only ever short-circuits a
  // call that was going to fail anyway, and never decides that a write succeeded.
  if (isOffline()) throw new OfflineError()
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

/**
 * `INV-2026-27-00001` — the tax invoice series, minted at Generate Bill.
 *
 * Deliberately separate from the job number. A job card is an internal work order and its
 * numbering is allowed gaps so it can be issued offline from a reserved block; a tax invoice
 * series has to stay consecutive for a GST-registered shop. Conflating the two meant one of
 * those two properties had to give. See `OFFLINE_NUMBERING.md`.
 */
export function formatInvoiceId(fyLabel: string, seq: number) {
  return `INV-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
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

/** `PAY-2609-00001` — money going *out*, numbered the same ddMM way an incoming receipt is.
 *
 * A different prefix rather than a shared `RCP-` run, because the two are read side by side: the
 * job card's Receipts row shows `RCP-2609-00001 ₹250` next to `PAY-2609-00001 −₹5`, and a
 * refund that looked like a receipt would read as money taken twice. They share the `receipts`
 * sequence, so a number is never issued for both. */
export function formatPaymentOutId(paymentDate: Date, seq: number) {
  const dd = pad(paymentDate.getDate(), 2)
  const mm = pad(paymentDate.getMonth() + 1, 2)
  return `PAY-${dd}${mm}-${pad(seq, 5)}`
}

/** `JPU-2026-27-00001` — a purchase raised *for a job*, "JPU" for Job PUrchase.
 *
 * Its own prefix rather than a shared purchase run, because the list shows the two side by side
 * and distinguishes them with a "From Job" badge: the number is the first thing a shopkeeper
 * reads, and it should already say where the entry came from. Financial-year-scoped like the
 * job card it belongs to, so the two line up in a year's books. */
export function formatJobPurchaseId(fyLabel: string, seq: number) {
  return `JPU-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `PUR-2026-27-00001` — a purchase entered by hand rather than raised from a job. */
export function formatPurchaseId(fyLabel: string, seq: number) {
  return `PUR-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `EXP-2026-27-00001` — financial-year-scoped like Job Cards, not day-scoped like receipts.
 * An expense is a book entry people look up by year, not a counter slip. */
export function formatExpenseId(fyLabel: string, seq: number) {
  return `EXP-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}

/** `SB-2026-27-00001` (Supplier Bill) */
export function formatSupplierBillId(fyLabel: string, seq: number) {
  return `SB-${fyLabel.replace(/^FY\s*/, '')}-${pad(seq, 5)}`
}
