import { useState } from 'react'
import { Workflow } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RolePermissionsTab } from './workflow-designer/role-permissions-tab'
import { FormBuilderTab } from './workflow-designer/form-builder-tab'

/**
 * Admin > Settings > Workflow Designer — matches `preview (7)`–`(13)` exactly. Three top-level
 * tabs: Role Permissions (per-role status×action matrix, assignment/handover, behavior toggles
 * — `role-permissions-tab.tsx`), Job Card Form and Lead Form (company-wide field builders,
 * sharing `form-builder-tab.tsx` parameterized by `formType` — see PROGRESS.md Phase 4 for why
 * these two are company-wide rather than per-role despite `workflowConfig` itself being
 * per-role).
 */
export function WorkflowDesignerPage() {
  const [tab, setTab] = useState<'rolePermissions' | 'jobCardForm' | 'leadForm'>('rolePermissions')

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <Workflow className="mt-0.5 size-5 text-teal-600" />
        <div>
          <h1 className="text-lg font-bold">Workflow Designer</h1>
          <p className="text-sm text-muted-foreground">
            Control exactly what each role can see and do at every job status.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="rolePermissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="jobCardForm">Job Card Form</TabsTrigger>
          <TabsTrigger value="leadForm">Lead Form</TabsTrigger>
        </TabsList>
        <TabsContent value="rolePermissions" className="pt-4">
          <RolePermissionsTab />
        </TabsContent>
        <TabsContent value="jobCardForm" className="pt-4">
          <FormBuilderTab formType="jobCard" />
        </TabsContent>
        <TabsContent value="leadForm" className="pt-4">
          <FormBuilderTab formType="lead" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
