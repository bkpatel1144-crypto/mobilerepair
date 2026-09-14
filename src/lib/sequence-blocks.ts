import { doc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { counterDoc } from '@/lib/firestore-paths'
import { OfflineError, isOffline } from '@/lib/sequences'
import type { CounterDoc } from '@/types/firestore'

/**
 * Numbers a device can issue with no connection.
 *
 * A `runTransaction` cannot complete offline, so a counter that is read and incremented per
 * document means no job card can be created on a dropped line — which at a repair counter is a
 * normal Tuesday, not an edge case.
 *
 * The fix is to move the transaction earlier: while connected, a device claims a **block** of
 * numbers by advancing the shared counter once, and then issues from that block locally. Two
 * devices can never collide because no two devices hold the same block, and a number is final
 * the moment it is issued — a printed job-card slip never has to be renumbered.
 *
 * The cost is gaps. A block that is only half used, or a browser whose storage is cleared,
 * leaves numbers that are never issued. That is acceptable for a **job card**, which is an
 * internal work order. It is deliberately not used for `invoices`, whose series must stay
 * consecutive for a GST-registered shop — see `OFFLINE_NUMBERING.md`.
 */

/** Twenty is about a busy day at one counter: large enough that a shop rarely runs a block dry
 *  while offline, small enough that losing one to cleared storage is not a visible hole. */
export const BLOCK_SIZE = 20

/** Reserve a fresh block once fewer than this many numbers are left, while there is still a
 *  connection to do it over. */
export const TOP_UP_AT = 5

export interface SequenceBlock {
  /** First number in the block. */
  from: number
  /** Last number in the block, inclusive. */
  to: number
  /** The next number to issue. Past `to` once the block is spent. */
  next: number
}

export function blockStorageKey(companyId: string, docType: string): string {
  return `aim-seq-block:${companyId}:${docType}`
}

/** How many numbers are left to issue. Never negative. */
export function blockRemaining(block: SequenceBlock | null): number {
  if (!block) return 0
  return Math.max(0, block.to - block.next + 1)
}

/** Takes the next number, returning the number and the block as it now stands. `null` when the
 *  block is spent — the caller has to reserve another, which needs a connection. */
export function takeFromBlock(
  block: SequenceBlock | null
): { seq: number; block: SequenceBlock } | null {
  if (!block || blockRemaining(block) === 0) return null
  return { seq: block.next, block: { ...block, next: block.next + 1 } }
}

/** A reserved range as a block ready to issue from. */
export function blockFromRange(from: number, size: number): SequenceBlock {
  return { from, to: from + size - 1, next: from }
}

/**
 * Reads the block this device holds.
 *
 * Storage is per browser, which is exactly the granularity wanted: the block belongs to the
 * device that will be issuing numbers from it. A read that throws (private mode, storage
 * disabled) is treated as "no block", so the app falls back to needing a connection rather than
 * breaking.
 */
export function readBlock(companyId: string, docType: string): SequenceBlock | null {
  try {
    const raw = window.localStorage.getItem(blockStorageKey(companyId, docType))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SequenceBlock>
    if (
      typeof parsed.from !== 'number' ||
      typeof parsed.to !== 'number' ||
      typeof parsed.next !== 'number'
    ) {
      return null
    }
    return { from: parsed.from, to: parsed.to, next: parsed.next }
  } catch {
    return null
  }
}

export function writeBlock(companyId: string, docType: string, block: SequenceBlock): void {
  try {
    window.localStorage.setItem(blockStorageKey(companyId, docType), JSON.stringify(block))
  } catch {
    // Storage full or blocked. The number has already been issued and the document is about to
    // be written with it; losing the bookmark costs a re-reservation, not correctness.
  }
}

/** Claims the next `size` numbers for this device by advancing the shared counter once. */
export async function reserveBlock(
  companyId: string,
  docType: string,
  size = BLOCK_SIZE
): Promise<SequenceBlock> {
  if (isOffline()) throw new OfflineError()
  const ref = doc(db, counterDoc(companyId, docType))
  const from = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? (snap.data() as CounterDoc).lastSeq : 0
    tx.set(ref, { lastSeq: current + size } satisfies CounterDoc, { merge: true })
    return current + 1
  })
  return blockFromRange(from, size)
}

/**
 * The next number for a document type that is allowed to have gaps.
 *
 * Always issues from the block, online or off, so the same code path runs either way — two paths
 * would interleave block numbers with directly-transacted ones and produce duplicates.
 *
 * Tops the block up opportunistically while there is a connection, so a device that has been
 * online all morning still has numbers in hand when the line drops at lunchtime.
 */
export async function getNextBlockSequence(companyId: string, docType: string): Promise<number> {
  let block = readBlock(companyId, docType)

  if (blockRemaining(block) === 0) {
    // Nothing left — this one genuinely needs a connection.
    block = await reserveBlock(companyId, docType)
  }

  const taken = takeFromBlock(block)
  if (!taken) throw new OfflineError()
  writeBlock(companyId, docType, taken.block)

  // Top up for later, not for now. Failure is ignored on purpose: the number just issued is
  // valid, and refusing the save because the *next* reservation failed would be absurd.
  if (!isOffline() && blockRemaining(taken.block) <= TOP_UP_AT) {
    void reserveBlock(companyId, docType)
      .then((fresh) => {
        // Only extend a block that is still the one just used — another tab may have taken
        // numbers in the meantime, and overwriting its bookmark would re-issue them.
        const current = readBlock(companyId, docType)
        if (current && current.to === taken.block.to && blockRemaining(current) <= TOP_UP_AT) {
          writeBlock(companyId, docType, {
            from: current.from,
            to: fresh.to,
            next: current.next,
          })
        }
      })
      .catch(() => {})
  }

  return taken.seq
}

/** Can this device issue a number right now without a connection? Used to decide whether a form
 *  can be offered offline at all, rather than to decide that a write succeeded. */
export function canIssueOffline(companyId: string, docType: string): boolean {
  return blockRemaining(readBlock(companyId, docType)) > 0
}
