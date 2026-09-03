import { useState } from 'react'
import { Store, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { FormModal } from '@/components/shared/form-modal'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompany, useUpdateCompany, type CompanyWithId, type UpdateCompanyInput } from '@/hooks/use-company'
import { formatTimestamp } from '@/lib/utils'

const CURRENCIES = [{ v: 'INR', l: 'INR - Indian Rupee (₹)' }, { v: 'USD', l: 'USD - US Dollar ($)' }]
const TIMEZONES = [{ v: 'Asia/Kolkata', l: 'Asia/Kolkata (IST)' }]

function blankForm(company: CompanyWithId): UpdateCompanyInput {
  return {
    name: company.name,
    code: company.code,
    legalName: company.legalName,
    gstRegistration: company.gstRegistration,
    gstin: company.gstin,
    pan: company.pan,
    email: company.email,
    phone: company.phone,
    currency: company.currency,
    timezone: company.timezone,
  }
}

/** `preview (5)`/`(6)` — this app has exactly one company per tenant (see `useCompany()`'s own
 * doc comment), so this manages *the* company rather than a real multi-company list; the "table"
 * below always has exactly one row, matching the reference's own screenshot for the same
 * underlying reason. No "Create Company" — see BUILD_PLAN.md's Phase 10 deviations. */
export function CompanySettingsPage() {
  const { data: company, isLoading } = useCompany()
  const [viewing, setViewing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UpdateCompanyInput | null>(null)
  const updateCompany = useUpdateCompany()

  const columns: DataTableColumn<CompanyWithId>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (c) => (
        <span className="inline-flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Store className="size-3.5" />
          </span>
          <span>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.name}</p>
          </span>
          {c.protected && <StatusBadge status="Default" tone="warning" />}
        </span>
      ),
    },
    { key: 'code', header: 'Code', render: (c) => c.code },
    { key: 'gstin', header: 'GSTIN', hideOnMobile: true, render: (c) => c.gstin ?? c.gstRegistration },
    { key: 'contact', header: 'Contact', hideOnMobile: true, render: (c) => <><p>{c.email}</p><p className="text-xs text-muted-foreground">{c.phone || '—'}</p></> },
  ]

  function startEdit() {
    if (!company) return
    setForm(blankForm(company))
    setEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    if (form.gstRegistration !== 'Unregistered' && !form.gstin?.trim()) return
    await updateCompany.mutateAsync(form)
    setEditing(false)
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader icon={Store} title="Company Management" subtitle="Manage company information and settings" />

      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        <StatCard label="Active" value={company ? 1 : 0} tone="success" selected />
        <StatCard label="Inactive" value={0} />
        <StatCard label="Deleted" value={0} />
      </div>

      <DataTable
        columns={columns}
        data={company ? [company] : []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        onRowClick={() => setViewing(true)}
        emptyState={<EmptyState icon={Store} title="No company found" />}
      />

      {viewing && company && (
        <DetailDrawer
          open
          onOpenChange={setViewing}
          icon={Store}
          title={company.name}
          subtitle={company.legalName}
          badges={
            <>
              {company.protected && <StatusBadge status="Default" tone="warning" />}
              <StatusBadge status={company.status === 'active' ? 'Active' : 'Disabled'} dot />
            </>
          }
          actions={
            <Button type="button" variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          }
          sections={[
            ...(company.protected
              ? [{ title: '', children: <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">Default company — cannot be disabled or deleted.</p> }]
              : []),
            {
              title: 'COMPANY INFORMATION',
              rows: [
                { label: 'Display Name', value: company.name },
                { label: 'Legal Name', value: company.legalName },
                { label: 'Company Code', value: company.code },
              ],
            },
            {
              title: 'CONTACT DETAILS',
              rows: [
                { label: 'Email', value: company.email || '—' },
                { label: 'Phone', value: company.phone || '—' },
              ],
            },
            {
              title: 'TAX & REGISTRATION',
              rows: [
                { label: 'GST Registration', value: company.gstRegistration === 'Unregistered' ? 'Unregistered (No GST)' : company.gstRegistration },
                ...(company.gstin ? [{ label: 'GSTIN', value: company.gstin }] : []),
                ...(company.pan ? [{ label: 'PAN', value: company.pan }] : []),
              ],
            },
            {
              title: 'FINANCIAL SETTINGS',
              rows: [
                { label: 'Currency', value: company.currency },
                { label: 'Timezone', value: company.timezone },
              ],
            },
          ]}
          timeline={[
            { title: 'Created', timestamp: formatTimestamp(company.createdAt) },
            { title: 'Last Updated', timestamp: formatTimestamp(company.updatedAt) },
          ]}
        />
      )}

      {editing && form && (
        <FormModal
          open
          onOpenChange={(o) => !o && setEditing(false)}
          title="Edit Company"
          description="Update your company information"
          onSubmit={handleSave}
          submitLabel="Save Changes"
          isSubmitting={updateCompany.isPending}
          className="sm:max-w-2xl"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Company Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Legal Name *</Label>
              <Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>GST Registration *</Label>
              <Select value={form.gstRegistration} onValueChange={(v) => v && setForm({ ...form, gstRegistration: v as UpdateCompanyInput['gstRegistration'] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Composition">Composition</SelectItem>
                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>GSTIN {form.gstRegistration !== 'Unregistered' && '*'}</Label>
              <Input value={form.gstin ?? ''} onChange={(e) => setForm({ ...form, gstin: e.target.value || null })} disabled={form.gstRegistration === 'Unregistered'} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>PAN</Label>
              <Input value={form.pan ?? ''} onChange={(e) => setForm({ ...form, pan: e.target.value || null })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency *</Label>
              <Select value={form.currency} onValueChange={(v) => v && setForm({ ...form, currency: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone *</Label>
              <Select value={form.timezone} onValueChange={(v) => v && setForm({ ...form, timezone: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
            Note: GSTIN is only required for registered companies (Regular/Composition) — pick "Unregistered" if this company isn't GST-registered. Ensure GSTIN and PAN match correctly.
          </p>
        </FormModal>
      )}
    </div>
  )
}
