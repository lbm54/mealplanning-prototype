/**
 * Variant B — DoneSummary (generative UI upgrade 2026-05-08).
 *
 * Replaces the manual stats block with:
 *   - InsightTile cards for any weekly imbalances (low fiber / low protein)
 *   - MealPlanCard showing full week macros + day count
 *   - Tap MealPlanCard expand → DayBreakdownModal in a Sheet
 *   - WeekHeatmap showing carb-tier shading per day
 *   - CTA buttons: Save week / Rebuild
 *
 * Confetti burst and coach-strip are preserved.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, Save, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import MealPlanCard from "@/components/shared/widgets/meal-plan-card";
import WeekHeatmap from "@/components/shared/widgets/week-heatmap";
import DayBreakdownModal from "@/components/shared/widgets/day-breakdown-modal";
import InsightTile from "@/components/shared/widgets/insight-tile";
import type { MealPlanCardOutput } from "@/components/shared/widgets/meal-plan-card";
import type { WeekHeatmapOutput, HeatmapDay } from "@/components/shared/widgets/week-heatmap";
import type { DayBreakdownModalOutput, PlanDay, DayMealSlot } from "@/components/shared/widgets/day-breakdown-modal";
import type { InsightTileOutput } from "@/components/shared/widgets/insight-tile";
import type { WeekPlan } from "@/server/jade/schema";
import type { SlotDecision } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(weekStart + "T12:00:00");
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Resolve a meal's macro totals — falls back to summing components when
 *  the loose schema omits the totals object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mealTotals(meal: any) {
  if (meal?.totals?.carb_g !== undefined || meal?.totals?.protein_g !== undefined || meal?.totals?.fat_g !== undefined) {
    return {
      carb_g: Number(meal.totals.carb_g ?? 0),
      protein_g: Number(meal.totals.protein_g ?? 0),
      fat_g: Number(meal.totals.fat_g ?? 0),
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components = (meal?.components ?? []) as any[];
  return {
    carb_g: components.reduce((s, c) => s + Number(c?.carb_g ?? 0), 0),
    protein_g: components.reduce((s, c) => s + Number(c?.protein_g ?? 0), 0),
    fat_g: components.reduce((s, c) => s + Number(c?.fat_g ?? 0), 0),
  };
}

function computeWeekTotals(weekPlan: WeekPlan) {
  let carbG = 0, protG = 0, fatG = 0;
  for (const day of weekPlan.days) {
    for (const meal of Object.values(day.meals ?? {})) {
      if (!meal) continue;
      const t = mealTotals(meal);
      carbG += t.carb_g;
      protG += t.protein_g;
      fatG += t.fat_g;
    }
  }
  return { carbG: Math.round(carbG), protG: Math.round(protG), fatG: Math.round(fatG) };
}

/** Derive MealPlanCard output from a WeekPlan */
function buildMealPlanCardOutput(weekPlan: WeekPlan): MealPlanCardOutput {
  const { carbG, protG, fatG } = computeWeekTotals(weekPlan);
  const dayCount = weekPlan.days.length;
  const weekKcal = Math.round((carbG * 4 + protG * 4 + fatG * 9));
  return {
    title: "Your week",
    description: weekPlan.coach_strip,
    weekKcal,
    dayCount,
    dailyAvg: {
      carbG: Math.round(carbG / dayCount),
      proteinG: Math.round(protG / dayCount),
      fatG: Math.round(fatG / dayCount),
      kcal: Math.round(weekKcal / dayCount),
    },
  };
}

/** Derive WeekHeatmap output from a WeekPlan */
function buildHeatmapOutput(weekPlan: WeekPlan): WeekHeatmapOutput {
  const days: HeatmapDay[] = weekPlan.days.map((day, i) => {
    const carbG = Object.values(day.meals ?? {}).reduce(
      (sum, m) => sum + (m ? mealTotals(m).carb_g : 0),
      0,
    );
    return {
      date: day.date,
      label: DAY_LABELS_SHORT[i] ?? "?",
      carbG: Math.round(carbG),
    };
  });
  return { days, label: "Carb distribution" };
}

/** Derive DayBreakdownModal output from a WeekPlan.
 *
 *  DayBreakdownModal uses MealCell's local MealAssembly type
 *  (carbG/protG/fatG flat fields, not `totals`), so we map here.
 */
function buildDayBreakdownOutput(weekPlan: WeekPlan): DayBreakdownModalOutput {
  const days: PlanDay[] = weekPlan.days.map((day, i) => {
    const meals = day.meals ?? {};
    let carbG = 0, proteinG = 0, fatG = 0;

    const slots: DayMealSlot[] = Object.entries(meals).map(([slot, meal]) => {
      const t = meal ? mealTotals(meal) : null;
      if (t) {
        carbG += t.carb_g;
        proteinG += t.protein_g;
        fatG += t.fat_g;
      }
      return {
        slot,
        meal: meal
          ? {
              id: meal.id,
              title: meal.title,
              methodTag: meal.method_tag,
              components: (meal.components ?? []).map((c) => ({
                name: c.name,
                portion: c.portion,
              })),
              carbG: t?.carb_g ?? 0,
              protG: t?.protein_g ?? 0,
              fatG: t?.fat_g ?? 0,
            }
          : null,
      };
    });

    const kcal = Math.round(carbG * 4 + proteinG * 4 + fatG * 9);
    return {
      date: day.date,
      label: DAY_LABELS_SHORT[i] ?? "Day",
      slots,
      carbG: Math.round(carbG),
      proteinG: Math.round(proteinG),
      fatG: Math.round(fatG),
      kcal,
    };
  });

  const weekKcal = days.reduce((s, d) => s + d.kcal, 0);
  return { title: "Week breakdown", days, weekKcal };
}

/** Detect nutritional imbalances and return InsightTile outputs */
function detectInsights(weekPlan: WeekPlan): InsightTileOutput[] {
  const { carbG, protG } = computeWeekTotals(weekPlan);
  const dayCount = weekPlan.days.length;
  const avgCarbG = carbG / dayCount;
  const avgProtG = protG / dayCount;
  const insights: InsightTileOutput[] = [];

  if (avgProtG < 100) {
    insights.push({
      tone: "warning",
      title: "Protein is running low",
      body: `Daily average is ${Math.round(avgProtG)}g — aim for at least 100g to support recovery.`,
      actionLabel: "Add a protein-rich swap",
    });
  }

  // Estimate fiber (rough: ~12% of carbs, target ~25g/day)
  const estimatedFiberG = avgCarbG * 0.12;
  if (estimatedFiberG < 20) {
    insights.push({
      tone: "info",
      title: "Fiber looks a bit low",
      body: `Estimated ${Math.round(estimatedFiberG)}g/day. Try adding beans, oats, or veggies to a few lunches.`,
    });
  }

  return insights;
}

// ─── Confetti ────────────────────────────────────────────────────────────────

function ConfettiDots() {
  const dots = [
    { x: "10%", y: "8%", color: "var(--color-orange)", size: 8, delay: 0 },
    { x: "85%", y: "5%", color: "var(--color-electrolyte)", size: 6, delay: 0.1 },
    { x: "50%", y: "3%", color: "var(--color-dragonfruit)", size: 7, delay: 0.2 },
    { x: "25%", y: "12%", color: "var(--color-orange-light)", size: 5, delay: 0.05 },
    { x: "72%", y: "10%", color: "var(--color-electrolyte-light)", size: 6, delay: 0.15 },
    { x: "92%", y: "18%", color: "var(--color-orange)", size: 4, delay: 0.3 },
    { x: "8%", y: "22%", color: "var(--color-dragonfruit-light)", size: 5, delay: 0.08 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            background: dot.color,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], y: [0, -20, -30, -50] }}
          transition={{
            duration: 1.2,
            delay: dot.delay,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.15, 0.6, 1],
          }}
        />
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DoneSummaryProps {
  weekPlan: WeekPlan;
  decisions: SlotDecision[];
  onRebuild: () => void;
  onSave?: () => void;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DoneSummary({
  weekPlan,
  onRebuild,
  onSave,
  className,
}: DoneSummaryProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const weekRange = formatWeekRange(weekPlan.week_start);
  const planCardOutput = buildMealPlanCardOutput(weekPlan);
  const heatmapOutput = buildHeatmapOutput(weekPlan);
  const breakdownOutput = buildDayBreakdownOutput(weekPlan);
  const insights = detectInsights(weekPlan);

  function handleSave() {
    setSaved(true);
    onSave?.();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative flex flex-col gap-5 px-4 py-8 max-w-md w-full mx-auto ${className ?? ""}`}
      >
        {/* Confetti */}
        <ConfettiDots />

        {/* Headline block */}
        <div className="text-center space-y-3 relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
            className="flex justify-center"
          >
            <JadeAvatar size={96} state="idle" glow />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-[var(--font-sansita)] font-bold uppercase tracking-wide text-foreground"
              style={{ fontSize: "clamp(1.6rem, 5vw, 2rem)" }}
            >
              WEEK BUILT
            </h1>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground mt-1">
              {weekRange}
            </p>
          </motion.div>
        </div>

        {/* Insight tiles — shown only when imbalances detected */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2"
          >
            {insights.map((insight, i) => (
              <InsightTile
                key={i}
                output={insight}
              />
            ))}
          </motion.div>
        )}

        {/* MealPlanCard — tap expand arrow to open DayBreakdownModal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <MealPlanCard
            output={planCardOutput}
            onExpand={() => setSheetOpen(true)}
          />
        </motion.div>

        {/* WeekHeatmap */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[var(--radius-card)] border border-border/40 bg-card p-4"
          style={{ boxShadow: "var(--shadow-card-elevated-light)" }}
        >
          <WeekHeatmap output={heatmapOutput} />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save week
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground normal-case"
            onClick={onRebuild}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rebuild stack
          </Button>
        </motion.div>
      </motion.div>

      {/* DayBreakdownModal Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Day breakdown
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <DayBreakdownModal output={breakdownOutput} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
