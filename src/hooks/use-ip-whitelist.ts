import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ipWhitelistCollection, ipWhitelistDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getClientIp, addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { isIpAllowed } from '@/lib/ip-enforcement'
import type { IpWhitelistDoc } from '@/types/firestore'

export interface IpWhitelistWithId extends IpWhitelistDoc { id: string }

export function ipWhitelistQueryKey(companyId: string | undefined) {
  return ['ipWhitelist', companyId] as const
}

/** Sorted client-side, not via a server-side `orderBy('createdAt')` — same pending-
 * `serverTimestamp()` reasoning documented on every other list hook in this phase (a freshly
 * added entry, e.g. right after this exact "Add IP to Whitelist" modal closes, would otherwise
 * be briefly excluded from the list rather than just mis-ordered). */
export function useIpWhitelist() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: ipWhitelistQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, ipWhitelistCollection(companyId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as IpWhitelistDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

/** Live-detects the caller's own public IP — backs the "Detect My Current IP" helper link in the
 * Add-to-Whitelist modal. Shares the same cached fetch every audit-log write and login-attempt
 * check already uses, so this never fires a second network request. */
export function useMyIp() {
  return useQuery({ queryKey: ['myIp'], queryFn: getClientIp, staleTime: Infinity })
}

export interface IpWhitelistInput {
  label: string
  ipOrCidr: string
  notes: string | null
  active: boolean
}

export function useCreateIpWhitelistEntry() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: IpWhitelistInput) => {
      const ref = doc(collection(db, ipWhitelistCollection(companyId)))
      const now = serverTimestamp()
      const data: IpWhitelistDoc = {
        label: input.label,
        ipOrCidr: input.ipOrCidr,
        notes: input.notes,
        active: input.active,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'administration',
        entityType: 'IP Whitelist',
        entityId: ref.id,
        entityLabel: input.label,
        details: { ipOrCidr: input.ipOrCidr, active: input.active },
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ipWhitelistQueryKey(companyId) }),
  })
}

export function useUpdateIpWhitelistEntry() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: IpWhitelistInput & { id: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, ipWhitelistDoc(companyId, input.id)), {
        label: input.label,
        ipOrCidr: input.ipOrCidr,
        notes: input.notes,
        active: input.active,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'administration',
        entityType: 'IP Whitelist',
        entityId: input.id,
        entityLabel: input.label,
        details: { ipOrCidr: input.ipOrCidr, active: input.active },
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ipWhitelistQueryKey(companyId) }),
  })
}

export function useDeleteIpWhitelistEntry() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: IpWhitelistWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, ipWhitelistDoc(companyId, entry.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'administration',
        entityType: 'IP Whitelist',
        entityId: entry.id,
        entityLabel: entry.label,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ipWhitelistQueryKey(companyId) }),
  })
}

/** Backs `ProtectedRoute`'s own enforcement — computed from the whitelist + the caller's own
 * detected IP + their role (an Owner is never blocked, so a company's own admin can never lock
 * themselves out by misconfiguring this). See `ip-enforcement.ts`'s doc comment for the
 * "advisory, not a real boundary" caveat this whole feature operates under. */
export function useIpAccessCheck() {
  const { profile } = useAuth()
  const { data: entries, isLoading: entriesLoading } = useIpWhitelist()
  const { data: myIp, isLoading: ipLoading } = useMyIp()

  const isOwner = profile?.roleCode === 'OWNER'
  const isLoading = entriesLoading || ipLoading
  const allowed = isOwner || isLoading || isIpAllowed(myIp ?? null, entries ?? [])

  return { blocked: !allowed, isLoading, myIp: myIp ?? null }
}
