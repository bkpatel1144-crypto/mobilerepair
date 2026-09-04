import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { printDevicesCollection, printDeviceDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { useLiveQuery } from '@/hooks/use-live-query'
import { useCompany } from '@/hooks/use-company'
import type { PrintDeviceDoc } from '@/types/firestore'

export interface PrintDeviceWithId extends PrintDeviceDoc {
  id: string
}

export function printDevicesQueryKey(companyId: string | undefined) {
  return ['printDevices', companyId] as const
}

/** How long a pairing code stays usable. Short on purpose — an unused code left on a screen is
 * a way into the tenant's print queue. */
export const PAIRING_CODE_TTL_MS = 10 * 60_000

/** Excludes I/O/0/1 — these get read off a screen and typed into another machine, and those four
 * are where transcription errors come from. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePairingCode(companyCode: string): string {
  const prefix = (companyCode || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'shop'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  return `${prefix}pa-${body}`
}

export function isCodeExpired(device: PrintDeviceDoc, now = Date.now()): boolean {
  const expires = device.codeExpiresAt?.toMillis?.()
  return device.status === 'pending' && !!expires && expires <= now
}

/** Live, because the whole point of the pairing screen is watching for an agent that hasn't
 * connected yet — polling would make "Waiting for a device…" lag behind reality by however long
 * the interval is. */
export function usePrintDevices() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<PrintDeviceWithId[]>(
    printDevicesQueryKey(companyId),
    companyId ? collection(db, printDevicesCollection(companyId)) : null,
    (docs) =>
      (docs as PrintDeviceWithId[]).sort(
        (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      ),
    !!companyId
  )
}

/** Mints a pending device row plus the code the shopkeeper types into the agent. The agent
 * claims the row by matching the code and flipping `status` to `paired`. */
export function useCreatePairingCode() {
  const { user, profile } = useAuth()
  const { data: company } = useCompany()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const ref = doc(collection(db, printDevicesCollection(companyId)))
      const data: PrintDeviceDoc = {
        name: null,
        status: 'pending',
        pairingCode: generatePairingCode(company?.code ?? company?.name ?? ''),
        codeExpiresAt: Timestamp.fromMillis(Date.now() + PAIRING_CODE_TTL_MS),
        pairedAt: null,
        lastSeenAt: null,
        platform: null,
        agentVersion: null,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: serverTimestamp() as never,
        updatedAt: serverTimestamp() as never,
      }
      // `setDoc`, not a batch: this is a single write with no sibling to stay atomic with. It is
      // deliberately *not* audit-logged at creation — an unused code is not yet an event; the
      // pairing itself is what the agent records when it claims the row.
      await setDoc(ref, data)
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printDevicesQueryKey(companyId) }),
  })
}

/**
 * Removes a device.
 *
 * Deletes rather than marking revoked: the agent authenticates by holding this document's id, so
 * removing the row is what actually stops it printing — a `revoked` flag would rely on the agent
 * choosing to honour it. The dialog says as much ("It will stop printing the next time it
 * connects"), because an agent mid-job keeps that job.
 */
export function useRemovePrintDevice() {
  const { profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, printDeviceDoc(companyId, id)))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: printDevicesQueryKey(companyId) }),
  })
}
