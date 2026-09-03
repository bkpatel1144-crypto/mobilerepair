import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Wrench className="size-4.5" />
          </span>
          <span className="text-lg font-bold">aim</span>
        </Link>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}
