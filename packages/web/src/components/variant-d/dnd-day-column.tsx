/**
 * DndDayColumn — DnD-aware day column for Variant D's grid.
 *
 * 2026 facelift:
 * - Today's column: soft Mango glow backdrop (radius 24px) instead of thick outline
 * - Day header: Compadre Wide day name, date, CarbTierBadge withLabel, training dot
 * - Slots: DroppableDayCell with isDragging prop for drop zone affordances
 * - Day macro bar at column bottom (compact, text-only)
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
  /** Forwarded from DndContext — shows drop affordances on all cells */
  isDragging?: boolean;
  className?: string;
}

export function DndDayColumn({ day, onMealClick, isDragging, className }: DndDayColumnProps) {
  const isHardDay =
    day.carbG >= 200 ||
    day.activity?.intensityLevel === "high" ||
    day.activity?.intensityLevel === "threshold";

  const hasActivity = Boolean(day.activity);

  return (
    <div
      className={cn(
        "flex flex-col min-w-[128px] relative",
        // Today column: subtle mango glow backdrop
        day.isToday && [
          "rounded-[1.5rem]",
          "before:absolute before:inset-0 before:rounded-[1.5rem] before:pointer-events-none",
          "before:shadow-[0_0_32px_-4px_rgba(247,139,20,0.22)]",
        ],
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-10 px-2.5 py-2 rounded-t-[var(--radius-card)]",
          day.isToday
            ? "bg-gradient-to-b from-[var(--color-orange)]/8 to-transparent"
            : "bg-background",
        )}
      >
        {/* Day name row */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <p
            className={cn(
              "font-[var(--font-compadre)] uppercase tracking-wider leading-none",
              day.isToday
                ? "text-[var(--font-size-body)] text-[var(--color-orange)] font-bold"
                : "text-[var(--font-size-caption)] text-foreground",
            )}
          >
            {day.dayLabel}
          </p>
          {hasActivity && <TrainingDayDot />}
        </div>

        {/* Date */}
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70 leading-none mb-1.5">
          {day.dateLabel}
        </p>

        {/* Carb tier badge */}
        <CarbTierBadge carbG={day.carbG} withLabel />

        {/* Activity label — only on workout days */}
        {day.activity && (
          <p
            className={cn(
              "mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground truncate",
              isHardDay && "font-medium text-foreground",
            )}
          >
            {day.activity.type}
            {day.activity.distanceMiles ? ` · ${day.activity.distanceMiles}mi` : ""}
          </p>
        )}
      </div>

      {/* Droppable meal slots */}
      <div className="flex flex-col gap-1.5 px-2 pb-2 flex-1">
        {SLOT_LABELS.map(({ key, label }) => {
          if (WORKOUT_ONLY_SLOTS.includes(key) && !hasActivity && !isHardDay) return null;
          if ((key === "during_workout" || key === "post_workout") && !isHardDay) return null;

          const meal =
            (day.meals as Record<string, MealAssembly | null | undefined>)[key] ?? null;

          return (
            <div key={key} className="flex flex-col gap-0.5">
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground/60 px-1 leading-none">
                {label}
              </p>
              <DroppableDayCell
                date={day.date}
                slot={key}
                meal={meal}
                isDragging={isDragging}
                onMealClick={() => onMealClick(day.date, key)}
              />
            </div>
          );
        })}
      </div>

      {/* Compact day macro summary at column bottom */}
      {(day.carbG > 0 || day.protG > 0 || day.fatG > 0) && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-border/30">
          <MacroBar
            carbG={day.carbG}
            protG={day.protG}
            fatG={day.fatG}
            textOnly
          />
        </div>
      )}
    </div>
  );
}
