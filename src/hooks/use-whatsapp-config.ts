import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { whatsappConfigDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { DEFAULT_WHATSAPP_TEMPLATES } from '@/lib/whatsapp'
import type { WhatsAppConfigDoc } from '@/types/firestore'

export function whatsappConfigQueryKey(companyId: string | undefined) {
  return ['whatsappConfig', companyId] as const
}

/** Falls back to the same `DEFAULT_WHATSAPP_TEMPLATES` a fresh signup seeds — covers an account
 * whose `whatsappConfig/config` doc predates this feature (or the rare "seeding batch never
 * landed" recovery case `completeAccountSetup()` exists for), so the WhatsApp button always has
 * *something* real to send rather than crashing on a missing doc. */
export function useWhatsAppConfig() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: whatsappConfigQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, whatsappConfigDoc(companyId!)))
      if (!snap.exists()) return { countryCode: '91', templates: DEFAULT_WHATSAPP_TEMPLATES } as WhatsAppConfigDoc
      return snap.data() as WhatsAppConfigDoc
    },
    enabled: !!companyId,
  })
}

export function useUpdateWhatsAppConfig() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Pick<WhatsAppConfigDoc, 'countryCode' | 'templates'>) => {
      const batch = writeBatch(db)
      batch.set(doc(db, whatsappConfigDoc(companyId)), { ...input, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'WhatsApp Config',
        entityId: companyId,
        entityLabel: 'WhatsApp Templates',
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappConfigQueryKey(companyId) }),
  })
}
