/**
 * useColumnPicks — client state for all column selections.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.3)
 *
 * Each entry is keyed by `${date}:${slot}` and records which food ID
 * the user has selected in each column. Initialised from the saved plan
 * (if any), then updated by user clicks.
 *
 * Running totals are derived synchronously from the option lists in the
 * column data — no server round-trip on pick.
 */

import { useState, useCallback, useMemo } from "react";
import type { FoodOption, ColumnOptions, SavedMeal } from "@/lib/queries/columns-data.c";

export interface CellPick {
  proteinId: string | null;
  carbId:    string | null;
  vegId:     string | null;
  locked:    boolean;
}

export type PickMap = Record<string, CellPick>; // keyed by `${date}:${slot}`

export interface CellTotals {
  carb_g:    number;
  protein_g: number;
  fat_g:     number;
}

function resolveFood(options: FoodOption[], id: string | null): FoodOption | null {
  if (!id) return null;
  return options.find((o) => o.id === id) ?? null;
}

function computeTotals(pick: CellPick, cols: ColumnOptions): CellTotals {
  const p = resolveFood(cols.protein, pick.proteinId);
  const c = resolveFood(cols.carb,    pick.carbId);
  const v = resolveFood(cols.veg,     pick.vegId);

  return {
    carb_g:    (p?.carb_g ?? 0)    + (c?.carb_g ?? 0)    + (v?.carb_g ?? 0),
    protein_g: (p?.protein_g ?? 0) + (c?.protein_g ?? 0) + (v?.protein_g ?? 0),
    fat_g:     (p?.fat_g ?? 0)     + (c?.fat_g ?? 0)     + (v?.fat_g ?? 0),
  };
}

export interface UseColumnPicksReturn {
  picks:        PickMap;
  setPick:      (key: string, col: "protein" | "carb" | "veg", foodId: string) => void;
  toggleLock:   (key: string) => void;
  bulkSetPicks: (map: PickMap) => void;
  getTotals:    (key: string, cols: ColumnOptions) => CellTotals;
  weekTotals:   (allCols: Record<string, ColumnOptions>) => CellTotals;
  isDirty:      boolean;
  markSaved:    () => void;
}

export function useColumnPicks(
  initialSaved?: Record<string, SavedMeal> | null,
  /** Recommended IDs per cell (from column options), used if no saved pick exists */
  recommended?: Record<string, { proteinId: string | null; carbId: string | null; vegId: string | null }>,
): UseColumnPicksReturn {
  const [savedSnapshot, setSavedSnapshot] = useState<PickMap>(() => {
    const init: PickMap = {};
    const source = initialSaved ?? {};
    for (const [key, saved] of Object.entries(source)) {
      init[key] = {
        proteinId: saved.proteinId,
        carbId:    saved.carbId,
        vegId:     saved.vegId,
        locked:    saved.locked,
      };
    }
    // Seed recommended picks where no saved data exists
    if (recommended) {
      for (const [key, rec] of Object.entries(recommended)) {
        if (!init[key]) {
          init[key] = { ...rec, locked: false };
        }
      }
    }
    return init;
  });

  const [picks, setPicks] = useState<PickMap>(savedSnapshot);

  const setPick = useCallback(
    (key: string, col: "protein" | "carb" | "veg", foodId: string) => {
      setPicks((prev) => {
        const current = prev[key] ?? { proteinId: null, carbId: null, vegId: null, locked: false };
        if (current.locked) return prev;
        const colKey = col === "protein" ? "proteinId" : col === "carb" ? "carbId" : "vegId";
        return { ...prev, [key]: { ...current, [colKey]: foodId } };
      });
    },
    [],
  );

  const toggleLock = useCallback((key: string) => {
    setPicks((prev) => {
      const current = prev[key];
      if (!current) return prev;
      return { ...prev, [key]: { ...current, locked: !current.locked } };
    });
  }, []);

  const bulkSetPicks = useCallback((map: PickMap) => {
    setPicks((prev) => {
      const merged = { ...prev };
      for (const [key, pick] of Object.entries(map)) {
        // Respect locked cells — skip them
        if (merged[key]?.locked) continue;
        merged[key] = pick;
      }
      return merged;
    });
  }, []);

  const getTotals = useCallback((key: string, cols: ColumnOptions): CellTotals => {
    const pick = picks[key];
    if (!pick) return { carb_g: 0, protein_g: 0, fat_g: 0 };
    return computeTotals(pick, cols);
  }, [picks]);

  const weekTotals = useCallback((allCols: Record<string, ColumnOptions>): CellTotals => {
    let carb_g = 0, protein_g = 0, fat_g = 0;
    for (const [key, pick] of Object.entries(picks)) {
      const cols = allCols[key];
      if (!cols) continue;
      const t = computeTotals(pick, cols);
      carb_g    += t.carb_g;
      protein_g += t.protein_g;
      fat_g     += t.fat_g;
    }
    return { carb_g, protein_g, fat_g };
  }, [picks]);

  const isDirty = useMemo(
    () => JSON.stringify(picks) !== JSON.stringify(savedSnapshot),
    [picks, savedSnapshot],
  );

  const markSaved = useCallback(() => {
    setSavedSnapshot(picks);
  }, [picks]);

  return { picks, setPick, toggleLock, bulkSetPicks, getTotals, weekTotals, isDirty, markSaved };
}
