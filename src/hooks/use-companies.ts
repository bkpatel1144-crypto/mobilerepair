import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  companyDoc,
  branchesCollection,
  financialYearsCollection,
  rolesCollection,
  userDoc,
  whatsappConfigDoc,
  backupSettingsDoc,
} from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { DEFAULT_ROLE_SEEDS } from '@/config/default-roles'
import { DEFAULT_WHATSAPP_TEMPLATES } from '@/lib/whatsapp'
import { addDefaultServiceOptionsToBatch } from '@/lib/service-options-seed'
import { addDefaultMastersToBatch } from '@/lib/masters-seed'
import { addDefaultPrintTemplatesToBatch } from '@/lib/print-templates-seed'
import type { CompanyWithId } from '@/hooks/use-company'
import type { BranchDoc, CompanyDoc, FinancialYearDoc, RoleDoc, UserDoc } from '@/types/firestore'

export function companiesQueryKey(uid: string | undefined, ids: string[]) {
  return ['companies', uid, ids.join('|')] as const
}

/** The company ids this user can open — `companyIds` where present, otherwise the single
 * `companyId` every pre-multi-company account has. */
export function membershipIds(profile: UserDoc | null): string[] {
  if (!profile) return []
  return profile.companyIds?.length ? profile.companyIds : [profile.companyId]
}

/**
 * Every company this user can open.
 *
 * Deliberately N `get()`s by id rather than one collection query. `firestore.rules` has no
 * `list` rule on `companies` and should not get one: a query over that collection is a query
 * over every tenant in the project, and the only thing between it and another shop's data would
 * be a filter the client supplies. Reading exactly the ids the user's own profile lists keeps
 * that boundary on the server. Company counts are single digits, so it costs nothing.
 */
export function useCompanies() {
  const { user, profile } = useAuth()
  const ids = membershipIds(profile)

  return useQuery({
    queryKey: companiesQueryKey(user?.uid, ids),
    queryFn: async () => {
      const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, companyDoc(id)))))
      return snaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...(s.data() as CompanyDoc) }) as CompanyWithId)
    },
    enabled: ids.length > 0 && !!user?.uid,
    staleTime: 30_000,
  })
}

export interface CreateCompanyInput {
  name: string
  code: string
  legalName: string
  gstRegistration: CompanyDoc['gstRegistration']
  gstin: string | null
  pan: string | null
  email: string
  phone: string
  currency: string
  timezone: string
}

/**
 * Creates a company with everything it needs to be usable, then makes it the active one.
 *
 * Mirrors `seedTenantForUser()` deliberately. A company with no roles has no permissions, one
 * with no branch cannot take a job card, one with no service options opens the Create Job Card
 * form onto empty dropdowns, and one with no print templates has a Print button that renders
 * nothing. Writing a bare company document and calling it done is precisely the "permanently
 * unreachable orphan" PROGRESS.md warned about — so it all goes in one batch, because a
 * half-seeded company is worse than no company.
 */
export function useCreateCompany() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCompanyInput) => {
      const uid = user!.uid
      const batch = writeBatch(db)
      const now = serverTimestamp() as never

      const companyRef = doc(collection(db, 'companies'))
      const companyId = companyRef.id

      const company: CompanyDoc = {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        legalName: input.legalName.trim() || input.name.trim(),
        gstRegistration: input.gstRegistration,
        // A shop that isn't registered has no GSTIN to store, and keeping a stale one after
        // switching to Unregistered would print it on bills.
        gstin: input.gstRegistration === 'Unregistered' ? null : input.gstin,
        pan: input.pan,
        email: input.email.trim(),
        phone: input.phone.trim(),
        currency: input.currency,
        timezone: input.timezone,
        // Only the signup company is protected; one added later can be disabled.
        protected: false,
        status: 'active',
        // Required by the users-update rule before this id may be added to `companyIds`.
        createdById: uid,
        createdAt: now,
        updatedAt: now,
      }
      batch.set(companyRef, company)

      const branchRef = doc(collection(db, branchesCollection(companyId)))
      const branch: BranchDoc = {
        name: 'Main Branch',
        code: 'MAIN',
        type: 'system',
        protected: true,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
      batch.set(branchRef, branch)

      const fy = getCurrentFinancialYear()
      const fyData: FinancialYearDoc = {
        name: fy.name,
        startDate: Timestamp.fromDate(fy.startDate),
        endDate: Timestamp.fromDate(fy.endDate),
        isActive: true,
        isLocked: false,
        isCurrent: true,
        createdAt: now,
        updatedAt: now,
      }
      batch.set(doc(collection(db, financialYearsCollection(companyId))), fyData)

      let ownerRoleId = ''
      for (const seed of DEFAULT_ROLE_SEEDS) {
        const roleRef = doc(collection(db, rolesCollection(companyId)))
        if (seed.code === 'OWNER') ownerRoleId = roleRef.id
        const role: RoleDoc = {
          name: seed.name,
          code: seed.code,
          type: seed.type,
          protected: seed.protected,
          status: 'active',
          fullAccess: seed.fullAccess,
          menuPermissions: seed.menuPermissions,
          actionPermissions: seed.actionPermissions,
          dashboardConfig: seed.dashboardConfig,
          createdAt: now,
          updatedAt: now,
        }
        batch.set(roleRef, role)
      }

      addDefaultServiceOptionsToBatch(batch, companyId, now)
      addDefaultMastersToBatch(batch, companyId, now)
      addDefaultPrintTemplatesToBatch(batch, companyId, uid, profile!.fullName)

      batch.set(doc(db, whatsappConfigDoc(companyId)), {
        countryCode: '91',
        templates: DEFAULT_WHATSAPP_TEMPLATES,
        updatedAt: now,
      })
      batch.set(doc(db, backupSettingsDoc(companyId)), {
        dailyAutoBackupEnabled: false,
        timeOfDay: '02:00',
        keepForDays: 7,
        updatedAt: now,
      })

      // Membership, per-company role/branch, and the switch — same batch, so there is never a
      // moment where the company exists but the user can't open it. The whole array is written
      // rather than `arrayUnion`, because `memberships` has to be written wholesale anyway and
      // the two must agree.
      const ids = membershipIds(profile)
      const memberships = {
        ...(profile!.memberships ?? {}),
        // Preserve what the existing company's role was; on a single-company account that lives
        // on the top-level fields rather than in this map.
        [profile!.homeCompanyId ?? profile!.companyId]: profile!.memberships?.[
          profile!.homeCompanyId ?? profile!.companyId
        ] ?? {
          roleId: profile!.roleId,
          roleName: profile!.roleName,
          roleCode: profile!.roleCode,
          branchId: profile!.branchId,
        },
        [companyId]: {
          roleId: ownerRoleId,
          roleName: 'Owner',
          roleCode: 'OWNER' as const,
          branchId: branchRef.id,
        },
      }

      batch.update(doc(db, userDoc(uid)), {
        companyIds: [...new Set([...ids, companyId])],
        memberships,
        activeCompanyId: companyId,
        updatedAt: now,
      })

      // Logged against the company the person was standing in when they did it.
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create Company',
        module: 'settings',
        entityType: 'Company',
        entityId: companyId,
        entityLabel: company.name,
        critical: true,
        details: { code: company.code },
      })

      await batch.commit()
      return { id: companyId, ...company }
    },
    // Every query key in this app is scoped by company id, so anything already loaded belongs to
    // the company just left.
    onSuccess: () => queryClient.clear(),
  })
}

/**
 * Switches which company the app is showing.
 *
 * Persisted to the profile rather than held in React state, so the choice survives a reload and
 * matches on a second tab — a switcher that silently resets on refresh is how somebody ends up
 * entering a job card against the wrong shop.
 */
export function useSwitchCompany() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyId: string) => {
      if (!membershipIds(profile).includes(companyId)) {
        throw new Error('You are not a member of that company.')
      }
      const batch = writeBatch(db)
      batch.update(doc(db, userDoc(user!.uid)), {
        activeCompanyId: companyId,
        updatedAt: serverTimestamp(),
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.clear(),
  })
}
