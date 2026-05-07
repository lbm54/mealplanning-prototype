/**
 * Variant C — persistence helpers.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.4)
 *
 * Upserts a WeekPlan to meal_plans + meal_plan_meals.
 * approach_used = 'c' marks this as the Columns variant.
 */

import { getServerSupabase } from "@/lib/supabase/server";
import type { PickMap } from "@/lib/hooks/use-column-picks";
import type { ColumnOptions, DayMacroRow } from "@/lib/queries/columns-data.c";

export interface SaveWeekParams {
  weekStart:  string;
  isoWeek:    number;
  isoYear:    number;
  days:       DayMacroRow[];
  picks:      PickMap;
  columns:    Record<string, ColumnOptions>;
}

export async function saveWeekPlan(params: SaveWeekParams): Promise<{ ok: boolean; error?: string }> {
  const { weekStart, isoWeek, isoYear, days, picks, columns } = params;
  const supabase = await getServerSupabase();

  // 1. Upsert meal_plans row
  const { data: planRow, error: planErr } = await supabase
    .from("meal_plans")
    .upsert(
      {
        week_start:   weekStart,
        iso_week:     isoWeek,
        iso_year:     isoYear,
        approach_used: "c",
        updated_at:   new Date().toISOString(),
      } as { week_start: string; iso_week: number; iso_year: number; approach_used: string; updated_at: string },
      { onConflict: "user_id,week_start" },
    )
    .select("id")
    .single();

  if (planErr || !planRow) {
    return { ok: false, error: planErr?.message ?? "Failed to upsert meal plan" };
  }

  const mealPlanId = (planRow as { id: string }).id;

  // 2. Build meal_plan_meals rows from picks
  const MAIN_SLOTS = ["breakfast", "lunch", "dinner"] as const;
  const rows: Array<Record<string, unknown>> = [];

  for (const day of days) {
    for (const slot of MAIN_SLOTS) {
      const key  = `${day.date}:${slot}`;
      const pick = picks[key];
      if (!pick) continue;

      const cols = columns[key];
      const comps: Array<{ food_id: string; category: string; carb_g: number; protein_g: number; fat_g: number }> = [];

      if (pick.proteinId && cols) {
        const f = cols.protein.find((o) => o.id === pick.proteinId);
        if (f) comps.push({ food_id: f.id, category: "protein", carb_g: f.carb_g, protein_g: f.protein_g, fat_g: f.fat_g });
      }
      if (pick.carbId && cols) {
        const f = cols.carb.find((o) => o.id === pick.carbId);
        if (f) comps.push({ food_id: f.id, category: "carb", carb_g: f.carb_g, protein_g: f.protein_g, fat_g: f.fat_g });
      }
      if (pick.vegId && cols) {
        const f = cols.veg.find((o) => o.id === pick.vegId);
        if (f) comps.push({ food_id: f.id, category: "veg", carb_g: f.carb_g, protein_g: f.protein_g, fat_g: f.fat_g });
      }

      const totals = comps.reduce(
        (acc, c) => ({
          carb_g:    acc.carb_g    + c.carb_g,
          protein_g: acc.protein_g + c.protein_g,
          fat_g:     acc.fat_g     + c.fat_g,
          sodium_mg: 0,
        }),
        { carb_g: 0, protein_g: 0, fat_g: 0, sodium_mg: 0 },
      );

      rows.push({
        meal_plan_id: mealPlanId,
        date:         day.date,
        slot,
        title:        comps.map((c) => c.food_id).join(" + "), // IDs as title placeholder
        components:   comps,
        totals,
        locked:       pick.locked,
        approach_used: "c",
        updated_at:   new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) {
    return { ok: true }; // Nothing to save
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: mealsErr } = await (supabase.from("meal_plan_meals") as any)
    .upsert(rows, { onConflict: "meal_plan_id,date,slot" });

  if (mealsErr) {
    return { ok: false, error: mealsErr.message };
  }

  return { ok: true };
}
