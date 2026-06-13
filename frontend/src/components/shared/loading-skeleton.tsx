import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── TableSkeleton ────────────────────────────────────────────────────────────

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full rounded-lg border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b bg-muted/30 px-4 py-2.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 border-b px-4 py-3 last:border-0"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── CardSkeleton ─────────────────────────────────────────────────────────────

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 ring-1 ring-foreground/10 bg-card flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${75 + (i % 3) * 8}%` }} />
      ))}
    </div>
  );
}

// ─── FormSkeleton ─────────────────────────────────────────────────────────────

interface FormSkeletonProps {
  fields?: number;
  columns?: 1 | 2;
  className?: string;
}

export function FormSkeleton({ fields = 6, columns = 1, className }: FormSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-5",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─── StatsSkeleton ────────────────────────────────────────────────────────────

interface StatsSkeletonProps {
  cards?: number;
  className?: string;
}

export function StatsSkeleton({ cards = 4, className }: StatsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-5 ring-1 ring-foreground/10 bg-card flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          </div>
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
      ))}
    </div>
  );
}
