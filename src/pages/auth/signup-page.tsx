import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/shared/form-error'
import { signUp, getAuthErrorMessage } from '@/lib/auth'
import { signupSchema, type SignupInput } from '@/lib/validation/auth-schemas'
import { useTranslation } from 'react-i18next'

export function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(data: SignupInput) {
    setFormError(null)
    try {
      await signUp(data)
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title={t('pages.signup.signup.createYourAccount')}
      subtitle={t('pages.signup.signup.freeForeverNoCardRequired')}
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <div className="space-y-1.5">
          <Label htmlFor="companyName">{t('shared.companyName2')}</Label>
          <Input
            id="companyName"
            placeholder={t('shared.sunriseEnterprises')}
            aria-invalid={!!errors.companyName}
            {...register('companyName')}
          />
          {errors.companyName && (
            <p className="text-xs text-red-600">{errors.companyName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t('shared.yourName')}</Label>
          <Input
            id="fullName"
            placeholder={t('shared.shreyGhadge')}
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
          />
          {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
        </div>
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
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('shared.password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
