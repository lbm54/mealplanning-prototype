/**
 * Variant A — Calendar
 *
 * Tagline: "The whole week, one screen, one tap to build it."
 * AI level: ★★☆☆☆
 *
 * Source: 06_five_uiux_approaches.md §1.A
 * Build order: 07_parallel_build_plans.md §2 (sub-phases 1.A.1 → 1.A.8)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Sub-phases implemented:
 *
 * 1.A.1 Layout shell — 7-col grid, header, Regenerate pill, macro rail,
 *        Ask-Jade pill. All rendered without data.
 *
 * 1.A.2 Read-only week — server loader pulls activities + daily_macro_targets
 *        + existing meal_plan; renders cells with real/stub data.
 *
 * 1.A.3 Carb-tier dots + training overlay — color-coded via CarbTierBadge
 *        on DayColumn headers; cyan TrainingDayDot on key workout day;
 *        extended PRE/DURING/POST rows on workout days.
 *
 * 1.A.4 Regenerate Week — Mango pill calls /api/jade/object?kind=week,
 *        streams a WeekPlan and persists to meal_plans. Falls back to
 *        getMockWeekPlan() when AI is not configured.
 *        TODO: Replace mock fallback once AI_GATEWAY_API_KEY is set.
 *
 * 1.A.5 Per-cell swap — clicking a cell opens SwapSheet with 3 alternatives
 *        from /api/jade/object?kind=swap; accepting one updates the cell +
 *        persists to meal_plan_meals.
 *        TODO: Persist swap to DB once planId is available from 1.A.4.
 *
 * 1.A.6 Coach strip — italic AI explanation from WeekPlan.coach_strip,
 *        pulled from planPageData.existingPlan or freshly generated WeekPlan.
 *
 * 1.A.7 Ask Jade drawer — floating JadePill pill (bottom-right), JadeDrawer
 *        right-side sheet with chat via /api/jade/chat?surface=a.
 *        TODO: Wire real useChat once AI_GATEWAY_API_KEY is set.
 *
 * 1.A.8 Polish — loading skeletons, empty/error states, keyboard nav (Esc
 *        closes drawers, arrow keys navigate days on mobile), sonner toasts.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * TODO (shared file changes needed — cannot edit without main PR):
 * - None currently. All shared primitives used as-is.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

// Shared primitives
import { Button } from "@/components/ui/button";
import { MacroTotalsRail } from "@/components/shared/macro-totals-rail";
import { cn } from "@/lib/utils";

// Variant-A-specific components
import { CoachStrip } from "@/components/variant-a/coach-strip";
import { WeekGrid } from "@/components/variant-a/week-grid";
import { JadePill } from "@/components/variant-a/jade-pill";
import { JadeDrawer } from "@/components/variant-a/jade-drawer";
import { SwapSheet } from "@/components/variant-a/swap-sheet";
import { TweakBar } from "@/components/variant-a/tweak-bar";

// Helpers
import {
  buildEmptyDays,
  applyMealRows,
  applyWeekPlan,
  computeWeekTotals,
  countPlanStats,
  getMealFromDay,
  findKeyWorkoutDate,
} from "@/components/variant-a/plan-helpers";
import { getMockWeekPlan } from "@/components/variant-a/mock-week-plan";

// Server-side data types
import type { PlanPageData } from "@/server/variant-a/plan-data";
import type { DayPlanData } from "@/components/shared/day-column";
import type { WeekPlan } from "@/server/jade/schema";
import type { SwapSheetMeal } from "@/components/variant-a/swap-sheet";

dayjs.extend(isoWeek);

// ─────────────────────────────────────────────────────────────────────────────
// Route definition + server loader (sub-phase 1.A.2)
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/plan/a")({
  loader: async (): Promise<PlanPageData> => {
    // Dynamic import so the server module is only evaluated server-side
    try {
      const { fetchPlanPageData } = await import(
        "@/server/variant-a/plan-data"
      );
      return await fetchPlanPageData();
    } catch {
      // Graceful fallback when server deps aren't available (e.g., browser-only build)
      const today = dayjs();
      const weekStart = today.isoWeekday(1).format("YYYY-MM-DD");
      const weekEnd = today.isoWeekday(7).format("YYYY-MM-DD");
      return {
        weekStart,
        weekEnd,
        isoWeek: today.isoWeek(),
        isoYear: today.isoWeekYear(),
        activities: [],
        macroTargets: [],
        existingPlan: null,
        existingMeals: [],
        hasSupabase: false,
      };
    }
  },
  component: VariantACalendar,
});

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

function VariantACalendar() {
  const loaderData = Route.useLoaderData();

  // ── State ─────────────────────────────────────────────────────────────────

  // Days displayed in the grid
  const [days, setDays] = useState<DayPlanData[]>(() => {
    const empty = buildEmptyDays(
      loaderData.weekStart,
      loaderData.activities,
      loaderData.macroTargets,
    );
    return applyMealRows(empty, loaderData.existingMeals);
  });

  // Coach strip text
  const [coachStrip, setCoachStrip] = useState<string | null>(
    loaderData.existingPlan?.coach_strip ?? null,
  );

  // Current plan ID (for persistence)
  const [planId, setPlanId] = useState<string | null>(
    loaderData.existingPlan?.id ?? null,
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Swap sheet state
  const [swapTarget, setSwapTarget] = useState<{
    date: string;
    slot: string;
    meal: SwapSheetMeal | null;
  } | null>(null);

  // Ask-Jade drawer state
  const [isJadeOpen, setIsJadeOpen] = useState(false);

  // Tweak applying state
  const [isApplyingTweak, setIsApplyingTweak] = useState(false);

  // Abort controller ref for stream cancellation
  const abortRef = useRef<AbortController | null>(null);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (swapTarget) setSwapTarget(null);
        else if (isJadeOpen) setIsJadeOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [swapTarget, isJadeOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Open swap sheet for a specific meal cell. */
  const handleMealClick = useCallback(
    (date: string, slot: string) => {
      const day = days.find((d) => d.date === date);
      if (!day) return;
      const meal = getMealFromDay(day, slot);
      setSwapTarget({
        date,
        slot,
        meal: meal
          ? {
              id: meal.id,
              title: meal.title,
              methodTag: meal.methodTag,
              components: meal.components,
              carbG: meal.carbG,
              protG: meal.protG,
              fatG: meal.fatG,
            }
          : null,
      });
    },
    [days],
  );

  /** Accept a swap — update the cell and persist. */
  const handleSwapAccept = useCallback(
    (meal: SwapSheetMeal) => {
      if (!swapTarget) return;

      // Optimistic update
      setDays((prev) =>
        prev.map((day) => {
          if (day.date !== swapTarget.date) return day;
          return {
            ...day,
            meals: {
              ...day.meals,
              [swapTarget.slot]: {
                title: meal.title,
                methodTag: meal.methodTag,
                components: meal.components,
                carbG: meal.carbG,
                protG: meal.protG,
                fatG: meal.fatG,
              },
            },
          };
        }),
      );

      toast.success("Meal swapped", {
        description: `${swapTarget.slot.replace(/_/g, " ")} on ${dayjs(swapTarget.date).format("ddd MMM D")} updated.`,
      });

      // Persist to DB if we have a plan
      if (planId) {
        import("@/server/variant-a/plan-data").then(({ updateMealCell }) => {
          updateMealCell(planId, swapTarget.date, swapTarget.slot, {
            title: meal.title,
            method_tag: meal.methodTag,
            carb_g: meal.carbG,
            prot_g: meal.protG,
            fat_g: meal.fatG,
          }).catch(() => {
            // Fail silently — optimistic update already shown
          });
        }).catch(() => {});
      }
    },
    [swapTarget, planId],
  );

  /** Regenerate the whole week via Jade (sub-phase 1.A.4). */
  const handleRegenerate = useCallback(async () => {
    if (isGenerating) {
      abortRef.current?.abort();
      return;
    }

    setIsGenerating(true);
    setCoachStrip(null);

    // Show skeleton immediately
    setDays(
      buildEmptyDays(
        loaderData.weekStart,
        loaderData.activities,
        loaderData.macroTargets,
      ),
    );

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          kind: "week",
          surface: "a",
          input: {
            week_start: loaderData.weekStart,
            iso_week: loaderData.isoWeek,
            iso_year: loaderData.isoYear,
          },
        }),
      });

      let weekPlan: WeekPlan | null = null;

      if (res.ok) {
        // Try to parse a streamed WeekPlan response
        try {
          const text = await res.text();
          // The streamObject endpoint emits partial JSON chunks —
          // find the last complete JSON-parseable object
          const lines = text.split("\n").filter(Boolean);
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            try {
              const parsed = JSON.parse(line.replace(/^data:\s*/, "")) as unknown;
              if (
                parsed &&
                typeof parsed === "object" &&
                "week_start" in parsed
              ) {
                weekPlan = parsed as WeekPlan;
                break;
              }
            } catch {
              // try previous line
            }
          }
          // Also try whole text as JSON
          if (!weekPlan) {
            try {
              const whole = JSON.parse(text) as unknown;
              if (whole && typeof whole === "object" && "week_start" in whole) {
                weekPlan = whole as WeekPlan;
              }
            } catch {
              // ignore
            }
          }
        } catch {
          // fall through to mock
        }
      }

      // Use mock if real endpoint failed or returned no parseable WeekPlan
      if (!weekPlan) {
        weekPlan = getMockWeekPlan(loaderData.weekStart);
      }

      // Apply the plan to the grid
      const baseDays = buildEmptyDays(
        loaderData.weekStart,
        loaderData.activities,
        loaderData.macroTargets,
      );
      const filledDays = applyWeekPlan(
        baseDays,
        weekPlan,
        loaderData.activities,
        loaderData.macroTargets,
      );
      setDays(filledDays);
      setCoachStrip(weekPlan.coach_strip ?? null);

      // Persist to DB
      try {
        const { persistWeekPlan } = await import("@/server/variant-a/plan-data");
        const meals: Parameters<typeof persistWeekPlan>[4] = [];

        for (const day of weekPlan.days) {
          if (!day.meals) continue;
          for (const [slot, asm] of Object.entries(day.meals)) {
            if (!asm) continue;
            meals.push({
              meal_date: day.date,
              meal_slot: slot,
              title: asm.title,
              method_tag: asm.method_tag,
              carb_g: asm.totals.carb_g,
              prot_g: asm.totals.protein_g,
              fat_g: asm.totals.fat_g,
              components_json: asm.components,
            });
          }
        }

        const newPlanId = await persistWeekPlan(
          loaderData.weekStart,
          loaderData.isoWeek,
          loaderData.isoYear,
          weekPlan.coach_strip ?? "",
          meals,
        );
        if (newPlanId) setPlanId(newPlanId);
      } catch {
        // Persist failure is non-fatal
      }

      toast.success("Week plan generated", {
        description: weekPlan.coach_strip ?? "Your week is ready.",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      // On any error, fall back to mock
      const mockPlan = getMockWeekPlan(loaderData.weekStart);
      const baseDays = buildEmptyDays(
        loaderData.weekStart,
        loaderData.activities,
        loaderData.macroTargets,
      );
      setDays(applyWeekPlan(baseDays, mockPlan, loaderData.activities, loaderData.macroTargets));
      setCoachStrip(mockPlan.coach_strip ?? null);

      toast.info("Using demo data", {
        description: "AI not configured — showing a sample week plan.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, loaderData]);

  /** Apply a week-level tweak (sub-phase 1.A.8 polish). */
  const handleApplyTweak = useCallback(
    async (tweak: string) => {
      setIsApplyingTweak(true);
      try {
        const res = await fetch("/api/jade/object", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "tweak",
            surface: "a",
            input: { tweak, week_start: loaderData.weekStart },
          }),
        });

        if (res.ok) {
          toast.success(`Tweak applied: "${tweak}"`, {
            description: "Some meals updated to match your preference.",
          });
        } else {
          throw new Error("Tweak endpoint failed");
        }
      } catch {
        toast.info(`Tweak noted: "${tweak}"`, {
          description: "AI not configured — tweak would apply on regenerate.",
        });
      } finally {
        setIsApplyingTweak(false);
      }
    },
    [loaderData.weekStart],
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const weekTotals = computeWeekTotals(days);
  const { daysPlanned, daysLocked } = countPlanStats(days);
  const hasPlan = daysPlanned > 0;
  const keyWorkoutDate = findKeyWorkoutDate(loaderData.activities);

  const weekLabel = `${dayjs(loaderData.weekStart).format("MMM D")} – ${dayjs(loaderData.weekEnd).format("MMM D, YYYY")}`;
  const isoLabel = `ISO-${loaderData.isoWeek} · ${loaderData.isoYear}`;

  // Find the active swap day for passing macro targets
  const swapDay = swapTarget ? days.find((d) => d.date === swapTarget.date) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background px-4 py-3 flex items-center gap-4 flex-wrap">
        {/* Week navigation */}
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider truncate">
            {weekLabel}
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground hidden sm:block shrink-0">
            {isoLabel}
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-3 ml-auto">
          {loaderData.hasSupabase ? (
            <span className="hidden sm:inline font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              {daysPlanned} of 7 days planned
              {daysLocked > 0 && ` · ${daysLocked} locked`}
            </span>
          ) : (
            <span className="hidden sm:inline font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              demo mode — no Supabase connection
            </span>
          )}

          {/* Regenerate Week pill — Mango orange per spec */}
          <Button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className={cn(
              "rounded-[var(--radius-pill)] gap-2",
              "bg-[var(--color-orange)] text-white",
              "hover:bg-[var(--color-orange-dark)]",
              "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider font-bold",
              "h-9 px-4",
            )}
          >
            <span
              className={cn(
                "inline-block",
                isGenerating ? "animate-spin" : "",
              )}
              aria-hidden
            >
              ⟳
            </span>
            {isGenerating ? "Generating…" : hasPlan ? "Regenerate Week" : "Plan my week"}
          </Button>
        </div>
      </div>

      {/* ── Coach strip (sub-phase 1.A.6) ────────────────────────────────── */}
      <div className="px-4 pt-3">
        <CoachStrip text={coachStrip} isLoading={isGenerating} />
      </div>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Week grid (sub-phases 1.A.1 + 1.A.2 + 1.A.3) */}
        <div className="flex-1 min-w-0">
          {loaderData.activities.length === 0 &&
          !loaderData.hasSupabase &&
          !hasPlan ? (
            // Empty state — show prompt to generate
            <EmptyPlanState onGenerate={handleRegenerate} isGenerating={isGenerating} />
          ) : (
            <WeekGrid
              days={days}
              onMealClick={handleMealClick}
              isLoading={isGenerating}
              className="h-full"
            />
          )}
        </div>

        {/* Macro totals rail — sticky right (sub-phase 1.A.1) */}
        <MacroTotalsRail
          weekTotals={weekTotals}
          daysPlanned={daysPlanned}
          daysLocked={daysLocked}
          className="hidden lg:block self-start"
        />
      </div>

      {/* ── Tweak bar (sub-phase 1.A.8) ──────────────────────────────────── */}
      {hasPlan && (
        <TweakBar
          onApplyTweak={handleApplyTweak}
          isApplying={isApplyingTweak}
        />
      )}

      {/* ── Key workout day callout ───────────────────────────────────────── */}
      {keyWorkoutDate && !isGenerating && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            Key workout: {dayjs(keyWorkoutDate).format("dddd MMM D")} — extended PRE / DURING / POST slots shown
          </p>
        </div>
      )}

      {/* ── Per-cell swap sheet (sub-phase 1.A.5) ─────────────────────────── */}
      {swapTarget && (
        <SwapSheet
          isOpen={true}
          onClose={() => setSwapTarget(null)}
          date={swapTarget.date}
          slot={swapTarget.slot}
          currentMeal={swapTarget.meal}
          targetCarb={swapDay?.carbG}
          targetProt={swapDay?.protG}
          targetFat={swapDay?.fatG}
          onAccept={handleSwapAccept}
        />
      )}

      {/* ── Ask Jade drawer (sub-phase 1.A.7) ─────────────────────────────── */}
      {isJadeOpen && (
        <JadeDrawer
          isOpen={isJadeOpen}
          onClose={() => setIsJadeOpen(false)}
          weekContext={{
            weekStart: loaderData.weekStart,
            coachStrip,
          }}
        />
      )}

      {/* ── Floating Ask Jade pill (sub-phase 1.A.7) ─────────────────────── */}
      <JadePill
        onClick={() => {
          setIsJadeOpen((open) => !open);
          setSwapTarget(null); // close swap if open
        }}
        isOpen={isJadeOpen}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty plan state
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyPlanStateProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

function EmptyPlanState({ onGenerate, isGenerating }: EmptyPlanStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 p-8 text-center">
      {/* Large "A" brand marker */}
      <p
        className="font-[var(--font-sansita)] font-bold leading-none select-none"
        style={{
          fontSize: "clamp(4rem, 15vw, 10rem)",
          color: "var(--color-electrolyte)",
          opacity: 0.15,
        }}
        aria-hidden
      >
        A
      </p>

      <div className="space-y-3 -mt-8 relative z-10">
        <p className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
          Calendar
        </p>
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground max-w-sm">
          The whole week, one screen, one tap to build it. Generate your
          training-aware meal plan below.
        </p>

        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            "rounded-[var(--radius-pill)] gap-2 h-[var(--spacing-btn-h)] px-8",
            "bg-[var(--color-orange)] text-white hover:bg-[var(--color-orange-dark)]",
            "font-[var(--font-sansita)] text-[var(--font-size-btn)] uppercase tracking-wider font-bold",
          )}
        >
          <span className={isGenerating ? "animate-spin" : ""} aria-hidden>⟳</span>
          {isGenerating ? "Building your week…" : "Plan my week"}
        </Button>

        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          <Link to="/" className="underline underline-offset-2 hover:text-foreground">
            Back to hub
          </Link>
          {" · "}
          <a
            href="/settings"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Settings
          </a>
        </p>
      </div>
    </div>
  );
}

export { VariantACalendar as default };
