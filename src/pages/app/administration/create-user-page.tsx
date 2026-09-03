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
import { buildPath } from '@/config/nav'
import { useBreadcrumbExtra } from '@/contexts/breadcrumb-context'

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  mobile: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number')
    .or(z.literal('')),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  roleId: z.string().min(1, 'Select a role'),
})
type CreateUserInput = z.infer<typeof createUserSchema>

const DRAFT_KEY = 'aim-create-user-draft'

export function CreateUserPage() {
  useBreadcrumbExtra('Create')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: roles = [] } = useRoles()
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
    resolver: zodResolver(createUserSchema),
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
            <h1 className="text-lg font-bold">Add New User</h1>
            <p className="text-sm text-muted-foreground">
              Create a new user account with role and permissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={isComplete ? 'Complete' : 'Incomplete'}
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
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              aria-invalid={!!errors.fullName}
              {...register('fullName')}
            />
            {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              placeholder="10-digit mobile"
              aria-invalid={!!errors.mobile}
              {...register('mobile')}
            />
            {errors.mobile && <p className="text-xs text-red-600">{errors.mobile.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address *</Label>
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
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Strong password"
                aria-invalid={!!errors.password}
                className="pr-9"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="roleId">Role *</Label>
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="roleId" className="w-full" aria-invalid={!!errors.roleId}>
                  <SelectValue placeholder="Select a role..." />
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
          <span className="font-semibold">Security Note:</span> Communicate password securely to the
          user
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  )
}
