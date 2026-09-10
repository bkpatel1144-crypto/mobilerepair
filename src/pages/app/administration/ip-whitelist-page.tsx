import { useState } from 'react'
import { ShieldCheck, Plus, Pencil, Trash2, Ban, CheckCircle2, MoreVertical } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
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
import { formatTimestamp } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function IpWhitelistPage() {
  const { t } = useTranslation()
  const { data: entries = [], isLoading, error: loadError, refetch } = useIpWhitelist()
  const { canDo } = usePermissions()
  const canManage = canDo('ADMINISTRATION_IP_WHITELIST_UPDATE')

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<IpWhitelistWithId | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IpWhitelistWithId | null>(null)

  const filtered = entries.filter((e) =>
    `${e.label} ${e.ipOrCidr}`.toLowerCase().includes(search.toLowerCase())
  )

  const columns: DataTableColumn<IpWhitelistWithId>[] = [
    {
      key: 'label',
      header: t('pages.administration.ipWhitelist.label'),
      sortValue: (e) => e.label,
      render: (e) => <span className="font-medium">{e.label}</span>,
    },
    {
      key: 'ip',
      header: t('pages.administration.ipWhitelist.ipCidr'),
      render: (e) => <span className="font-mono text-xs">{e.ipOrCidr}</span>,
    },
    { key: 'notes', header: t('common.notes'), hideOnMobile: true, render: (e) => e.notes || '—' },
    {
      key: 'status',
      header: t('common.status'),
      render: (e) => <StatusBadge status={e.active ? 'Active' : t('common.inactive')} />,
    },
    {
      key: 'created',
      header: t('common.createdAt'),
      hideOnMobile: true,
      render: (e) => formatTimestamp(e.createdAt, false),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-right',
      render: (e) =>
        canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(ev) => {
                  ev.stopPropagation()
                  setEditing(e)
                }}
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <ToggleActiveItem entry={e} />
              <DropdownMenuItem
                variant="destructive"
                onClick={(ev) => {
                  ev.stopPropagation()
                  setDeleteTarget(e)
                }}
              >
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
        title={t('pages.administration.ipWhitelist.ipWhitelist')}
        subtitle={t('pages.administration.ipWhitelist.restrictNonOwnerSignInsTo')}
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              {t('pages.administration.ipWhitelist.addIpToWhitelist')}
            </Button>
          )
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.total')} value={entries.length} icon={ShieldCheck} />
        <StatCard
          label={t('common.active')}
          icon={CheckCircle2}
          value={entries.filter((e) => e.active).length}
          tone="success"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.administration.ipWhitelist.searchByLabelOrIp')}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={ShieldCheck}
            title={t('pages.administration.ipWhitelist.noIpRestrictionsYet')}
            description={t('pages.administration.ipWhitelist.everyNonOwnerSignInIs')}
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
              : t('pages.administration.ipWhitelist.thisPermanentlyRemovesThisIpRestriction')
          }
          confirmLabel={t('common.delete')}
          isPending={deleteEntry.isPending}
          onConfirm={() =>
            deleteEntry.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })
          }
        />
      )}
    </div>
  )
}

function ToggleActiveItem({ entry }: { entry: IpWhitelistWithId }) {
  const { t } = useTranslation()
  const update = useUpdateIpWhitelistEntry()
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation()
          setConfirming(true)
        }}
      >
        {entry.active ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
        {entry.active ? 'Deactivate' : t('common.activate')}
      </DropdownMenuItem>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${entry.active ? 'Deactivate' : t('common.activate')} "${entry.label}"?`}
        message={
          entry.active
            ? 'Deactivating this entry stops it from authorizing sign-ins from this network — a non-Owner relying on it may be locked out immediately.'
            : t('pages.administration.ipWhitelist.thisIpCidrWillStartAuthorizing')
        }
        confirmLabel={entry.active ? 'Deactivate' : t('common.activate')}
        destructive={entry.active}
        isPending={update.isPending}
        onConfirm={() =>
          update.mutate(
            {
              id: entry.id,
              label: entry.label,
              ipOrCidr: entry.ipOrCidr,
              notes: entry.notes,
              active: !entry.active,
            },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}

function IpWhitelistModal({
  editing,
  onClose,
}: {
  editing: IpWhitelistWithId | 'new'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const isNew = editing === 'new'
  const { data: myIp } = useMyIp()
  const createEntry = useCreateIpWhitelistEntry()
  const updateEntry = useUpdateIpWhitelistEntry()

  const [label, setLabel] = useState(isNew ? '' : editing.label)
  const [ipOrCidr, setIpOrCidr] = useState(isNew ? '' : editing.ipOrCidr)
  const [notes, setNotes] = useState(isNew ? '' : (editing.notes ?? ''))
  const [active, setActive] = useState(isNew ? true : editing.active)

  const isPending = createEntry.isPending || updateEntry.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !ipOrCidr.trim()) return
    const input = {
      label: label.trim(),
      ipOrCidr: ipOrCidr.trim(),
      notes: notes.trim() || null,
      active,
    }
    if (isNew) await createEntry.mutateAsync(input)
    else await updateEntry.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={
        isNew ? 'Add IP to Whitelist' : t('pages.administration.ipWhitelist.editWhitelistEntry')
      }
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Add' : t('common.save')}
      isSubmitting={isPending}
    >
      <div className="space-y-1.5">
        <Label>{t('pages.administration.ipWhitelist.label2')}</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Shop Office WiFi"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('pages.administration.ipWhitelist.ipCidr2')}</Label>
        <Input
          value={ipOrCidr}
          onChange={(e) => setIpOrCidr(e.target.value)}
          placeholder="e.g. 103.21.244.10 or 103.21.244.0/24"
          className="font-mono"
        />
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
        <Label>{t('common.notes')}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('common.optional')}
          rows={2}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
        Active
      </label>
    </FormModal>
  )
}
