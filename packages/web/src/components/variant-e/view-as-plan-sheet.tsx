/**
 * ViewAsPlanSheet — right-panel plan viewer for Variant E.
 *
 * Upgraded to use DayBreakdownModal widget inside the Sheet, replacing the
 * hand-rolled dense list. Keeps the existing shadcn Sheet scaffold and header.
 * Tab toggle: "Overview" (dense macro list) | "Day view" (DayBreakdownModal).
 */
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { Badge } from "@/components/ui/badge";
import DayBreakdownModal from "@/components/shared/widgets/day-breakdown-modal";
import type {
  DayBreakdownModalOutput,
  PlanDay,
  DayMealSlot,
} from "@/components/shared/widgets/day-breakdown-modal";
import type { MealAssembly as CellMealAssembly } from "@/components/shared/meal-cell";
import type { WeekPlan, DayPlan, MealAssembly as SchemaMealAssembly } from "@/server/jade/schema";
import dayjs from "dayjs";
import { KyleButton } from "@/components/shared/kyle-button";
import { MessageSquare } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Adapters
// ─────────────────────────────────────────────────────────────

const SLOT_ORDER = [
  "breakfast", "pre_workout", "during_workout", "post_workout",
  "lunch", "dinner", "snack",
];

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  pre_workout: "Pre-workout",
  during_workout: "During",
  post_workout: "Post-workout",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const DAY_NAMES: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

/** Convert a server-schema MealAssembly to MealCell's shape. */
function adaptMeal(meal: SchemaMealAssembly | null | undefined): CellMealAssembly | null {
  if (!meal) return null;
  return {
    id: meal.id,
    title: meal.title,
    methodTag: meal.method_tag,
    components: meal.components.map((c) => ({ name: c.name, portion: c.portion })),
    carbG: meal.totals.carb_g,
    protG: meal.totals.protein_g,
    fatG: meal.totals.fat_g,
  };
}

/** Convert a WeekPlan to DayBreakdownModalOutput */
function adaptWeekPlan(plan: WeekPlan): DayBreakdownModalOutput {
  const weekStart = dayjs(plan.week_start);
  const weekEnd = weekStart.add(6, "day");
  const title = `${weekStart.format("MMM D")} – ${weekEnd.format("MMM D")}`;

  const weekKcal = plan.days.reduce((total, day) => {
    const dayKcal = Object.values(day.meals ?? {}).reduce((s, m) => {
      if (!m) return s;
      return s + m.totals.carb_g * 4 + m.totals.protein_g * 4 + m.totals.fat_g * 9;
    }, 0);
    return total + dayKcal;
  }, 0);

  const days: PlanDay[] = plan.days.map((day): PlanDay => {
    const date = dayjs(day.date);
    const dayName = DAY_NAMES[date.day()] ?? "";
    const dateLabel = date.format("MMM D");

    const carbG = Math.round(
      Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.carb_g ?? 0), 0),
    );
    const proteinG = Math.round(
      Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.protein_g ?? 0), 0),
    );
    const fatG = Math.round(
      Object.values(day.meals ?? {}).reduce((s, m) => s + (m?.totals.fat_g ?? 0), 0),
    );
    const kcal = Math.round(carbG * 4 + proteinG * 4 + fatG * 9);

    const slots: DayMealSlot[] = SLOT_ORDER
      .filter((slot) => day.meals?.[slot as keyof typeof day.meals] !== undefined)
      .map((slot): DayMealSlot => ({
        slot: SLOT_LABEL[slot] ?? slot,
        meal: adaptMeal(day.meals?.[slot as keyof typeof day.meals]),
      }));

    return {
      date: day.date,
      label: `${dayName} · ${dateLabel}`,
      slots,
      carbG,
      proteinG,
      fatG,
      kcal,
    };
  });

  return {
    title,
    description: plan.coach_strip,
    days,
    weekKcal: Math.round(weekKcal),
  };
}

// ─────────────────────────────────────────────────────────────
// Overview (dense macro list — original design)
// ─────────────────────────────────────────────────────────────

function MacroBar({ carb, prot, fat }: { carb: number; prot: number; fat: number }) {
  const total = carb + prot + fat;
  if (total === 0) return null;
  const carbPct = (carb / total) * 100;
  const protPct = (prot / total) * 100;
  const fatPct = (fat / total) * 100;

  return (
    <div className="space-y-1.5 mt-3">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div className="bg-[var(--color-orange)] rounded-l-full" style={{ width: `${carbPct}%` }} />
        <div className="bg-[var(--color-electrolyte)]" style={{ width: `${protPct}%` }} />
        <div className="bg-[var(--color-dragonfruit)]/60 rounded-r-full" style={{ width: `${fatPct}%` }} />
      </div>
      <div className="flex gap-4 flex-wrap">
        {[
          { color: "var(--color-orange)", label: "Carbs", val: carb },
          { color: "var(--color-electrolyte)", label: "Protein", val: prot },
          { color: "var(--color-dragonfruit)", label: "Fat", val: fat },
        ].map(({ color, label, val }) => (
          <span
            key={label}
            className="flex items-center gap-1 font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider text-muted-foreground/50 uppercase"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            {Math.round(val)}g {label}
          </span>
        ))}
      </div>
    </div>
  );
}

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
  const activeMeals = SLOT_ORDER.filter((slot) => day.meals?.[slot as keyof typeof day.meals]);

  return (
    <div className="rounded-[var(--radius-card)] border border-border/50 bg-card/60 overflow-hidden backdrop-blur-[4px]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
              {dayName}
            </span>
            <span className="font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider text-muted-foreground/50 uppercase">
              {dateLabel}
            </span>
            {hasWorkout && <TrainingDayDot />}
          </div>
          {day.day_note && (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] italic text-muted-foreground/50 mt-0.5">
              {day.day_note}
            </p>
          )}
        </div>
        {totalCarbs > 0 && <CarbTierBadge carbG={Math.round(totalCarbs)} withLabel />}
      </div>
      <div className="divide-y divide-border/25">
        {activeMeals.map((slot) => {
          const meal = day.meals?.[slot as keyof typeof day.meals];
          if (!meal) return null;
          return (
            <div key={slot} className="px-4 py-2.5">
              <p className="font-[var(--font-compadre)] text-[0.6rem] uppercase tracking-widest text-muted-foreground/40 mb-1">
                {SLOT_LABEL[slot] ?? slot}
              </p>
              <p className="font-[var(--font-apercu)] font-medium text-[var(--font-size-body)] leading-snug text-foreground/90">
                {meal.title}
              </p>
              <ul className="mt-1 space-y-0.5">
                {meal.components.map((c, i) => (
                  <li
                    key={i}
                    className="flex gap-1.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/55"
                  >
                    <span className="shrink-0 text-[var(--color-electrolyte)]/40 mt-px">›</span>
                    <span>{c.portion} {c.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 font-[var(--font-apercu-mono)] text-[0.6rem] text-muted-foreground/40 uppercase tracking-wider">
                {Math.round(meal.totals.carb_g)}g C · {Math.round(meal.totals.protein_g)}g P · {Math.round(meal.totals.fat_g)}g F
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab toggle
// ─────────────────────────────────────────────────────────────

type ViewTab = "overview" | "day-view";

function TabToggle({
  active,
  onChange,
}: {
  active: ViewTab;
  onChange: (tab: ViewTab) => void;
}) {
  return (
    <div className="flex rounded-[var(--radius-pill)] bg-muted/30 p-0.5 text-[var(--font-size-caption)]">
      {(["overview", "day-view"] as ViewTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 rounded-[var(--radius-pill)] px-3 py-1.5 transition-all duration-150",
            "font-[var(--font-apercu)] capitalize",
            active === tab
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab === "overview" ? "Overview" : "Day view"}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sheet
// ─────────────────────────────────────────────────────────────

export interface ViewAsPlanSheetProps {
  plan: WeekPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAsPlanSheet({ plan, isOpen, onClose }: ViewAsPlanSheetProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("day-view");

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

  const dayBreakdownOutput = plan ? adaptWeekPlan(plan) : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "sm:max-w-md flex flex-col bg-background/95 backdrop-blur-[20px]",
          "border-l border-white/10 p-0",
        )}
      >
        {/* Header */}
        <SheetHeader className="shrink-0 px-5 pt-5 pb-4 border-b border-border/30">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <SheetTitle
                className={cn(
                  "font-[var(--font-compadre)] uppercase tracking-widest",
                  "text-[var(--font-size-body)] text-foreground",
                )}
              >
                {weekStart && weekEnd
                  ? `${weekStart.format("MMM D")} – ${weekEnd.format("MMM D, YYYY")}`
                  : "Your week"}
              </SheetTitle>
              <SheetDescription className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/60">
                Read-only · edit by talking to Jade
              </SheetDescription>
            </div>
            {plan?.coach_strip && (
              <Badge variant="training-day" className="shrink-0 mt-0.5">
                Plan
              </Badge>
            )}
          </div>

          {/* Macro bar summary */}
          {weekTotals && (
            <MacroBar
              carb={weekTotals.carb}
              prot={weekTotals.prot}
              fat={weekTotals.fat}
            />
          )}

          {/* Tab toggle */}
          {plan && (
            <div className="mt-3">
              <TabToggle active={activeTab} onChange={setActiveTab} />
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!plan ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <MessageSquare size={20} className="text-muted-foreground/40" />
              </div>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground/60">
                No plan yet
              </p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/40 mt-1">
                Ask Jade to build your week
              </p>
            </div>
          ) : activeTab === "day-view" && dayBreakdownOutput ? (
            // DayBreakdownModal widget — the full accordion with 2×2 meal grid
            <DayBreakdownModal output={dayBreakdownOutput} />
          ) : (
            // Overview — original dense day cards
            <div className="space-y-3">
              {plan.days.map((day) => <DayCard key={day.date} day={day} />)}
            </div>
          )}
        </div>

        {/* Footer — back to chat */}
        <div className="shrink-0 border-t border-border/30 px-4 py-3">
          <KyleButton
            variant="outline"
            onClick={onClose}
            className={cn(
              "w-full border-white/15 text-foreground/70 bg-transparent",
              "hover:bg-white/5 hover:text-foreground",
            )}
          >
            Back to chat with Jade
          </KyleButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
