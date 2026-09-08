import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { RoleWithId } from '@/hooks/use-roles'
import type { WorkflowConfigDraft } from './types'
import { useTranslation } from 'react-i18next'

interface UsersSubtabProps {
  draft: WorkflowConfigDraft
  setDraft: (updater: (prev: WorkflowConfigDraft) => WorkflowConfigDraft) => void
  disabled: boolean
  allRoles: RoleWithId[]
}

const WHO_DID_IT_ROWS: {
  key: 'receivedBy' | 'deliveredBy' | 'cancelledBy' | 'returnedBy'
  labelKey: string
}[] = [
  { key: 'receivedBy', labelKey: 'pages.settings.usersSubtab.receivedBy' },
  { key: 'deliveredBy', labelKey: 'pages.settings.usersSubtab.deliveredBy' },
  { key: 'cancelledBy', labelKey: 'pages.settings.usersSubtab.cancelledBy' },
  { key: 'returnedBy', labelKey: 'pages.settings.usersSubtab.returnedBy' },
]

/** "Users" sub-tab of a selected role — Assignment & Handover role pickers, plus the "Who Did
 * It" toggles (off = the logged-in user is auto-recorded, on = a dropdown lets anyone pick).
 * Matches `preview (12)`. */
export function UsersSubtab({ draft, setDraft, disabled, allRoles }: UsersSubtabProps) {
  const { t } = useTranslation()
  function setAssignment(patch: Partial<WorkflowConfigDraft['assignment']>) {
    setDraft((prev) => ({ ...prev, assignment: { ...prev.assignment, ...patch } }))
  }

  function setWhoDidIt(patch: Partial<WorkflowConfigDraft['whoDidIt']>) {
    setDraft((prev) => ({ ...prev, whoDidIt: { ...prev.whoDidIt, ...patch } }))
  }

  function roleScopeSelect(
    value: 'all' | string[],
    onChange: (next: 'all' | string[]) => void,
    idPrefix: string
  ) {
    // "All users" plus one option per role — picking a specific role narrows to just that role
    // for now (a fuller multi-role picker is more machinery than this single-value dropdown in
    // the reference screenshots shows any need for yet).
    const value0 = value === 'all' ? 'all' : (value[0] ?? 'all')
    return (
      <Select value={value0} onValueChange={(v) => v && onChange(v === 'all' ? 'all' : [v])}>
        <SelectTrigger id={idPrefix} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('pages.settings.usersSubtab.allUsers')}</SelectItem>
          {allRoles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Assignment &amp; Handover</h3>
          <p className="text-xs text-muted-foreground">
            Who can be assigned jobs and where they hand off
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Assign To Roles
            </p>
            {roleScopeSelect(
              draft.assignment.assignToRoles,
              (v) => setAssignment({ assignToRoles: v }),
              'assignToRoles'
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Handover Roles
            </p>
            {roleScopeSelect(
              draft.assignment.handoverRoles,
              (v) => setAssignment({ handoverRoles: v }),
              'handoverRoles'
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              ⇄ Default Handover
            </p>
            <Select
              value={draft.assignment.defaultHandover ?? 'none'}
              onValueChange={(v) =>
                setAssignment({ defaultHandover: v === 'none' ? null : (v ?? null) })
              }
            >
              <SelectTrigger id="defaultHandover" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t('pages.settings.usersSubtab.noneManualSelect')}
                </SelectItem>
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">
            {t('pages.settings.usersSubtab.whoDidItDropdowns')}
          </h3>
          <p className="text-xs text-muted-foreground">
            When an action happens, should the user pick who did it? Off = the logged-in user is
            recorded automatically.
          </p>
        </div>
        <div className="divide-y rounded-lg border">
          {WHO_DID_IT_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 p-3">
              <div>
                <p className="text-sm font-medium">{t(row.labelKey)}</p>
                <p className="text-xs text-muted-foreground">
                  Logged-in user is recorded automatically
                </p>
              </div>
              <Switch
                checked={draft.whoDidIt[row.key]}
                onCheckedChange={(checked) => setWhoDidIt({ [row.key]: checked })}
                disabled={disabled}
              />
            </div>
          ))}
          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {t('pages.settings.usersSubtab.fieldVisitTechnician')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('pages.settings.usersSubtab.whoCheckedInOnAnOn')}
                </p>
              </div>
              <Switch
                checked={draft.whoDidIt.fieldVisitTechnician}
                onCheckedChange={(checked) => setWhoDidIt({ fieldVisitTechnician: checked })}
                disabled={disabled}
              />
            </div>
            {draft.whoDidIt.fieldVisitTechnician && (
              <div className="max-w-xs">
                {roleScopeSelect(
                  draft.whoDidIt.fieldVisitTechnicianRoles,
                  (v) => setWhoDidIt({ fieldVisitTechnicianRoles: v }),
                  'fieldVisitTechnicianRoles'
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {draft.whoDidIt.fieldVisitTechnicianRoles === 'all'
                    ? 'All users can be selected'
                    : 'One role can be selected'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
