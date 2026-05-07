/**
 * EmptyStateC — shown when there are no foods in the column catalog.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.8)
 */

import { TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateCProps {
  message?: string;
  className?: string;
}

export function EmptyStateC({ message, className }: EmptyStateCProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 py-16 text-center",
      className,
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <TableProperties size={28} />
      </div>
      <div className="space-y-1">
        <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] font-bold uppercase tracking-wider">
          No options yet
        </p>
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground max-w-xs">
          {message ?? "Jade couldn't find options for this column. Check your food catalog or update your dietary preferences."}
        </p>
      </div>
    </div>
  );
}
