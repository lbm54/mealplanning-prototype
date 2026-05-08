/**
 * DndDayColumn — DnD-aware day column for Variant D's grid.
 *
 * Wraps the shared DayColumn's slot rows with DroppableDayCell targets.
 * Used instead of raw DayColumn so each slot accepts drops from the chat panel.
 *
 * Design source: 07_parallel_build_plans.md §5.3 step 1.D.6
 */
import { cn } from "@/lib/utils";
import { DroppableDayCell } from "./droppable-day-cell";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { MacroBar } from "@/components/shared/macro-bar";
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";

const SLOT_LABELS: { key: keyof DayPlanData["meals"]; label: string }[] = [
  { key: "breakfast", label: "B" },
  { key: "pre_workout", label: "PRE" },
  { key: "during_workout", label: "DURING" },
  { key: "post_workout", label: "POST" },
  { key: "lunch", label: "L" },
  { key: "dinner", label: "D" },
  { key: "snack", label: "SNACK" },
];

const WORKOUT_ONLY_SLOTS: (keyof DayPlanData["meals"])[] = [
  "pre_workout",
  "during_workout",
  "post_workout",
];

export interface DndDayColumnProps {
  day: DayPlanData;
  onMealClick: (date: string, slot: string) => void;
  className?: string;
}

export function DndDayColumn({ day, onMealClick, className }: DndDayColumnProps) {
  const isHardDay =
    day.carbG >= 200 ||
    day.activity?.intensityLevel === "high" ||
    day.activity?.intensityLevel === "threshold";

  const hasActivity = Boolean(day.activity);

  return (
    <div className={cn("flex flex-col min-w-[130px]", className)}>
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-10 bg-background p-3 pb-2",
          day.isToday &&
            "after:absolute after:inset-0 after:rounded-[var(--radius-card)] after:border-2 after:border-foreground after:pointer-events-none",
        )}
      >
        {day.isToday && (
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary mb-0.5">
            Today
          </p>
        )}
        <div className="flex items-center gap-1">
          <p
            className={cn(
              "uppercase tracking-wider",
              isHardDay
                ? "font-[var(--font-sansita)] font-bold text-[var(--font-size-body)]"
                : "font-[var(--font-compadre)] text-[var(--font-size-caption)]",
            )}
          >
            {day.dayLabel}
          </p>
          {day.isKeyWorkout && <TrainingDayDot />}
        </div>
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          {day.dateLabel}
        </p>
        <p
          className={cn(
            "mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground truncate",
            isHardDay &&
              "font-[var(--font-sansita)] font-bold text-foreground",
          )}
        >
          {day.activity
            ? `${day.activity.type}${day.activity.distanceMiles ? ` · ${day.activity.distanceMiles}mi` : ""}`
            : "rest"}
        </p>
        <CarbTierBadge carbG={day.carbG} className="mt-1" />
        <MacroBar
          carbG={day.carbG}
          protG={day.protG}
          fatG={day.fatG}
          className="mt-1"
        />
      </div>

      {/* Droppable meal slots */}
      <div className="flex flex-col gap-2 p-2">
        {SLOT_LABELS.map(({ key, label }) => {
          // Skip workout-only slots unless it's a workout day
          if (WORKOUT_ONLY_SLOTS.includes(key) && !hasActivity && !isHardDay) {
            return null;
          }

          // Skip during_workout + post_workout on low-intensity days
          if (
            (key === "during_workout" || key === "post_workout") &&
            !isHardDay
          ) {
            return null;
          }

          const meal = (day.meals as Record<string, MealAssembly | null | undefined>)[key] ?? null;

          return (
            <div key={key} className="flex flex-col gap-1">
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-1">
                {label}
              </p>
              <DroppableDayCell
                date={day.date}
                slot={key}
                meal={meal}
                onMealClick={() => onMealClick(day.date, key)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
