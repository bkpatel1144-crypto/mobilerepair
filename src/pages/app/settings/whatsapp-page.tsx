import { useState } from 'react'
import { MessageCircle, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { useWhatsAppConfig, useUpdateWhatsAppConfig } from '@/hooks/use-whatsapp-config'
import type { WhatsAppTemplateDoc } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

const PLACEHOLDER_HINT = '{{customerName}} {{jobNumber}} {{status}} {{amount}} {{shopName}}'

/** Backs the WhatsApp button already shipped on the Job Card detail page since Phase 5
 * (previously a single hardcoded message string) — editing a template here changes what that
 * button, and every other lifecycle-event send, actually sends. */
export function WhatsAppPage() {
  const { t } = useTranslation()
  const { data: config, isLoading, error: loadError, refetch } = useWhatsAppConfig()
  const updateConfig = useUpdateWhatsAppConfig()
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [templates, setTemplates] = useState<WhatsAppTemplateDoc[] | null>(null)

  const effectiveCountryCode = countryCode ?? config?.countryCode ?? '91'
  const effectiveTemplates = templates ?? config?.templates ?? []
  const dirty = countryCode !== null || templates !== null

  function updateTemplate(
    event: WhatsAppTemplateDoc['event'],
    patch: Partial<WhatsAppTemplateDoc>
  ) {
    setTemplates(
      effectiveTemplates.map((tpl) => (tpl.event === event ? { ...tpl, ...patch } : tpl))
    )
  }

  async function handleSave() {
    await updateConfig.mutateAsync({
      countryCode: effectiveCountryCode,
      templates: effectiveTemplates,
    })
    setCountryCode(null)
    setTemplates(null)
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={MessageCircle}
        title={t('pages.settings.whatsapp.whatsapp')}
        subtitle={t('pages.settings.whatsapp.messageTemplatesSentToCustomersAs')}
        actions={
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !dirty || updateConfig.isPending}
          >
            <Save className="size-4" />
            {updateConfig.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full max-w-xs" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => void refetch()}
          title={t('pages.settings.whatsapp.couldnTLoadYourWhatsappTemplates')}
        />
      ) : (
        <>
          <div className="max-w-xs space-y-1.5">
            <Label>{t('pages.settings.whatsapp.countryCode')}</Label>
            <Input
              value={effectiveCountryCode}
              onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="91"
            />
            <p className="text-xs text-muted-foreground">
              Prefixed to a customer's 10-digit mobile before opening WhatsApp.
            </p>
          </div>

          <div className="space-y-3">
            {effectiveTemplates.map((tpl) => (
              <div key={tpl.event} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{tpl.label}</p>
                  <Switch
                    checked={tpl.enabled}
                    onCheckedChange={(checked) => updateTemplate(tpl.event, { enabled: checked })}
                  />
                </div>
                <Textarea
                  value={tpl.message}
                  onChange={(e) => updateTemplate(tpl.event, { message: e.target.value })}
                  rows={2}
                  disabled={!tpl.enabled}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Available placeholders: {PLACEHOLDER_HINT}
          </p>
        </>
      )}
    </div>
  )
}
