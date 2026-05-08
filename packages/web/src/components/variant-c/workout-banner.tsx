/**
 * WorkoutBanner — thin horizontal banner above the first meal slot on workout days.
 *
 * "WORKOUT FUEL" in Compadre Wide uppercase + "Tempo run · 6pm · 60min" in muted Apercu.
 * Left Electrolyte border, TrainingDayDot.
 */

import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { cn } from "@/lib/utils";

export interface WorkoutBannerProps {
  workoutNote: string;
  className?: string;
}

export function WorkoutBanner({ workoutNote, className }: WorkoutBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-card)]",
        "border border-[var(--color-electrolyte)]/20 bg-[var(--color-electrolyte)]/5",
        "border-l-[3px] border-l-[var(--color-electrolyte)]/60",
        "px-3 py-2",
        className,
      )}
    >
      <TrainingDayDot active size="md" />
      <div className="flex items-baseline gap-2 flex-wrap min-w-0">
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-[var(--color-electrolyte)] leading-none shrink-0">
          Workout Fuel
        </span>
        <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground leading-none truncate">
          {workoutNote}
        </span>
      </div>
    </div>
  );
}
