/**
 * WeekGrid — the 7-column desktop calendar grid.
 *
 * Design source: 06_five_uiux_approaches.md §1.A wireframes.
 *
 * Renders DayColumn × 7. Today's column has a Mango orange outline.
 * The "key workout day" (longest activity) gets a cyan TrainingDayDot.
 * Scrollable horizontally on smaller desktop viewports.
 */
import { cn } from "@/lib/utils";
import { DayColumn, type DayPlanData } from "@/components/shared/day-column";
// TODO: Replace with shadcn ScrollArea once it's added via `pnpm dlx shadcn@latest add scroll-area`
// For now using a plain div with overflow-x-auto

export interface WeekGridProps {
  days: DayPlanData[];
  onMealClick?: (date: string, slot: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function WeekGrid({ days, onMealClick, isLoading, className }: WeekGridProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex gap-3 pb-4 min-w-max">
        {isLoading
          ? // Skeleton columns while Jade streams
            Array.from({ length: 7 }).map((_, i) => (
              <DayColumnSkeleton key={i} />
            ))
          : days.map((day) => (
              <DayColumn
                key={day.date}
                day={day}
                onMealClick={onMealClick}
                className={cn(
                  "min-w-[160px] flex-1",
                  // Today: Mango outline (per spec — "Today's column is outlined in Mango")
                  day.isToday &&
                    "ring-2 ring-[var(--color-orange)] ring-offset-2 ring-offset-background rounded-[var(--radius-card)]",
                )}
              />
            ))}
      </div>
    </div>
  );
}

function DayColumnSkeleton() {
  return (
    <div className="flex flex-col min-w-[160px] flex-1 gap-2">
      {/* Header skeleton */}
      <div className="p-3 pb-2 space-y-2">
        <div className="h-3 w-12 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
      </div>
      {/* Meal slot skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mx-2 h-16 rounded-[var(--radius-card)] bg-muted animate-pulse" />
      ))}
    </div>
  );
}
