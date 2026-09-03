import { useState } from 'react'
import { ShieldCheck, Plus, Pencil, Trash2, Ban, CheckCircle2, MoreVertical } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useIpWhitelist,
  useMyIp,
  useCreateIpWhitelistEntry,
  useUpdateIpWhitelistEntry,
  useDeleteIpWhitelistEntry,
  type IpWhitelistWithId,
} from '@/hooks/use-ip-whitelist'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'
import { formatTimestamp } from '@/lib/utils'

export function IpWhitelistPage() {
  const { data: entries = [], isLoading } = useIpWhitelist()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('administration', 'ipWhitelist', 'update'))

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<IpWhitelistWithId | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IpWhitelistWithId | null>(null)

  const filtered = entries.filter((e) => `${e.label} ${e.ipOrCidr}`.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<IpWhitelistWithId>[] = [
    { key: 'label', header: 'Label', sortValue: (e) => e.label, render: (e) => <span className="font-medium">{e.label}</span> },
    { key: 'ip', header: 'IP / CIDR', render: (e) => <span className="font-mono text-xs">{e.ipOrCidr}</span> },
    { key: 'notes', header: 'Notes', hideOnMobile: true, render: (e) => e.notes || '—' },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.active ? 'Active' : 'Inactive'} /> },
    { key: 'created', header: 'Created', hideOnMobile: true, render: (e) => formatTimestamp(e.createdAt, false) },
    {
      key: 'actions',
      header: '',
      render: (e) =>
        canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" onClick={(ev) => ev.stopPropagation()}>
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); setEditing(e) }}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <ToggleActiveItem entry={e} />
              <DropdownMenuItem variant="destructive" onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e) }}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ]

  const deleteEntry = useDeleteIpWhitelistEntry()
  const activeCount = entries.filter((e) => e.active).length

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={ShieldCheck}
        title="IP Whitelist"
        subtitle="Restrict non-Owner sign-ins to trusted networks — advisory only, not a hard security boundary"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add IP to Whitelist
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total" value={entries.length} icon={ShieldCheck} />
        <StatCard label="Active" value={entries.filter((e) => e.active).length} tone="success" />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by label or IP..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={ShieldCheck}
            title="No IP restrictions yet"
            description="Every non-Owner sign-in is currently allowed from any network. Add an entry to start restricting access."
          />
        }
      />

      {editing && <IpWhitelistModal editing={editing} onClose={() => setEditing(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={`Delete "${deleteTarget.label}"?`}
          message={
            deleteTarget.active && activeCount <= 1
              ? `This is your only active whitelist entry — deleting it removes every IP restriction, letting non-Owner sign-ins succeed from any network. This cannot be undone.`
              : 'This permanently removes this IP restriction. This cannot be undone.'
          }
          confirmLabel="Delete"
          isPending={deleteEntry.isPending}
          onConfirm={() => deleteEntry.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
        />
      )}
    </div>
  )
}

function ToggleActiveItem({ entry }: { entry: IpWhitelistWithId }) {
  const update = useUpdateIpWhitelistEntry()
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirming(true) }}>
        {entry.active ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
        {entry.active ? 'Deactivate' : 'Activate'}
      </DropdownMenuItem>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${entry.active ? 'Deactivate' : 'Activate'} "${entry.label}"?`}
        message={
          entry.active
            ? 'Deactivating this entry stops it from authorizing sign-ins from this network — a non-Owner relying on it may be locked out immediately.'
            : 'This IP/CIDR will start authorizing non-Owner sign-ins again.'
        }
        confirmLabel={entry.active ? 'Deactivate' : 'Activate'}
        destructive={entry.active}
        isPending={update.isPending}
        onConfirm={() =>
          update.mutate(
            { id: entry.id, label: entry.label, ipOrCidr: entry.ipOrCidr, notes: entry.notes, active: !entry.active },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}

function IpWhitelistModal({ editing, onClose }: { editing: IpWhitelistWithId | 'new'; onClose: () => void }) {
  const isNew = editing === 'new'
  const { data: myIp } = useMyIp()
  const createEntry = useCreateIpWhitelistEntry()
  const updateEntry = useUpdateIpWhitelistEntry()

  const [label, setLabel] = useState(isNew ? '' : editing.label)
  const [ipOrCidr, setIpOrCidr] = useState(isNew ? '' : editing.ipOrCidr)
  const [notes, setNotes] = useState(isNew ? '' : editing.notes ?? '')
  const [active, setActive] = useState(isNew ? true : editing.active)

  const isPending = createEntry.isPending || updateEntry.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !ipOrCidr.trim()) return
    const input = { label: label.trim(), ipOrCidr: ipOrCidr.trim(), notes: notes.trim() || null, active }
    if (isNew) await createEntry.mutateAsync(input)
    else await updateEntry.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Add IP to Whitelist' : 'Edit Whitelist Entry'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Add' : 'Save'}
      isSubmitting={isPending}
    >
      <div className="space-y-1.5">
        <Label>Label *</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Shop Office WiFi" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>IP / CIDR *</Label>
        <Input value={ipOrCidr} onChange={(e) => setIpOrCidr(e.target.value)} placeholder="e.g. 103.21.244.10 or 103.21.244.0/24" className="font-mono" />
        {myIp && (
          <button
            type="button"
            onClick={() => setIpOrCidr(myIp)}
            className="text-xs text-teal-700 hover:underline dark:text-teal-400"
          >
            Detect My Current IP ({myIp})
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
        Active
      </label>
    </FormModal>
  )
}
