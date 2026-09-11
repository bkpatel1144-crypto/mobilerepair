import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { companyDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { companyQueryKey } from '@/hooks/use-company'
import { LOCKED_MODULES } from '@/config/modules'

export { LOCKED_MODULES, TOGGLEABLE_MODULES, moduleEnabled } from '@/config/modules'

export function useSaveEnabledModules() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enabledModules: string[]) => {
      const batch = writeBatch(db)
      batch.update(doc(db, companyDoc(companyId)), {
        // The locked pair is never stored, so it cannot be turned off by editing the document
        // by hand either.
        enabledModules: enabledModules.filter((m) => !LOCKED_MODULES.includes(m)),
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Modules Changed',
        module: 'settings',
        entityType: 'Company',
        entityId: companyId,
        entityLabel: profile!.companyId,
        // Turning a module off hides it from every user in the company at once.
        critical: true,
        details: { enabled: enabledModules.length },
      })
      await batch.commit()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyQueryKey(companyId) })
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

/** Two megabytes. A logo is a small image; anything larger is a photograph by mistake. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024

export function useUploadCompanyLogo() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File | null) => {
      let logoUrl: string | null = null
      if (file) {
        if (!file.type.startsWith('image/')) throw new Error('That file is not an image.')
        if (file.size > MAX_LOGO_BYTES) throw new Error('That image is larger than 2 MB.')
        // Timestamped rather than a fixed name: a browser that has cached the old logo would
        // otherwise keep showing it long after it was replaced.
        const path = `companies/${companyId}/branding/${Date.now()}-${file.name}`
        const fileRef = ref(storage, path)
        await uploadBytes(fileRef, file)
        logoUrl = await getDownloadURL(fileRef)
      }

      const batch = writeBatch(db)
      batch.update(doc(db, companyDoc(companyId)), { logoUrl, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: file ? 'Logo Updated' : 'Logo Removed',
        module: 'settings',
        entityType: 'Company',
        entityId: companyId,
        entityLabel: profile!.companyId,
        details: file ? { size: file.size, type: file.type } : {},
      })
      await batch.commit()
      return logoUrl
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyQueryKey(companyId) })
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
