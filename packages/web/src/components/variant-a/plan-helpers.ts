/**
 * Plan helpers — convert server-side data to the DayPlanData shape
 * consumed by DayColumn and WeekGrid.
 *
 * Also: find the "key workout day" (longest/heaviest activity in the week).
 */
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import type {
  ActivityRow,
  MacroTargetRow,
  MealPlanMealRow,
} from "@/server/variant-a/plan-data";
import type { WeekPlan } from "@/server/jade/schema";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function formatDateLabel(dateStr: string): string {
  const d = dayjs(dateStr);
  return d.format("MMM D");
}

/** Find the key workout day (largest duration_minutes, then largest distance_miles). */
export function findKeyWorkoutDate(activities: ActivityRow[]): string | null {
  if (activities.length === 0) return null;

  let best: ActivityRow | null = null;
  for (const a of activities) {
    if (!best) { best = a; continue; }
    const durCur = a.duration_minutes ?? 0;
    const durBest = best.duration_minutes ?? 0;
    if (durCur > durBest) { best = a; continue; }
    if (durCur === durBest) {
      const distCur = a.distance_miles ?? 0;
      const distBest = best.distance_miles ?? 0;
      if (distCur > distBest) best = a;
    }
  }
  return best ? best.scheduled_date_time.split("T")[0] : null;
}

/** Build 7 DayPlanData entries from server data (no WeekPlan yet — empty cells). */
export function buildEmptyDays(
  weekStart: string,
  activities: ActivityRow[],
  macroTargets: MacroTargetRow[],
): DayPlanData[] {
  const keyDate = findKeyWorkoutDate(activities);
  const today = dayjs().format("YYYY-MM-DD");

  return Array.from({ length: 7 }, (_, i) => {
    const date = dayjs(weekStart).add(i, "day").format("YYYY-MM-DD");
    const dayActivities = activities.filter(
      (a) => a.scheduled_date_time.startsWith(date),
    );
    const primaryActivity = dayActivities[0] ?? null;

    const macroTarget = macroTargets.find((m) => m.target_date === date);

    return {
      date,
      dayLabel: DAY_LABELS[i],
      dateLabel: formatDateLabel(date),
      isToday: date === today,
      isKeyWorkout: date === keyDate,
      activity: primaryActivity
        ? {
            type: primaryActivity.activity_type,
            title: primaryActivity.title ?? undefined,
            distanceMiles: primaryActivity.distance_miles ?? undefined,
            durationMinutes: primaryActivity.duration_minutes ?? undefined,
            intensityLevel: primaryActivity.intensity_level ?? undefined,
          }
        : null,
      carbG: macroTarget?.carb_g ?? 0,
      protG: macroTarget?.prot_g ?? 0,
      fatG: macroTarget?.fat_g ?? 0,
      meals: {
        breakfast: null,
        pre_workout: null,
        during_workout: null,
        post_workout: null,
        lunch: null,
        dinner: null,
        snack: null,
      },
    } satisfies DayPlanData;
  });
}

/** Map a MealPlanMealRow to a MealAssembly for display. */
function mealRowToAssembly(row: MealPlanMealRow): MealAssembly {
  let components: { name: string; portion: string }[] = [];
  try {
    if (Array.isArray(row.components_json)) {
      components = (row.components_json as Array<{ name?: string; portion?: string }>).map((c) => ({
        name: c.name ?? "",
        portion: c.portion ?? "",
      }));
    }
  } catch {
    // ignore parse errors
  }

  return {
    id: row.id,
    title: row.title ?? "(untitled)",
    methodTag: row.method_tag ?? undefined,
    components,
    carbG: row.carb_g ?? 0,
    protG: row.prot_g ?? 0,
    fatG: row.fat_g ?? 0,
  };
}

type MealSlot =
  | "breakfast"
  | "pre_workout"
  | "during_workout"
  | "post_workout"
  | "lunch"
  | "dinner"
  | "snack";

/** Apply existing meal rows onto pre-built empty DayPlanData array. */
export function applyMealRows(
  days: DayPlanData[],
  mealRows: MealPlanMealRow[],
): DayPlanData[] {
  return days.map((day) => {
    const dayMeals = mealRows.filter((m) => m.meal_date === day.date);
    if (dayMeals.length === 0) return day;

    const updatedMeals = { ...day.meals };
    for (const row of dayMeals) {
      const slot = row.meal_slot as MealSlot;
      updatedMeals[slot] = mealRowToAssembly(row);
    }

    return { ...day, meals: updatedMeals };
  });
}

/** Apply a WeekPlan (from Jade) onto DayPlanData array. */
export function applyWeekPlan(
  days: DayPlanData[],
  weekPlan: WeekPlan,
  activities: ActivityRow[],
  macroTargets: MacroTargetRow[],
): DayPlanData[] {
  const keyDate = findKeyWorkoutDate(activities);

  return days.map((day) => {
    const planDay = weekPlan.days.find((d) => d.date === day.date);
    if (!planDay?.meals) return day;

    const macroTarget = macroTargets.find((m) => m.target_date === day.date);

    const updatedMeals: DayPlanData["meals"] = {
      breakfast: null,
      pre_workout: null,
      during_workout: null,
      post_workout: null,
      lunch: null,
      dinner: null,
      snack: null,
    };

    for (const [slot, asm] of Object.entries(planDay.meals)) {
      if (!asm) continue;
      updatedMeals[slot as MealSlot] = {
        id: asm.id,
        title: asm.title,
        methodTag: asm.method_tag,
        components: asm.components.map((c) => ({
          name: c.name,
          portion: c.portion,
        })),
        carbG: asm.totals.carb_g,
        protG: asm.totals.protein_g,
        fatG: asm.totals.fat_g,
      };
    }

    return {
      ...day,
      isKeyWorkout: day.date === keyDate,
      carbG: macroTarget?.carb_g ?? day.carbG,
      protG: macroTarget?.prot_g ?? day.protG,
      fatG: macroTarget?.fat_g ?? day.fatG,
      meals: updatedMeals,
    };
  });
}

/** Compute week macro totals from DayPlanData. */
export function computeWeekTotals(days: DayPlanData[]): {
  carbG: number;
  protG: number;
  fatG: number;
} {
  // Sum from macro targets (per-day targets, not meal sums)
  return days.reduce(
    (acc, day) => ({
      carbG: acc.carbG + day.carbG,
      protG: acc.protG + day.protG,
      fatG: acc.fatG + day.fatG,
    }),
    { carbG: 0, protG: 0, fatG: 0 },
  );
}

/** Get a MealAssembly from a DayPlanData for a given slot. */
export function getMealFromDay(
  day: DayPlanData,
  slot: string,
): MealAssembly | null {
  return (day.meals as Record<string, MealAssembly | null | undefined>)[slot] ?? null;
}

/** Count planned and locked days. */
export function countPlanStats(days: DayPlanData[]): {
  daysPlanned: number;
  daysLocked: number;
} {
  let daysPlanned = 0;
  let daysLocked = 0;

  for (const day of days) {
    const hasMeals = Object.values(day.meals).some((m) => m !== null);
    if (hasMeals) daysPlanned++;
    // Locked days: tracked separately — for now count 0 (lock feature in swap)
    void daysLocked;
  }

  return { daysPlanned, daysLocked: 0 };
}
