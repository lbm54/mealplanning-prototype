/**
 * DayColumnA — Variant A's upgraded day column.
 *
 * 2026 facelift:
 * - Mango glow outline on today (box-shadow, not ring)
 * - Carb tier badge in withLabel mode
 * - TrainingDayDot with active+pulse on key workout days
 * - Workout slot grouping with Electrolyte left-border "FUEL" section
 * - Hover: column edges tint to Electrolyte
 * - Stagger-in animation on load (60ms per column)
 */
import { cn } from "@/lib/utils";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import { MealCellA } from "./meal-cell-a";

export interface DayColumnAProps {
  day: DayPlanData;
  onMealClick?: (date: string, slot: string) => void;
  className?: string;
  /** Column index for stagger animation (0-6) */
  index?: number;
}

export function DayColumnA({ day, onMealClick, className, index = 0 }: DayColumnAProps) {
  const hasWorkout = Boolean(day.activity);

  return (
    <div
      className={cn(
        "group/col flex flex-col min-w-[160px] flex-1",
        "rounded-[var(--radius-card)]",
        "transition-all duration-300",
        // Today: Mango glow outline
        day.isToday && "ring-1 ring-[var(--color-orange)]",
        className,
      )}
      style={{
        // Stagger fade-up animation
        animation: `fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
        // Mango glow for today
        boxShadow: day.isToday
          ? `var(--shadow-glow-orange), inset 0 0 0 1px var(--color-orange)`
          : undefined,
      }}
    >
      {/* Column header */}
      <div
        className={cn(
          "sticky top-0 z-10 rounded-t-[var(--radius-card)] p-3 pb-2 space-y-1",
          "bg-card border-b border-border/60",
          // Hover: subtle Electrolyte tint on column edges
          "group-hover/col:border-[var(--color-electrolyte)]/20",
          "transition-colors duration-200",
          day.isToday && "bg-[var(--color-orange)]/[0.04]",
        )}
      >
        {/* Today label */}
        {day.isToday && (
          <p className="font-[var(--font-compadre)] text-[8px] uppercase tracking-widest text-[var(--color-orange)] leading-none mb-1">
            Today
          </p>
        )}

        {/* Day name + training dot */}
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "font-[var(--font-compadre)] uppercase tracking-wider leading-none",
              day.isToday
                ? "text-[var(--color-orange)] text-[var(--font-size-body)]"
                : "text-foreground text-[var(--font-size-body)]",
            )}
          >
            {day.dayLabel}
          </p>
          {(day.isKeyWorkout || hasWorkout) && (
            <TrainingDayDot active={day.isKeyWorkout} size="sm" />
          )}
        </div>

        {/* Date */}
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground leading-none">
          {day.dateLabel}
        </p>

        {/* Activity summary */}
        {day.activity && (
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/80 truncate leading-none">
            {day.activity.type}
            {day.activity.distanceMiles ? ` · ${day.activity.distanceMiles}mi` : ""}
            {day.activity.durationMinutes ? ` · ${day.activity.durationMinutes}m` : ""}
          </p>
        )}

        {/* Carb tier badge with label */}
        <CarbTierBadge carbG={day.carbG} withLabel className="mt-0.5" />
      </div>

      {/* Meal slots */}
      <div className="flex flex-col gap-1.5 p-2 flex-1">
        {/* Standard slots: B */}
        <SlotRowA
          label="B"
          fullLabel="BREAKFAST"
          meal={day.meals.breakfast}
          onClick={onMealClick ? () => onMealClick(day.date, "breakfast") : undefined}
        />

        {/* Workout fuel group */}
        {hasWorkout && (
          <div
            className={cn(
              "relative pl-2",
              // Electrolyte left-border running down the fuel group
              "before:absolute before:left-0 before:top-0 before:bottom-0",
              "before:w-0.5 before:rounded-full",
              "before:bg-[var(--color-electrolyte)]/60",
            )}
          >
            {/* FUEL section header */}
            <p className="font-[var(--font-compadre)] text-[7px] uppercase tracking-widest text-[var(--color-electrolyte)]/70 mb-1 pl-1">
              Fuel
            </p>

            <div className="flex flex-col gap-1.5">
              <SlotRowA
                label="PRE"
                fullLabel="PRE"
                meal={day.meals.pre_workout}
                onClick={
                  onMealClick ? () => onMealClick(day.date, "pre_workout") : undefined
                }
                isFuel
              />
              {day.isKeyWorkout && (
                <>
                  <SlotRowA
                    label="DURING"
                    fullLabel="DURING"
                    meal={day.meals.during_workout}
                    onClick={
                      onMealClick
                        ? () => onMealClick(day.date, "during_workout")
                        : undefined
                    }
                    isFuel
                  />
                  <SlotRowA
                    label="POST"
                    fullLabel="POST"
                    meal={day.meals.post_workout}
                    onClick={
                      onMealClick
                        ? () => onMealClick(day.date, "post_workout")
                        : undefined
                    }
                    isFuel
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* L / D / SNACK */}
        <SlotRowA
          label="L"
          fullLabel="LUNCH"
          meal={day.meals.lunch}
          onClick={onMealClick ? () => onMealClick(day.date, "lunch") : undefined}
        />
        <SlotRowA
          label="D"
          fullLabel="DINNER"
          meal={day.meals.dinner}
          onClick={onMealClick ? () => onMealClick(day.date, "dinner") : undefined}
        />
        <SlotRowA
          label="SNACK"
          fullLabel="SNACK"
          meal={day.meals.snack}
          onClick={onMealClick ? () => onMealClick(day.date, "snack") : undefined}
        />
      </div>
    </div>
  );
}

// ─── Slot row ────────────────────────────────────────────────────────────────

interface SlotRowAProps {
  label: string;
  fullLabel: string;
  meal?: MealAssembly | null;
  onClick?: () => void;
  isFuel?: boolean;
}

function SlotRowA({ label: _label, fullLabel, meal, onClick, isFuel }: SlotRowAProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <p
        className={cn(
          "font-[var(--font-compadre)] text-[7px] uppercase tracking-widest px-1 leading-none",
          isFuel
            ? "text-[var(--color-electrolyte)]/60"
            : "text-muted-foreground/60",
        )}
      >
        {fullLabel}
      </p>
      <MealCellA meal={meal} slot={fullLabel} onClick={onClick} />
    </div>
  );
}
