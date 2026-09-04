import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Reloading the page usually fixes this — if it keeps
            happening, please let us know.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      )
    }
    return this.props.children
  }
}
