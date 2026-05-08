/**
 * Variant B — Mock data for no-env fallback.
 *
 * Used when no AI key is configured so the UI is demoable without credentials.
 * Returns a deterministic 7-day WeekPlan with realistic-looking meals.
 */
import type { WeekPlan, MealAssembly } from "@/server/jade/schema";

const MOCK_FOOD_ID = "00000000-0000-0000-0000-000000000001";

function mockMeal(title: string, carbG: number, protG: number, fatG: number): MealAssembly {
  return {
    id: `mock-${title.replace(/\s+/g, "-").toLowerCase()}`,
    title,
    method_tag: "5-min assembly",
    components: [
      {
        food_id: MOCK_FOOD_ID,
        name: title.split(" + ")[0] ?? title,
        portion: "1 serving",
        carb_g: carbG,
        protein_g: protG,
        fat_g: fatG,
      },
    ],
    totals: { carb_g: carbG, protein_g: protG, fat_g: fatG },
  };
}

/** Build a mock WeekPlan for the week starting on weekStart (YYYY-MM-DD) */
export function buildMockWeekPlan(weekStart: string): WeekPlan {
  const days: WeekPlan["days"] = [];

  const dayData = [
    { note: "Rest day — light meals, keep protein high.", carb: 130, activities: false },
    { note: "Easy 6 mi — moderate carbs.", carb: 170, activities: true },
    { note: "Tempo 8 mi — carbs up.", carb: 210, activities: true },
    { note: "Easy 5 mi — steady day.", carb: 170, activities: true },
    { note: "Shake-out 4 mi — pre-race fueling starts.", carb: 220, activities: true },
    { note: "Long run 18 mi — heaviest carb day.", carb: 320, activities: true },
    { note: "Swim recovery — light carbs.", carb: 150, activities: true },
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const date = d.toISOString().split("T")[0]!;
    const info = dayData[i]!;
    const prot = 140;
    const fat = 60;

    const meals: WeekPlan["days"][number]["meals"] = {
      breakfast: mockMeal("oats + berries + almond butter", Math.round(info.carb * 0.28), Math.round(prot * 0.25), Math.round(fat * 0.3)),
      lunch: mockMeal("chicken + rice + broccoli", Math.round(info.carb * 0.3), Math.round(prot * 0.35), Math.round(fat * 0.2)),
      dinner: mockMeal("salmon + sweet potato + asparagus", Math.round(info.carb * 0.28), Math.round(prot * 0.3), Math.round(fat * 0.35)),
    };

    if (info.activities) {
      if (i === 5) {
        // Long run day — add pre/during/post
        meals.pre_workout = mockMeal("bagel + honey", 65, 9, 2);
        meals.during_workout = mockMeal("maurten gel ×3 + lmnt", 90, 0, 0);
        meals.post_workout = mockMeal("chocolate milk + banana", 60, 15, 5);
      } else {
        meals.pre_workout = mockMeal("banana + peanut butter toast", 45, 8, 10);
        meals.post_workout = mockMeal("greek yogurt + granola", 35, 20, 8);
      }
    }

    days.push({ date, meals, day_note: info.note });
  }

  return {
    week_start: weekStart,
    iso_week: getISOWeek(new Date(weekStart)),
    iso_year: new Date(weekStart).getFullYear(),
    coach_strip: "High-carb week — long run Saturday (18 mi). Carbs ramp Wed–Sat.",
    approach_used: "b",
    days,
  };
}

/** Mock alternatives for a slot */
export function buildMockAlternatives(): MealAssembly[] {
  return [
    mockMeal("turkey + quinoa + spinach", 78, 45, 12),
    mockMeal("tuna + farro + avocado", 72, 40, 18),
    mockMeal("egg white omelette + whole grain toast", 55, 38, 14),
  ];
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
