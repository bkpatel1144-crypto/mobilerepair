import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { jobCardsCollection } from '@/lib/firestore-paths'
import type { JobCardDoc } from '@/types/firestore'

/**
 * Resolves a scanned/typed job card code (e.g. "JC-2026-27-00001", as printed on the job card's
 * own barcode/QR label — see BUILD_PLAN.md's Print Label formats) to its Firestore document id,
 * so the scanner can navigate straight to `/app/service/job-cards/:id`. Returns null if nothing
 * matches — the caller shows that as "no job card found for this code", not a crash.
 */
export async function findJobCardIdByNumber(
  companyId: string,
  jobNumber: string
): Promise<string | null> {
  const trimmed = jobNumber.trim()
  if (!trimmed) return null

  const snap = await getDocs(
    query(collection(db, jobCardsCollection(companyId)), where('jobNumber', '==', trimmed), limit(1))
  )
  if (snap.empty) return null
  return snap.docs[0].id
}

/** A QR label might encode a full deep link (e.g. `.../job-cards/{firestoreId}`) instead of the
 * plain job number — pull the id back out of that shape too, so either encoding scans correctly. */
export function extractJobNumberOrId(scannedText: string): { jobNumber?: string; rawId?: string } {
  const text = scannedText.trim()
  const idFromUrl = text.match(/job-cards\/([a-zA-Z0-9]{20})(?:[/?#]|$)/)
  if (idFromUrl) return { rawId: idFromUrl[1] }
  if (/^[a-zA-Z0-9]{20}$/.test(text)) return { rawId: text }
  return { jobNumber: text }
}

export type { JobCardDoc }
