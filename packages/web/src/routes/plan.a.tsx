/**
 * Mobile meal-planning app — the canonical plan UX.
 *
 * Cream/blackberry palette, day pills, vertical meal stack. State is
 * persisted via lib/plan-store so navigating between Plan / Cookbook /
 * You doesn't blow it away. Jade lives inside the coach strip (no FAB).
 * Empty meal slots open MealAddSheet; filled slots open SwapMealSheet.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  Sparkles,
  Settings,
  Activity,
  Utensils,
  Zap,
  ChevronRight,
  RefreshCw,
  MessageCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Variant-A AI helpers we keep
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
import { jadeObjectFn } from "@/server/jade/server-fns";
import { MobileShell } from "@/components/shared/mobile-shell";
import {
  SwapMealSheet,
  type SwapMealResult,
} from "@/components/shared/swap-meal-sheet";
import { JadeChatSheet } from "@/components/shared/jade-chat-sheet";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import {
  setPlanState,
  patchPlanState,
  updateDays,
  usePlanState,
} from "@/lib/plan-store";

// Server / shared types
import type { PlanPageData } from "@/server/variant-a/plan-data";
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import type { WeekPlan } from "@/server/jade/schema";

dayjs.extend(isoWeek);

// ─────────────────────────────────────────────────────────────────────────────
// Route + loader
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
  component: MobilePlanScreen,
});

// ─────────────────────────────────────────────────────────────────────────────
// Slot ordering / labels
// ─────────────────────────────────────────────────────────────────────────────

const FUEL_SLOTS = ["pre_workout", "during_workout", "post_workout"] as const;
const REGULAR_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_workout: "Pre-workout",
  during_workout: "During",
  post_workout: "Post-workout",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

function MobilePlanScreen() {
  const loaderData = Route.useLoaderData();
  const persisted = usePlanState();

  // ── Initialize the store once per fresh week ──
  // If we have a persisted plan for this week, use it. Otherwise seed the
  // store from the loader.
  useEffect(() => {
    if (persisted && persisted.weekStart === loaderData.weekStart) return;
    const empty = buildEmptyDays(
      loaderData.weekStart,
      loaderData.activities,
      loaderData.macroTargets,
    );
    setPlanState({
      weekStart: loaderData.weekStart,
      planId: loaderData.existingPlan?.id ?? null,
      coachStrip: loaderData.existingPlan?.coach_strip ?? null,
      days: applyMealRows(empty, loaderData.existingMeals),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaderData.weekStart]);

  const days = persisted?.days ?? [];
  const coachStrip = persisted?.coachStrip ?? null;
  const planId = persisted?.planId ?? null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isApplyingTweak, setIsApplyingTweak] = useState(false);

  // Jade chat
  const [isJadeOpen, setIsJadeOpen] = useState(false);

  // Day selection — default to today if in this week, else Monday.
  // Persisted across navigation via sessionStorage so coming back to the
  // tab returns you to whatever day you were on.
  const todayStr = dayjs().format("YYYY-MM-DD");
  const initialDate = useMemo(() => {
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("mealvana.selectedDate");
      if (stored && days.find((d) => d.date === stored)) return stored;
    }
    const todayInWeek = days.find((d) => d.date === todayStr);
    return todayInWeek?.date ?? days[0]?.date ?? loaderData.weekStart;
  }, [days, todayStr, loaderData.weekStart]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  useEffect(() => {
    if (!days.find((d) => d.date === selectedDate)) {
      setSelectedDate(initialDate);
    }
  }, [days, selectedDate, initialDate]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("mealvana.selectedDate", selectedDate);
    }
  }, [selectedDate]);

  // Tick generation timer
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

  // Picker target — unified for both swap (currentMeal set) and add (null)
  const [pickerTarget, setPickerTarget] = useState<{
    date: string;
    slot: string;
    currentMeal: {
      title: string;
      carbG: number;
      protG: number;
      fatG: number;
      imageUrl?: string;
    } | null;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── ESC closes any open sheet ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pickerTarget) setPickerTarget(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pickerTarget]);

  // ── Handlers ──
  const handleMealClick = useCallback(
    (date: string, slot: string) => {
      const day = days.find((d) => d.date === date);
      if (!day) return;
      const meal = getMealFromDay(day, slot);
      setPickerTarget({
        date,
        slot,
        currentMeal: meal
          ? {
              title: meal.title,
              carbG: meal.carbG,
              protG: meal.protG,
              fatG: meal.fatG,
              imageUrl: meal.imageUrl,
            }
          : null,
      });
    },
    [days],
  );

  const handlePicked = useCallback(
    (meal: SwapMealResult) => {
      if (!pickerTarget) return;
      const target = pickerTarget;
      updateDays((prev) =>
        prev.map((day) => {
          if (day.date !== target.date) return day;
          return {
            ...day,
            meals: {
              ...day.meals,
              [target.slot]: {
                title: meal.title,
                methodTag: meal.methodTag,
                components: meal.components,
                carbG: meal.carbG,
                protG: meal.protG,
                fatG: meal.fatG,
                recipeId: meal.recipeId,
                imageUrl: meal.imageUrl,
              },
            },
          };
        }),
      );
      if (planId) {
        import("@/server/variant-a/plan-data")
          .then(({ updateMealCell }) => {
            updateMealCell(planId, target.date, target.slot, {
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
    [pickerTarget, planId],
  );

  const handleGenerate = useCallback(async () => {
    if (isGenerating) {
      abortRef.current?.abort();
      return;
    }

    setIsGenerating(true);
    patchPlanState({
      coachStrip: null,
      days: buildEmptyDays(
        loaderData.weekStart,
        loaderData.activities,
        loaderData.macroTargets,
      ),
    });

    abortRef.current = new AbortController();

    try {
      let weekPlan: WeekPlan | null = null;
      try {
        const data = await jadeObjectFn({
          data: {
            kind: "week",
            surface: "a",
            input: {
              week_start: loaderData.weekStart,
              iso_week: loaderData.isoWeek,
              iso_year: loaderData.isoYear,
            },
          },
          signal: abortRef.current.signal,
        });
        if (data && typeof data === "object" && "week_start" in data) {
          weekPlan = data as WeekPlan;
        }
      } catch {
        /* fall through to mock */
      }

      if (!weekPlan) weekPlan = getMockWeekPlan(loaderData.weekStart);

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
      patchPlanState({
        days: filledDays,
        coachStrip: weekPlan.coach_strip ?? null,
      });

      try {
        const { persistWeekPlan } = await import(
          "@/server/variant-a/plan-data"
        );
        const meals: Parameters<typeof persistWeekPlan>[4] = [];
        for (const day of weekPlan.days) {
          if (!day.meals) continue;
          for (const [slot, asm] of Object.entries(day.meals)) {
            if (!asm) continue;
            const components = asm.components ?? [];
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
        if (newPlanId) patchPlanState({ planId: newPlanId });
      } catch {
        /* persist failure non-fatal */
      }

      toast.success("Your week is ready", {
        description: weekPlan.coach_strip ?? "Jade built your week.",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      const mockPlan = getMockWeekPlan(loaderData.weekStart);
      const baseDays = buildEmptyDays(
        loaderData.weekStart,
        loaderData.activities,
        loaderData.macroTargets,
      );
      patchPlanState({
        days: applyWeekPlan(
          baseDays,
          mockPlan,
          loaderData.activities,
          loaderData.macroTargets,
        ),
        coachStrip: mockPlan.coach_strip ?? null,
      });

      toast.info("Demo data shown", {
        description: "AI gateway not configured — using sample plan.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, loaderData]);

  // Per-day generation state — keyed by date so multiple days can build
  // in parallel without UI confusion.
  const [generatingDay, setGeneratingDay] = useState<string | null>(null);

  const handleGenerateDay = useCallback(
    async (date: string) => {
      if (generatingDay) return;
      const day = days.find((d) => d.date === date);
      if (!day) return;

      setGeneratingDay(date);
      try {
        const data = (await jadeObjectFn({
          data: {
            kind: "day",
            surface: "plan-day",
            input: {
              date,
              activity: day.activity
                ? {
                    type: day.activity.type,
                    durationMinutes: day.activity.durationMinutes,
                    intensityLevel: day.activity.intensityLevel,
                  }
                : undefined,
              targets: {
                carbG: day.carbG,
                protG: day.protG,
                fatG: day.fatG,
              },
            },
          },
        })) as {
          date: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meals: Record<string, any>;
          day_note?: string;
        };
        if (!data?.meals) throw new Error("no meals returned");

        // Convert the AI day payload into our DayPlanData["meals"] shape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buildMeal = (asm: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const components = (asm?.components ?? []) as any[];
          const sum = (k: "carb_g" | "protein_g" | "fat_g") =>
            components.reduce((s, c) => s + Number(c?.[k] ?? 0), 0);
          return {
            title: asm?.title ?? "",
            methodTag: asm?.method_tag,
            components: components.map((c) => ({
              name: c?.name ?? "",
              portion: c?.portion ?? "",
            })),
            carbG: asm?.totals?.carb_g ?? sum("carb_g"),
            protG: asm?.totals?.protein_g ?? sum("protein_g"),
            fatG: asm?.totals?.fat_g ?? sum("fat_g"),
          };
        };

        updateDays((prev) =>
          prev.map((d) => {
            if (d.date !== date) return d;
            const updated: typeof d.meals = { ...d.meals };
            for (const [slot, asm] of Object.entries(data.meals ?? {})) {
              if (!asm) continue;
              updated[slot as keyof typeof updated] = buildMeal(asm);
            }
            return { ...d, meals: updated };
          }),
        );

        toast.success("Day planned", {
          description: data.day_note ?? `${dayjs(date).format("ddd MMM D")} ready.`,
        });
      } catch {
        toast.info("Demo data shown", {
          description: "AI gateway not configured — using sample meals.",
        });
        // Fallback: pull this day from the mock week plan
        const mockPlan = getMockWeekPlan(loaderData.weekStart);
        const mockDay = mockPlan.days.find((d) => d.date === date);
        if (mockDay?.meals) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const buildMeal = (asm: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const components = (asm?.components ?? []) as any[];
            const sum = (k: "carb_g" | "protein_g" | "fat_g") =>
              components.reduce((s, c) => s + Number(c?.[k] ?? 0), 0);
            return {
              title: asm?.title ?? "",
              methodTag: asm?.method_tag,
              components: components.map((c) => ({
                name: c?.name ?? "",
                portion: c?.portion ?? "",
              })),
              carbG: asm?.totals?.carb_g ?? sum("carb_g"),
              protG: asm?.totals?.protein_g ?? sum("protein_g"),
              fatG: asm?.totals?.fat_g ?? sum("fat_g"),
            };
          };
          updateDays((prev) =>
            prev.map((d) => {
              if (d.date !== date) return d;
              const updated: typeof d.meals = { ...d.meals };
              for (const [slot, asm] of Object.entries(mockDay.meals!)) {
                if (!asm) continue;
                updated[slot as keyof typeof updated] = buildMeal(asm);
              }
              return { ...d, meals: updated };
            }),
          );
        }
      } finally {
        setGeneratingDay(null);
      }
    },
    [generatingDay, days, loaderData.weekStart],
  );

  const handleApplyTweak = useCallback(
    async (tweak: string) => {
      setIsApplyingTweak(true);
      try {
        await jadeObjectFn({
          data: {
            kind: "tweak",
            surface: "a",
            input: { tweak, week_start: loaderData.weekStart },
          },
        });
        toast.success(`Tweak applied: "${tweak}"`);
      } catch {
        toast.info(`Tweak noted: "${tweak}"`, {
          description: "AI not configured — would apply on next generate.",
        });
      } finally {
        setIsApplyingTweak(false);
      }
    },
    [loaderData.weekStart],
  );

  // ── Derived ──
  // Meal-sum actuals — `day.carbG/protG/fatG` are macro *targets*, not
  // what's actually on the plate. Sum the meal cells for a realistic readout.
  const dayActuals = useMemo(() => {
    const map = new Map<
      string,
      { carbG: number; protG: number; fatG: number }
    >();
    for (const day of days) {
      let c = 0;
      let p = 0;
      let f = 0;
      for (const m of Object.values(day.meals)) {
        if (!m) continue;
        c += m.carbG ?? 0;
        p += m.protG ?? 0;
        f += m.fatG ?? 0;
      }
      map.set(day.date, { carbG: c, protG: p, fatG: f });
    }
    return map;
  }, [days]);

  const weekTotals = useMemo(() => {
    let c = 0;
    let p = 0;
    let f = 0;
    for (const t of dayActuals.values()) {
      c += t.carbG;
      p += t.protG;
      f += t.fatG;
    }
    // Fall back to target-based totals if there are no meals yet
    if (c === 0 && p === 0 && f === 0) return computeWeekTotals(days);
    return { carbG: c, protG: p, fatG: f };
  }, [dayActuals, days]);

  const { daysPlanned, daysLocked } = countPlanStats(days);
  const hasPlan = daysPlanned > 0;
  const keyWorkoutDate = findKeyWorkoutDate(loaderData.activities);

  const selectedDay = days.find((d) => d.date === selectedDate) ?? days[0];
  const dayHasMeals = selectedDay
    ? Object.values(selectedDay.meals).some(Boolean)
    : false;

  const weekRangeLabel = `${dayjs(loaderData.weekStart).format("MMM D")} – ${dayjs(
    loaderData.weekEnd,
  ).format("MMM D")}`;

  // ── Render ──
  return (
    <>
      <MobileShell
        showFab={false}
        header={
          <header
            className={cn(
              "sticky top-0 z-30 flex items-center gap-3 px-4 pt-3 pb-3",
              "bg-[var(--color-cream)]/90 backdrop-blur-md",
              "border-b border-black/5",
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)]">
              <Utensils size={16} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-[var(--font-sansita)] text-[18px] font-bold leading-none tracking-tight">
                Mealvana
              </h1>
              <p className="font-[var(--font-apercu)] text-[11px] leading-tight text-[var(--color-blackberry)]/60">
                Endurance · Week of {weekRangeLabel}
              </p>
            </div>
            <button
              type="button"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-blackberry)]/70 hover:bg-black/5 active:scale-95 transition"
            >
              <Settings size={18} />
            </button>
          </header>
        }
      >
        <WeekHeader
          weekRangeLabel={weekRangeLabel}
          isoWeek={loaderData.isoWeek}
          daysPlanned={daysPlanned}
          daysLocked={daysLocked}
          hasPlan={hasPlan}
          weekTotals={weekTotals}
          isGenerating={isGenerating}
          elapsedSec={elapsedSec}
          onGenerate={handleGenerate}
        />

        <DayPills
          days={days}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          keyWorkoutDate={keyWorkoutDate}
        />

        {/* Jade card — coach line, tweaks, chat. Action buttons live in
            their respective scope headers (week + day). */}
        <JadeCard
          hasPlan={hasPlan}
          isGenerating={isGenerating}
          elapsedSec={elapsedSec}
          isGeneratingDay={
            selectedDay ? generatingDay === selectedDay.date : false
          }
          selectedDayLabel={
            selectedDay
              ? selectedDay.isToday
                ? "today"
                : dayjs(selectedDay.date).format("ddd")
              : "today"
          }
          coachStrip={coachStrip}
          isApplyingTweak={isApplyingTweak}
          onApplyTweak={handleApplyTweak}
          onTalk={() => setIsJadeOpen(true)}
        />

        {selectedDay && (
          <DayDetail
            day={selectedDay}
            hasPlan={dayHasMeals}
            dayMacros={
              dayActuals.get(selectedDay.date) ?? {
                carbG: 0,
                protG: 0,
                fatG: 0,
              }
            }
            onMealClick={(slot) => handleMealClick(selectedDay.date, slot)}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            isGeneratingDay={generatingDay === selectedDay.date}
            onGenerateDay={() => handleGenerateDay(selectedDay.date)}
          />
        )}
      </MobileShell>

      {/* Unified picker — opens on every meal tap (swap or add) */}
      <SwapMealSheet
        isOpen={Boolean(pickerTarget)}
        date={pickerTarget?.date ?? ""}
        slot={pickerTarget?.slot ?? ""}
        currentMeal={pickerTarget?.currentMeal ?? null}
        onClose={() => setPickerTarget(null)}
        onAccept={handlePicked}
      />

      {/* Jade chat — opened from the Jade card */}
      <JadeChatSheet
        isOpen={isJadeOpen}
        onClose={() => setIsJadeOpen(false)}
      />
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// WeekHeader — title + macro rings preview
// ─────────────────────────────────────────────────────────────────────────────

interface WeekHeaderProps {
  weekRangeLabel: string;
  isoWeek: number;
  daysPlanned: number;
  daysLocked: number;
  hasPlan: boolean;
  weekTotals: { carbG: number; protG: number; fatG: number };
  isGenerating: boolean;
  elapsedSec: number;
  onGenerate: () => void;
}

function WeekHeader({
  weekRangeLabel,
  isoWeek,
  daysPlanned,
  daysLocked,
  hasPlan,
  weekTotals,
  isGenerating,
  elapsedSec,
  onGenerate,
}: WeekHeaderProps) {
  return (
    <section className="rounded-2xl bg-[var(--color-blackberry)] text-[var(--color-cream)] p-4 shadow-[0_8px_24px_-12px_rgba(56,22,51,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-cream)]/60">
            This week · ISO-{isoWeek}
          </p>
          <h2 className="font-[var(--font-sansita)] text-[22px] font-bold leading-tight">
            {weekRangeLabel}
          </h2>
          {hasPlan && (
            <p className="mt-1 font-[var(--font-apercu)] text-[11px] text-[var(--color-cream)]/55">
              {daysPlanned}/7 planned
              {daysLocked > 0 ? ` · ${daysLocked} locked` : ""}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          aria-label={hasPlan ? "Regenerate week" : "Plan my week"}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full",
            "h-9 px-3.5",
            "font-[var(--font-sansita)] text-[11px] font-bold uppercase tracking-wider text-white",
            "shadow-[0_6px_16px_-6px_rgba(247,139,20,0.6)]",
            "transition-all active:scale-95",
            "disabled:opacity-90 disabled:cursor-progress",
          )}
          style={{
            background: isGenerating
              ? "var(--color-orange-dark)"
              : "linear-gradient(180deg, var(--color-orange-light) 0%, var(--color-orange) 100%)",
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={12} className="animate-spin" strokeWidth={2.5} />
              {elapsedSec}s
            </>
          ) : (
            <>
              <Sparkles size={12} strokeWidth={2.5} />
              {hasPlan ? "Regenerate" : "Plan week"}
            </>
          )}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <MacroChip
          label="Carbs"
          value={weekTotals.carbG}
          unit="g"
          tone="electrolyte"
        />
        <MacroChip
          label="Protein"
          value={weekTotals.protG}
          unit="g"
          tone="cream"
        />
        <MacroChip
          label="Fat"
          value={weekTotals.fatG}
          unit="g"
          tone="orange"
        />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JadeCard — Jade's one-stop widget. Combines empty-state CTA, coach line,
// quick tweak chips, and chat entry point. Replaces FAB + empty card +
// standalone TweakBar.
// ─────────────────────────────────────────────────────────────────────────────

const TWEAK_CHIPS = [
  "more protein",
  "no fish",
  "simpler dinners",
  "lower carb Sunday",
  "more vegetables",
];

function JadeCard({
  hasPlan,
  isGenerating,
  elapsedSec,
  isGeneratingDay,
  selectedDayLabel,
  coachStrip,
  isApplyingTweak,
  onApplyTweak,
  onTalk,
}: {
  hasPlan: boolean;
  isGenerating: boolean;
  elapsedSec: number;
  isGeneratingDay: boolean;
  selectedDayLabel: string;
  coachStrip: string | null;
  isApplyingTweak: boolean;
  onApplyTweak: (tweak: string) => void;
  onTalk: () => void;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-white border border-black/5",
        "shadow-[0_2px_8px_-2px_rgba(56,22,51,0.08)]",
        "overflow-hidden",
      )}
    >
      {/* Top row — avatar + coach text + chat affordance */}
      <button
        type="button"
        onClick={onTalk}
        aria-label="Talk to Jade"
        className="w-full text-left flex items-start gap-3 px-3 py-3 active:bg-black/[0.02] transition"
      >
        <span className="relative shrink-0">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(28,249,207,0.30) 0%, transparent 70%)",
            }}
          />
          <JadeAvatar
            size={36}
            state={isGenerating ? "thinking" : "idle"}
            online
          />
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/55">
            Jade · Endurance coach
          </p>
          <p
            className={cn(
              "mt-0.5 font-[var(--font-apercu)] text-[13px] leading-snug",
              hasPlan || isGenerating
                ? "text-[var(--color-blackberry)] italic"
                : "text-[var(--color-blackberry)]",
            )}
          >
            {isGenerating ? (
              <span className="inline-flex items-center gap-1.5">
                Building your week… {elapsedSec}s
                <span className="inline-flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-[var(--color-blackberry)]/50 animate-pulse" />
                  <span
                    className="h-1 w-1 rounded-full bg-[var(--color-blackberry)]/50 animate-pulse"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1 w-1 rounded-full bg-[var(--color-blackberry)]/50 animate-pulse"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </span>
            ) : isGeneratingDay ? (
              <span className="inline-flex items-center gap-1.5">
                Planning {selectedDayLabel}…
                <span className="inline-flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-[var(--color-blackberry)]/50 animate-pulse" />
                  <span
                    className="h-1 w-1 rounded-full bg-[var(--color-blackberry)]/50 animate-pulse"
                    style={{ animationDelay: "150ms" }}
                  />
                </span>
              </span>
            ) : hasPlan ? (
              coachStrip ?? "Tap to chat about your week."
            ) : (
              "Hey — I'm Jade. I'll build your training-aware week, or just chat about whatever you're eating."
            )}
          </p>
        </div>

        <MessageCircle
          size={14}
          className="text-[var(--color-electrolyte-dark)] shrink-0 mt-1"
          strokeWidth={2.4}
        />
      </button>

      {/* Tweak chips — only after a plan exists */}
      {hasPlan && !isGenerating && (
        <div className="border-t border-black/5 px-3 py-2.5">
          <p className="font-[var(--font-apercu)] text-[9px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55 mb-1.5 px-0.5">
            Quick tweaks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TWEAK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onApplyTweak(chip)}
                disabled={isApplyingTweak}
                className={cn(
                  "inline-flex items-center rounded-full px-3 h-7",
                  "bg-[var(--color-cream)] border border-black/5",
                  "font-[var(--font-apercu)] text-[11px] text-[var(--color-blackberry)]/80",
                  "hover:border-[var(--color-electrolyte)]/40 hover:bg-[var(--color-electrolyte)]/10",
                  "active:scale-95 transition disabled:opacity-50",
                )}
              >
                {chip}
              </button>
            ))}
            <button
              type="button"
              onClick={onTalk}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 h-7",
                "bg-[var(--color-blackberry)]/[0.04] border border-dashed border-black/15",
                "font-[var(--font-apercu)] text-[11px] text-[var(--color-blackberry)]/60",
                "hover:bg-black/[0.06] active:scale-95 transition",
              )}
            >
              <MessageCircle size={10} strokeWidth={2.4} />
              custom…
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function MacroChip({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: "electrolyte" | "cream" | "orange";
}) {
  const dotColor =
    tone === "electrolyte"
      ? "var(--color-electrolyte)"
      : tone === "orange"
        ? "var(--color-orange)"
        : "var(--color-cream)";
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-cream)]/70">
          {label}
        </p>
      </div>
      <p className="mt-0.5 font-[var(--font-apercu)] text-[18px] font-semibold tabular-nums leading-none">
        {value.toLocaleString()}
        <span className="ml-0.5 text-[11px] font-normal text-[var(--color-cream)]/60">
          {unit}
        </span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DayPills — horizontal scrollable day selector
// ─────────────────────────────────────────────────────────────────────────────

function DayPills({
  days,
  selectedDate,
  onSelect,
  keyWorkoutDate,
}: {
  days: DayPlanData[];
  selectedDate: string;
  onSelect: (date: string) => void;
  keyWorkoutDate: string | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Scroll selected pill into view
  useEffect(() => {
    if (!scrollerRef.current) return;
    const sel = scrollerRef.current.querySelector<HTMLButtonElement>(
      `[data-date="${selectedDate}"]`,
    );
    sel?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedDate]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        const isKey = day.date === keyWorkoutDate;
        const hasMeals = Object.values(day.meals).some(Boolean);
        const date = dayjs(day.date);

        return (
          <button
            key={day.date}
            data-date={day.date}
            onClick={() => onSelect(day.date)}
            className={cn(
              "shrink-0 flex flex-col items-center justify-center",
              "w-[56px] h-[72px] rounded-2xl border transition-all",
              "active:scale-95",
              isSelected
                ? "bg-[var(--color-blackberry)] text-[var(--color-cream)] border-[var(--color-blackberry)] shadow-[0_6px_16px_-8px_rgba(56,22,51,0.45)]"
                : "bg-white text-[var(--color-blackberry)] border-black/5 hover:border-black/15",
            )}
          >
            <span
              className={cn(
                "font-[var(--font-apercu)] text-[9px] uppercase tracking-wider",
                isSelected
                  ? "text-[var(--color-cream)]/70"
                  : "text-[var(--color-blackberry)]/55",
              )}
            >
              {date.format("ddd")}
            </span>
            <span className="font-[var(--font-sansita)] text-[20px] font-bold leading-none tabular-nums mt-1">
              {date.format("D")}
            </span>
            <div className="mt-1.5 flex items-center gap-0.5">
              {hasMeals && (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isSelected
                      ? "bg-[var(--color-electrolyte)]"
                      : "bg-[var(--color-blackberry)]/40",
                  )}
                />
              )}
              {isKey && (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isSelected
                      ? "bg-[var(--color-orange)]"
                      : "bg-[var(--color-orange)]",
                  )}
                />
              )}
              {day.isToday && (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isSelected
                      ? "bg-[var(--color-cream)]"
                      : "bg-[var(--color-blackberry)]",
                  )}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DayDetail — selected day's activity + meal stack
// ─────────────────────────────────────────────────────────────────────────────

function DayDetail({
  day,
  hasPlan,
  dayMacros,
  onMealClick,
  isGenerating,
  onGenerate,
  isGeneratingDay,
  onGenerateDay,
}: {
  day: DayPlanData;
  hasPlan: boolean;
  dayMacros: { carbG: number; protG: number; fatG: number };
  onMealClick: (slot: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  isGeneratingDay: boolean;
  onGenerateDay: () => void;
}) {
  const date = dayjs(day.date);

  return (
    <section className="space-y-3">
      {/* Day header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55">
            {day.isToday ? "Today" : date.format("dddd")}
          </p>
          <h2 className="font-[var(--font-sansita)] text-[24px] font-bold leading-tight">
            {date.format("MMM D")}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {day.activity && (
            <ActivityChip activity={day.activity} isKey={day.isKeyWorkout} />
          )}
          <button
            type="button"
            onClick={onGenerateDay}
            disabled={isGeneratingDay || isGenerating}
            aria-label={hasPlan ? "Regenerate this day" : "Plan this day"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full h-9 px-3.5",
              "font-[var(--font-sansita)] text-[11px] font-bold uppercase tracking-wider text-white",
              "shadow-[0_6px_16px_-6px_rgba(247,139,20,0.6)]",
              "transition-all active:scale-95",
              "disabled:opacity-90 disabled:cursor-progress",
            )}
            style={{
              background: isGeneratingDay
                ? "var(--color-orange-dark)"
                : "linear-gradient(180deg, var(--color-orange-light) 0%, var(--color-orange) 100%)",
            }}
          >
            {isGeneratingDay ? (
              <>
                <RefreshCw
                  size={12}
                  className="animate-spin"
                  strokeWidth={2.5}
                />
                Planning…
              </>
            ) : (
              <>
                <Sparkles size={12} strokeWidth={2.5} />
                {hasPlan ? "Regenerate day" : "Plan this day"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Day macro bar (live) */}
      {hasPlan && (
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-3 gap-3">
            <DayMacro label="Carbs" value={dayMacros.carbG} color="electrolyte" />
            <DayMacro label="Protein" value={dayMacros.protG} color="cream-dark" />
            <DayMacro label="Fat" value={dayMacros.fatG} color="orange" />
          </div>
        </div>
      )}

      {/* Workout fuel slots (only when there's a workout) */}
      {day.activity &&
        FUEL_SLOTS.some((s) => day.meals[s as keyof typeof day.meals]) && (
          <div className="rounded-2xl border border-black/5 bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-1.5 mt-1 px-2 flex items-center gap-1.5">
              <Zap
                size={11}
                className="text-[var(--color-electrolyte-dark)]"
                strokeWidth={2.5}
              />
              <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/70 font-medium">
                Fuel timing
              </p>
            </div>
            <ul className="space-y-1">
              {FUEL_SLOTS.map((slot) => {
                const meal = day.meals[slot as keyof typeof day.meals];
                if (!meal && !hasPlan) return null;
                return (
                  <MealRow
                    key={slot}
                    slot={slot}
                    meal={meal ?? null}
                    onClick={() => onMealClick(slot)}
                    accent="electrolyte"
                  />
                );
              })}
            </ul>
          </div>
        )}

      {/* Regular meal slots */}
      <div className="rounded-2xl border border-black/5 bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-1.5 mt-1 px-2 flex items-center gap-1.5">
          <Utensils
            size={11}
            className="text-[var(--color-blackberry)]/70"
            strokeWidth={2.5}
          />
          <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/70 font-medium">
            Meals
          </p>
        </div>
        <ul className="space-y-1">
          {REGULAR_SLOTS.map((slot) => {
            const meal = day.meals[slot as keyof typeof day.meals];
            if (slot === "snack" && !meal) return null;
            return (
              <MealRow
                key={slot}
                slot={slot}
                meal={meal ?? null}
                onClick={() => onMealClick(slot)}
              />
            );
          })}
        </ul>
      </div>

    </section>
  );
}

function DayMacro({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "electrolyte" | "cream-dark" | "orange";
}) {
  const dot =
    color === "electrolyte"
      ? "var(--color-electrolyte)"
      : color === "orange"
        ? "var(--color-orange)"
        : "var(--color-cream-dark)";
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
        <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/55">
          {label}
        </p>
      </div>
      <p className="mt-0.5 font-[var(--font-apercu)] text-[17px] font-semibold tabular-nums leading-none">
        {value.toLocaleString()}
        <span className="ml-0.5 text-[10px] font-normal text-[var(--color-blackberry)]/50">
          g
        </span>
      </p>
    </div>
  );
}

function ActivityChip({
  activity,
  isKey,
}: {
  activity: NonNullable<DayPlanData["activity"]>;
  isKey: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5",
        isKey
          ? "bg-[var(--color-orange)]/10 text-[var(--color-orange-dark)] border border-[var(--color-orange)]/30"
          : "bg-[var(--color-electrolyte)]/15 text-[var(--color-blackberry)] border border-[var(--color-electrolyte)]/40",
      )}
    >
      <Activity size={11} strokeWidth={2.5} />
      <span className="font-[var(--font-apercu)] text-[11px] font-medium leading-none">
        {activity.type}
        {activity.durationMinutes ? ` · ${activity.durationMinutes}m` : ""}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MealRow — single meal entry, mobile-friendly tap target
// ─────────────────────────────────────────────────────────────────────────────

function MealRow({
  slot,
  meal,
  onClick,
  accent,
}: {
  slot: string;
  meal: MealAssembly | null;
  onClick?: () => void;
  accent?: "electrolyte";
}) {
  const label = SLOT_LABEL[slot] ?? slot;

  if (!meal) {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left",
            "border border-dashed border-black/15",
            "hover:bg-black/[0.02] active:bg-black/[0.04]",
            "transition-colors",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "bg-black/[0.04] text-[var(--color-blackberry)]/45",
            )}
          >
            <Sparkles size={13} strokeWidth={2.2} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/50">
              {label}
            </span>
            <span className="block font-[var(--font-apercu)] text-[13px] text-[var(--color-blackberry)]/55 mt-0.5">
              Tap to add
            </span>
          </span>
          <ChevronRight size={14} className="text-[var(--color-blackberry)]/30" />
        </button>
      </li>
    );
  }

  const macros = `${meal.carbG}C · ${meal.protG}P · ${meal.fatG}F`;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left",
          "hover:bg-black/[0.02] active:bg-black/[0.04]",
          "transition-colors",
        )}
      >
        {meal.imageUrl ? (
          <span className="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--color-cream-dark)]">
            <img
              src={meal.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </span>
        ) : (
          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              accent === "electrolyte"
                ? "bg-[var(--color-electrolyte)]/20 text-[var(--color-blackberry)]"
                : "bg-[var(--color-blackberry)]/8 text-[var(--color-blackberry)]/70",
            )}
          >
            {accent === "electrolyte" ? (
              <Zap size={16} strokeWidth={2.2} />
            ) : (
              <Utensils size={15} strokeWidth={2.2} />
            )}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/55">
            {label}
            {meal.recipeId && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-electrolyte)]/20 text-[var(--color-blackberry)] px-1.5 py-0 text-[8px] font-semibold tracking-normal">
                recipe
              </span>
            )}
          </span>
          <span className="block font-[var(--font-apercu)] text-[14px] font-medium text-[var(--color-blackberry)] truncate mt-0.5">
            {meal.title}
          </span>
          {meal.components.length > 0 && (
            <span className="block font-[var(--font-apercu)] text-[11px] text-[var(--color-blackberry)]/55 truncate">
              {meal.components
                .slice(0, 3)
                .map((c) => c.name)
                .join(" · ")}
            </span>
          )}
        </span>
        <span className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="font-[var(--font-apercu)] text-[10px] font-semibold tabular-nums text-[var(--color-blackberry)]/80">
            {macros}
          </span>
          <ChevronRight size={12} className="text-[var(--color-blackberry)]/30" />
        </span>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionTitle — tiny section header used between cards
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {icon && (
        <span className="text-[var(--color-blackberry)]/60">{icon}</span>
      )}
      <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] font-medium text-[var(--color-blackberry)]/60">
        {children}
      </p>
    </div>
  );
}

