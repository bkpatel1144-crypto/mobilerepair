import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormError } from '@/components/shared/form-error'
import { StatusBadge } from '@/components/shared/status-badge'
import { useAuth } from '@/hooks/use-auth'
import { useRoles } from '@/hooks/use-roles'
import { useCreateTeammate } from '@/hooks/use-users'
import { getAuthErrorMessage } from '@/lib/auth'
import { errorMessage } from '@/lib/error-message'
import { buildPath } from '@/config/nav'
import { useBreadcrumbExtra } from '@/contexts/breadcrumb-context'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

/**
 * Built from `t` rather than declared at module scope, because a zod message is baked in when
 * the schema object is created — a module-scope schema would freeze every validation message in
 * whichever language happened to be active at import time and never follow a language switch.
 *
 * The inferred type is taken from a throwaway instance so `CreateUserInput` stays a plain type
 * and does not depend on `t` at all.
 */
function buildCreateUserSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(2, t('pages.administration.createUser.fullNameMustBeAtLeast')).max(80),
    mobile: z
      .string()
      .regex(/^\d{10}$/, t('pages.administration.createUser.enterAValid10DigitMobile'))
      .or(z.literal('')),
    email: z
      .string()
      .min(1, t('pages.administration.createUser.emailIsRequired'))
      .email(t('pages.administration.createUser.enterAValidEmailAddress')),
    password: z
      .string()
      .min(6, t('pages.administration.createUser.passwordMustBeAtLeast6'))
      .max(128),
    roleId: z.string().min(1, t('pages.administration.createUser.selectARole')),
  })
}
type CreateUserInput = z.infer<ReturnType<typeof buildCreateUserSchema>>

const DRAFT_KEY = 'aim-create-user-draft'

export function CreateUserPage() {
  const { t } = useTranslation()
  // Rebuilt when the language changes, so the messages follow it.
  const schema = useMemo(() => buildCreateUserSchema(t), [t])
  useBreadcrumbExtra(t('common.create'))
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: roles = [], error: rolesError, refetch: refetchRoles } = useRoles()
  const createTeammate = useCreateTeammate()

  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: (() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        return raw
          ? JSON.parse(raw)
          : { fullName: '', mobile: '', email: '', password: '', roleId: '' }
      } catch {
        return { fullName: '', mobile: '', email: '', password: '', roleId: '' }
      }
    })(),
  })

  const watched = watch()

  // Autosave the draft to localStorage — a lightweight per-viewer convenience (survives an
  // accidental navigation away), not a synced/shared draft. Debounced so it isn't writing on
  // every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(watched))
        setSavedAt(new Date())
      } catch {
        // Storage can throw in a private window with site data blocked — draft simply won't
        // persist across a reload in that case, which is an acceptable degradation.
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [watched])

  const assignableRoles = roles.filter((r) => r.type !== 'owner')
  const isComplete =
    isValid && Object.values(watched).every((v) => v !== '' || v === watched.mobile)

  async function onSubmit(data: CreateUserInput) {
    setFormError(null)
    const role = roles.find((r) => r.id === data.roleId)
    if (!role || !profile) return
    try {
      await createTeammate.mutateAsync({
        fullName: data.fullName,
        mobile: data.mobile,
        email: data.email,
        password: data.password,
        branchId: profile.branchId,
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
      })
      localStorage.removeItem(DRAFT_KEY)
      reset()
      navigate(buildPath('administration', 'users'))
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold">{t('pages.administration.createUser.addNewUser')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('pages.administration.createUser.createANewUserAccountWith')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={isComplete ? 'Complete' : t('pages.administration.createUser.incomplete')}
            tone={isComplete ? 'success' : 'warning'}
          />
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Auto-saved{' '}
              {savedAt.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 rounded-lg border bg-card p-5"
      >
        <FormError message={formError} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t('pages.administration.createUser.fullName')}</Label>
            <Input
              id="fullName"
              placeholder={t('pages.administration.createUser.enterFullName')}
              aria-invalid={!!errors.fullName}
              {...register('fullName')}
            />
            {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">{t('pages.administration.createUser.mobileNumber')}</Label>
            <Input
              id="mobile"
              placeholder={t('common.tenDigitMobile')}
              aria-invalid={!!errors.mobile}
              {...register('mobile')}
            />
            {errors.mobile && <p className="text-xs text-red-600">{errors.mobile.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('pages.administration.createUser.emailAddress')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('pages.administration.createUser.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('pages.administration.createUser.strongPassword')}
                aria-invalid={!!errors.password}
                className="pr-9"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showPassword ? 'Hide password' : t('pages.administration.createUser.showPassword')
                }
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="roleId">{t('pages.administration.createUser.role')}</Label>
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="roleId" className="w-full" aria-invalid={!!errors.roleId}>
                  <SelectValue placeholder={t('pages.administration.createUser.selectARole')} />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {rolesError && (
            // An empty Role dropdown reads as "this company has no roles", which is impossible —
            // signup seeds five. Say the list failed to load instead of letting the Owner hunt
            // for a role that is actually still there.
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-red-600">
              {errorMessage(rolesError)}
              <button
                type="button"
                onClick={() => void refetchRoles()}
                className="underline underline-offset-2"
              >
                Retry
              </button>
            </p>
          )}
          {errors.roleId ? (
            <p className="text-xs text-red-600">{errors.roleId.message}</p>
          ) : (
            watched.roleId && (
              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" /> Role selected
              </p>
            )
          )}
        </div>

        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <span className="font-semibold">{t('pages.administration.createUser.securityNote')}</span>{' '}
          Communicate password securely to the user
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : t('pages.administration.createUser.createUser')}
          </Button>
        </div>
      </form>
    </div>
  )
}
