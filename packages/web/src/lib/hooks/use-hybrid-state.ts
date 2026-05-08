/**
 * useHybridState — chat ↔ grid sync state for Variant D.
 *
 * Design source: 07_parallel_build_plans.md §5.3
 *
 * Manages:
 * - The week grid's meal data (derived from server + optimistic updates)
 * - Debounced persistence of grid changes to Supabase
 * - A mutex so only one AI call is in-flight at a time
 * - Swap drawer state
 * - Chat panel collapse state (persisted in localStorage)
 *
 * This hook is the single source of truth for the Hybrid page state.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import type { WeekDataD } from "@/lib/queries/week-data.d";

const CHAT_COLLAPSE_KEY = "jade-d-chat-collapsed";
const DEBOUNCE_MS = 1000;

export interface SwapDrawerState {
  isOpen: boolean;
  date: string;
  slot: string;
  currentMeal: MealAssembly | null;
  alternatives: MealAssembly[];
  isLoading: boolean;
}

export function useHybridState(initialData: WeekDataD | null) {
  const [days, setDays] = useState<DayPlanData[]>(initialData?.days ?? []);
  const [planId, setPlanId] = useState<string | null>(
    initialData?.existingPlanId ?? null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Swap drawer
  const [swapDrawer, setSwapDrawer] = useState<SwapDrawerState>({
    isOpen: false,
    date: "",
    slot: "",
    currentMeal: null,
    alternatives: [],
    isLoading: false,
  });

  // Chat collapse — read from localStorage
  const [isChatCollapsed, setIsChatCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CHAT_COLLAPSE_KEY) === "true";
  });

  // AI mutex — only one call in flight at a time
  const aiInFlight = useRef(false);

  // Debounce timer for persistence
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync days when initial data changes (SSR refresh)
  useEffect(() => {
    if (initialData) {
      setDays(initialData.days);
      setPlanId(initialData.existingPlanId);
    }
  }, [initialData]);

  // Persist collapse state to localStorage
  const toggleChatCollapse = useCallback(() => {
    setIsChatCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(CHAT_COLLAPSE_KEY, String(next));
      return next;
    });
  }, []);

  /**
   * Replace a single meal slot in the grid (optimistic update).
   * Fires debounced persistence.
   */
  const replaceMeal = useCallback(
    (date: string, slot: string, meal: MealAssembly) => {
      setDays((prev) =>
        prev.map((day) => {
          if (day.date !== date) return day;
          return {
            ...day,
            meals: {
              ...day.meals,
              [slot as keyof typeof day.meals]: meal,
            },
          };
        }),
      );

      // Debounced persist
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(async () => {
        if (!planId) return;
        try {
          const { persistMealSlot } = await import(
            "@/lib/queries/week-data.d"
          );
          await persistMealSlot(planId, date, slot, meal);
        } catch (err) {
          console.error("[hybrid] Failed to persist meal slot:", err);
        }
      }, DEBOUNCE_MS);
    },
    [planId],
  );

  /**
   * Apply a full WeekPlan JSON (from Jade streaming) to the grid.
   */
  const applyWeekPlan = useCallback(
    async (planJson: string) => {
      if (aiInFlight.current) return;
      aiInFlight.current = true;
      setIsGenerating(true);

      try {
        const parsed = JSON.parse(planJson);
        const { WeekPlanSchema } = await import("@/server/jade/schema");
        const plan = WeekPlanSchema.parse(parsed);

        // Persist to DB
        const { persistWeekPlan } = await import("@/lib/queries/week-data.d");
        const newPlanId = await persistWeekPlan(plan);
        setPlanId(newPlanId);

        // Map WeekPlan days to DayPlanData for display
        setDays((prev) =>
          prev.map((existingDay) => {
            const planDay = plan.days.find((d) => d.date === existingDay.date);
            if (!planDay || !planDay.meals) return existingDay;

            const meals: DayPlanData["meals"] = {
              breakfast: null,
              pre_workout: null,
              during_workout: null,
              post_workout: null,
              lunch: null,
              dinner: null,
              snack: null,
            };

            for (const [slot, assembly] of Object.entries(planDay.meals)) {
              if (!assembly) continue;
              const mealForDisplay: MealAssembly = {
                id: assembly.id,
                title: assembly.title,
                methodTag: assembly.method_tag,
                components: assembly.components.map((c) => ({
                  name: c.name,
                  portion: c.portion,
                })),
                carbG: assembly.totals.carb_g,
                protG: assembly.totals.protein_g,
                fatG: assembly.totals.fat_g,
              };
              (meals as Record<string, MealAssembly>)[slot] = mealForDisplay;
            }

            return { ...existingDay, meals };
          }),
        );
      } catch (err) {
        console.error("[hybrid] Failed to apply week plan:", err);
      } finally {
        aiInFlight.current = false;
        setIsGenerating(false);
      }
    },
    [],
  );

  /** Open the swap drawer for a given cell */
  const openSwapDrawer = useCallback(
    async (date: string, slot: string) => {
      if (aiInFlight.current) return;

      const day = days.find((d) => d.date === date);
      const currentMeal =
        (day?.meals as Record<string, MealAssembly | null | undefined>)?.[
          slot
        ] ?? null;

      setSwapDrawer({
        isOpen: true,
        date,
        slot,
        currentMeal,
        alternatives: [],
        isLoading: true,
      });

      aiInFlight.current = true;

      try {
        const res = await fetch("/api/jade/object", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "swap",
            surface: "d",
            input: { date, slot },
          }),
        });

        if (!res.ok) throw new Error(`Swap failed: ${res.status}`);

        const data = await res.json();
        const alternatives = (data?.alternatives ?? []).map(
          (a: {
            id?: string;
            title: string;
            method_tag?: string;
            components?: { name: string; portion: string }[];
            totals?: { carb_g?: number; protein_g?: number; fat_g?: number };
          }): MealAssembly => ({
            id: a.id,
            title: a.title,
            methodTag: a.method_tag,
            components: a.components ?? [],
            carbG: a.totals?.carb_g ?? 0,
            protG: a.totals?.protein_g ?? 0,
            fatG: a.totals?.fat_g ?? 0,
          }),
        );

        setSwapDrawer((prev) => ({
          ...prev,
          alternatives,
          isLoading: false,
        }));
      } catch (err) {
        console.error("[hybrid] Swap failed:", err);
        setSwapDrawer((prev) => ({ ...prev, isLoading: false }));
      } finally {
        aiInFlight.current = false;
      }
    },
    [days],
  );

  const closeSwapDrawer = useCallback(() => {
    setSwapDrawer((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const acceptSwap = useCallback(
    (meal: MealAssembly) => {
      replaceMeal(swapDrawer.date, swapDrawer.slot, meal);
      closeSwapDrawer();
    },
    [swapDrawer.date, swapDrawer.slot, replaceMeal, closeSwapDrawer],
  );

  /** Generate / regenerate the week via /api/jade/object */
  const regenerateWeek = useCallback(
    async (weekStart: string) => {
      if (aiInFlight.current) return;
      aiInFlight.current = true;
      setIsGenerating(true);

      try {
        const res = await fetch("/api/jade/object", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "week",
            surface: "d",
            input: { week_start: weekStart },
          }),
        });

        if (!res.ok) throw new Error(`Regen failed: ${res.status}`);

        // Stream the response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
          }
        }

        // Try to parse the accumulated JSON from the stream
        // streamObject returns SSE with data: {...} lines
        const lines = accumulated.split("\n");
        let planJson = "";
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // AI SDK data stream format: "0:{json}\n"
            try {
              planJson += line.slice(2);
            } catch {
              // continue
            }
          }
        }

        if (planJson) {
          await applyWeekPlan(planJson);
        }
      } catch (err) {
        console.error("[hybrid] Regenerate week failed:", err);
      } finally {
        aiInFlight.current = false;
        setIsGenerating(false);
      }
    },
    [applyWeekPlan],
  );

  return {
    days,
    planId,
    isGenerating,
    swapDrawer,
    isChatCollapsed,
    toggleChatCollapse,
    replaceMeal,
    applyWeekPlan,
    openSwapDrawer,
    closeSwapDrawer,
    acceptSwap,
    regenerateWeek,
  };
}
