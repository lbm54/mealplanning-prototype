/**
 * WeekGrid — the 7-column desktop calendar grid.
 *
 * 2026 facelift:
 * - KyleCard variant="elevated" glass surface wrapping the grid
 * - DayColumnA with stagger-in (60ms per column)
 * - Skeleton cells stagger in 50ms apart
 * - Low-opacity internal dividers
 */
import { cn } from "@/lib/utils";
import type { DayPlanData } from "@/components/shared/day-column";
import { DayColumnA } from "./day-column-a";

export interface WeekGridProps {
  days: DayPlanData[];
  onMealClick?: (date: string, slot: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function WeekGrid({ days, onMealClick, isLoading, className }: WeekGridProps) {
  return (
    /* Glass elevated card wrapping the entire grid */
    <div
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-card)]",
        "border border-white/10 bg-card/80 backdrop-blur-[12px]",
        "shadow-[var(--shadow-card-elevated-light)] dark:shadow-[var(--shadow-card-elevated-dark)]",
        "dark:ring-1 dark:ring-white/[0.06]",
        className,
      )}
    >
      <div className="overflow-x-auto pb-4">
        <div
          className={cn(
            "flex min-w-max",
            // Internal column dividers
            "[&>*+*]:border-l [&>*+*]:border-border/20",
          )}
        >
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <DayColumnSkeletonA key={i} index={i} />
              ))
            : days.map((day, i) => (
                <DayColumnA
                  key={day.date}
                  day={day}
                  onMealClick={onMealClick}
                  index={i}
                  className="flex-1 min-w-[155px]"
                />
              ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DayColumnSkeletonA({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col min-w-[155px] flex-1 gap-2"
      style={{
        animation: `fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Header skeleton */}
      <div className="p-3 pb-2 space-y-2 border-b border-border/30">
        <div className="h-2 w-10 rounded-full bg-muted" style={{ animation: `shimmer 1.5s ease-in-out infinite ${index * 50}ms`, background: "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)", backgroundSize: "200% 100%" }} />
        <div className="h-2 w-14 rounded-full" style={{ animation: `shimmer 1.5s ease-in-out infinite ${index * 50 + 100}ms`, background: "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)", backgroundSize: "200% 100%" }} />
        <div className="h-4 w-16 rounded-[var(--radius-pill)]" style={{ animation: `shimmer 1.5s ease-in-out infinite ${index * 50 + 200}ms`, background: "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)", backgroundSize: "200% 100%" }} />
      </div>

      {/* Meal slot skeletons */}
      <div className="flex flex-col gap-1.5 px-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[4.5rem] rounded-[var(--radius-card)]"
            style={{
              animation: `shimmer 1.5s ease-in-out infinite ${index * 50 + i * 50}ms`,
              background:
                "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)",
              backgroundSize: "200% 100%",
            }}
          />
        ))}
      </div>
    </div>
  );
}
