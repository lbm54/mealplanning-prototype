/**
 * useJadeFill — triggers the "Fill my week with Jade" header pill.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.6)
 *
 * Calls POST /api/jade/object { kind: 'week', input: { week_start, approach_used: 'c' } }
 * then maps the returned WeekPlan into a PickMap.
 *
 * Food IDs from the WeekPlan are resolved against the available column options.
 * IDs not found in the options are silently skipped (safety: no hallucinated foods).
 */

import { useState, useCallback } from "react";
import type { WeekPlan, DayPlan, MealAssembly } from "@/server/jade/schema";
import type { PickMap } from "./use-column-picks";
import type { ColumnOptions } from "@/lib/queries/columns-data.c";
import type { MealSlot } from "@/lib/queries/columns-data.c";

export interface UseJadeFillReturn {
  isLoading:  boolean;
  error:      string | null;
  fillWeek:   (weekStart: string, allCols: Record<string, ColumnOptions>) => Promise<PickMap | null>;
}

function mealAssemblyToPartialPick(
  meal: MealAssembly,
  cols: ColumnOptions,
): { proteinId: string | null; carbId: string | null; vegId: string | null } {
  let proteinId: string | null = null;
  let carbId:    string | null = null;
  let vegId:     string | null = null;

  // Match each component's food_id against the available column options
  for (const comp of meal.components) {
    const fid = comp.food_id;
    if (!proteinId && cols.protein.some((o) => o.id === fid)) {
      proteinId = fid;
    } else if (!carbId && cols.carb.some((o) => o.id === fid)) {
      carbId = fid;
    } else if (!vegId && cols.veg.some((o) => o.id === fid)) {
      vegId = fid;
    }
  }

  return { proteinId, carbId, vegId };
}

export function useJadeFill(): UseJadeFillReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fillWeek = useCallback(async (
    weekStart: string,
    allCols: Record<string, ColumnOptions>,
  ): Promise<PickMap | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind:    "week",
          input:   { week_start: weekStart, approach_used: "c" },
          surface: "c",
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || `HTTP ${response.status}`);
      }

      // The endpoint streams text — collect full body then parse JSON
      const text = await response.text();

      // Parse streamed JSON — it may be a partial stream; try to find last valid JSON
      let weekPlan: WeekPlan | null = null;
      try {
        // streamObject returns newline-delimited JSON; grab the last complete object
        const lines = text.split("\n").filter(Boolean).reverse();
        for (const line of lines) {
          try {
            weekPlan = JSON.parse(line) as WeekPlan;
            break;
          } catch {
            continue;
          }
        }
        if (!weekPlan) {
          weekPlan = JSON.parse(text) as WeekPlan;
        }
      } catch {
        throw new Error("Could not parse Jade's response");
      }

      if (!weekPlan?.days) {
        throw new Error("Jade returned an incomplete plan");
      }

      // Map WeekPlan → PickMap
      const pickMap: PickMap = {};
      const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"];

      for (const day of weekPlan.days as DayPlan[]) {
        for (const slot of SLOTS) {
          const meal = day.meals?.[slot as keyof typeof day.meals];
          if (!meal) continue;
          const key = `${day.date}:${slot}`;
          const cols = allCols[key];
          if (!cols) continue;
          const partial = mealAssemblyToPartialPick(meal, cols);
          pickMap[key] = { ...partial, locked: false };
        }
      }

      return pickMap;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, fillWeek };
}
