/**
 * Variant D — Hybrid week data loader.
 *
 * Fetches:
 * 1. Activities for the current week (from Supabase `activities` table)
 * 2. Daily macro targets (from `daily_macro_targets`)
 * 3. Existing meal plan + meals (from `meal_plans` + `meal_plan_meals`)
 *
 * Returns a shape that both the grid and chat panel can use.
 *
 * Source: 07_parallel_build_plans.md §5.3 step 1.D.2
 */

import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import type { WeekPlan } from "@/server/jade/schema";

export interface WeekDataD {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekLabel: string; // "May 6 – May 12, 2026"
  days: DayPlanData[];
  weekTotals: { carbG: number; protG: number; fatG: number };
  daysPlanned: number;
  daysLocked: number;
  existingPlanId: string | null;
  coachStrip: string | null;
}

/** Convert a DB meal_plan_meals row into a MealAssembly for display */
function rowToAssembly(row: MealPlanMealRow): MealAssembly {
  const components = Array.isArray(row.components)
    ? (row.components as { name: string; portion: string }[])
    : [];
  const totals =
    row.totals && typeof row.totals === "object"
      ? (row.totals as { carb_g?: number; protein_g?: number; fat_g?: number })
      : {};
  return {
    id: row.id,
    title: row.title ?? "",
    methodTag: row.method_tag ?? undefined,
    components,
    carbG: totals.carb_g ?? 0,
    protG: totals.protein_g ?? 0,
    fatG: totals.fat_g ?? 0,
  };
}

interface MealPlanMealRow {
  id: string;
  date: string;
  slot: string;
  title: string | null;
  method_tag: string | null;
  components: unknown;
  totals: unknown;
  locked: boolean | null;
}

function getWeekStart(from?: Date): string {
  const d = from ? new Date(from) : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(startISO: string): string {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const SLOTS = [
  "breakfast",
  "pre_workout",
  "during_workout",
  "post_workout",
  "lunch",
  "dinner",
  "snack",
] as const;

export async function loadWeekDataD(weekStartOverride?: string): Promise<WeekDataD> {
  const { getServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await getServerSupabase();

  const weekStart = weekStartOverride ?? getWeekStart();

  // Build week day list (Mon–Sun)
  const dayDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    dayDates.push(d.toISOString().split("T")[0]);
  }

  const weekEnd = dayDates[6];
  const todayISO = new Date().toISOString().split("T")[0];

  // 1. Activities
  const { data: activities } = await supabase
    .from("activities")
    .select(
      "id, scheduled_date_time, activity_type, title, duration_minutes, intensity_level, distance_miles",
    )
    .gte("scheduled_date_time", weekStart + "T00:00:00")
    .lte("scheduled_date_time", weekEnd + "T23:59:59")
    .order("scheduled_date_time");

  // 2. Macro targets
  const { data: macroTargets } = await supabase
    .from("daily_macro_targets")
    .select("target_date, carb_g, prot_g, fat_g")
    .gte("target_date", weekStart)
    .lte("target_date", weekEnd);

  // 3. Existing meal plan
  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select("id, coach_strip")
    .eq("week_start", weekStart)
    .eq("approach_used", "d")
    .maybeSingle();

  // 4. Existing meal plan meals
  const mealsByDate: Map<string, Map<string, MealAssembly>> = new Map();

  if (mealPlan?.id) {
    const { data: planMeals } = await supabase
      .from("meal_plan_meals")
      .select("id, date, slot, title, method_tag, components, totals, locked")
      .eq("meal_plan_id", mealPlan.id);

    if (planMeals) {
      for (const row of planMeals as MealPlanMealRow[]) {
        if (!mealsByDate.has(row.date)) mealsByDate.set(row.date, new Map());
        mealsByDate.get(row.date)!.set(row.slot, rowToAssembly(row));
      }
    }
  }

  // Build macros lookup
  const macrosByDate = new Map<string, { carb_g: number; prot_g: number; fat_g: number }>();
  if (macroTargets) {
    for (const mt of macroTargets) {
      macrosByDate.set(mt.target_date, {
        carb_g: mt.carb_g ?? 0,
        prot_g: mt.prot_g ?? 0,
        fat_g: mt.fat_g ?? 0,
      });
    }
  }

  // Build activity lookup by date
  const activityByDate = new Map<
    string,
    { type: string; title?: string; distanceMiles?: number; durationMinutes?: number; intensityLevel?: string }
  >();
  if (activities) {
    for (const a of activities) {
      const dateKey = a.scheduled_date_time.split("T")[0];
      activityByDate.set(dateKey, {
        type: a.activity_type ?? "workout",
        title: a.title ?? undefined,
        distanceMiles: a.distance_miles ?? undefined,
        durationMinutes: a.duration_minutes ?? undefined,
        intensityLevel: a.intensity_level ?? undefined,
      });
    }
  }

  let daysPlanned = 0;

  const days: DayPlanData[] = dayDates.map((date, i) => {
    const macros = macrosByDate.get(date) ?? { carb_g: 150, prot_g: 120, fat_g: 55 };
    const mealsForDay = mealsByDate.get(date) ?? new Map<string, MealAssembly>();
    const activity = activityByDate.get(date) ?? null;

    const hasMeals = mealsForDay.size > 0;
    if (hasMeals) daysPlanned++;

    const d = new Date(date + "T00:00:00");
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return {
      date,
      dayLabel: DAY_LABELS[i],
      dateLabel,
      isToday: date === todayISO,
      isKeyWorkout:
        (macros.carb_g ?? 0) >= 280 ||
        activity?.intensityLevel === "high" ||
        activity?.intensityLevel === "threshold",
      activity,
      carbG: macros.carb_g,
      protG: macros.prot_g,
      fatG: macros.fat_g,
      meals: {
        breakfast: mealsForDay.get("breakfast") ?? null,
        pre_workout: mealsForDay.get("pre_workout") ?? null,
        during_workout: mealsForDay.get("during_workout") ?? null,
        post_workout: mealsForDay.get("post_workout") ?? null,
        lunch: mealsForDay.get("lunch") ?? null,
        dinner: mealsForDay.get("dinner") ?? null,
        snack: mealsForDay.get("snack") ?? null,
      },
    };
  });

  const weekTotals = days.reduce(
    (acc, d) => ({
      carbG: acc.carbG + d.carbG,
      protG: acc.protG + d.protG,
      fatG: acc.fatG + d.fatG,
    }),
    { carbG: 0, protG: 0, fatG: 0 },
  );

  return {
    weekStart,
    weekLabel: formatWeekLabel(weekStart),
    days,
    weekTotals,
    daysPlanned,
    daysLocked: 0,
    existingPlanId: mealPlan?.id ?? null,
    coachStrip: mealPlan?.coach_strip ?? null,
  };
}

/** Persist a WeekPlan (from Jade) to Supabase meal_plans + meal_plan_meals */
export async function persistWeekPlan(plan: WeekPlan): Promise<string> {
  const { getServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await getServerSupabase();

  // Upsert the meal_plans row
  const { data: planRow, error: planError } = await supabase
    .from("meal_plans")
    .upsert(
      {
        week_start: plan.week_start,
        iso_week: plan.iso_week,
        iso_year: plan.iso_year,
        coach_strip: plan.coach_strip,
        rationale: plan.rationale ?? null,
        approach_used: "d",
        generation_model: "jade-hybrid",
      },
      { onConflict: "user_id,week_start" },
    )
    .select("id")
    .single();

  if (planError || !planRow) {
    throw new Error(`Failed to upsert meal_plans: ${planError?.message}`);
  }

  const planId: string = planRow.id;

  // Upsert meal_plan_meals for each slot
  const meals: {
    meal_plan_id: string;
    date: string;
    slot: string;
    title: string;
    method_tag: string | null;
    components: unknown;
    totals: unknown;
    locked: boolean;
  }[] = [];

  for (const day of plan.days) {
    if (!day.meals) continue;
    for (const slot of SLOTS) {
      const meal = day.meals[slot];
      if (!meal) continue;
      meals.push({
        meal_plan_id: planId,
        date: day.date,
        slot,
        title: meal.title,
        method_tag: meal.method_tag ?? null,
        components: meal.components,
        totals: meal.totals,
        locked: false,
      });
    }
  }

  if (meals.length > 0) {
    const { error: mealsError } = await supabase
      .from("meal_plan_meals")
      .upsert(meals, { onConflict: "meal_plan_id,date,slot" });

    if (mealsError) {
      throw new Error(`Failed to upsert meal_plan_meals: ${mealsError.message}`);
    }
  }

  return planId;
}

/** Persist a single meal slot change */
export async function persistMealSlot(
  planId: string,
  date: string,
  slot: string,
  meal: MealAssembly,
): Promise<void> {
  const { getServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await getServerSupabase();

  await supabase.from("meal_plan_meals").upsert(
    {
      meal_plan_id: planId,
      date,
      slot,
      title: meal.title,
      method_tag: meal.methodTag ?? null,
      components: meal.components,
      totals: { carb_g: meal.carbG, protein_g: meal.protG, fat_g: meal.fatG },
      locked: false,
    },
    { onConflict: "meal_plan_id,date,slot" },
  );
}
