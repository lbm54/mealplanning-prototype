/**
 * DayRail — left visual rail + header cell shown once per day group.
 *
 * The rail color encodes the carb tier:
 *   REST / low     → muted
 *   EASY / moderate → subtle Electrolyte
 *   MOD  / high     → brighter Electrolyte
 *   HARD / very-high → Mango
 *   RACE             → Dragonfruit
 *
 * Shows: day name (Compadre Wide), date (Apercu Mono), CarbTierBadge,
 * TrainingDayDot if workout day.
 */

import { CarbTierBadge, getCarbTier } from "@/components/shared/carb-tier-badge";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { cn } from "@/lib/utils";

export interface DayRailProps {
  date: string;       // YYYY-MM-DD
  label: string;      // "Mon"
  carbG: number;
  isWorkoutDay: boolean;
  /** Whether this is the first slot of a day group (shows full header) */
  isFirstSlot: boolean;
  className?: string;
}

// Left rail thickness — 3px line that spans the full row height
const RAIL_WIDTH = "w-[3px]";

function railColorClass(carbG: number): string {
  const tier = getCarbTier(carbG);
  return {
    "low":       "bg-muted-foreground/20",
    "moderate":  "bg-[var(--color-electrolyte)]/40",
    "high":      "bg-[var(--color-electrolyte)]/70",
    "very-high": "bg-[var(--color-orange)]",
  }[tier];
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DayRail({
  date,
  label,
  carbG,
  isWorkoutDay,
  isFirstSlot,
  className,
}: DayRailProps) {
  const railColor = railColorClass(carbG);

  return (
    <div className={cn("flex items-stretch gap-0", className)}>
      {/* Colored left rail */}
      <div className={cn("shrink-0 rounded-l-[var(--radius-card)]", RAIL_WIDTH, railColor)} />

      {/* Day header — only rendered on first slot */}
      <div className="flex flex-col justify-center px-3 py-2 w-full min-h-[52px]">
        {isFirstSlot ? (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-widest font-bold text-foreground leading-none">
                {label}
              </span>
              {isWorkoutDay && (
                <TrainingDayDot active size="sm" />
              )}
            </div>
            <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wide mt-0.5">
              {formatDateShort(date)}
            </span>
            <div className="mt-1">
              <CarbTierBadge carbG={carbG} withLabel />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
