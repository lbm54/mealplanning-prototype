/**
 * save-plan.ts — server-side Supabase persistence for Variant E WeekPlans.
 *
 * Design source: 07_parallel_build_plans.md §6 (1.E.4, 1.E.7)
 *
 * Upserts meal_plans + meal_plan_meals rows.
 * Called from /api/jade/save-plan route and from the savePlan action.
 */
import { getServerSupabase } from "@/lib/supabase/server";
import type { WeekPlan } from "@/server/jade/schema";

export interface SavePlanInput {
  plan: WeekPlan;
  weekStart: string;
  isoWeek: number;
  isoYear: number;
  approach: string;
}

export async function savePlanToSupabase(input: SavePlanInput): Promise<{ ok: boolean; planId?: string; error?: string }> {
  const { plan, weekStart, isoWeek, isoYear, approach } = input;

  try {
    const supabase = await getServerSupabase();

    // Get user id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    // Upsert meal_plans row
    const { data: planRow, error: planError } = await supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: user.id,
          week_start: weekStart,
          iso_week: isoWeek,
          iso_year: isoYear,
          coach_strip: plan.coach_strip,
          rationale: plan.rationale ?? null,
          approach_used: approach,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        { onConflict: "user_id,week_start" },
      )
      .select("id")
      .single();

    if (planError || !planRow) {
      console.error("[savePlan] meal_plans upsert error:", planError);
      return { ok: false, error: planError?.message ?? "meal_plans upsert failed" };
    }

    const planId = (planRow as { id: string }).id;

    // Build meal rows from WeekPlan.days
    const mealRows: Array<{
      meal_plan_id: string;
      user_id: string;
      date: string;
      slot: string;
      title: string;
      method_tag: string | null;
      components: unknown;
      totals: unknown;
      locked: boolean;
      template_id: string | null;
      template_table: string | null;
    }> = [];

    for (const day of plan.days) {
      for (const [slot, meal] of Object.entries(day.meals ?? {})) {
        if (!meal) continue;
        mealRows.push({
          meal_plan_id: planId,
          user_id: user.id,
          date: day.date,
          slot,
          title: meal.title,
          method_tag: meal.method_tag ?? null,
          components: meal.components,
          totals: meal.totals,
          locked: false,
          template_id: meal.template_id ?? null,
          template_table: meal.template_table ?? null,
        });
      }
    }

    if (mealRows.length > 0) {
      // Delete existing meals for this plan first (cleaner than upsert on complex keys)
      await supabase.from("meal_plan_meals").delete().eq("meal_plan_id", planId);

      const { error: mealsError } = await supabase
        .from("meal_plan_meals")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(mealRows as any);

      if (mealsError) {
        console.error("[savePlan] meal_plan_meals insert error:", mealsError);
        return { ok: false, error: mealsError.message };
      }
    }

    return { ok: true, planId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[savePlan] unexpected error:", err);
    return { ok: false, error: message };
  }
}
