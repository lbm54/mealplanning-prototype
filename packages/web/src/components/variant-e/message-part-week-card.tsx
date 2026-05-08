/**
 * MessagePartWeekCard — structured WeekPlan card embedded in Jade's bubble.
 *
 * Design source: 06_five_uiux_approaches.md §1.E wireframe
 *
 * Shows:
 * - Week header (dates, coach strip / theme)
 * - Week totals (carb/protein/fat)
 * - Per-day bullet list: day label + carb tier dot + brief meal list
 * - [view as plan] and [save this week] buttons
 *
 * When isStreaming=true, shows a skeleton for days not yet populated.
 */
import { cn } from "@/lib/utils";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import type { WeekPlan, DayPlan } from "@/server/jade/schema";
import dayjs from "dayjs";

export interface MessagePartWeekCardProps {
  plan: WeekPlan;
  isStreaming?: boolean;
  onSave?: () => void;
  onView?: () => void;
  className?: string;
}

const DAY_ABBR: Record<number, string> = {
  0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT",
};

const SLOT_ABBR: Record<string, string> = {
  breakfast: "B",
  pre_workout: "PRE",
  during_workout: "DUR",
  post_workout: "POST",
  lunch: "L",
  dinner: "D",
  snack: "S",
};

function DayRow({ day }: { day: DayPlan }) {
  const date = dayjs(day.date);
  const dow = DAY_ABBR[date.day()] ?? "?";
  const dateLabel = date.format("MMM D");

  // Compute total carbs for the day
  const totalCarbs = Object.values(day.meals ?? {}).reduce((sum, meal) => {
    if (!meal) return sum;
    return sum + (meal.totals.carb_g ?? 0);
  }, 0);

  // Build meal summary string
  const mealParts: string[] = [];
  const slotOrder = ["breakfast", "pre_workout", "lunch", "dinner", "during_workout", "post_workout", "snack"] as const;
  for (const slot of slotOrder) {
    const meal = day.meals?.[slot];
    if (meal) {
      mealParts.push(`${SLOT_ABBR[slot] ?? slot} ${meal.title}`);
    }
  }

  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Day + date */}
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider min-w-[2.5rem]">
          {dow}
        </span>
        <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          {dateLabel}
        </span>
        {/* Carb tier */}
        {totalCarbs > 0 && (
          <CarbTierBadge carbG={Math.round(totalCarbs)} />
        )}
      </div>

      {/* Day note */}
      {day.day_note && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground italic pl-[2.5rem]">
          {day.day_note}
        </p>
      )}

      {/* Meals */}
      {mealParts.length > 0 && (
        <ul className="pl-[2.5rem] space-y-0.5">
          {mealParts.map((part, i) => (
            <li
              key={i}
              className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground leading-snug"
            >
              {part}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MessagePartWeekCard({
  plan,
  isStreaming,
  onSave,
  onView,
  className,
}: MessagePartWeekCardProps) {
  const weekStart = dayjs(plan.week_start);
  const weekEnd = weekStart.add(6, "day");

  // Compute week totals
  const weekTotals = plan.days.reduce(
    (acc, day) => {
      const dayCarbs = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.carb_g ?? 0), 0);
      const dayProt = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.protein_g ?? 0), 0);
      const dayFat = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.fat_g ?? 0), 0);
      return { carb: acc.carb + dayCarbs, prot: acc.prot + dayProt, fat: acc.fat + dayFat };
    },
    { carb: 0, prot: 0, fat: 0 },
  );

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-card",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "overflow-hidden",
        className,
      )}
    >
      {/* Card header */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
          WEEK · {weekStart.format("MMM D")} – {weekEnd.format("MMM D, YYYY")}
        </p>

        {/* Coach strip / theme */}
        {plan.coach_strip && (
          <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium">
            {plan.coach_strip}
          </p>
        )}

        {/* Week totals */}
        {(weekTotals.carb > 0 || isStreaming) && (
          <p className="mt-1 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
            {Math.round(weekTotals.carb)}g C · {Math.round(weekTotals.prot)}g P · {Math.round(weekTotals.fat)}g F
          </p>
        )}
      </div>

      {/* Day list */}
      <div className="px-4 py-1">
        {plan.days.map((day) => (
          <DayRow key={day.date} day={day} />
        ))}
        {/* Skeleton rows while streaming */}
        {isStreaming && plan.days.length < 7 && (
          Array.from({ length: 7 - plan.days.length }).map((_, i) => (
            <div key={`skeleton-${i}`} className="py-2 border-b border-border/50 last:border-0">
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex gap-2 flex-wrap">
        {onView && (
          <button
            onClick={onView}
            className={cn(
              "rounded-[var(--radius-pill)] border border-border px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground",
              "transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
          >
            view as plan
          </button>
        )}
        {onSave && !isStreaming && (
          <button
            onClick={onSave}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5",
              "bg-primary text-primary-foreground",
              "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
              "transition-colors hover:bg-[var(--color-orange-light)]",
            )}
          >
            save this week
          </button>
        )}
        {isStreaming && (
          <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground italic">
            Building…
          </span>
        )}
      </div>
    </div>
  );
}
