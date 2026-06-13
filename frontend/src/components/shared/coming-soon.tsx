import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function ComingSoon({ icon: Icon, title, description, className }: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <Badge variant="secondary" className="text-xs font-normal">
          Dalam Pengembangan
        </Badge>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
