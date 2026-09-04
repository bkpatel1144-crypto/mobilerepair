import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { printDevicesDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'

export interface PrintDevice {
  id: string
  name: string
  /** Free text — "58mm", "80mm", "50x25 label". Not validated against the paper presets, because
   * this is a note about hardware the app cannot inspect. */
  paper: string
  notes: string
}

export function printDevicesQueryKey(companyId: string | undefined) {
  return ['printDevices', companyId] as const
}

/**
 * Named printer profiles, shared company-wide (one fixed doc, the same pattern as
 * `whatsappConfig/config`).
 *
 * These are **records, not connections**. A browser cannot enumerate or address a thermal
 * printer; every print in this app goes through the browser's own dialog, where the user picks
 * the device. Keeping the list here lets a shop write down which printer is meant for which
 * format — useful, and honest about being nothing more than that.
 */
export function usePrintDevices() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: printDevicesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, printDevicesDoc(companyId!)))
      return snap.exists() ? ((snap.data().devices ?? []) as PrintDevice[]) : []
    },
    enabled: !!companyId,
  })
}

export function useSavePrintDevices() {
  const { profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (devices: PrintDevice[]) => {
      await setDoc(
        doc(db, printDevicesDoc(companyId)),
        { devices, updatedAt: serverTimestamp() },
        { merge: true }
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printDevicesQueryKey(companyId) }),
  })
}
