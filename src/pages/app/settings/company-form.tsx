import { Check, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
        <Field label={t('shared.companyName')} required>
          <Input
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t('shared.sunriseEnterprises')}
          />
        </Field>
        <Field label={t('pages.settings.companyForm.companyCode')} required>
          <Input
            value={value.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            placeholder={t('pages.settings.companyForm.sunrise')}
          />
        </Field>
        <Field label={t('pages.settings.companyForm.legalName')} required>
          <Input
            value={value.legalName}
            onChange={(e) => set({ legalName: e.target.value })}
            placeholder={t('pages.settings.companyForm.sunriseEnterprisesPvtLtd')}
          />
        </Field>
      </div>

      <div className="grid gap-4 border-t pt-5 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
        <Field label={t('shared.gstRegistration')} required>
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
              <SelectItem value="Regular">{t('pages.settings.companyForm.regular')}</SelectItem>
              <SelectItem value="Composition">
                {t('pages.settings.companyForm.composition')}
              </SelectItem>
              <SelectItem value="Unregistered">{t('shared.unregistered')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t('common.gstin')} required={registered}>
          <Input
            value={value.gstin}
            onChange={(e) => set({ gstin: e.target.value.toUpperCase() })}
            placeholder={registered ? '29PQRSX6789L1Z2' : t('common.notApplicable')}
            disabled={!registered}
            maxLength={15}
          />
        </Field>
        {/* Only a "Regular" shop charges GST. A Composition dealer pays it out of their own
         * turnover and is barred from collecting it, and an unregistered shop bills without it —
         * so these two only appear where they would actually be used. */}
        {value.gstRegistration === 'Regular' && (
          <>
            <Field label={t('pages.settings.company.gstRate')}>
              <Input
                inputMode="numeric"
                value={String(value.gstRate ?? 18)}
                onChange={(e) => set({ gstRate: Number(e.target.value) || 0 })}
                placeholder="18"
              />
            </Field>
            {/* The help text sits under the control, not inside the label: the two lines of
             * explanation are taller than the field row and overlapped the label above them. */}
            <Field label={t('pages.settings.company.pricesIncludeGst')}>
              <div className="space-y-1">
                <label className="flex min-h-9 items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.pricesIncludeGst !== false}
                    onCheckedChange={(v) => set({ pricesIncludeGst: v === true })}
                  />
                  <span>{t('pages.settings.company.pricesIncludeGst')}</span>
                </label>
                <p className="text-xs leading-snug text-muted-foreground">
                  {t('pages.settings.company.pricesIncludeGstHelp')}
                </p>
              </div>
            </Field>
          </>
        )}
        <Field label={t('common.pan')} required={registered}>
          <Input
            value={value.pan}
            onChange={(e) => set({ pan: e.target.value.toUpperCase() })}
            placeholder={registered ? 'PQRSX6789L' : t('common.notApplicable')}
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
        <Field label={t('common.phone')}>
          <Input
            value={value.phone}
            onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder={t('common.tenDigitMobile')}
            inputMode="numeric"
          />
        </Field>
        <Field
          label={t('shared.currency')}
          required
          hint={
            value.currency ? (
              <Confirmed text={t('pages.settings.companyForm.currencySelected')} />
            ) : undefined
          }
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
          label={t('shared.timezone')}
          required
          hint={
            value.timezone ? (
              <Confirmed text={t('pages.settings.companyForm.timezoneSelected')} />
            ) : undefined
          }
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
          <p className="font-semibold text-blue-900 dark:text-blue-300">
            {t('pages.settings.companyForm.note')}
          </p>
          <p className="mt-0.5 text-blue-900/80 dark:text-blue-300/80">
            All fields marked with * are required. GSTIN is only required for registered companies
            (Regular/Composition) — pick "{t('pages.settings.companyForm.unregistered')}" if this
            company isn't GST-registered. Ensure GSTIN and PAN match correctly.
          </p>
        </div>
      </div>
    </div>
  )
}
