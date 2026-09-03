import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { archivesCollection, backupsCollection, backupSettingsDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import {
  buildBackupSnapshot,
  getDatabaseStats,
  isValidBackupShape,
  restoreOverwriteLive,
  triggerJsonDownload,
  uploadBackupJson,
  type BackupSnapshot,
} from '@/lib/backup'
import type { ArchiveDoc, BackupDoc, BackupSettingsDoc } from '@/types/firestore'

export interface BackupWithId extends BackupDoc {
  id: string
}
export interface ArchiveWithId extends ArchiveDoc {
  id: string
}

function backupFileName(companyCode: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `backup_${companyCode}_${stamp}.json`
}

export function databaseStatsQueryKey(companyId: string | undefined) {
  return ['databaseStats', companyId] as const
}
export function useDatabaseStats() {
  const { profile } = useAuth()
  const companyId = profile?.companyId
  return useQuery({
    queryKey: databaseStatsQueryKey(companyId),
    queryFn: () => getDatabaseStats(companyId!),
    enabled: !!companyId,
    staleTime: 60_000,
  })
}

export function backupsQueryKey(companyId: string | undefined) {
  return ['backups', companyId] as const
}
export function useBackups() {
  const { profile } = useAuth()
  const companyId = profile?.companyId
  return useQuery({
    queryKey: backupsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, backupsCollection(companyId!)))
      const now = new Date().getTime()
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as BackupDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

export function archivesQueryKey(companyId: string | undefined) {
  return ['archives', companyId] as const
}
export function useArchives() {
  const { profile } = useAuth()
  const companyId = profile?.companyId
  return useQuery({
    queryKey: archivesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, archivesCollection(companyId!)))
      const now = new Date().getTime()
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as ArchiveDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

export function backupSettingsQueryKey(companyId: string | undefined) {
  return ['backupSettings', companyId] as const
}
export function useBackupSettings() {
  const { profile } = useAuth()
  const companyId = profile?.companyId
  return useQuery({
    queryKey: backupSettingsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, backupSettingsDoc(companyId!)))
      if (!snap.exists()) return { dailyAutoBackupEnabled: false, timeOfDay: '02:00', keepForDays: 7 } as BackupSettingsDoc
      return snap.data() as BackupSettingsDoc
    },
    enabled: !!companyId,
  })
}
export function useUpdateBackupSettings() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<BackupSettingsDoc, 'dailyAutoBackupEnabled' | 'timeOfDay' | 'keepForDays'>) => {
      await setDoc(doc(db, backupSettingsDoc(companyId)), { ...input, updatedAt: serverTimestamp() })
      // Advisory-preference-only write (see `BackupSettingsDoc`'s own doc comment) — not routed
      // through `addAuditLogToBatch` since it never touches real business data, same "noise
      // avoidance" call already made for a couple of other low-stakes preference toggles.
      void auditContextFrom(user!, profile!)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: backupSettingsQueryKey(companyId) }),
  })
}

/** "Backup Now" — builds a real snapshot, uploads it to Storage, and records the metadata doc,
 * all for real; not a decorative progress bar over nothing. */
export function useCreateBackup() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyName: string) => {
      const snapshot = await buildBackupSnapshot(companyId, companyName)
      const fileName = backupFileName(profile!.companyId.slice(0, 6))
      const { storagePath, sizeBytes } = await uploadBackupJson(companyId, fileName, snapshot)

      const ref = doc(collection(db, backupsCollection(companyId)))
      const now = serverTimestamp()
      const data: BackupDoc = {
        storagePath,
        fileName,
        sizeBytes,
        collectionCounts: snapshot._meta.collectionCounts,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Backup Now',
        module: 'settings',
        entityType: 'Backup',
        entityId: ref.id,
        entityLabel: fileName,
        critical: true,
        details: { sizeBytes, collectionCounts: snapshot._meta.collectionCounts },
      })
      await batch.commit()
      return snapshot
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupsQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: databaseStatsQueryKey(companyId) })
    },
  })
}

/** "Download Backup" — a fresh snapshot straight to the browser's own download, independent of
 * whether a Storage-backed "Backup Now" has ever been run (Google Drive/Storage connectivity
 * isn't required for this path, matching `preview.webp`'s own "Direct download works without
 * it" note). */
export function useDownloadBackup() {
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async (companyName: string) => {
      const snapshot = await buildBackupSnapshot(profile!.companyId, companyName)
      triggerJsonDownload(backupFileName(profile!.companyId.slice(0, 6)), snapshot)
    },
  })
}

/** "Restore from File" → "Restore as Archive" (the safe path) — parses and validates the
 * uploaded file, re-uploads its content to Storage under `archives/`, and records an `ArchiveDoc`
 * pointing at it. Live data is never touched. */
export function useRestoreAsArchive() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('That file is not valid JSON.')
      }
      if (!isValidBackupShape(parsed)) throw new Error('That file does not look like a real backup export.')
      const snapshot = parsed

      const fileName = `archive_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
      const { storagePath, sizeBytes } = await uploadBackupJson(companyId, fileName, snapshot, 'archives')

      const ref = doc(collection(db, archivesCollection(companyId)))
      const now = serverTimestamp()
      const data: ArchiveDoc = {
        label: `Restored from ${file.name}`,
        storagePath,
        sizeBytes,
        collectionCounts: snapshot._meta.collectionCounts,
        sourceFileName: file.name,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Restore as Archive',
        module: 'settings',
        entityType: 'Archive',
        entityId: ref.id,
        entityLabel: data.label,
        critical: true,
        details: { sourceFileName: file.name, collectionCounts: snapshot._meta.collectionCounts },
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: archivesQueryKey(companyId) }),
  })
}

/** "Restore from File" → "Overwrite live data" (the dangerous path, behind the UI's own strong
 * confirm) — genuinely writes every document back into its live collection. See
 * `restoreOverwriteLive()`'s own doc comment for exactly what "restore" means here (a real
 * document-level merge/overwrite by id, never a destructive delete-everything-else). */
export function useRestoreOverwriteLive() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('That file is not valid JSON.')
      }
      if (!isValidBackupShape(parsed)) throw new Error('That file does not look like a real backup export.')
      const snapshot: BackupSnapshot = parsed
      if (snapshot._meta.companyId !== companyId) {
        throw new Error('This backup was exported from a different company and cannot be restored here.')
      }

      const restoredCount = await restoreOverwriteLive(companyId, snapshot)

      const batch = writeBatch(db)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Restore (Overwrite Live Data)',
        module: 'settings',
        entityType: 'Backup',
        entityId: null,
        entityLabel: 'Live data restore',
        critical: true,
        details: { sourceFileName: 'uploaded file', restoredDocumentCount: restoredCount, collectionCounts: snapshot._meta.collectionCounts },
      })
      await batch.commit()
      return restoredCount
    },
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
