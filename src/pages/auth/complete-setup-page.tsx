import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/shared/form-error'
import { useAuth } from '@/hooks/use-auth'
import { completeAccountSetup, getAuthErrorMessage, logOut } from '@/lib/auth'
import { completeSetupSchema, type CompleteSetupInput } from '@/lib/validation/auth-schemas'

/**
 * Reachable only when `ProtectedRoute` finds a signed-in Auth user with no profile doc after
 * `usePermissions`'s full retry budget has genuinely exhausted itself — see auth-provider.tsx.
 * That's the signature of a signup whose bootstrap batch never landed (a hard reload/close
 * mid-write, before `persistentLocalCache` was added, or a sustained-offline edge case even
 * with it) rather than of a role a user simply can't view. Re-running the same seeding logic
 * for their existing uid finishes the job instead of leaving them stuck on a permanent
 * "Access Denied" with no path forward.
 */
export function CompleteSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteSetupInput>({
    resolver: zodResolver(completeSetupSchema),
    defaultValues: { fullName: user?.displayName ?? '' },
  })

  if (!user) return <Navigate to="/login" replace />

  async function onSubmit(data: CompleteSetupInput) {
    setFormError(null)
    try {
      await completeAccountSetup(user!.uid, user!.email!, data.companyName, data.fullName)
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Let's finish setting up your account"
      subtitle="Your last sign-up got interrupted before we could set up your company. This will only take a moment."
      footer={
        <button
          type="button"
          onClick={() => logOut()}
          className="font-medium text-teal-700 hover:underline dark:text-teal-400"
        >
          Sign out and start over
        </button>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            placeholder="Sunrise Enterprises"
            aria-invalid={!!errors.companyName}
            {...register('companyName')}
          />
          {errors.companyName && (
            <p className="text-xs text-red-600">{errors.companyName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            placeholder="Shrey Ghadge"
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
          />
          {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Setting up…' : 'Finish setup'}
        </Button>
      </form>
    </AuthLayout>
  )
}
