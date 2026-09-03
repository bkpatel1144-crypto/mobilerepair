import { Check, Smartphone, User, MessageCircle, PackageCheck, ShieldCheck } from 'lucide-react'

const TIMELINE_STEPS = ['Received', 'Diagnosis', 'Repair', 'Quality check', 'Ready', 'Delivered']
const ACTIVE_STEP_INDEX = 4 // "Ready" — matches the info cards below (device is ready for pickup)

export function JobCardMockup() {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-card shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex-1 truncate rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
          app.aim.in/service/job-cards/JC-2026-0143
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-500/15 dark:text-amber-400">
          Sample data
        </span>
      </div>

      {/* Content */}
      <div className="space-y-6 p-5 sm:p-6">
        {/* Horizontal status timeline */}
        <div className="flex items-center">
          {TIMELINE_STEPS.map((step, i) => {
            const isDone = i < ACTIVE_STEP_INDEX
            const isCurrent = i === ACTIVE_STEP_INDEX
            return (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={
                      isDone || isCurrent
                        ? 'flex size-6 items-center justify-center rounded-full bg-teal-600 text-white'
                        : 'flex size-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-transparent'
                    }
                  >
                    {(isDone || isCurrent) && <Check className="size-3.5" />}
                  </span>
                  <span
                    className={
                      isCurrent
                        ? 'text-[11px] font-semibold whitespace-nowrap text-teal-700 dark:text-teal-400'
                        : 'text-[11px] whitespace-nowrap text-muted-foreground'
                    }
                  >
                    {step}
                  </span>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <span
                    className={
                      isDone
                        ? 'mx-1 h-0.5 flex-1 bg-teal-600'
                        : 'mx-1 h-0.5 flex-1 bg-muted-foreground/20'
                    }
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
              <Smartphone className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Device Received</p>
              <p className="text-xs text-muted-foreground">
                Samsung Galaxy A15 · Battery replacement
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                <User className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Assigned to Technician</p>
                <p className="text-xs text-muted-foreground">Rahul K. · In progress</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 w-4/5 rounded-full bg-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
              <MessageCircle className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Customer Updated</p>
              <p className="text-xs text-muted-foreground">Auto-message sent via WhatsApp</p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <PackageCheck className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Ready for Pickup</p>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Paid ₹1,450
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3" /> 90-day warranty on repair
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
