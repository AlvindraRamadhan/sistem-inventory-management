import { FilterBarSkeleton, TableSkeleton } from "@/components/shared/skeletons";

export default function AuditLogLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-pulse flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-32 rounded bg-muted" />
          <div className="h-4 w-80 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-md bg-muted" />
          <div className="h-8 w-32 rounded-md bg-muted" />
        </div>
      </div>
      <FilterBarSkeleton fields={6} />
      <div className="animate-pulse flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-8 w-40 rounded-md bg-muted" />
      </div>
      <TableSkeleton rows={8} className="rounded-xl border bg-card" />
    </div>
  );
}
