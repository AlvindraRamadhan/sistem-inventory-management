import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatsVariant = "default" | "success" | "warning" | "danger";

interface TrendInfo {
  value: number;
  isPositive: boolean;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: TrendInfo;
  variant?: StatsVariant;
  isLoading?: boolean;
  className?: string;
}

const variantStyles: Record<StatsVariant, { icon: string }> = {
  default: { icon: "bg-primary/10 text-primary" },
  success:  { icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  warning:  { icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  danger:   { icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isLoading = false,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("px-5 py-4 gap-0", className)}>
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Top row: title + icon */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium text-muted-foreground leading-snug">
              {title}
            </p>
            {Icon && (
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                  variantStyles[variant].icon
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Value */}
          <p className="text-3xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>

          {/* Bottom row: trend + subtitle */}
          {(trend || subtitle) && (
            <div className="flex items-center justify-between gap-2">
              {trend ? (
                <Trend trend={trend} />
              ) : (
                <span />
              )}
              {subtitle && (
                <span className="text-sm text-muted-foreground text-right">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Trend({ trend }: { trend: TrendInfo }) {
  const TrendIcon = trend.isPositive ? TrendingUp : TrendingDown;
  const sign = trend.isPositive ? "+" : "-";
  const colorClass = trend.isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", colorClass)}>
      <TrendIcon className="h-4 w-4" />
      {sign}{Math.abs(trend.value)}%
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-4 w-36" />
    </div>
  );
}
