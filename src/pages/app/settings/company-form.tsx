import { Check, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CompanyDoc } from '@/types/firestore'
import { CURRENCIES, TIMEZONES, type CompanyFormValues } from '@/lib/company-validation'
import { useTranslation } from 'react-i18next'

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-red-600">*</span>}
      </Label>
      {children}
      {hint}
    </div>
  )
}

function Confirmed({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400">
      <Check className="size-3.5" />
      {text}
    </p>
  )
}

/** Shared by Create and Edit — the same fields either way, so the two can't drift into
 * disagreeing about what a company needs. */
export function CompanyForm({
  value,
  onChange,
}: {
  value: CompanyFormValues
  onChange: (next: CompanyFormValues) => void
}) {
  const { t } = useTranslation()
  const set = (patch: Partial<CompanyFormValues>) => onChange({ ...value, ...patch })
  const registered = value.gstRegistration !== 'Unregistered'

  return (
    <div className="space-y-5">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]">
        <Field label="Company Name" required>
          <Input
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Sunrise Enterprises"
          />
        </Field>
        <Field label="Company Code" required>
          <Input
            value={value.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            placeholder="SUNRISE"
          />
        </Field>
        <Field label="Legal Name" required>
          <Input
            value={value.legalName}
            onChange={(e) => set({ legalName: e.target.value })}
            placeholder="Sunrise Enterprises Pvt Ltd"
          />
        </Field>
      </div>

      <div className="grid gap-4 border-t pt-5 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
        <Field label="GST Registration" required>
          <Select
            value={value.gstRegistration}
            onValueChange={(v) =>
              v &&
              set({
                gstRegistration: v as CompanyDoc['gstRegistration'],
                // Clearing on switch, so an unregistered company can't keep a stale GSTIN that
                // would then be printed on its bills.
                ...(v === 'Unregistered' ? { gstin: '', pan: '' } : {}),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Composition">Composition</SelectItem>
              <SelectItem value="Unregistered">Unregistered</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t('common.gstin')} required={registered}>
          <Input
            value={value.gstin}
            onChange={(e) => set({ gstin: e.target.value.toUpperCase() })}
            placeholder={registered ? '29PQRSX6789L1Z2' : 'Not applicable'}
            disabled={!registered}
            maxLength={15}
          />
        </Field>
        <Field label={t('common.pan')} required={registered}>
          <Input
            value={value.pan}
            onChange={(e) => set({ pan: e.target.value.toUpperCase() })}
            placeholder={registered ? 'PQRSX6789L' : 'Not applicable'}
            disabled={!registered}
            maxLength={10}
          />
        </Field>
        <Field label={t('common.email')} required>
          <Input
            type="email"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="contact@sunriseenterprises.in"
          />
        </Field>
      </div>

      <div className="grid gap-4 border-t pt-5 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
        <Field label={t('common.phone')} required>
          <Input
            value={value.phone}
            onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder={t('common.tenDigitMobile')}
            inputMode="numeric"
          />
        </Field>
        <Field
          label="Currency"
          required
          hint={value.currency ? <Confirmed text="Currency selected" /> : undefined}
        >
          <Select value={value.currency} onValueChange={(v) => v && set({ currency: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Timezone"
          required
          hint={value.timezone ? <Confirmed text="Timezone selected" /> : undefined}
        >
          <Select value={value.timezone} onValueChange={(v) => v && set({ timezone: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-300">Note:</p>
          <p className="mt-0.5 text-blue-900/80 dark:text-blue-300/80">
            All fields marked with * are required. GSTIN is only required for registered companies
            (Regular/Composition) — pick "Unregistered" if this company isn't GST-registered. Ensure
            GSTIN and PAN match correctly.
          </p>
        </div>
      </div>
    </div>
  )
}
