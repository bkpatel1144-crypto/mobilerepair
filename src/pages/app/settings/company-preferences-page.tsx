import { useRef, useState } from 'react'
import { Building2, ImageIcon, MessageCircle, Upload, Trash2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormError } from '@/components/shared/form-error'
import { useCompany } from '@/hooks/use-company'
import {
  useSaveEnabledModules,
  useUploadCompanyLogo,
  moduleEnabled,
  LOCKED_MODULES,
  TOGGLEABLE_MODULES,
  MAX_LOGO_BYTES,
} from '@/hooks/use-company-preferences'
import { NAV_SECTIONS, buildPath } from '@/config/nav'
import { useNavLabels } from '@/hooks/use-nav-labels'
import { usePermissions } from '@/hooks/use-permissions'
import { useTranslation } from 'react-i18next'

/**
 * Settings > Company > Preferences — configuration that belongs to one company rather than to
 * the whole account.
 *
 * Enabled Modules is the load-bearing part: switching one off removes it from the sidebar for
 * *every* user of that company, not just the person changing it. Administration and Settings
 * cannot be switched off — a company that could disable Settings could never enable anything
 * again, and one without Administration could not grant the permission needed to fix it.
 */
export function CompanyPreferencesPage() {
  const { t } = useTranslation()
  const navLabel = useNavLabels()
  const { data: company } = useCompany()
  const { isOwner, canDo } = usePermissions()
  const canManage = isOwner || canDo('SETTINGS_COMPANY_UPDATE')

  const saveModules = useSaveEnabledModules()
  const uploadLogo = useUploadCompanyLogo()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  // The draft starts from what is stored and is keyed on the company, so switching company
  // re-seeds it without an effect.
  const stored = company?.enabledModules
  const [draftFor, setDraftFor] = useState<string | null>(null)
  const [draft, setDraft] = useState<string[]>([])
  if (company && draftFor !== company.id) {
    setDraftFor(company.id)
    setDraft(TOGGLEABLE_MODULES.filter((k) => moduleEnabled(stored, k)))
  }

  const dirty =
    company != null &&
    JSON.stringify([...draft].sort()) !==
      JSON.stringify(TOGGLEABLE_MODULES.filter((k) => moduleEnabled(stored, k)).sort())

  function toggle(key: string, on: boolean) {
    setDraft((prev) => (on ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)))
  }

  async function handleLogo(file: File | null) {
    setError(null)
    try {
      await uploadLogo.mutateAsync(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.settings.preferences.logoFailed'))
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{t('pages.settings.preferences.companyPreferences')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.settings.preferences.settingsFor')}{' '}
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
              {company?.name ?? '—'}
            </span>{' '}
            {t('pages.settings.preferences.eachCompanyKeepsItsOwn')}
          </p>
        </div>
      </div>

      <FormError message={error} />

      <section className="space-y-3 rounded-xl border p-4">
        <div>
          <h2 className="text-base font-semibold">
            {t('pages.settings.preferences.enabledModules')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('pages.settings.preferences.turnErpModulesOnOff')}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {NAV_SECTIONS.map((section) => {
            const locked = LOCKED_MODULES.includes(section.key)
            const on = locked || draft.includes(section.key)
            return (
              <label
                key={section.key}
                className={
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ' +
                  (locked
                    ? 'cursor-not-allowed opacity-60'
                    : on
                      ? 'border-teal-300 bg-teal-50/50 dark:border-teal-500/30 dark:bg-teal-500/5'
                      : 'hover:bg-muted/50')
                }
              >
                <Checkbox
                  checked={on}
                  disabled={locked || !canManage}
                  onCheckedChange={(v) => !locked && toggle(section.key, v === true)}
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {navLabel.section(section.key, section.label)}
                </span>
                {locked && (
                  <ShieldCheck
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-label={t('pages.settings.preferences.alwaysOn')}
                  />
                )}
              </label>
            )
          })}
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={!dirty || saveModules.isPending}
              onClick={() => saveModules.mutate(draft)}
            >
              {saveModules.isPending ? t('common.saving') : t('shared.saveChanges')}
            </Button>
            {dirty && (
              <span className="text-xs text-amber-600">
                {t('pages.settings.preferences.unsavedChanges')}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-semibold">
            <ImageIcon className="size-4 text-muted-foreground" />
            {t('pages.settings.preferences.branding')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('pages.settings.preferences.companyLogoShownOn')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={t('pages.settings.preferences.companyLogo')}
                className="size-full object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {t('pages.settings.preferences.noLogo')}
              </span>
            )}
          </div>
          {canManage && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (file) void handleLogo(file)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadLogo.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload className="size-4" />
                  {uploadLogo.isPending
                    ? t('common.saving')
                    : t('pages.settings.preferences.uploadLogo')}
                </Button>
                {company?.logoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={uploadLogo.isPending}
                    onClick={() => void handleLogo(null)}
                  >
                    <Trash2 className="size-4" />
                    {t('common.remove')}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('pages.settings.preferences.uploadsApplyImmediately', {
                  mb: MAX_LOGO_BYTES / 1024 / 1024,
                })}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <MessageCircle className="size-4 text-muted-foreground" />
          {t('pages.settings.preferences.whatsappProvider')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('pages.settings.preferences.providerConfigIsManagedIn')}{' '}
          <Link
            to={buildPath('settings', 'whatsapp')}
            className="font-medium text-teal-700 underline dark:text-teal-400"
          >
            {t('pages.settings.preferences.settingsWhatsapp')}
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
