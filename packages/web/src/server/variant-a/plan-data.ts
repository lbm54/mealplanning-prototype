/**
 * Variant A — plan-page data stubs.
 *
 * The demo runs on localStorage (lib/plan-store) — there's no live
 * Supabase persistence in the prototype. This module exposes the same
 * types and function signatures the route expects, but returns empty
 * defaults so the production build can chunk client code without
 * dragging in server-only Supabase modules.
 */
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
  weekStart: string;
  weekEnd: string;
  isoWeek: number;
  isoYear: number;
  activities: ActivityRow[];
  macroTargets: MacroTargetRow[];
  existingPlan: MealPlanRow | null;
  existingMeals: MealPlanMealRow[];
  hasSupabase: boolean;
}

export async function fetchPlanPageData(
  weekStartOverride?: string,
): Promise<PlanPageData> {
  const today = dayjs();
  const weekStart = weekStartOverride
    ? dayjs(weekStartOverride)
    : today.isoWeekday(1);
  const weekEnd = weekStart.add(6, "day");
  return {
    weekStart: weekStart.format("YYYY-MM-DD"),
    weekEnd: weekEnd.format("YYYY-MM-DD"),
    isoWeek: weekStart.isoWeek(),
    isoYear: weekStart.isoWeekYear(),
    activities: [],
    macroTargets: [],
    existingPlan: null,
    existingMeals: [],
    hasSupabase: false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function persistWeekPlan(
  _weekStart: string,
  _isoWeek: number,
  _isoYear: number,
  _coachStrip: string,
  _meals: {
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
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateMealCell(
  _planId: string,
  _mealDate: string,
  _mealSlot: string,
  _meal: {
    title: string;
    method_tag?: string;
    carb_g: number;
    prot_g: number;
    fat_g: number;
  },
): Promise<void> {
  return;
}
