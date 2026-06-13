import { ChartSkeleton } from "@/components/shared/skeletons";

export default function ParetoLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-pulse space-y-1.5">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
      </div>
      <div className="animate-pulse flex gap-2">
        <div className="h-9 w-32 rounded-md bg-muted" />
        <div className="h-9 w-36 rounded-md bg-muted" />
      </div>
      <ChartSkeleton />
    </div>
  );
}
