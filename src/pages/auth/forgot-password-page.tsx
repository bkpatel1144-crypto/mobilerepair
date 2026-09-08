import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/shared/form-error'
import { resetPassword, getAuthErrorMessage } from '@/lib/auth'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth-schemas'
import { useTranslation } from 'react-i18next'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordInput) {
    setFormError(null)
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch (err) {
      // Deliberately don't reveal whether the email exists — that would let an attacker
      // enumerate registered accounts. Firebase's own `auth/user-not-found` is common enough
      // here that showing the generic success state either way is the safer choice.
      if ((err as { code?: string })?.code === 'auth/user-not-found') {
        setSent(true)
      } else {
        setFormError(getAuthErrorMessage(err))
      }
    }
  }

  return (
    <AuthLayout
      title={t('pages.forgotPassword.forgotPassword.resetYourPassword')}
      subtitle={t('pages.forgotPassword.forgotPassword.enterYourEmailAndWeLl')}
      footer={
        <>
          Remembered it?{' '}
          <Link
            to="/login"
            className="font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            {t('pages.forgotPassword.forgotPassword.backToLogIn')}
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <CheckCircle2 className="size-8 text-emerald-600" />
          <p className="text-sm font-medium">
            {t('pages.forgotPassword.forgotPassword.checkYourEmail')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('pages.forgotPassword.forgotPassword.ifAnAccountExistsForThat')}
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormError message={formError} />
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : t('pages.forgotPassword.forgotPassword.sendResetLink')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
