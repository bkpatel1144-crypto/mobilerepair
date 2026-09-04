import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/error-message'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  /** The thrown value from a failed query — `error` off a TanStack `useQuery` result. */
  error: unknown
  /** Usually the query's own `refetch`. Omitted when there's nothing sensible to retry. */
  onRetry?: () => void
  title?: string
  className?: string
}

/**
 * The third branch every data view needs, alongside `EmptyState` and the loading skeleton.
 *
 * This exists because the alternative is genuinely dangerous: with `const { data = [] } =
 * useThing()`, a failed read leaves `data` as `[]` and the page renders its *empty state* — so
 * a permission-denied error, an offline device, or the wrong `VITE_FIREBASE_DATABASE_ID` all
 * look exactly like "you haven't added anything yet." A shop owner would reasonably start
 * re-entering data that is actually still there. Never collapse an error into an empty state.
 */
export function ErrorState({
  error,
  onRetry,
  title = "Couldn't load this data",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-12 text-center',
        className
      )}
    >
      <AlertTriangle className="mb-1 size-8 text-destructive/70" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  )
}
