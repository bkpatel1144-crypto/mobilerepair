import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useSetItemStatus } from '@/hooks/use-items'
import type { EntityStatus } from '@/types/firestore'

/**
 * Deactivate or re-activate an item, with the confirm that explains what that means.
 *
 * Shared because Service Items is a filtered view of the same Item Master collection, and it
 * had Edit but no way to retire a row at all — a service typed by mistake, or one the shop
 * stopped offering, stayed in every picker in the app for good.
 *
 * Deactivate, never delete: an item is referenced by name *and* id on every job card that ever
 * used it, so removing the row would leave job cards pointing at nothing. Deactivating takes it
 * out of the pickers and leaves history intact.
 */
/** Only what the control actually reads. Typing this against a full row type coupled it to
 *  whichever of the two item shapes the calling screen happened to use. */
export function ItemStatusButton({
  item,
}: {
  item: { id: string; name: string; status: EntityStatus }
}) {
  const { t } = useTranslation()
  const setStatus = useSetItemStatus()
  const [confirming, setConfirming] = useState(false)
  const willDeactivate = item.status === 'active'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {willDeactivate ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {willDeactivate ? t('common.deactivate') : t('common.activate')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${willDeactivate ? t('common.deactivate') : t('common.activate')} "${item.name}"?`}
        message={
          willDeactivate
            ? t('pages.masters.itemMaster.deactivatedItemsNoLongerAppear')
            : t('pages.masters.itemMaster.thisItemWillBecomeSelectableAgain')
        }
        confirmLabel={willDeactivate ? t('common.deactivate') : t('common.activate')}
        destructive={willDeactivate}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: item.id, status: willDeactivate ? 'disabled' : 'active', itemName: item.name },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}
