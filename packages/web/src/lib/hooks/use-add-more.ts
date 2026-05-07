/**
 * useAddMore — handles the "+ show more" popover flow.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.7)
 *
 * Fires POST /api/jade/object { kind: 'tweak', input: { scope: 'slot', tweak_text } }
 * and prepends the returned food options to the current column.
 */

import { useState, useCallback } from "react";
import type { FoodOption } from "@/lib/queries/columns-data.c";

export interface UseAddMoreReturn {
  isLoading: boolean;
  error:     string | null;
  fetchMore: (params: {
    date:     string;
    slot:     string;
    column:   "protein" | "carb" | "veg";
    tweakText: string;
  }) => Promise<FoodOption[]>;
}

export function useAddMore(): UseAddMoreReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchMore = useCallback(async (params: {
    date:      string;
    slot:      string;
    column:    "protein" | "carb" | "veg";
    tweakText: string;
  }): Promise<FoodOption[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "tweak",
          input: {
            scope:      "slot",
            date:       params.date,
            slot:       params.slot,
            column:     params.column,
            tweak_text: params.tweakText,
          },
          surface: "c",
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || `HTTP ${response.status}`);
      }

      const result = await response.json() as {
        changes?: Array<{
          new_meal?: { components?: Array<{ food_id: string; name: string; carb_g: number; protein_g: number; fat_g: number; portion: string }> };
        }>;
      };

      // Extract food options from the tweak changes
      const foods: FoodOption[] = [];
      for (const change of result.changes ?? []) {
        for (const comp of change.new_meal?.components ?? []) {
          foods.push({
            id:           comp.food_id,
            name:         comp.name,
            carb_g:       comp.carb_g,
            protein_g:    comp.protein_g,
            fat_g:        comp.fat_g,
            sodium_mg:    0,
            serving_size: comp.portion ?? null,
            category:     params.column,
            isDisliked:   false,
            isRecommended: false,
          });
        }
      }

      return foods.slice(0, 3); // Max 3 new options
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, fetchMore };
}
