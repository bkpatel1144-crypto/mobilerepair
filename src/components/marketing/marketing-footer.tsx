import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Wrench className="size-4" />
              </span>
              <span className="text-base font-bold">aim</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Repair-shop &amp; second-hand-device ERP by AIM ENTERPRISE. Free forever.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <a href="/#workflow" className="hover:text-foreground">
              Workflow
            </a>
            <a href="/#features" className="hover:text-foreground">
              Features
            </a>
            <Link to="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <a href="/#faq" className="hover:text-foreground">
              FAQ
            </a>
            <Link to="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} AIM ENTERPRISE. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
