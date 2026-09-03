import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ScanLine,
  Plus,
  UserPlus,
  PackagePlus,
  FileText,
  Activity,
  Wrench,
  IndianRupee,
  AlertTriangle,
  Clock,
  XCircle,
  ListOrdered,
  PauseCircle,
  CheckCircle2,
  PackageCheck,
  Truck,
  Lock,
  Undo2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ScanJobCardModal } from '@/components/shared/scan-job-card-modal'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useAuth } from '@/hooks/use-auth'
import { toneFromStatus } from '@/lib/status-tone'

// Tailwind's compiler needs literal class strings, not template interpolation — these hex values
// intentionally mirror the same tones (emerald/amber/red/blue/purple/neutral) `status-tone.ts`
// already maps status labels to, just as raw colors since recharts needs an actual fill string.
const CHART_TONE_HEX: Record<string, string> = {
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  purple: '#9333ea',
  neutral: '#6b7280',
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const [range, setRange] = useState<DateRangeKey | 'all'>('all')
  const [scanOpen, setScanOpen] = useState(false)
  const { data: stats, isLoading } = useDashboardStats(range)
  const { profile } = useAuth()

  const quickActions = [
    { label: 'Scan Job Card', icon: ScanLine, tone: 'bg-muted text-foreground', onClick: () => setScanOpen(true) },
    { label: 'New Job Card', icon: Plus, tone: 'bg-teal-600 text-white', to: '/app/service/job-cards/create' },
    { label: 'New Party', icon: UserPlus, tone: 'bg-blue-600 text-white', to: '/app/masters/parties' },
    { label: 'New Item', icon: PackagePlus, tone: 'bg-purple-600 text-white', to: '/app/masters/items' },
  ] as const

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-lg border bg-gradient-to-br from-teal-50 to-background p-5 dark:from-teal-500/10">
        <h1 className="text-xl font-bold">
          {greeting()},{' '}
          {isLoading ? (
            <Skeleton className="inline-block h-6 w-32 align-middle" />
          ) : (
            <span className="text-teal-600 dark:text-teal-400">{profile?.fullName ?? 'there'}</span>
          )}{' '}
          👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening in your service center.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickActions.map((action) =>
          'to' in action ? (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${action.tone}`}>
                <action.icon className="size-4" />
              </span>
              <span className="truncate">{action.label}</span>
            </Link>
          ) : (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted"
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${action.tone}`}>
                <action.icon className="size-4" />
              </span>
              <span className="truncate">{action.label}</span>
            </button>
          )
        )}
      </div>

      <FilterBar dateRange={range === 'all' ? undefined : range} onDateRangeChange={setRange}>
        <Button
          type="button"
          size="sm"
          variant={range === 'all' ? 'default' : 'outline'}
          onClick={() => setRange('all')}
        >
          All Time
        </Button>
      </FilterBar>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Job Cards" value={stats.totalJobCards} icon={FileText} />
        <StatCard
          label="Total in Pipeline"
          value={stats.totalInPipeline}
          icon={Activity}
          tone="info"
        />
        <StatCard label="All Job Cards" value={stats.allJobCards} icon={Wrench} tone="purple" />
        <StatCard label="Revenue" value={`₹${stats.revenue}`} icon={IndianRupee} tone="success" />
        <StatCard
          label="Outstanding"
          value={`₹${stats.outstanding}`}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard label="In Progress" value={stats.inProgress} icon={Activity} tone="info" />

        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Avg Turnaround" value={stats.avgTurnaroundLabel ?? '—'} icon={Clock} />
        <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} tone="danger" />
        <StatCard label="In Queue" value={stats.inQueue} icon={ListOrdered} tone="warning" />
        <StatCard label="On Hold" value={stats.onHold} icon={PauseCircle} tone="warning" />
        <StatCard label="Tech Done" value={stats.techDone} icon={CheckCircle2} tone="success" />

        <StatCard label="Ready" value={stats.ready} icon={PackageCheck} tone="success" />
        <StatCard label="Delivered" value={stats.delivered} icon={Truck} tone="purple" />
        <StatCard label="Closed" value={stats.closed} icon={Lock} />
        <StatCard label="Pending Return" value={stats.pendingReturn} icon={Undo2} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-semibold">Job Cards by Status</h2>
          {stats.jobCardsByStatus.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No job cards yet"
              description="This chart fills in once job cards start moving through your workflow."
            />
          ) : (
            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.jobCardsByStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {stats.jobCardsByStatus.map((entry) => (
                      <Cell key={entry.status} fill={CHART_TONE_HEX[toneFromStatus(entry.status)]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">
                  {stats.jobCardsByStatus.reduce((sum, s) => sum + s.count, 0)}
                </span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                {stats.jobCardsByStatus.map((s) => (
                  <span key={s.status} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: CHART_TONE_HEX[toneFromStatus(s.status)] }}
                    />
                    {s.status} ({s.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-semibold">Revenue Trend</h2>
          {stats.revenueTrend.length === 0 ? (
            <EmptyState
              icon={IndianRupee}
              title="No revenue yet"
              description="This chart fills in once bills start getting generated."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenueTrend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${v}`}
                    width={56}
                  />
                  <Tooltip formatter={(v: unknown) => [`₹${String(v)}`, 'Revenue'] as [string, string]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <ScanJobCardModal open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  )
}
