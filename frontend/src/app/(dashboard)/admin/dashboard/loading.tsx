import { ChartSkeleton, KpiCardsSkeleton } from "@/components/shared/skeletons";

export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="animate-pulse flex items-end justify-between">
        <div className="space-y-1">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-7 w-44 rounded bg-muted" />
        </div>
        <div className="h-4 w-36 rounded bg-muted" />
      </div>

      {/* KPI cards */}
      <KpiCardsSkeleton count={4} />

      {/* Chart + alert panel */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border bg-card">
          <div className="animate-pulse border-b border-border px-5 py-4">
            <div className="h-4 w-56 rounded bg-muted" />
          </div>
          <ChartSkeleton className="py-4" />
        </div>
        <div className="lg:col-span-2 animate-pulse rounded-xl border bg-card p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-muted"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* Bottom tables */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 animate-pulse rounded-xl border bg-card p-5 space-y-3">
          <div className="h-4 w-48 rounded bg-muted" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
        <div className="lg:col-span-2 animate-pulse rounded-xl border bg-card p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
