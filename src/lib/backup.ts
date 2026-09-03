import { collection, doc, getDocs, query, where, writeBatch, type DocumentData } from 'firebase/firestore'
import { getDownloadURL, ref, uploadString } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { BACKUP_COLLECTIONS, SERVICE_OPTION_TYPES } from '@/config/backup-collections'
import { jobTimelineCollection, serviceOptionsCollection, usersCollection } from '@/lib/firestore-paths'

export const BACKUP_FORMAT_VERSION = 1

/** The full shape "Backup Now"/"Download Backup" produce and "Restore from File" reads back —
 * `_meta` lets a restore validate a selected file is actually one of these before touching
 * anything, rather than guessing from raw shape alone. */
export interface BackupSnapshot {
  _meta: {
    formatVersion: number
    companyId: string
    companyName: string
    exportedAt: string
    collectionCounts: Record<string, number>
  }
  collections: Record<string, DocumentData[]>
  serviceOptions: Record<string, DocumentData[]>
  users: DocumentData[]
}

/** Real Firestore doc counts across every collection this backup would walk — backs the
 * "Current Database" stat cards (`preview.webp`'s own "Data Sets"/"Records"). A live count, not
 * a cached/estimated one — fetches every collection exactly once, same cost as an actual backup
 * would, since there's no cheaper way to get an exact count without a maintained counter doc per
 * collection (which nothing in this app keeps for most of these). */
export async function getDatabaseStats(companyId: string): Promise<{ dataSets: number; records: number; approxSizeBytes: number }> {
  const snapshot = await buildBackupSnapshot(companyId, 'Stats')
  const json = JSON.stringify(snapshot)
  const dataSets = Object.keys(snapshot._meta.collectionCounts).length
  const records = Object.values(snapshot._meta.collectionCounts).reduce((s, n) => s + n, 0)
  return { dataSets, records, approxSizeBytes: new Blob([json]).size }
}

/** Walks every collection in `BACKUP_COLLECTIONS`, the 8 `serviceOptions` sub-collections, this
 * company's own slice of the top-level `users` collection, and each job card's own `timeline`
 * subcollection (folded onto that job's own record as `__timeline`) — see
 * `src/config/backup-collections.ts`'s own doc comment for exactly what's deliberately excluded
 * and why. */
export async function buildBackupSnapshot(companyId: string, companyName: string): Promise<BackupSnapshot> {
  const collections: Record<string, DocumentData[]> = {}
  const collectionCounts: Record<string, number> = {}

  // Every collection here is independent of every other — fetched concurrently via `Promise.all`
  // rather than one at a time, which previously made a real backup (or just checking "Current
  // Database" stats) take one full network round trip *per collection*, sequentially. A job
  // card's own `timeline` subcollection reads (one per job) are the one genuinely nested,
  // per-document fetch — parallelized across jobs too, for the same reason.
  await Promise.all(
    BACKUP_COLLECTIONS.map(async (c) => {
      const snap = await getDocs(collection(db, c.path(companyId)))
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (c.key === 'jobCards') {
        await Promise.all(
          docs.map(async (jobDoc) => {
            const timelineSnap = await getDocs(collection(db, jobTimelineCollection(companyId, jobDoc.id as string)))
            ;(jobDoc as DocumentData).__timeline = timelineSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          })
        )
      }
      collections[c.key] = docs
      collectionCounts[c.key] = docs.length
    })
  )

  const serviceOptions: Record<string, DocumentData[]> = {}
  await Promise.all(
    SERVICE_OPTION_TYPES.map(async (type) => {
      const snap = await getDocs(collection(db, serviceOptionsCollection(companyId, type)))
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      serviceOptions[type] = docs
      collectionCounts[`serviceOptions.${type}`] = docs.length
    })
  )

  const usersSnap = await getDocs(query(collection(db, usersCollection()), where('companyId', '==', companyId)))
  const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  collectionCounts.users = users.length

  return {
    _meta: {
      formatVersion: BACKUP_FORMAT_VERSION,
      companyId,
      companyName,
      exportedAt: new Date().toISOString(),
      collectionCounts,
    },
    collections,
    serviceOptions,
    users,
  }
}

export function triggerJsonDownload(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Uploads a snapshot's JSON to Firebase Storage under the company's own path — the real
 * mechanism behind "Backup Now" (BUILD_PLAN's own spec: "serializes a JSON snapshot to Firebase
 * Storage under the company's path"), not just a client-side download. Returns the storage path
 * and a fresh download URL. */
export async function uploadBackupJson(
  companyId: string,
  fileName: string,
  snapshot: BackupSnapshot,
  folder: 'backups' | 'archives' = 'backups'
): Promise<{ storagePath: string; downloadUrl: string; sizeBytes: number }> {
  const json = JSON.stringify(snapshot)
  const storagePath = `companies/${companyId}/${folder}/${fileName}`
  const fileRef = ref(storage, storagePath)
  await uploadString(fileRef, json, 'raw', { contentType: 'application/json' })
  const downloadUrl = await getDownloadURL(fileRef)
  return { storagePath, downloadUrl, sizeBytes: new Blob([json]).size }
}

export function isValidBackupShape(data: unknown): data is BackupSnapshot {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d._meta === 'object' &&
    d._meta !== null &&
    typeof (d._meta as Record<string, unknown>).companyId === 'string' &&
    typeof d.collections === 'object' &&
    typeof d.serviceOptions === 'object' &&
    Array.isArray(d.users)
  )
}

/** The "overwrite live data" restore path — `set()`s every document from the snapshot back into
 * its live collection by the *same id* it was exported with (an honest merge/overwrite of
 * matching documents, not a full delete-then-replace — a document that exists live but wasn't in
 * the backup is left alone, since a destructive "delete everything not in this file" restore is a
 * much larger, riskier promise than what "restore my data" usually means). Chunked into batches
 * of ≤450 writes (Firestore's own limit is 500; kept under it since each job card write is
 * followed by its own timeline sub-writes in the same batch). */
export async function restoreOverwriteLive(companyId: string, snapshot: BackupSnapshot): Promise<number> {
  let writeCount = 0
  let batch = writeBatch(db)

  async function flushIfNeeded() {
    if (writeCount >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      writeCount = 0
    }
  }

  for (const c of BACKUP_COLLECTIONS) {
    const docs = snapshot.collections[c.key] ?? []
    for (const docData of docs) {
      const { id, __timeline, ...rest } = docData as DocumentData & { id: string; __timeline?: DocumentData[] }
      batch.set(doc(db, c.path(companyId), id), rest)
      writeCount++
      await flushIfNeeded()
      if (c.key === 'jobCards' && Array.isArray(__timeline)) {
        for (const eventData of __timeline) {
          const { id: eventId, ...eventRest } = eventData as DocumentData & { id: string }
          batch.set(doc(db, jobTimelineCollection(companyId, id), eventId), eventRest)
          writeCount++
          await flushIfNeeded()
        }
      }
    }
  }

  for (const type of SERVICE_OPTION_TYPES) {
    const docs = snapshot.serviceOptions[type] ?? []
    for (const docData of docs) {
      const { id, ...rest } = docData as DocumentData & { id: string }
      batch.set(doc(db, serviceOptionsCollection(companyId, type), id), rest)
      writeCount++
      await flushIfNeeded()
    }
  }

  // Users are restored by profile fields only, never touching Firebase Auth — a restored user
  // doc for a uid with no matching Auth account would be an orphan, but that's the same shape
  // `completeAccountSetup()` already knows how to recognize and recover from.
  for (const userData of snapshot.users) {
    const { id, ...rest } = userData as DocumentData & { id: string }
    batch.set(doc(db, usersCollection(), id), rest)
    writeCount++
    await flushIfNeeded()
  }

  if (writeCount > 0) await batch.commit()

  return Object.values(snapshot._meta.collectionCounts).reduce((s, n) => s + n, 0)
}
