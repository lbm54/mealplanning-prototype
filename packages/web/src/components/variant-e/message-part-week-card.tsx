/**
 * MessagePartWeekCard — structured WeekPlan card embedded in Jade's message.
 *
 * 2026 facelift:
 * - KyleCard variant="elevated" for depth
 * - Compadre Wide header with week range + training-day badge
 * - 7 day rows: Day | CarbTierBadge (withLabel) | condensed meal summary
 * - Weekly macro totals as horizontal stacked bar at the bottom
 * - Two pill actions: VIEW AS PLAN (outline, cyan ghost) + SAVE THIS WEEK (Mango)
 * - Skeleton rows with shimmer animation while streaming
 */
import { cn } from "@/lib/utils";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
import { Badge } from "@/components/ui/badge";
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

const SLOT_ORDER = [
  "breakfast", "pre_workout", "lunch", "dinner",
  "during_workout", "post_workout", "snack",
] as const;

/** Shimmer skeleton row while streaming */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 animate-pulse">
      <div className="h-2.5 w-8 rounded bg-muted/60" />
      <div className="h-2.5 w-12 rounded bg-muted/40" />
      <div className="h-2.5 flex-1 rounded bg-muted/30" />
    </div>
  );
}

function DayRow({ day }: { day: DayPlan }) {
  const date = dayjs(day.date);
  const dow = DAY_ABBR[date.day()] ?? "?";
  const dateLabel = date.format("M/D");

  const totalCarbs = Object.values(day.meals ?? {}).reduce(
    (sum, meal) => sum + (meal?.totals.carb_g ?? 0), 0,
  );

  // Build condensed meal summary: "B · L · D" or with titles when compact
  const mealParts: string[] = [];
  for (const slot of SLOT_ORDER) {
    const meal = day.meals?.[slot];
    if (meal) {
      mealParts.push(`${SLOT_ABBR[slot] ?? slot}: ${meal.title}`);
    }
  }

  return (
    <div className="py-2 border-b border-border/25 last:border-0">
      <div className="flex items-start gap-2.5">
        {/* Day abbreviation */}
        <span
          className={cn(
            "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
            "text-muted-foreground/70 shrink-0 w-8 pt-px",
          )}
        >
          {dow}
        </span>

        {/* Date label */}
        <span
          className={cn(
            "font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider",
            "text-muted-foreground/40 shrink-0 pt-0.5 w-7",
          )}
        >
          {dateLabel}
        </span>

        {/* Carb tier badge */}
        {totalCarbs > 0 && (
          <div className="shrink-0 pt-px">
            <CarbTierBadge carbG={Math.round(totalCarbs)} withLabel />
          </div>
        )}

        {/* Meal summary — condensed dots */}
        <div className="flex-1 min-w-0">
          {mealParts.length > 0 && (
            <p
              className={cn(
                "font-[var(--font-apercu)] text-[var(--font-size-caption)] leading-relaxed",
                "text-foreground/60 truncate",
              )}
            >
              {mealParts.join(" · ")}
            </p>
          )}
          {day.day_note && (
            <p className="font-[var(--font-apercu)] text-[0.6rem] italic text-muted-foreground/40 mt-0.5">
              {day.day_note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Horizontal macro stacked bar */
function MacroBar({
  carb,
  prot,
  fat,
}: {
  carb: number;
  prot: number;
  fat: number;
}) {
  const total = carb + prot + fat;
  if (total === 0) return null;

  const carbPct = (carb / total) * 100;
  const protPct = (prot / total) * 100;
  const fatPct = (fat / total) * 100;

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div
          className="bg-[var(--color-orange)] rounded-l-full transition-all duration-500"
          style={{ width: `${carbPct}%` }}
        />
        <div
          className="bg-[var(--color-electrolyte)] transition-all duration-500"
          style={{ width: `${protPct}%` }}
        />
        <div
          className="bg-[var(--color-dragonfruit)]/60 rounded-r-full transition-all duration-500"
          style={{ width: `${fatPct}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {[
          { color: "var(--color-orange)", label: "C", val: carb },
          { color: "var(--color-electrolyte)", label: "P", val: prot },
          { color: "var(--color-dragonfruit)", label: "F", val: fat },
        ].map(({ color, label, val }) => (
          <span
            key={label}
            className="flex items-center gap-1 font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider text-muted-foreground/50 uppercase"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: color }}
            />
            {Math.round(val)}g {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Determine an appropriate badge for the week character */
function weekBadge(plan: WeekPlan): React.ReactNode {
  const strip = (plan.coach_strip ?? "").toLowerCase();
  if (strip.includes("race") || strip.includes("event")) {
    return <Badge variant="race">Race week</Badge>;
  }
  if (strip.includes("load") || strip.includes("carb")) {
    return <Badge variant="carb-loading">Carb loading</Badge>;
  }
  if (strip.includes("rest") || strip.includes("recover")) {
    return <Badge variant="rest">Recovery</Badge>;
  }
  return <Badge variant="training-day">Training</Badge>;
}

import type React from "react";

export function MessagePartWeekCard({
  plan,
  isStreaming,
  onSave,
  onView,
  className,
}: MessagePartWeekCardProps) {
  const weekStart = dayjs(plan.week_start);
  const weekEnd = weekStart.add(6, "day");

  const weekTotals = plan.days.reduce(
    (acc, day) => {
      const c = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.carb_g ?? 0), 0);
      const p = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.protein_g ?? 0), 0);
      const f = Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.fat_g ?? 0), 0);
      return { carb: acc.carb + c, prot: acc.prot + p, fat: acc.fat + f };
    },
    { carb: 0, prot: 0, fat: 0 },
  );

  return (
    <KyleCard
      variant="elevated"
      className={cn("overflow-hidden", className)}
    >
      {/* Card header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border/40">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p
              className={cn(
                "font-[var(--font-compadre)] uppercase tracking-[0.15em]",
                "text-[var(--font-size-caption)] text-muted-foreground/60",
              )}
            >
              Week of
            </p>
            <p
              className={cn(
                "font-[var(--font-compadre)] uppercase tracking-widest",
                "text-[var(--font-size-body)] text-foreground mt-0.5",
              )}
            >
              {weekStart.format("MMM D")} – {weekEnd.format("MMM D")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {weekBadge(plan)}
            {isStreaming && (
              <Badge variant="ai-active">Building…</Badge>
            )}
          </div>
        </div>

        {/* Coach strip */}
        {plan.coach_strip && (
          <p
            className={cn(
              "mt-2 font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium",
              "text-foreground/80 leading-snug",
            )}
          >
            {plan.coach_strip}
          </p>
        )}
      </div>

      {/* Day rows */}
      <div className="px-4 py-1">
        {plan.days.map((day) => (
          <DayRow key={day.date} day={day} />
        ))}

        {/* Skeleton rows for days not yet streamed */}
        {isStreaming &&
          plan.days.length < 7 &&
          Array.from({ length: 7 - plan.days.length }).map((_, i) => (
            <SkeletonRow key={`sk-${i}`} />
          ))}
      </div>

      {/* Macro bar */}
      {(weekTotals.carb > 0 || weekTotals.prot > 0) && (
        <div className="px-4 pb-3 pt-1 border-t border-border/25">
          <MacroBar
            carb={weekTotals.carb}
            prot={weekTotals.prot}
            fat={weekTotals.fat}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border/30 flex gap-2 flex-wrap">
        {onView && (
          <button
            type="button"
            onClick={onView}
            className={cn(
              "rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/40 px-3 py-1.5",
              "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
              "text-[var(--color-electrolyte)]/80",
              "hover:bg-[var(--color-electrolyte)]/10 hover:border-[var(--color-electrolyte)]/60",
              "hover:text-[var(--color-electrolyte)] hover:-translate-y-px",
              "transition-all duration-150",
            )}
          >
            View as plan
          </button>
        )}
        {onSave && !isStreaming && (
          <KyleButton
            size="sm"
            onClick={onSave}
            className="text-[var(--font-size-caption)] px-3 py-1.5 h-auto"
          >
            Save this week
          </KyleButton>
        )}
        {isStreaming && (
          <span className="flex items-center gap-1.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50 italic">
            <span className="w-1 h-1 rounded-full bg-[var(--color-electrolyte)]/50 animate-pulse" />
            Building your week…
          </span>
        )}
      </div>
    </KyleCard>
  );
}
