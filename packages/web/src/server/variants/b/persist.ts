/**
 * Variant B — Server-side persist helper.
 *
 * Writes a decided WeekPlan + decisions to Supabase:
 * - Upserts a row in meal_plans (approach_used = 'b')
 * - Upserts rows in meal_plan_meals for each decided meal
 *
 * Called by POST /api/jade/variant-b/persist
 *
 * Gracefully handles missing env (dev without credentials).
 */
import { getServerSupabase } from "@/lib/supabase/server";
import type { WeekPlan } from "@/server/jade/schema";

export interface PersistDecision {
  date: string;
  slot: string;
  meal: {
    id?: string;
    title: string;
    components: {
      food_id: string;
      name: string;
      portion: string;
      carb_g: number;
      protein_g: number;
      fat_g: number;
    }[];
    totals: { carb_g: number; protein_g: number; fat_g: number };
  };
  decision: "keep" | "swap" | "lock";
}

export async function persistVariantBPlan(
  weekPlan: WeekPlan,
  decisions: PersistDecision[],
): Promise<{ success: boolean; planId?: string; error?: string }> {
  try {
    const supabase = await getServerSupabase();

    // Upsert meal_plans row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planUpsert: any = {
      week_start: weekPlan.week_start,
      approach_used: "b",
      coach_strip: weekPlan.coach_strip,
      rationale: weekPlan.rationale ?? null,
      iso_week: weekPlan.iso_week,
      iso_year: weekPlan.iso_year,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase.from("meal_plans") as any)
      .upsert(planUpsert, { onConflict: "week_start,approach_used" })
      .select("id")
      .single();

    if (planError || !plan) {
      // meal_plans table may not exist in all envs — fail gracefully
      return { success: false, error: (planError as { message?: string } | null)?.message ?? "No plan returned" };
    }

    const planId = (plan as { id: string }).id;

    // Upsert meal_plan_meals rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mealRows: any[] = decisions.map((d) => ({
      plan_id: planId,
      date: d.date,
      slot: d.slot,
      meal_title: d.meal.title,
      components: d.meal.components,
      carb_g: d.meal.totals.carb_g,
      protein_g: d.meal.totals.protein_g,
      fat_g: d.meal.totals.fat_g,
      locked: d.decision === "lock",
      decision: d.decision,
      updated_at: new Date().toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: mealsError } = await (supabase.from("meal_plan_meals") as any)
      .upsert(mealRows, { onConflict: "plan_id,date,slot" });

    if (mealsError) {
      return { success: false, planId, error: mealsError.message };
    }

    return { success: true, planId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
