import { initializeApp, deleteApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { app, db } from '@/lib/firebase'
import { userDoc } from '@/lib/firestore-paths'
import { addAuditLogToBatch, type AuditContext } from '@/lib/audit-log'
import type { RoleCode, UserDoc } from '@/types/firestore'

export interface CreateTeammateInput {
  fullName: string
  mobile: string
  email: string
  password: string
  companyId: string
  branchId: string
  roleId: string
  roleName: string
  roleCode: RoleCode
  /** The acting Owner/Administrator's own audit context — this file is a plain lib function, not
   * a hook, so it can't call `useAuth()` itself the way every other mutation's audit call site
   * does. */
  performedBy: AuditContext
}

/**
 * Creates a new teammate's Firebase Auth account + Firestore profile, without signing the
 * acting Owner/Administrator out of their own session. `createUserWithEmailAndPassword` always
 * signs the *caller* in as the newly created user — calling it on the app's primary `auth`
 * instance would hijack whoever is currently logged in (BUILD_PLAN.md Phase 3 calls this out
 * explicitly). A secondary, throwaway Firebase App instance isolates that side effect entirely;
 * it's torn down again before this function returns either way.
 */
export async function createTeammateUser(input: CreateTeammateInput): Promise<string> {
  const secondaryApp = initializeApp(app.options, `secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email,
      input.password
    )
    const uid = credential.user.uid
    await updateProfile(credential.user, { displayName: input.fullName })
    await signOut(secondaryAuth)

    // Written through the PRIMARY db, under the acting Owner/Administrator's own auth context
    // (never switched away from) — this is exactly the write firestore.rules' `create` rule for
    // `users/{uid}` expects from the "administration/users"-permitted branch.
    const userData: UserDoc = {
      companyId: input.companyId,
      branchId: input.branchId,
      roleId: input.roleId,
      roleName: input.roleName,
      roleCode: input.roleCode,
      fullName: input.fullName,
      email: input.email,
      mobile: input.mobile || null,
      protected: false,
      status: 'active',
      createdAt: serverTimestamp() as never,
      updatedAt: serverTimestamp() as never,
    }
    const batch = writeBatch(db)
    batch.set(doc(db, userDoc(uid)), userData)
    await addAuditLogToBatch(batch, input.performedBy, {
      action: 'Create',
      module: 'administration',
      entityType: 'User',
      entityId: uid,
      entityLabel: input.fullName,
      details: { roleName: input.roleName, email: input.email },
    })
    await batch.commit()
    return uid
  } finally {
    await deleteApp(secondaryApp)
  }
}
