import { cn } from "@/lib/utils";
import { MealCell, type MealAssembly } from "./meal-cell";
import { CarbTierBadge } from "./carb-tier-badge";
import { TrainingDayDot } from "./training-day-dot";
import { MacroBar } from "./macro-bar";

/**
 * DayColumn — a single day's column in the week grid.
 *
 * Design source: 05_design_proposal.md §5.1, §5.4, §5.6
 *
 * Used by Approach A (Calendar) and Approach D (Hybrid).
 * Contains: sticky header, activity summary, carb tier, slot rows.
 */
export interface ActivitySummary {
  type: string;
  title?: string;
  distanceMiles?: number;
  durationMinutes?: number;
  intensityLevel?: string;
}

export interface DayPlanData {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "MON", "TUE", etc.
  dateLabel: string; // "May 6"
  isToday: boolean;
  isKeyWorkout: boolean;
  activity?: ActivitySummary | null;
  carbG: number;
  protG: number;
  fatG: number;
  meals: {
    breakfast?: MealAssembly | null;
    pre_workout?: MealAssembly | null;
    during_workout?: MealAssembly | null;
    post_workout?: MealAssembly | null;
    lunch?: MealAssembly | null;
    dinner?: MealAssembly | null;
    snack?: MealAssembly | null;
  };
}

export interface DayColumnProps {
  day: DayPlanData;
  onMealClick?: (date: string, slot: string) => void;
  className?: string;
}

export function DayColumn({ day, onMealClick, className }: DayColumnProps) {
  const isHardDay =
    day.carbG >= 200 ||
    day.activity?.intensityLevel === "high" ||
    day.activity?.intensityLevel === "threshold";

  return (
    <div
      className={cn(
        "flex flex-col min-w-[140px]",
        className,
      )}
    >
      {/* Sticky column header */}
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

        {/* Activity summary */}
        <p
          className={cn(
            "mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground truncate",
            isHardDay && "font-[var(--font-sansita)] font-bold text-foreground",
          )}
        >
          {day.activity
            ? `${day.activity.type}${day.activity.distanceMiles ? ` · ${day.activity.distanceMiles}mi` : ""}`
            : "rest"}
        </p>

        {/* Carb tier badge */}
        <CarbTierBadge carbG={day.carbG} className="mt-1" />

        {/* Macro summary (compact) */}
        <MacroBar carbG={day.carbG} protG={day.protG} fatG={day.fatG} className="mt-1" />
      </div>

      {/* Meal slots */}
      <div className="flex flex-col gap-2 p-2">
        <SlotRow
          label="B"
          meal={day.meals.breakfast}
          onClick={onMealClick ? () => onMealClick(day.date, "breakfast") : undefined}
        />

        {/* Pre/During/Post — only on workout days */}
        {(day.activity || isHardDay) && (
          <>
            <SlotRow
              label="PRE"
              meal={day.meals.pre_workout}
              onClick={
                onMealClick
                  ? () => onMealClick(day.date, "pre_workout")
                  : undefined
              }
            />
            {isHardDay && (
              <>
                <SlotRow
                  label="DURING"
                  meal={day.meals.during_workout}
                  onClick={
                    onMealClick
                      ? () => onMealClick(day.date, "during_workout")
                      : undefined
                  }
                />
                <SlotRow
                  label="POST"
                  meal={day.meals.post_workout}
                  onClick={
                    onMealClick
                      ? () => onMealClick(day.date, "post_workout")
                      : undefined
                  }
                />
              </>
            )}
          </>
        )}

        <SlotRow
          label="L"
          meal={day.meals.lunch}
          onClick={onMealClick ? () => onMealClick(day.date, "lunch") : undefined}
        />
        <SlotRow
          label="D"
          meal={day.meals.dinner}
          onClick={onMealClick ? () => onMealClick(day.date, "dinner") : undefined}
        />
        <SlotRow
          label="SNACK"
          meal={day.meals.snack}
          onClick={onMealClick ? () => onMealClick(day.date, "snack") : undefined}
        />
      </div>
    </div>
  );
}

interface SlotRowProps {
  label: string;
  meal?: MealAssembly | null;
  onClick?: () => void;
}

function SlotRow({ label, meal, onClick }: SlotRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-1">
        {label}
      </p>
      <MealCell
        meal={meal}
        slot={label}
        density="compact"
        onClick={onClick}
      />
    </div>
  );
}
