import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RouteFallback } from '@/components/shared/route-fallback'
import { EmptyState } from '@/components/shared/empty-state'
import { FileQuestion } from 'lucide-react'
import { useJobCard } from '@/hooks/use-job-cards'
import { JobCardDetailContent } from './job-card-detail-content'

/** The full-page half of "build one component, the drawer just renders it narrower" — same
 * `JobCardDetailContent` as the drawer, just given the whole page width so its `lg:grid-cols-3`
 * body actually shows 3 columns, matching `preview (72)`. */
export function JobCardDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading } = useJobCard(jobId)

  if (isLoading) return <RouteFallback />
  if (!job) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState icon={FileQuestion} title="Job card not found" description="It may have been removed." />
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 sm:p-6">
      <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft />
        Back
      </Button>
      <JobCardDetailContent job={job} />
    </div>
  )
}
