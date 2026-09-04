import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { userDoc } from '@/lib/firestore-paths'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { useAuth } from '@/hooks/use-auth'
import { usersQueryKey } from '@/hooks/use-users'

/**
 * The signed-in user editing *their own* profile — distinct from Administration → User
 * Management, which is an Owner/Manager editing someone else's and is gated on that menu
 * permission. This one needs no menu permission at all: every user can open their own profile.
 *
 * Deliberately narrow. `roleId`/`roleName`/`branchId`/`status`/`mobile` are all absent, because
 * letting someone edit their own role or status from here would be a straightforward privilege
 * escalation — the drawer shows those as read-only cards for the same reason. Mobile is the
 * login identifier for teammate accounts (see `createTeammateUser`), so it stays administrative
 * too. `firestore.rules` should enforce the same narrowing server-side; see the note in
 * PROGRESS.md about the rules still being undeployed.
 */
export interface UpdateMyProfileInput {
  fullName: string
  email: string
}

export function useUpdateMyProfile() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateMyProfileInput) => {
      const batch = writeBatch(db)
      batch.update(doc(db, userDoc(user!.uid)), {
        fullName: input.fullName.trim(),
        email: input.email.trim(),
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'administration',
        entityType: 'Own Profile',
        entityId: user!.uid,
        entityLabel: input.fullName.trim(),
      })
      await batch.commit()
    },
    // The profile itself rides a live `onSnapshot` in AuthProvider, so the top bar updates on
    // its own; this only refreshes the User Management list, which is a plain query.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey(profile?.companyId) }),
  })
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * Firebase refuses `updatePassword()` on a session older than a few minutes
 * (`auth/requires-recent-login`), so this always re-authenticates first rather than trying the
 * update and handling the rejection — a change-password form is expected to ask for the current
 * password anyway, and doing it up front means the flow can't fail halfway and demand more input.
 *
 * Note the audit entry is written only *after* the password actually changes: unlike every other
 * mutation in this app, the real write here happens in Firebase Auth rather than in the batch,
 * so there is no single commit that can carry both atomically. Ordering it this way means a
 * failed change never leaves a log entry claiming it succeeded — the opposite order could.
 */
export function useChangePassword() {
  const { user, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: ChangePasswordInput) => {
      const current = auth.currentUser
      if (!current?.email) {
        throw new Error('You must be signed in with an email account to change your password.')
      }

      await reauthenticateWithCredential(
        current,
        EmailAuthProvider.credential(current.email, currentPassword)
      )
      await firebaseUpdatePassword(current, newPassword)

      const batch = writeBatch(db)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Change Password',
        module: 'administration',
        entityType: 'Own Profile',
        entityId: user!.uid,
        entityLabel: profile!.fullName,
        // Anything that changes how an account is accessed belongs in the critical filter, the
        // same way Role/User writes already do.
        critical: true,
      })
      await batch.commit()
    },
  })
}

/** Firebase's own auth codes, translated into something a shop owner can act on. */
export function passwordErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'That current password is not correct.'
    case 'auth/weak-password':
      return 'That new password is too weak — use at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'auth/requires-recent-login':
      return 'Your session is too old. Sign out, sign back in, and try again.'
    case 'auth/network-request-failed':
      return "Couldn't reach Firebase. Check your connection and try again."
    default:
      return error instanceof Error ? error.message : 'Could not change your password.'
  }
}
