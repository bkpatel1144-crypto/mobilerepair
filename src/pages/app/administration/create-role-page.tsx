import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/shared/form-error'
import { useRoles, useCreateRole } from '@/hooks/use-roles'
import { slugifyCode } from '@/lib/utils'
import { buildPath } from '@/config/nav'

/**
 * A full page rather than a modal, matching the reference — and it earns it: the Next Steps
 * panel below exists because a freshly created role grants nothing at all, which is surprising
 * enough that it needs saying before someone assigns the role to a person and wonders why they
 * can't see anything.
 */
export function CreateRolePage() {
  const navigate = useNavigate()
  const { data: roles = [] } = useRoles()
  const createRole = useCreateRole()

  const [name, setName] = useState('')
  // Null until the user types in the field — before that the code tracks the name, which is what
  // "auto-generated from name" means. Once edited it stops following, so a deliberate code is
  // never silently overwritten by a later rename.
  const [codeOverride, setCodeOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const code = codeOverride ?? (name.trim() ? slugifyCode(name) : '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Role name must be at least 2 characters.')
      return
    }
    if (!code) {
      setError('Role code is required.')
      return
    }
    if (roles.some((r) => r.code.toUpperCase() === code.toUpperCase())) {
      setError(`A role with the code ${code} already exists.`)
      return
    }
    if (roles.some((r) => r.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('A role with that name already exists.')
      return
    }
    try {
      const roleId = await createRole.mutateAsync({ name: trimmed, code })
      // Straight into Configure: the role currently grants nothing, so leaving the user on a
      // list would leave a role that exists but does nothing, with no prompt to fix it.
      navigate(`${buildPath('administration', 'roles')}/${roleId}/configure`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this role.')
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back to roles"
          onClick={() => navigate(buildPath('administration', 'roles'))}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Role</h1>
          <p className="text-sm text-muted-foreground">Create a new role with custom permissions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">
                Role Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="e.g. SalesManager"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-code">
                Role Code <span className="text-red-600">*</span>
              </Label>
              <Input
                id="role-code"
                value={code}
                onChange={(e) => setCodeOverride(e.target.value.toUpperCase())}
                placeholder="e.g. SALES_MANAGER"
              />
              <p className="text-sm text-muted-foreground">
                Unique identifier (auto-generated from name)
              </p>
            </div>

            {error && <FormError message={error} />}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(buildPath('administration', 'roles'))}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="size-5 text-muted-foreground" />
            Next Steps
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">After creating the role</p>

          <div className="mt-5 flex gap-3 rounded-xl bg-blue-50 p-4 text-sm dark:bg-blue-500/10">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-3">
              <p className="font-semibold text-blue-900 dark:text-blue-300">
                After creating this role, you'll need to:
              </p>
              <ol className="list-decimal space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-300/90">
                <li>Assign permissions to define what users with this role can do</li>
                <li>Assign menus to control navigation access</li>
                <li>Assign users to this role</li>
              </ol>
              <p className="font-semibold text-blue-900 dark:text-blue-300">
                By default, new roles have no permissions and no menu access.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
