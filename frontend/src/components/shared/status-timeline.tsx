import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  date?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const StatusTimeline = ({
  steps,
  orientation = "horizontal",
  className,
}: StatusTimelineProps) => {
  if (orientation === "vertical") {
    return <VerticalTimeline steps={steps} className={className} />;
  }
  return <HorizontalTimeline steps={steps} className={className} />;
};

const StepCircle = ({ step }: { step: TimelineStep }) => {
  if (step.isCompleted) {
    return (
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600">
        <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
    );
  }

  if (step.isCurrent) {
    return (
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full border-2 border-emerald-500 opacity-60" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-500 bg-background">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>
    );
  }

  return (
    <div className="relative z-10 h-8 w-8 shrink-0 rounded-full border-2 border-border bg-muted/30" />
  );
};

const HorizontalTimeline = ({
  steps,
  className,
}: {
  steps: TimelineStep[];
  className?: string;
}) => (
  <div className={cn("flex w-full items-start", className)}>
    {steps.map((step, index) => (
      <div key={index} className="relative flex flex-1 flex-col items-center">
        {/* Left half of connector — colored by previous step */}
        {index > 0 && (
          <div
            className={cn(
              "absolute top-4 left-0 right-1/2 h-0.5",
              steps[index - 1].isCompleted ? "bg-emerald-500" : "bg-border"
            )}
          />
        )}
        {/* Right half of connector — colored by this step */}
        {index < steps.length - 1 && (
          <div
            className={cn(
              "absolute top-4 left-1/2 right-0 h-0.5",
              step.isCompleted ? "bg-emerald-500" : "bg-border"
            )}
          />
        )}

        <StepCircle step={step} />

        <div className="mt-2 px-1 text-center">
          <p
            className={cn(
              "text-xs font-medium leading-tight",
              step.isCompleted || step.isCurrent
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {step.label}
          </p>
          {step.date && (
            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground/70">
              {step.date}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
);

const VerticalTimeline = ({
  steps,
  className,
}: {
  steps: TimelineStep[];
  className?: string;
}) => (
  <div className={cn("flex flex-col", className)}>
    {steps.map((step, index) => (
      <div key={index} className="flex gap-3">
        {/* Circle + vertical connector */}
        <div className="flex flex-col items-center">
          <StepCircle step={step} />
          {index < steps.length - 1 && (
            <div
              className={cn(
                "my-1 w-px flex-1 rounded-full",
                step.isCompleted ? "bg-emerald-500" : "bg-border"
              )}
            />
          )}
        </div>

        {/* Label + date */}
        <div
          className={cn(
            "flex min-h-8 flex-col justify-center",
            index < steps.length - 1 && "pb-4"
          )}
        >
          <p
            className={cn(
              "text-sm font-medium leading-none",
              step.isCompleted || step.isCurrent
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {step.label}
          </p>
          {step.date && (
            <p className="mt-1 text-xs tabular-nums text-muted-foreground/70">
              {step.date}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
);
