import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RouteFallback } from '@/components/shared/route-fallback'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { FileQuestion } from 'lucide-react'
import { useJobCard } from '@/hooks/use-job-cards'
import { JobCardDetailContent } from './job-card-detail-content'
import { useTranslation } from 'react-i18next'

/** The full-page half of "build one component, the drawer just renders it narrower" — same
 * `JobCardDetailContent` as the drawer, just given the whole page width so its `lg:grid-cols-3`
 * body actually shows 3 columns, matching `preview (72)`. */
export function JobCardDetailPage() {
  const { t } = useTranslation()
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading, error: loadError, refetch } = useJobCard(jobId)

  if (isLoading) return <RouteFallback />
  // Before the not-found branch: a failed read also yields no `job`, and telling someone their
  // job card "may have been removed" when the read merely failed would send them looking for a
  // deletion that never happened.
  if (loadError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          error={loadError}
          onRetry={() => void refetch()}
          title={t('pages.service.jobCardDetail.couldnTLoadThisJobCard')}
        />
      </div>
    )
  }
  if (!job) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={FileQuestion}
          title={t('pages.service.jobCardDetail.jobCardNotFound')}
          description={t('pages.service.jobCardDetail.itMayHaveBeenRemoved')}
        />
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
