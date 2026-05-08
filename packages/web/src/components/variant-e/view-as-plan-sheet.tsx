/**
 * ViewAsPlanSheet — read-only overlay showing the latest WeekPlan as a grid.
 *
 * Design source: 06_five_uiux_approaches.md §1.E "View as plan" detail wireframe
 *
 * Opens as a Sheet (full-height right panel on desktop, bottom sheet on mobile).
 * Renders each day as a card with slot → meal component list.
 * Read-only: no editing here; conversation is the source of truth.
 */
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import type { WeekPlan, DayPlan } from "@/server/jade/schema";
import dayjs from "dayjs";

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  pre_workout: "Pre-workout",
  during_workout: "During workout",
  post_workout: "Post-workout",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const SLOT_ORDER = [
  "breakfast", "pre_workout", "during_workout", "post_workout",
  "lunch", "dinner", "snack",
];

const DAY_NAMES: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function DayCard({ day }: { day: DayPlan }) {
  const date = dayjs(day.date);
  const dayName = DAY_NAMES[date.day()] ?? "";
  const dateLabel = date.format("MMM D");
  const hasWorkout = Object.keys(day.meals ?? {}).some(
    (s) => s === "pre_workout" || s === "during_workout" || s === "post_workout",
  );

  const totalCarbs = Object.values(day.meals ?? {}).reduce(
    (s, m) => s + (m?.totals.carb_g ?? 0), 0,
  );

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card overflow-hidden">
      {/* Day header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
        <span className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider">
          {dayName}
        </span>
        <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          {dateLabel}
        </span>
        {hasWorkout && <TrainingDayDot />}
        {totalCarbs > 0 && (
          <CarbTierBadge carbG={Math.round(totalCarbs)} className="ml-auto" />
        )}
      </div>

      {/* Meals */}
      <div className="divide-y divide-border/50">
        {SLOT_ORDER.map((slot) => {
          const meal = day.meals?.[slot as keyof typeof day.meals];
          if (!meal) return null;
          return (
            <div key={slot} className="px-4 py-2.5">
              {/* Slot label */}
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground mb-1">
                {SLOT_LABEL[slot] ?? slot}
              </p>
              {/* Title */}
              <p className="font-[var(--font-apercu)] font-medium text-[var(--font-size-body)] leading-snug">
                {meal.title}
              </p>
              {/* Components */}
              <ul className="mt-1 space-y-0.5">
                {meal.components.map((c, i) => (
                  <li
                    key={i}
                    className="flex gap-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground"
                  >
                    <span className="shrink-0">·</span>
                    <span>{c.portion} {c.name}</span>
                  </li>
                ))}
              </ul>
              {/* Macro line */}
              <p className="mt-1 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/70 uppercase tracking-wider">
                {Math.round(meal.totals.carb_g)}g C · {Math.round(meal.totals.protein_g)}g P · {Math.round(meal.totals.fat_g)}g F
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface ViewAsPlanSheetProps {
  plan: WeekPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAsPlanSheet({ plan, isOpen, onClose }: ViewAsPlanSheetProps) {
  if (!isOpen) return null;

  const weekStart = plan ? dayjs(plan.week_start) : null;
  const weekEnd = weekStart ? weekStart.add(6, "day") : null;

  const weekTotals = plan
    ? plan.days.reduce(
        (acc, day) => {
          const c = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.carb_g ?? 0), 0);
          const p = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.protein_g ?? 0), 0);
          const f = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.fat_g ?? 0), 0);
          return { carb: acc.carb + c, prot: acc.prot + p, fat: acc.fat + f };
        },
        { carb: 0, prot: 0, fat: 0 },
      )
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-label="Your week plan"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:max-w-md",
          "flex flex-col bg-background border-l border-border",
          "animate-in slide-in-from-right",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <p className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider">
              {weekStart && weekEnd
                ? `${weekStart.format("MMM D")} – ${weekEnd.format("MMM D, YYYY")}`
                : "Your week"}
            </p>
            {weekTotals && (
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                {Math.round(weekTotals.carb)}g C · {Math.round(weekTotals.prot)}g P · {Math.round(weekTotals.fat)}g F
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-muted transition-colors",
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Day cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {plan ? (
            plan.days.map((day) => (
              <DayCard key={day.date} day={day} />
            ))
          ) : (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground text-center py-8">
              No plan yet — ask Jade to build your week.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <button
            onClick={onClose}
            className={cn(
              "w-full rounded-[var(--radius-pill)] border border-border py-2",
              "font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground",
              "transition-colors hover:bg-muted",
            )}
          >
            back to chat with Jade
          </button>
        </div>
      </div>
    </>
  );
}
