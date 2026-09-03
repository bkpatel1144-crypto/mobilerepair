import { useRef, useState } from 'react'
import {
  DatabaseZap,
  RefreshCw,
  Download,
  Clock,
  AlertTriangle,
  Archive as ArchiveIcon,
  Upload,
  Save,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import {
  useDatabaseStats,
  useBackups,
  useArchives,
  useBackupSettings,
  useUpdateBackupSettings,
  useCreateBackup,
  useDownloadBackup,
  useRestoreAsArchive,
  useRestoreOverwriteLive,
} from '@/hooks/use-backups'
import { formatTimestamp } from '@/lib/utils'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CONFIRM_PHRASE = 'OVERWRITE'

/** `preview.webp` — real doc counts, a real "Backup Now"/"Download Backup" pipeline
 * (`src/lib/backup.ts`), and a real (if genuinely dangerous) restore path. Deliberately does
 * *not* build the reference's own "Google Drive not connected" banner/connect flow — this
 * project is client-SDK-only with no server to run that OAuth handshake, so backups go straight
 * to this company's own Firebase Storage path instead (BUILD_PLAN's own explicit spec). */
export function BackupRestorePage() {
  const { profile } = useAuth()
  const stats = useDatabaseStats()
  const { data: backups = [], isLoading: backupsLoading } = useBackups()
  const { data: archives = [], isLoading: archivesLoading } = useArchives()
  const { data: settings } = useBackupSettings()
  const updateSettings = useUpdateBackupSettings()
  const createBackup = useCreateBackup()
  const downloadBackup = useDownloadBackup()
  const restoreAsArchive = useRestoreAsArchive()
  const restoreOverwrite = useRestoreOverwriteLive()

  const [dailyEnabled, setDailyEnabled] = useState<boolean | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<string | null>(null)
  const [keepForDays, setKeepForDays] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const effectiveDaily = dailyEnabled ?? settings?.dailyAutoBackupEnabled ?? false
  const effectiveTime = timeOfDay ?? settings?.timeOfDay ?? '02:00'
  const effectiveKeepDays = keepForDays ?? settings?.keepForDays ?? 7
  const schedulerDirty = dailyEnabled !== null || timeOfDay !== null || keepForDays !== null

  async function handleSaveScheduler() {
    await updateSettings.mutateAsync({ dailyAutoBackupEnabled: effectiveDaily, timeOfDay: effectiveTime, keepForDays: effectiveKeepDays })
    setDailyEnabled(null)
    setTimeOfDay(null)
    setKeepForDays(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRestoreError(null)
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  async function handleRestoreAsArchive() {
    if (!selectedFile) return
    setRestoreError(null)
    try {
      await restoreAsArchive.mutateAsync(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Restore failed.')
    }
  }

  async function handleConfirmOverwrite(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || confirmText !== CONFIRM_PHRASE) return
    setRestoreError(null)
    try {
      await restoreOverwrite.mutateAsync(selectedFile)
      setConfirmOverwrite(false)
      setConfirmText('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Restore failed.')
      setConfirmOverwrite(false)
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={DatabaseZap}
        title="Backup & Restore"
        subtitle="Download backups, schedule daily backups, and restore data safely"
        actions={
          <Button type="button" variant="outline" onClick={() => stats.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <DatabaseZap className="size-4 text-muted-foreground" />
            Current Database
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold tabular-nums">{stats.data?.dataSets ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Data Sets</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold tabular-nums">{stats.data?.records ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Records</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold tabular-nums">{stats.data ? formatBytes(stats.data.approxSizeBytes) : '—'}</p>
              <p className="text-xs text-muted-foreground">Data Size</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Create Backup</p>
          <p className="text-sm text-muted-foreground">A backup contains your complete company data as a JSON snapshot.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => profile && createBackup.mutate(profile.fullName)}
              disabled={!profile || createBackup.isPending}
            >
              <Save className="size-4" />
              {createBackup.isPending ? 'Backing up…' : 'Backup Now'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => profile && downloadBackup.mutate(profile.fullName)}
              disabled={!profile || downloadBackup.isPending}
            >
              <Download className="size-4" />
              {downloadBackup.isPending ? 'Preparing…' : 'Download Backup'}
            </Button>
          </div>
          {createBackup.isError && (
            <p className="text-sm text-red-600">
              Backup failed: {createBackup.error instanceof Error ? createBackup.error.message : 'Something went wrong.'} Please try again.
            </p>
          )}
          {downloadBackup.isError && (
            <p className="text-sm text-red-600">
              Download failed: {downloadBackup.error instanceof Error ? downloadBackup.error.message : 'Something went wrong.'} Please try again.
            </p>
          )}

          <div className="space-y-2 border-t pt-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={effectiveDaily} onCheckedChange={(v) => setDailyEnabled(v === true)} />
              <Clock className="size-3.5 text-muted-foreground" />
              Daily automatic backup
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={effectiveTime} onChange={(e) => setTimeOfDay(e.target.value)} disabled={!effectiveDaily} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Keep for (days)</Label>
                <Input type="number" min={1} value={effectiveKeepDays} onChange={(e) => setKeepForDays(Number(e.target.value) || 1)} disabled={!effectiveDaily} className="h-8" />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleSaveScheduler} disabled={!schedulerDirty || updateSettings.isPending} className="col-span-2 sm:col-span-1">
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Persists your preference, but can't fire itself unattended — this project has no server/Cloud Function/cron to run a schedule. Use "Backup Now" for a real backup today.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="size-4 text-muted-foreground" />
          Backup History
          {!backupsLoading && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{backups.length}</span>
          )}
        </p>
        {backupsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : backups.length === 0 ? (
          <EmptyState icon={Clock} title="No backups yet." description="Create your first backup above." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-sm whitespace-nowrap">
              <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="p-2 text-left">File</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-left">By</th>
                  <th className="p-2 text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{b.fileName}</td>
                    <td className="p-2">{formatTimestamp(b.createdAt)}</td>
                    <td className="p-2">{b.createdByName}</td>
                    <td className="p-2 text-right">{formatBytes(b.sizeBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-dashed border-amber-300 bg-card p-4 dark:border-amber-500/40">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            Restore from File
          </p>
          <p className="text-sm text-muted-foreground">
            Upload a previously downloaded backup file (.json). You can restore it as a separate read-only archive (safe) or replace your live data (dangerous).
          </p>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileChange} className="text-sm" />
          {restoreError && <p className="text-sm text-red-600">{restoreError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleRestoreAsArchive} disabled={!selectedFile || restoreAsArchive.isPending}>
              <ArchiveIcon className="size-4" />
              {restoreAsArchive.isPending ? 'Restoring…' : 'Restore as Archive (Safe)'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40"
              onClick={() => setConfirmOverwrite(true)}
              disabled={!selectedFile}
            >
              <Upload className="size-4" />
              Overwrite Live Data (Dangerous)
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <ArchiveIcon className="size-4 text-muted-foreground" />
            Archives
            {!archivesLoading && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{archives.length}</span>
            )}
          </p>
          {archivesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : archives.length === 0 ? (
            <EmptyState
              icon={ArchiveIcon}
              title="No archives."
              description="Restoring a backup as an archive creates a separate read-only copy of your data — useful for viewing old records without touching what's live."
            />
          ) : (
            <div className="space-y-2">
              {archives.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <p className="font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(a.createdAt)} · {formatBytes(a.sizeBytes)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{Object.values(a.collectionCounts).reduce((s, n) => s + n, 0)} records</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormModal
        open={confirmOverwrite}
        onOpenChange={(o) => {
          setConfirmOverwrite(o)
          if (!o) setConfirmText('')
        }}
        title="Overwrite Live Data"
        description="This writes every document from the uploaded file back into your live company data, overwriting anything with a matching ID. This cannot be undone from within the app."
        onSubmit={handleConfirmOverwrite}
        submitLabel="Overwrite Live Data"
        submitDisabled={confirmText !== CONFIRM_PHRASE}
        isSubmitting={restoreOverwrite.isPending}
      >
        <div className="space-y-1.5">
          <Label>
            Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to confirm
          </Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
        </div>
      </FormModal>
    </div>
  )
}
