import { useState } from 'react'
import { DatabaseZap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FormError } from '@/components/shared/form-error'
import { useBackfillDefaultMasters, useBackfillPlan } from '@/hooks/use-masters-backfill'
import { useTranslation } from 'react-i18next'

/**
 * "Load default catalogue" — applies the signup seed to a company that already exists.
 *
 * Renders nothing when there is nothing to do, so a company already matching the catalogue does
 * not carry a button that would be a no-op. The count in the label is the point: it says what
 * will happen before it happens, because this writes up to forty-three documents.
 */
export function LoadDefaultsButton({ variant = 'default' }: { variant?: 'default' | 'outline' }) {
  const { t } = useTranslation()
  const plan = useBackfillPlan()
  const backfill = useBackfillDefaultMasters()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (plan.isUpToDate) return null

  const summary = [
    plan.itemsToCreate
      ? t('components.shared.loadDefaults.nItems', { count: plan.itemsToCreate })
      : null,
    plan.categoriesToCreate
      ? t('components.shared.loadDefaults.nCategories', { count: plan.categoriesToCreate })
      : null,
    plan.categoriesToFix
      ? t('components.shared.loadDefaults.nCorrected', { count: plan.categoriesToFix })
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className="space-y-2">
        <Button
          type="button"
          variant={variant}
          onClick={() => setConfirming(true)}
          disabled={backfill.isPending}
        >
          <DatabaseZap className="size-4" />
          {backfill.isPending
            ? t('common.saving')
            : t('components.shared.loadDefaults.loadDefaultCatalogue')}
        </Button>
        {error && <FormError message={error} />}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('components.shared.loadDefaults.loadDefaultCatalogue')}
        message={`${t('components.shared.loadDefaults.thisAddsTheStandardCatalogue')} ${summary}`}
        confirmLabel={t('components.shared.loadDefaults.load')}
        isPending={backfill.isPending}
        onConfirm={() => {
          setError(null)
          backfill.mutate(undefined, {
            onSuccess: () => setConfirming(false),
            onError: (err) =>
              setError(
                err instanceof Error
                  ? err.message
                  : t('components.shared.loadDefaults.couldNotLoadTheCatalogue')
              ),
          })
        }}
      />
    </>
  )
}
