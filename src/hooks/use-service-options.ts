import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { serviceOptionsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { ServiceOptionType } from '@/config/service-options'
import type { ServiceOptionDoc } from '@/types/firestore'

export interface ServiceOptionWithId extends ServiceOptionDoc {
  id: string
}

/** "Device Types" / "Brands" / ... — the audit log's own entity-type label, since the raw
 * `ServiceOptionType` keys ("deviceTypes") read as code, not a screen a person recognizes. */
const TYPE_LABEL: Record<ServiceOptionType, string> = {
  brands: 'Brand',
  cancelReasons: 'Cancel Reason',
  customerItems: 'Customer Item',
  deviceTypes: 'Device Type',
  holdReasons: 'Hold Reason',
  models: 'Model',
  outstandingReasons: 'Outstanding Reason',
  problems: 'Problem',
}

export function serviceOptionsQueryKey(companyId: string | undefined, type: ServiceOptionType) {
  return ['serviceOptions', companyId, type] as const
}

export function useServiceOptions(type: ServiceOptionType) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: serviceOptionsQueryKey(companyId, type),
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, serviceOptionsCollection(companyId!, type)), orderBy('order', 'asc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ServiceOptionDoc) }))
    },
    enabled: !!companyId,
  })
}

/** Every service-option type at once — the Service Options page needs all 8 (brands/models
 * need each other's names for grouping) and the Job Card form needs whichever ones back its
 * own pickers, so this is the one place both read from. Each type gets its own fixed `useQuery`
 * call (not a loop over an array) — the Rules of Hooks disallow a variable-length/looped set of
 * hook calls even when, as here, the array happens to always be the same 8 entries. */
export function useAllServiceOptions() {
  const brands = useServiceOptions('brands')
  const cancelReasons = useServiceOptions('cancelReasons')
  const customerItems = useServiceOptions('customerItems')
  const deviceTypes = useServiceOptions('deviceTypes')
  const holdReasons = useServiceOptions('holdReasons')
  const models = useServiceOptions('models')
  const outstandingReasons = useServiceOptions('outstandingReasons')
  const problems = useServiceOptions('problems')

  const all = {
    brands, cancelReasons, customerItems, deviceTypes,
    holdReasons, models, outstandingReasons, problems,
  }
  const isLoading = Object.values(all).some((q) => q.isLoading)
  const data = Object.fromEntries(
    Object.entries(all).map(([type, q]) => [type, q.data ?? []])
  ) as Record<ServiceOptionType, ServiceOptionWithId[]>

  return { data, isLoading }
}

export function useCreateServiceOption(type: ServiceOptionType) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { label: string; deviceTypeIds?: string[]; brandId?: string; existingCount: number }) => {
      const ref = doc(collection(db, serviceOptionsCollection(companyId, type)))
      const now = serverTimestamp()
      const data: ServiceOptionDoc = {
        label: input.label,
        order: input.existingCount,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
        ...(input.deviceTypeIds ? { deviceTypeIds: input.deviceTypeIds } : {}),
        ...(input.brandId ? { brandId: input.brandId } : {}),
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'service',
        entityType: TYPE_LABEL[type],
        entityId: ref.id,
        entityLabel: input.label,
      })
      await batch.commit()
      return ref.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceOptionsQueryKey(companyId, type) }),
  })
}

export function useUpdateServiceOption(type: ServiceOptionType) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; label: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, serviceOptionsCollection(companyId, type), input.id), {
        label: input.label,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'service',
        entityType: TYPE_LABEL[type],
        entityId: input.id,
        entityLabel: input.label,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceOptionsQueryKey(companyId, type) }),
  })
}

export function useDeleteServiceOption(type: ServiceOptionType) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (option: ServiceOptionWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, serviceOptionsCollection(companyId, type), option.id))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'service',
        entityType: TYPE_LABEL[type],
        entityId: option.id,
        entityLabel: option.label,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceOptionsQueryKey(companyId, type) }),
  })
}

/** Swaps `order` with whichever neighbor sits immediately before/after `id` in `currentList` —
 * the up/down-arrow reorder control's entire implementation (a real drag-and-drop library is
 * more machinery than this phase's actual need for "reorderable list" justifies). Deliberately
 * NOT audit-logged — a cosmetic display-order swap between two rows isn't the kind of event
 * BUILD_PLAN.md Phase 8's audit trail is meant to surface, and logging it would just be noise
 * on top of every other real create/update/delete already covered here. */
export function useReorderServiceOption(type: ServiceOptionType) {
  const { profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      currentList: ServiceOptionWithId[]
      id: string
      direction: 'up' | 'down'
    }) => {
      const idx = input.currentList.findIndex((o) => o.id === input.id)
      const swapIdx = input.direction === 'up' ? idx - 1 : idx + 1
      if (idx < 0 || swapIdx < 0 || swapIdx >= input.currentList.length) return
      const a = input.currentList[idx]
      const b = input.currentList[swapIdx]
      const batch = writeBatch(db)
      batch.update(doc(db, serviceOptionsCollection(companyId, type), a.id), { order: b.order })
      batch.update(doc(db, serviceOptionsCollection(companyId, type), b.id), { order: a.order })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceOptionsQueryKey(companyId, type) }),
  })
}

/** Forks every brand still shared across more than one device type into one independent row
 * per device type it was shared with — existing job cards reference brands by denormalized
 * name, not id, so this can never retroactively touch their history. Matches `preview (73)`'s
 * "🔀 Split shared brands" action and its own banner text exactly. */
export function useSplitSharedBrands() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (brands: ServiceOptionWithId[]) => {
      const shared = brands.filter((b) => (b.deviceTypeIds?.length ?? 0) > 1)
      if (shared.length === 0) return 0

      const batch = writeBatch(db)
      const maxOrder = Math.max(0, ...brands.map((b) => b.order))
      let nextOrder = maxOrder + 1
      for (const brand of shared) {
        for (const deviceTypeId of brand.deviceTypeIds!) {
          const ref = doc(collection(db, serviceOptionsCollection(companyId, 'brands')))
          const now = serverTimestamp()
          const data: ServiceOptionDoc = {
            label: brand.label,
            order: nextOrder++,
            deviceTypeIds: [deviceTypeId],
            status: 'active',
            createdAt: now as never,
            updatedAt: now as never,
          }
          batch.set(ref, data)
        }
        batch.delete(doc(db, serviceOptionsCollection(companyId, 'brands'), brand.id))
      }
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Split Shared Brands',
        module: 'service',
        entityType: 'Brand',
        entityLabel: `${shared.length} brand(s)`,
        details: { brands: shared.map((b) => b.label) },
      })
      await batch.commit()
      return shared.length
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: serviceOptionsQueryKey(companyId, 'brands') }),
  })
}
