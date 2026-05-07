/**
 * week-data.e.ts — server-side data loader for Variant E (Coach).
 *
 * Fetches:
 * 1. The current week's activities
 * 2. The current week's macro targets
 * 3. The latest meal plan for this week (approach_used = 'e'), if any
 *
 * Used by plan.e.tsx's route loader.
 */
import { getServerSupabase } from "@/lib/supabase/server";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export type ExistingMealRow = {
  date: string;
  slot: string;
  title: string;
  components: Record<string, unknown>[];
  totals: { carb_g: number; protein_g: number; fat_g: number };
  locked: boolean;
};

export type ExistingPlan = {
  id: string;
  coach_strip?: string;
  rationale?: string;
  meals: ExistingMealRow[];
};

export type WeekDataE = {
  weekStart: string;
  isoWeek: number;
  isoYear: number;
  activities: Array<{
    id: string;
    scheduled_date_time: string;
    activity_type: string;
    title?: string;
    duration_minutes?: number;
    intensity_level?: string;
    distance_miles?: number;
  }>;
  macroTargets: Array<{
    target_date: string;
    carb_g: number;
    prot_g: number;
    fat_g: number;
  }>;
  existingPlan: ExistingPlan | null;
};

export async function loadWeekDataE(): Promise<WeekDataE> {
  const supabase = await getServerSupabase();

  const today = dayjs();
  const weekStart = today.startOf("isoWeek").format("YYYY-MM-DD");
  const weekEnd = today.endOf("isoWeek").format("YYYY-MM-DD");
  const isoWeekNum = today.isoWeek();
  const isoYear = today.isoWeekYear();

  // Activities for this week
  const { data: activities } = await supabase
    .from("activities")
    .select("id, scheduled_date_time, activity_type, title, duration_minutes, intensity_level, distance_miles")
    .gte("scheduled_date_time", `${weekStart}T00:00:00`)
    .lte("scheduled_date_time", `${weekEnd}T23:59:59`)
    .order("scheduled_date_time");

  // Macro targets for this week
  const { data: macroTargets } = await supabase
    .from("daily_macro_targets")
    .select("target_date, carb_g, prot_g, fat_g")
    .gte("target_date", weekStart)
    .lte("target_date", weekEnd)
    .order("target_date");

  // Latest meal plan for this week with approach_used = 'e'
  const { data: planRow } = await supabase
    .from("meal_plans")
    .select("id, coach_strip, rationale")
    .eq("week_start", weekStart)
    .eq("approach_used", "e")
    .maybeSingle();

  let existingPlan: WeekDataE["existingPlan"] = null;

  if (planRow) {
    const { data: mealRows } = await supabase
      .from("meal_plan_meals")
      .select("date, slot, title, components, totals, locked")
      .eq("meal_plan_id", planRow.id)
      .order("date")
      .order("slot");

    existingPlan = {
      id: planRow.id,
      coach_strip: planRow.coach_strip ?? undefined,
      rationale: planRow.rationale ?? undefined,
      meals: (mealRows ?? []).map((r) => ({
        date: r.date,
        slot: r.slot,
        title: r.title,
        components: (r.components as Record<string, unknown>[]) ?? [],
        totals: (r.totals as { carb_g: number; protein_g: number; fat_g: number }) ?? { carb_g: 0, protein_g: 0, fat_g: 0 },
        locked: r.locked ?? false,
      })),
    };
  }

  return {
    weekStart,
    isoWeek: isoWeekNum,
    isoYear,
    activities: (activities ?? []).map((a) => ({
      id: a.id,
      scheduled_date_time: a.scheduled_date_time ?? "",
      activity_type: a.activity_type ?? "",
      title: a.title ?? undefined,
      duration_minutes: a.duration_minutes ?? undefined,
      intensity_level: a.intensity_level ?? undefined,
      distance_miles: a.distance_miles ?? undefined,
    })),
    macroTargets: (macroTargets ?? []).map((t) => ({
      target_date: t.target_date,
      carb_g: t.carb_g ?? 0,
      prot_g: t.prot_g ?? 0,
      fat_g: t.fat_g ?? 0,
    })),
    existingPlan,
  };
}
