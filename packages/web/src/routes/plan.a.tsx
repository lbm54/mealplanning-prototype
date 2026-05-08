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
 * 2026 facelift applied:
 *
 * - Hero header: Sansita Bold date range, ISO week, training-day Badge,
 *   KyleButton pill with glow
 * - Glass coach strip: KyleCard variant="glass" with Electrolyte left-border
 *   and shimmer skeleton while generating
 * - Glass week-grid surface: KyleCard variant="elevated" with inner highlight
 * - Day column headers: Mango glow on today, CarbTierBadge withLabel,
 *   TrainingDayDot with pulse on key workout day
 * - Meal cells: dashed empty with hover Electrolyte tint, filled with macro
 *   Badge ai-active chip, lift on hover
 * - Workout slot grouping: FUEL header + Electrolyte left-border
 * - SwapSheet: uses shadcn Sheet, staggered alternative cards, macro chips
 * - Empty state: radial-gradient + JadeAvatar size=96 + glow
 * - Loading skeletons: shimmer stagger per cell
 * - Floating Ask Jade pill: circle expanding on hover
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Sparkles, ChevronDown } from "lucide-react";
import type { InsightTileOutput } from "@/components/shared/widgets/insight-tile";

// Shared primitives
import { MacroTotalsRail } from "@/components/shared/macro-totals-rail";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Variant-A-specific components
import { CoachStrip } from "@/components/variant-a/coach-strip";
import { WeekGrid } from "@/components/variant-a/week-grid";
import { JadePill } from "@/components/variant-a/jade-pill";
import { JadeDrawer } from "@/components/variant-a/jade-drawer";
import { SwapSheet } from "@/components/variant-a/swap-sheet";
import { TweakBar } from "@/components/variant-a/tweak-bar";
import {
  MorningBriefingPill,
  MorningBriefingSheet,
  useMorningBriefingVisible,
  useMorningBriefingOpen,
} from "@/components/variant-a/morning-briefing-sheet";

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
import { JadeAvatar } from "@/components/shared/jade-avatar";

// Server-side data types
import type { PlanPageData } from "@/server/variant-a/plan-data";
import type { DayPlanData } from "@/components/shared/day-column";
import type { WeekPlan } from "@/server/jade/schema";
import type { SwapSheetMeal } from "@/components/variant-a/swap-sheet";

dayjs.extend(isoWeek);

// ─────────────────────────────────────────────────────────────────────────────
// Route definition + server loader
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/plan/a")({
  loader: async (): Promise<PlanPageData> => {
    try {
      const { fetchPlanPageData } = await import(
        "@/server/variant-a/plan-data"
      );
      return await fetchPlanPageData();
    } catch {
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

  const [days, setDays] = useState<DayPlanData[]>(() => {
    const empty = buildEmptyDays(
      loaderData.weekStart,
      loaderData.activities,
      loaderData.macroTargets,
    );
    return applyMealRows(empty, loaderData.existingMeals);
  });

  const [coachStrip, setCoachStrip] = useState<string | null>(
    loaderData.existingPlan?.coach_strip ?? null,
  );

  const [planId, setPlanId] = useState<string | null>(
    loaderData.existingPlan?.id ?? null,
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Tick a seconds counter while a generation is in flight so the button
  // shows progress instead of looking frozen.
  useEffect(() => {
    if (!isGenerating) {
      setElapsedSec(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isGenerating]);

  const [swapTarget, setSwapTarget] = useState<{
    date: string;
    slot: string;
    meal: SwapSheetMeal | null;
  } | null>(null);

  const [isJadeOpen, setIsJadeOpen] = useState(false);
  const [jadePendingSeed, setJadePendingSeed] = useState<string | null>(null);

  const [isApplyingTweak, setIsApplyingTweak] = useState(false);

  /**
   * InsightTile from Jade's showInsightTile tool call.
   * When set, CoachStrip renders the InsightTile instead of plain text.
   * Cleared on each regenerate.
   */
  const [insightTile, setInsightTile] = useState<InsightTileOutput | null>(null);

  // Morning briefing pill + sheet
  const {
    isOpen: isMorningOpen,
    open: openMorning,
    close: closeMorning,
  } = useMorningBriefingOpen();

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

  const handleSwapAccept = useCallback(
    (meal: SwapSheetMeal) => {
      if (!swapTarget) return;

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

      if (planId) {
        import("@/server/variant-a/plan-data")
          .then(({ updateMealCell }) => {
            updateMealCell(planId, swapTarget.date, swapTarget.slot, {
              title: meal.title,
              method_tag: meal.methodTag,
              carb_g: meal.carbG,
              prot_g: meal.protG,
              fat_g: meal.fatG,
            }).catch(() => {});
          })
          .catch(() => {});
      }
    },
    [swapTarget, planId],
  );

  const handleRegenerate = useCallback(async () => {
    if (isGenerating) {
      abortRef.current?.abort();
      return;
    }

    setIsGenerating(true);
    setCoachStrip(null);
    setInsightTile(null);

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
        try {
          const text = await res.text();
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

      if (!weekPlan) {
        weekPlan = getMockWeekPlan(loaderData.weekStart);
      }

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

      try {
        const { persistWeekPlan } = await import("@/server/variant-a/plan-data");
        const meals: Parameters<typeof persistWeekPlan>[4] = [];

        for (const day of weekPlan.days) {
          if (!day.meals) continue;
          for (const [slot, asm] of Object.entries(day.meals)) {
            if (!asm) continue;
            // Defensive — loose schema may omit totals; sum components.
            const components = asm.components ?? [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sum = (k: "carb_g" | "protein_g" | "fat_g") =>
              components.reduce(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (s: number, c: any) => s + Number(c?.[k] ?? 0),
                0,
              );
            meals.push({
              meal_date: day.date,
              meal_slot: slot,
              title: asm.title,
              method_tag: asm.method_tag,
              carb_g: asm.totals?.carb_g ?? sum("carb_g"),
              prot_g: asm.totals?.protein_g ?? sum("protein_g"),
              fat_g: asm.totals?.fat_g ?? sum("fat_g"),
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

      const mockPlan = getMockWeekPlan(loaderData.weekStart);
      const baseDays = buildEmptyDays(
        loaderData.weekStart,
        loaderData.activities,
        loaderData.macroTargets,
      );
      setDays(
        applyWeekPlan(
          baseDays,
          mockPlan,
          loaderData.activities,
          loaderData.macroTargets,
        ),
      );
      setCoachStrip(mockPlan.coach_strip ?? null);

      toast.info("Using demo data", {
        description: "AI not configured — showing a sample week plan.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, loaderData]);

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

  // Hero header labels
  const weekLabel = `${dayjs(loaderData.weekStart).format("MMM D").toUpperCase()} — ${dayjs(loaderData.weekEnd).format("MMM D").toUpperCase()}`;
  const isoLabel = `ISO-${loaderData.isoWeek} · ${loaderData.isoYear}`;

  // Key workout badge — find the day with the most duration
  const keyWorkoutDay = keyWorkoutDate
    ? days.find((d) => d.date === keyWorkoutDate)
    : null;

  // Swap day for macro targets
  const swapDay = swapTarget ? days.find((d) => d.date === swapTarget.date) : null;

  // Morning briefing pill: visible 5am–10am when user has an activity today
  const todayStr = dayjs().format("YYYY-MM-DD");
  const hasActivityToday = loaderData.activities.some(
    (a) =>
      typeof a.scheduled_date_time === "string"
        ? a.scheduled_date_time.startsWith(todayStr)
        : false,
  );
  const showMorningPill = useMorningBriefingVisible(hasActivityToday);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <header
        className={cn(
          "border-b border-border/60 px-5 py-4",
          "bg-background/95 backdrop-blur-[8px]",
          "sticky top-0 z-20",
        )}
      >
        <div className="flex items-center gap-4 flex-wrap">
          {/* Left: date range + ISO week */}
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h1
              className={cn(
                "font-[var(--font-sansita)] font-bold leading-none tracking-wider",
                "text-[var(--font-size-section)] sm:text-[var(--font-size-date-time)]",
              )}
            >
              {weekLabel}
            </h1>
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70 hidden sm:inline font-mono tracking-wider shrink-0">
              {isoLabel}
            </span>
          </div>

          {/* Center: key workout badge */}
          {keyWorkoutDay?.activity && (
            <Badge variant="training-day" className="hidden md:inline-flex gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)] animate-status-pulse" />
              {keyWorkoutDay.activity.type}
              {keyWorkoutDay.activity.durationMinutes
                ? ` · ${keyWorkoutDay.activity.durationMinutes}m`
                : ""}
            </Badge>
          )}

          {/* Right: Morning briefing pill + PLAN MY WEEK button */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Morning briefing pill — shown 5am–10am when user has a workout today */}
            {showMorningPill && (
              <MorningBriefingPill onClick={openMorning} />
            )}
            {loaderData.hasSupabase ? (
              <span className="hidden sm:inline font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/60 font-mono">
                {daysPlanned} of 7 · {daysLocked} locked
              </span>
            ) : (
              <span className="hidden sm:inline font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50">
                demo mode
              </span>
            )}

            {/* Grocery list — opens Jade drawer with a pre-seeded message */}
            <button
              type="button"
              disabled={!hasPlan || isGenerating}
              onClick={() => {
                setJadePendingSeed(
                  `Build my grocery list for the week of ${loaderData.weekStart} (approach a, meal_plan_id ${planId ?? "unknown"}).`,
                );
                setIsJadeOpen(true);
              }}
              title={hasPlan ? "Generate grocery list for this week" : "Build a plan first"}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-pill)]",
                "h-9 px-3.5",
                "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                "border border-border bg-background text-foreground",
                "transition-all duration-150",
                "hover:bg-muted/60 hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              )}
              aria-label="Generate grocery list"
            >
              <span aria-hidden>🛒</span>
              <span className="hidden md:inline">Grocery</span>
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className={cn(
                "group flex items-center gap-2 rounded-[var(--radius-pill)]",
                "h-9 px-4",
                "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest font-bold",
                // Inner gradient: top lighter orange → bottom darker orange
                "text-white",
                "transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-orange)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
              style={{
                background: isGenerating
                  ? "var(--color-orange-dark)"
                  : "linear-gradient(180deg, var(--color-orange-light) 0%, var(--color-orange) 100%)",
              }}
            >
              {isGenerating ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Sparkles size={12} className="opacity-80 group-hover:opacity-100" />
              )}
              {isGenerating
                ? `Generating… ${elapsedSec}s`
                : hasPlan
                  ? "Regenerate Week"
                  : "Plan My Week"}
              {!isGenerating && (
                <ChevronDown size={12} className="opacity-60" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Coach strip ───────────────────────────────────────────────────── */}
      {/* When Jade has emitted a showInsightTile for this week, the InsightTile
          is rendered here instead of the plain italic strip. */}
      <div className="px-5 pt-3">
        <CoachStrip
          text={coachStrip}
          isLoading={isGenerating}
          insightTile={insightTile}
        />
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 p-4 lg:p-5 overflow-hidden">
        {/* Week grid */}
        <div className="flex-1 min-w-0">
          {loaderData.activities.length === 0 &&
          !loaderData.hasSupabase &&
          !hasPlan ? (
            <EmptyPlanState
              onGenerate={handleRegenerate}
              isGenerating={isGenerating}
            />
          ) : (
            <WeekGrid
              days={days}
              onMealClick={handleMealClick}
              isLoading={isGenerating}
              className="h-full"
            />
          )}
        </div>

        {/* Right rail */}
        <MacroTotalsRail
          weekTotals={weekTotals}
          daysPlanned={daysPlanned}
          daysLocked={daysLocked}
          className="hidden lg:block self-start"
        />
      </div>

      {/* ── Tweak bar ─────────────────────────────────────────────────────── */}
      {hasPlan && (
        <TweakBar
          onApplyTweak={handleApplyTweak}
          isApplying={isApplyingTweak}
        />
      )}

      {/* ── Key workout callout ───────────────────────────────────────────── */}
      {keyWorkoutDate && !isGenerating && (
        <div className="px-5 pb-3 flex items-center gap-2">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)]"
            aria-hidden
          />
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/60">
            Key workout: {dayjs(keyWorkoutDate).format("dddd MMM D")} — PRE /
            DURING / POST slots shown
          </p>
        </div>
      )}

      {/* ── Swap sheet ────────────────────────────────────────────────────── */}
      <SwapSheet
        isOpen={Boolean(swapTarget)}
        onClose={() => setSwapTarget(null)}
        date={swapTarget?.date ?? ""}
        slot={swapTarget?.slot ?? ""}
        currentMeal={swapTarget?.meal ?? null}
        targetCarb={swapDay?.carbG}
        targetProt={swapDay?.protG}
        targetFat={swapDay?.fatG}
        onAccept={handleSwapAccept}
      />

      {/* ── Ask Jade drawer ───────────────────────────────────────────────── */}
      {isJadeOpen && (
        <JadeDrawer
          isOpen={isJadeOpen}
          onClose={() => setIsJadeOpen(false)}
          weekContext={{
            weekStart: loaderData.weekStart,
            coachStrip,
          }}
          pendingSeed={jadePendingSeed}
          onSeedConsumed={() => setJadePendingSeed(null)}
        />
      )}

      {/* ── Floating Ask Jade pill ────────────────────────────────────────── */}
      <JadePill
        onClick={() => {
          setIsJadeOpen((open) => !open);
          setSwapTarget(null);
        }}
        isOpen={isJadeOpen}
      />

      {/* ── Morning briefing sheet ────────────────────────────────────────── */}
      <MorningBriefingSheet
        isOpen={isMorningOpen}
        onClose={closeMorning}
        weekContext={{
          weekStart: loaderData.weekStart,
          coachStrip,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty plan state — 2026 facelift
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyPlanStateProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

function EmptyPlanState({ onGenerate, isGenerating }: EmptyPlanStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full min-h-[400px] gap-6 p-8 text-center",
        "rounded-[var(--radius-card)]",
        "relative overflow-hidden",
      )}
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(28,249,207,0.06) 0%, transparent 70%)",
      }}
    >
      {/* Jade avatar — large, glowing */}
      <div
        className="animate-breathe"
        style={{ animation: "breathe 3s ease-in-out infinite" }}
      >
        <JadeAvatar size={96} state="idle" glow online />
      </div>

      <div className="space-y-3 relative z-10 max-w-sm">
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] italic text-muted-foreground leading-relaxed">
          Click &ldquo;Plan my week&rdquo; to build your training-aware nutrition plan.
        </p>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            "group flex items-center gap-2 mx-auto rounded-[var(--radius-pill)]",
            "h-[var(--spacing-btn-h)] px-8",
            "font-[var(--font-compadre)] text-[var(--font-size-btn)] uppercase tracking-widest font-bold",
            "text-white",
            "transition-all duration-200",
            "hover:-translate-y-1 hover:shadow-[var(--shadow-glow-orange)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
          )}
          style={{
            background: isGenerating
              ? "var(--color-orange-dark)"
              : "linear-gradient(180deg, var(--color-orange-light) 0%, var(--color-orange) 100%)",
          }}
        >
          {isGenerating ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Sparkles size={16} className="opacity-80" />
          )}
          {isGenerating ? "Building your week…" : "Plan My Week"}
        </button>

        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50">
          <Link
            to="/"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Back to hub
          </Link>
          {" · "}
          <a
            href="/settings"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Settings
          </a>
        </p>
      </div>
    </div>
  );
}

export default VariantACalendar;
