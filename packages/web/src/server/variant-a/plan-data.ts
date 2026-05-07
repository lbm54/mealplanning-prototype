/**
 * Variant A — server-side data loader for the Calendar plan page.
 *
 * Fetches for the current ISO week:
 *   - activities (to detect workout days + key workout day)
 *   - daily_macro_targets (carb tier, macro rail)
 *   - existing meal_plan + meal_plan_meals (if already built)
 *
 * All queries fail gracefully — the page renders an empty/stub state
 * when env vars or data are absent.
 *
 * Source: 07_parallel_build_plans.md §2, sub-phase 1.A.2
 */
import { getServerSupabase } from "@/lib/supabase/server";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export interface ActivityRow {
  id: string;
  scheduled_date_time: string;
  activity_type: string;
  title: string | null;
  duration_minutes: number | null;
  intensity_level: string | null;
  distance_miles: number | null;
}

export interface MacroTargetRow {
  target_date: string;
  carb_g: number;
  prot_g: number;
  fat_g: number;
}

export interface MealPlanMealRow {
  id: string;
  plan_id: string;
  meal_date: string;
  meal_slot: string;
  title: string | null;
  method_tag: string | null;
  carb_g: number | null;
  prot_g: number | null;
  fat_g: number | null;
  locked: boolean | null;
  components_json: unknown;
}

export interface MealPlanRow {
  id: string;
  week_start: string;
  iso_week: number;
  iso_year: number;
  coach_strip: string | null;
  approach_used: string | null;
}

export interface PlanPageData {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  isoWeek: number;
  isoYear: number;
  activities: ActivityRow[];
  macroTargets: MacroTargetRow[];
  existingPlan: MealPlanRow | null;
  existingMeals: MealPlanMealRow[];
  /** True if Supabase env vars are present */
  hasSupabase: boolean;
}

export async function fetchPlanPageData(weekStartOverride?: string): Promise<PlanPageData> {
  // Calculate current ISO week Mon–Sun
  const today = dayjs();
  const weekStart = weekStartOverride
    ? dayjs(weekStartOverride)
    : today.isoWeekday(1); // Monday
  const weekEnd = weekStart.add(6, "day"); // Sunday

  const weekStartStr = weekStart.format("YYYY-MM-DD");
  const weekEndStr = weekEnd.format("YYYY-MM-DD");
  const isoWeekNum = weekStart.isoWeek();
  const isoYearNum = weekStart.isoWeekYear();

  // Check if Supabase is configured
  const hasSupabase = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY,
  );

  if (!hasSupabase) {
    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      isoWeek: isoWeekNum,
      isoYear: isoYearNum,
      activities: [],
      macroTargets: [],
      existingPlan: null,
      existingMeals: [],
      hasSupabase: false,
    };
  }

  let supabase;
  try {
    supabase = await getServerSupabase();
  } catch {
    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      isoWeek: isoWeekNum,
      isoYear: isoYearNum,
      activities: [],
      macroTargets: [],
      existingPlan: null,
      existingMeals: [],
      hasSupabase: false,
    };
  }

  const [activitiesResult, targetsResult, planResult] = await Promise.allSettled([
    supabase
      .from("activities")
      .select(
        "id, scheduled_date_time, activity_type, title, duration_minutes, intensity_level, distance_miles",
      )
      .gte("scheduled_date_time", `${weekStartStr}T00:00:00`)
      .lte("scheduled_date_time", `${weekEndStr}T23:59:59`)
      .in("status", ["planned", "in_progress", "completed"])
      .order("scheduled_date_time"),

    supabase
      .from("daily_macro_targets")
      .select("target_date, carb_g, prot_g, fat_g")
      .gte("target_date", weekStartStr)
      .lte("target_date", weekEndStr)
      .order("target_date"),

    supabase
      .from("meal_plans")
      .select("id, week_start, iso_week, iso_year, coach_strip, approach_used")
      .eq("week_start", weekStartStr)
      .eq("approach_used", "a")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const activities: ActivityRow[] =
    activitiesResult.status === "fulfilled"
      ? ((activitiesResult.value.data as ActivityRow[] | null) ?? [])
      : [];

  const macroTargets: MacroTargetRow[] =
    targetsResult.status === "fulfilled"
      ? ((targetsResult.value.data as MacroTargetRow[] | null) ?? [])
      : [];

  const existingPlan: MealPlanRow | null =
    planResult.status === "fulfilled"
      ? (planResult.value.data as MealPlanRow | null)
      : null;

  // If there's an existing plan, load its meals
  let existingMeals: MealPlanMealRow[] = [];
  if (existingPlan?.id) {
    try {
      const mealsResult = await supabase
        .from("meal_plan_meals")
        .select(
          "id, plan_id, meal_date, meal_slot, title, method_tag, carb_g, prot_g, fat_g, locked, components_json",
        )
        .eq("plan_id", existingPlan.id)
        .order("meal_date")
        .order("meal_slot");
      existingMeals = (mealsResult.data as MealPlanMealRow[] | null) ?? [];
    } catch {
      // fail gracefully
    }
  }

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    isoWeek: isoWeekNum,
    isoYear: isoYearNum,
    activities,
    macroTargets,
    existingPlan,
    existingMeals,
    hasSupabase: true,
  };
}

/** Persist a newly generated WeekPlan to meal_plans + meal_plan_meals. */
export async function persistWeekPlan(
  weekStart: string,
  isoWeek: number,
  isoYear: number,
  coachStrip: string,
  meals: {
    meal_date: string;
    meal_slot: string;
    title: string;
    method_tag?: string;
    carb_g: number;
    prot_g: number;
    fat_g: number;
    components_json?: unknown;
  }[],
): Promise<string | null> {
  try {
    const supabase = await getServerSupabase();

    // Upsert the plan row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planInsertResult = await (supabase.from("meal_plans") as any)
      .insert({
        week_start: weekStart,
        iso_week: isoWeek,
        iso_year: isoYear,
        coach_strip: coachStrip,
        approach_used: "a",
      })
      .select("id")
      .single() as { data: { id: string } | null; error: unknown };

    if (planInsertResult.error || !planInsertResult.data) return null;

    const planId = planInsertResult.data.id;

    // Insert meal rows
    if (meals.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("meal_plan_meals") as any).insert(
        meals.map((m) => ({
          plan_id: planId,
          meal_date: m.meal_date,
          meal_slot: m.meal_slot,
          title: m.title,
          method_tag: m.method_tag ?? null,
          carb_g: m.carb_g,
          prot_g: m.prot_g,
          fat_g: m.fat_g,
          locked: false,
          components_json: m.components_json ?? null,
        })),
      );
    }

    return planId;
  } catch {
    return null;
  }
}

/** Update a single meal cell (swap). */
export async function updateMealCell(
  planId: string,
  mealDate: string,
  mealSlot: string,
  meal: {
    title: string;
    method_tag?: string;
    carb_g: number;
    prot_g: number;
    fat_g: number;
    components_json?: unknown;
  },
): Promise<boolean> {
  try {
    const supabase = await getServerSupabase();

    // Upsert the meal row by plan_id + meal_date + meal_slot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upsertResult = await (supabase.from("meal_plan_meals") as any)
      .upsert(
        {
          plan_id: planId,
          meal_date: mealDate,
          meal_slot: mealSlot,
          title: meal.title,
          method_tag: meal.method_tag ?? null,
          carb_g: meal.carb_g,
          prot_g: meal.prot_g,
          fat_g: meal.fat_g,
          components_json: meal.components_json ?? null,
        },
        { onConflict: "plan_id,meal_date,meal_slot" },
      ) as { error: unknown };

    return !upsertResult.error;
  } catch {
    return false;
  }
}
