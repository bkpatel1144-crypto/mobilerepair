import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
// A class component, so `useTranslation` is unavailable — the i18next singleton is the
// supported way to translate outside a hook, and this renders after a crash where pulling in
// more React machinery is exactly what we don't want.
import i18next from 'i18next'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Root-level safety net. Phase 1's own visual QA found a real bug (a third-party library
 * crashing on an undefined context) that unmounted the *entire* app to a blank white screen —
 * with nothing catching it. React error boundaries can only be class components; this is the
 * one class component in the codebase for exactly that reason.
 *
 * Crashes are also recorded to `companies/{id}/auditLog` (Phase 11, closing Phase 8's TODO) so a
 * white-screen report from a shop has something behind it besides a `console.error` in a browser
 * nobody was watching. See `logCrashEvent()` for why it reads the profile cache rather than
 * `useAuth()`.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught render error:', error, info.componentStack)

    // A *dynamic* import, deliberately: this boundary is one of the few things App.tsx imports
    // statically, and `audit-log` pulls in the Firestore SDK. A top-level import here would put
    // the whole of Firebase back into the marketing bundle that App.tsx's own lazy-loading
    // comment exists to keep it out of.
    //
    // Nothing here may throw or reject: this runs while the app is already broken, and a failed
    // report must not replace the crash screen with a second crash.
    void import('@/lib/audit-log')
      .then((m) => m.logCrashEvent(error, info.componentStack))
      .catch(() => {})
  }

  /**
   * A screen whose code was never downloaded, on a connection that has since gone.
   *
   * Routes are lazily code-split, so opening a page for the first time fetches its chunk. Offline
   * that fetch fails and lands here — where "Something went wrong… Reload" was actively
   * misleading: nothing went wrong, and reloading with no connection makes it worse. The two
   * conditions are checked together because a chunk failure while *online* is a real deploy
   * problem and should keep the loud crash screen.
   */
  private isOfflineChunkFailure(): boolean {
    const message = String(this.state.error?.message ?? '')
    const looksLikeChunk =
      /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(
        message
      )
    return looksLikeChunk && typeof navigator !== 'undefined' && navigator.onLine === false
  }

  render() {
    if (this.state.error && this.isOfflineChunkFailure()) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <CloudOff className="size-6" />
          </span>
          <h1 className="text-lg font-semibold">
            {i18next.t('components.shared.errorBoundary.screenNotDownloaded')}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {i18next.t('components.shared.errorBoundary.screenNotDownloadedExplained')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              {i18next.t('common.back')}
            </Button>
            {/* Clears the boundary so the route re-renders — not a page reload, which with no
             * connection would replace a working cached app with a browser error page. */}
            <Button onClick={() => this.setState({ error: null })}>
              {i18next.t('components.shared.errorBoundary.tryAgain')}
            </Button>
          </div>
        </div>
      )
    }
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="text-lg font-semibold">
            {i18next.t('components.shared.errorBoundary.somethingWentWrong')}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {i18next.t('components.shared.errorBoundary.anUnexpectedErrorOccurredReloadingThe')}
          </p>
          <Button onClick={() => window.location.reload()}>
            {i18next.t('components.shared.errorBoundary.reload')}
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
