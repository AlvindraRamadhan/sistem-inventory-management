import { cn } from "@/lib/utils";

export const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse space-y-4 p-5", className)}>
    <div className="flex items-center gap-3">
      <div className="h-4 w-4 rounded bg-muted" />
      <div className="h-4 w-48 rounded bg-muted" />
    </div>
    <div className="h-[320px] w-full rounded-xl bg-muted" />
  </div>
);

export const TableSkeleton = ({ rows = 5, className }: { rows?: number; className?: string }) => (
  <div className={cn("animate-pulse space-y-2 p-5", className)}>
    <div className="h-9 w-full rounded-lg bg-muted" />
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="h-12 w-full rounded-lg bg-muted"
        style={{ opacity: 1 - i * 0.15 }}
      />
    ))}
  </div>
);

export const KpiCardsSkeleton = ({ count = 4, className }: { count?: number; className?: string }) => (
  <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="animate-pulse rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-8 rounded-lg bg-muted" />
        </div>
        <div className="h-8 w-16 rounded bg-muted mb-2" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
    ))}
  </div>
);

export const FilterBarSkeleton = ({ fields = 4, className }: { fields?: number; className?: string }) => (
  <div className={cn("animate-pulse rounded-xl border bg-card px-5 py-4", className)}>
    <div className="flex flex-wrap items-end gap-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-9 w-36 rounded-md bg-muted" />
        </div>
      ))}
    </div>
  </div>
);
