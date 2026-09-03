import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { buildPath } from '@/config/nav'
import { JobCardDetailContent } from './job-card-detail-content'
import type { JobCardWithId } from '@/hooks/use-job-cards'

/** The drawer half of "build one component, the drawer just renders it narrower" — same
 * `JobCardDetailContent`, just inside a `sm:max-w-3xl` sheet instead of the full page, so its
 * `lg:grid-cols-3` body naturally stacks to one/two columns here. The expand icon inside the
 * header navigates to the full-page route for the same job. */
export function JobCardDetailDrawer({
  job,
  open,
  onOpenChange,
}: {
  job: JobCardWithId | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <ScrollArea className="flex-1">
          <div className="p-5 pr-8">
            {job && (
              <JobCardDetailContent
                job={job}
                onExpand={() => navigate(`${buildPath('service', 'job-cards')}/${job.id}`)}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
