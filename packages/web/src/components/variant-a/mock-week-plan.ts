/**
 * Mock WeekPlan — used when AI_GATEWAY_API_KEY / OPENAI_API_KEY is not set.
 *
 * TODO: Remove this file and wire the real /api/jade/object endpoint
 * once AI keys are configured. See gateway.ts for setup instructions.
 *
 * This data mirrors the WeekPlan Zod schema from server/jade/schema.ts.
 */
import type { WeekPlan, DayPlan } from "@/server/jade/schema";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export function getMockWeekPlan(weekStart: string): WeekPlan {
  const mon = dayjs(weekStart);

  const days: DayPlan[] = [
    {
      date: mon.format("YYYY-MM-DD"),
      day_note: "Rest day — light carbs.",
      meals: {
        breakfast: { title: "oats + banana + almond butter", method_tag: "stovetop · 5-min", components: [{ food_id: "00000000-0000-0000-0000-000000000001", name: "rolled oats", portion: "1 cup", carb_g: 54, protein_g: 6, fat_g: 3 }, { food_id: "00000000-0000-0000-0000-000000000002", name: "banana", portion: "1 medium", carb_g: 27, protein_g: 1, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000003", name: "almond butter", portion: "2 tbsp", carb_g: 6, protein_g: 7, fat_g: 18 }], totals: { carb_g: 87, protein_g: 14, fat_g: 21 } },
        lunch: { title: "chicken + brown rice + broccoli", method_tag: "grilled · 10-min assembly", components: [{ food_id: "00000000-0000-0000-0000-000000000004", name: "grilled chicken breast", portion: "6 oz", carb_g: 0, protein_g: 53, fat_g: 6 }, { food_id: "00000000-0000-0000-0000-000000000005", name: "brown rice", portion: "1 cup cooked", carb_g: 45, protein_g: 5, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000006", name: "roasted broccoli", portion: "2 cups", carb_g: 12, protein_g: 5, fat_g: 3 }], totals: { carb_g: 57, protein_g: 63, fat_g: 11 } },
        dinner: { title: "salmon + sweet potato + asparagus", method_tag: "baked · 20-min", components: [{ food_id: "00000000-0000-0000-0000-000000000007", name: "baked salmon", portion: "6 oz", carb_g: 0, protein_g: 40, fat_g: 20 }, { food_id: "00000000-0000-0000-0000-000000000008", name: "sweet potato", portion: "1 medium", carb_g: 37, protein_g: 3, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000009", name: "asparagus", portion: "1 cup", carb_g: 7, protein_g: 4, fat_g: 0 }], totals: { carb_g: 44, protein_g: 47, fat_g: 20 } },
        snack: null,
      },
    },
    {
      date: mon.add(1, "day").format("YYYY-MM-DD"),
      day_note: "Easy run — moderate carbs.",
      meals: {
        breakfast: { title: "eggs + toast + avocado", method_tag: "scrambled · 10-min", components: [{ food_id: "00000000-0000-0000-0000-000000000010", name: "eggs", portion: "3 large", carb_g: 2, protein_g: 18, fat_g: 15 }, { food_id: "00000000-0000-0000-0000-000000000011", name: "whole grain toast", portion: "2 slices", carb_g: 30, protein_g: 7, fat_g: 3 }, { food_id: "00000000-0000-0000-0000-000000000012", name: "avocado", portion: "1/2 medium", carb_g: 6, protein_g: 1, fat_g: 15 }], totals: { carb_g: 38, protein_g: 26, fat_g: 33 } },
        pre_workout: { title: "bagel + honey", method_tag: "no-cook · 2-min", components: [{ food_id: "00000000-0000-0000-0000-000000000013", name: "plain bagel", portion: "1 medium", carb_g: 57, protein_g: 10, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000014", name: "honey", portion: "1 tbsp", carb_g: 17, protein_g: 0, fat_g: 0 }], totals: { carb_g: 74, protein_g: 10, fat_g: 2 } },
        lunch: { title: "turkey wrap + side salad", method_tag: "no-cook · 5-min", components: [{ food_id: "00000000-0000-0000-0000-000000000015", name: "whole wheat tortilla", portion: "1 large", carb_g: 42, protein_g: 8, fat_g: 5 }, { food_id: "00000000-0000-0000-0000-000000000016", name: "sliced turkey", portion: "4 oz", carb_g: 2, protein_g: 28, fat_g: 3 }], totals: { carb_g: 60, protein_g: 36, fat_g: 8 } },
        dinner: { title: "pasta + ground turkey + marinara", method_tag: "stovetop · 15-min", components: [{ food_id: "00000000-0000-0000-0000-000000000017", name: "whole wheat pasta", portion: "2 cups cooked", carb_g: 74, protein_g: 14, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000018", name: "ground turkey", portion: "4 oz", carb_g: 0, protein_g: 28, fat_g: 10 }], totals: { carb_g: 80, protein_g: 42, fat_g: 12 } },
        snack: null,
      },
    },
    {
      date: mon.add(2, "day").format("YYYY-MM-DD"),
      day_note: "Tempo run — high carbs to fuel intensity.",
      meals: {
        breakfast: { title: "oats + berries + almond butter + milk", method_tag: "stovetop · 5-min", components: [{ food_id: "00000000-0000-0000-0000-000000000001", name: "rolled oats", portion: "1.5 cups", carb_g: 81, protein_g: 9, fat_g: 5 }, { food_id: "00000000-0000-0000-0000-000000000019", name: "mixed berries", portion: "1 cup", carb_g: 21, protein_g: 1, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000003", name: "almond butter", portion: "2 tbsp", carb_g: 6, protein_g: 7, fat_g: 18 }], totals: { carb_g: 108, protein_g: 17, fat_g: 23 } },
        pre_workout: { title: "bagel + jam", method_tag: "no-cook · 2-min", components: [{ food_id: "00000000-0000-0000-0000-000000000013", name: "plain bagel", portion: "1 large", carb_g: 66, protein_g: 12, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000020", name: "strawberry jam", portion: "2 tbsp", carb_g: 26, protein_g: 0, fat_g: 0 }], totals: { carb_g: 92, protein_g: 12, fat_g: 2 } },
        during_workout: { title: "maurten gel ×2 + water", method_tag: "during · carry", components: [{ food_id: "00000000-0000-0000-0000-000000000021", name: "Maurten Gel 100", portion: "2 gels", carb_g: 50, protein_g: 0, fat_g: 0 }], totals: { carb_g: 50, protein_g: 0, fat_g: 0 } },
        post_workout: { title: "choc milk + banana", method_tag: "ready-to-drink · 2-min", components: [{ food_id: "00000000-0000-0000-0000-000000000022", name: "chocolate milk", portion: "16 oz", carb_g: 52, protein_g: 16, fat_g: 5 }, { food_id: "00000000-0000-0000-0000-000000000002", name: "banana", portion: "1 large", carb_g: 31, protein_g: 1, fat_g: 0 }], totals: { carb_g: 83, protein_g: 17, fat_g: 5 } },
        lunch: { title: "rice + chicken + roasted veg", method_tag: "meal-prep · 5-min reheat", components: [{ food_id: "00000000-0000-0000-0000-000000000023", name: "jasmine rice", portion: "1.5 cups cooked", carb_g: 68, protein_g: 6, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000004", name: "grilled chicken", portion: "5 oz", carb_g: 0, protein_g: 44, fat_g: 5 }], totals: { carb_g: 75, protein_g: 50, fat_g: 5 } },
        dinner: { title: "steak + mashed potato + green beans", method_tag: "pan-seared · 20-min", components: [{ food_id: "00000000-0000-0000-0000-000000000024", name: "lean sirloin steak", portion: "6 oz", carb_g: 0, protein_g: 48, fat_g: 14 }, { food_id: "00000000-0000-0000-0000-000000000025", name: "mashed potato", portion: "1 cup", carb_g: 36, protein_g: 4, fat_g: 4 }], totals: { carb_g: 42, protein_g: 52, fat_g: 18 } },
        snack: { title: "greek yogurt + honey", method_tag: "no-cook · 1-min", components: [{ food_id: "00000000-0000-0000-0000-000000000026", name: "greek yogurt", portion: "1 cup", carb_g: 9, protein_g: 23, fat_g: 0 }], totals: { carb_g: 17, protein_g: 23, fat_g: 0 } },
      },
    },
    {
      date: mon.add(3, "day").format("YYYY-MM-DD"),
      day_note: "Easy recovery — moderate intake.",
      meals: {
        breakfast: { title: "eggs + toast + avocado", method_tag: "scrambled · 10-min", components: [{ food_id: "00000000-0000-0000-0000-000000000010", name: "eggs", portion: "3 large", carb_g: 2, protein_g: 18, fat_g: 15 }, { food_id: "00000000-0000-0000-0000-000000000011", name: "whole grain toast", portion: "2 slices", carb_g: 30, protein_g: 7, fat_g: 3 }], totals: { carb_g: 38, protein_g: 25, fat_g: 18 } },
        lunch: { title: "tuna bowl + quinoa + cucumber", method_tag: "no-cook · 5-min", components: [{ food_id: "00000000-0000-0000-0000-000000000027", name: "canned tuna", portion: "5 oz", carb_g: 0, protein_g: 34, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000028", name: "quinoa", portion: "1 cup cooked", carb_g: 39, protein_g: 8, fat_g: 4 }], totals: { carb_g: 55, protein_g: 42, fat_g: 6 } },
        dinner: { title: "salmon + rice + broccoli", method_tag: "baked · 20-min", components: [{ food_id: "00000000-0000-0000-0000-000000000007", name: "baked salmon", portion: "5 oz", carb_g: 0, protein_g: 34, fat_g: 17 }, { food_id: "00000000-0000-0000-0000-000000000023", name: "jasmine rice", portion: "1 cup cooked", carb_g: 45, protein_g: 4, fat_g: 0 }], totals: { carb_g: 52, protein_g: 38, fat_g: 17 } },
        snack: null,
      },
    },
    {
      date: mon.add(4, "day").format("YYYY-MM-DD"),
      day_note: "Short shake-out — moderate carbs, no GI stress.",
      meals: {
        breakfast: { title: "pancakes + maple syrup + eggs", method_tag: "stovetop · 10-min", components: [{ food_id: "00000000-0000-0000-0000-000000000029", name: "buckwheat pancakes", portion: "3 medium", carb_g: 63, protein_g: 9, fat_g: 6 }, { food_id: "00000000-0000-0000-0000-000000000030", name: "maple syrup", portion: "2 tbsp", carb_g: 26, protein_g: 0, fat_g: 0 }], totals: { carb_g: 95, protein_g: 11, fat_g: 6 } },
        pre_workout: { title: "rice cake + peanut butter", method_tag: "no-cook · 2-min", components: [{ food_id: "00000000-0000-0000-0000-000000000031", name: "rice cakes", portion: "2 cakes", carb_g: 28, protein_g: 2, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000032", name: "peanut butter", portion: "1 tbsp", carb_g: 3, protein_g: 4, fat_g: 8 }], totals: { carb_g: 31, protein_g: 6, fat_g: 8 } },
        lunch: { title: "chicken + sweet potato + salad", method_tag: "meal-prep · 5-min reheat", components: [{ food_id: "00000000-0000-0000-0000-000000000004", name: "grilled chicken", portion: "6 oz", carb_g: 0, protein_g: 53, fat_g: 6 }, { food_id: "00000000-0000-0000-0000-000000000008", name: "sweet potato", portion: "1 medium", carb_g: 37, protein_g: 3, fat_g: 0 }], totals: { carb_g: 58, protein_g: 56, fat_g: 6 } },
        dinner: { title: "pasta + shrimp + olive oil + garlic", method_tag: "stovetop · 15-min", components: [{ food_id: "00000000-0000-0000-0000-000000000017", name: "whole wheat pasta", portion: "2 cups cooked", carb_g: 74, protein_g: 14, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000033", name: "shrimp", portion: "5 oz", carb_g: 1, protein_g: 31, fat_g: 2 }], totals: { carb_g: 80, protein_g: 45, fat_g: 4 } },
        snack: { title: "greek yogurt + granola", method_tag: "no-cook · 1-min", components: [{ food_id: "00000000-0000-0000-0000-000000000026", name: "greek yogurt", portion: "1 cup", carb_g: 9, protein_g: 23, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000034", name: "granola", portion: "1/4 cup", carb_g: 30, protein_g: 4, fat_g: 5 }], totals: { carb_g: 39, protein_g: 27, fat_g: 5 } },
      },
    },
    {
      // Saturday — key long workout day
      date: mon.add(5, "day").format("YYYY-MM-DD"),
      day_note: "Long run — max carbs. PRE/DURING/POST are load-bearing.",
      meals: {
        breakfast: { title: "3 eggs + oats + berries", method_tag: "stovetop · 10-min", components: [{ food_id: "00000000-0000-0000-0000-000000000010", name: "eggs", portion: "3 large", carb_g: 2, protein_g: 18, fat_g: 15 }, { food_id: "00000000-0000-0000-0000-000000000001", name: "rolled oats", portion: "1 cup", carb_g: 54, protein_g: 6, fat_g: 3 }], totals: { carb_g: 72, protein_g: 28, fat_g: 18 } },
        pre_workout: { title: "bagel + honey + banana", method_tag: "no-cook · 2-min", components: [{ food_id: "00000000-0000-0000-0000-000000000013", name: "plain bagel", portion: "1 large", carb_g: 66, protein_g: 12, fat_g: 2 }, { food_id: "00000000-0000-0000-0000-000000000014", name: "honey", portion: "2 tbsp", carb_g: 34, protein_g: 0, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000002", name: "banana", portion: "1 medium", carb_g: 27, protein_g: 1, fat_g: 0 }], totals: { carb_g: 127, protein_g: 13, fat_g: 2 } },
        during_workout: { title: "maurten gel ×4 + LMNT electrolyte", method_tag: "during · carry", components: [{ food_id: "00000000-0000-0000-0000-000000000021", name: "Maurten Gel 100", portion: "4 gels", carb_g: 100, protein_g: 0, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000035", name: "LMNT electrolyte", portion: "2 packets", carb_g: 2, protein_g: 0, fat_g: 0 }], totals: { carb_g: 102, protein_g: 0, fat_g: 0 } },
        post_workout: { title: "choc milk + protein shake + banana", method_tag: "ready-to-drink · 2-min", components: [{ food_id: "00000000-0000-0000-0000-000000000022", name: "chocolate milk", portion: "16 oz", carb_g: 52, protein_g: 16, fat_g: 5 }, { food_id: "00000000-0000-0000-0000-000000000036", name: "whey protein", portion: "1 scoop", carb_g: 3, protein_g: 25, fat_g: 1 }, { food_id: "00000000-0000-0000-0000-000000000002", name: "banana", portion: "1 large", carb_g: 31, protein_g: 1, fat_g: 0 }], totals: { carb_g: 86, protein_g: 42, fat_g: 6 } },
        lunch: { title: "rice + chicken + roasted veg + extra rice", method_tag: "meal-prep · 5-min reheat", components: [{ food_id: "00000000-0000-0000-0000-000000000023", name: "jasmine rice", portion: "2 cups cooked", carb_g: 90, protein_g: 8, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000004", name: "grilled chicken", portion: "6 oz", carb_g: 0, protein_g: 53, fat_g: 6 }], totals: { carb_g: 95, protein_g: 61, fat_g: 6 } },
        dinner: { title: "steak + pasta + salad", method_tag: "pan-seared + stovetop · 20-min", components: [{ food_id: "00000000-0000-0000-0000-000000000024", name: "lean sirloin steak", portion: "8 oz", carb_g: 0, protein_g: 64, fat_g: 18 }, { food_id: "00000000-0000-0000-0000-000000000017", name: "whole wheat pasta", portion: "1.5 cups cooked", carb_g: 55, protein_g: 10, fat_g: 1 }], totals: { carb_g: 62, protein_g: 74, fat_g: 19 } },
        snack: { title: "greek yogurt + honey + granola", method_tag: "no-cook · 1-min", components: [{ food_id: "00000000-0000-0000-0000-000000000026", name: "greek yogurt", portion: "1 cup", carb_g: 9, protein_g: 23, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000034", name: "granola", portion: "1/3 cup", carb_g: 40, protein_g: 5, fat_g: 7 }], totals: { carb_g: 49, protein_g: 28, fat_g: 7 } },
      },
    },
    {
      date: mon.add(6, "day").format("YYYY-MM-DD"),
      day_note: "Sunday swim — light to moderate. Focus protein for recovery.",
      meals: {
        breakfast: { title: "oats + banana + milk", method_tag: "stovetop · 5-min", components: [{ food_id: "00000000-0000-0000-0000-000000000001", name: "rolled oats", portion: "1 cup", carb_g: 54, protein_g: 6, fat_g: 3 }, { food_id: "00000000-0000-0000-0000-000000000002", name: "banana", portion: "1 medium", carb_g: 27, protein_g: 1, fat_g: 0 }], totals: { carb_g: 81, protein_g: 7, fat_g: 3 } },
        pre_workout: { title: "rice cake + banana", method_tag: "no-cook · 1-min", components: [{ food_id: "00000000-0000-0000-0000-000000000031", name: "rice cakes", portion: "2 cakes", carb_g: 28, protein_g: 2, fat_g: 0 }, { food_id: "00000000-0000-0000-0000-000000000002", name: "banana", portion: "1 small", carb_g: 23, protein_g: 1, fat_g: 0 }], totals: { carb_g: 51, protein_g: 3, fat_g: 0 } },
        lunch: { title: "chicken bowl + quinoa + roasted veg", method_tag: "meal-prep · 5-min reheat", components: [{ food_id: "00000000-0000-0000-0000-000000000004", name: "grilled chicken", portion: "5 oz", carb_g: 0, protein_g: 44, fat_g: 5 }, { food_id: "00000000-0000-0000-0000-000000000028", name: "quinoa", portion: "1 cup cooked", carb_g: 39, protein_g: 8, fat_g: 4 }], totals: { carb_g: 55, protein_g: 52, fat_g: 9 } },
        dinner: { title: "salmon + sweet potato + asparagus", method_tag: "baked · 20-min", components: [{ food_id: "00000000-0000-0000-0000-000000000007", name: "baked salmon", portion: "6 oz", carb_g: 0, protein_g: 40, fat_g: 20 }, { food_id: "00000000-0000-0000-0000-000000000008", name: "sweet potato", portion: "1 medium", carb_g: 37, protein_g: 3, fat_g: 0 }], totals: { carb_g: 44, protein_g: 43, fat_g: 20 } },
        snack: null,
      },
    },
  ];

  return {
    week_start: weekStart,
    iso_week: dayjs(weekStart).isoWeek(),
    iso_year: dayjs(weekStart).isoWeekYear(),
    coach_strip: "High-carb week — long run Saturday (18 mi). Carbs ramp Mon → Sat.",
    rationale: "Saturday's long run is the anchor. Wednesday tempo is the secondary hard day. Carbs step up Wed and peak Sat; Sun drops back for recovery.",
    approach_used: "a",
    days,
  };
}

export function getMockSwapAlternatives(slot: string, _date: string) {
  const alternatives = [
    {
      title: "grilled salmon + farro + lemon asparagus",
      method_tag: "baked · 20-min",
      components: [
        { food_id: "00000000-0000-0000-0000-000000000007", name: "grilled salmon", portion: "6 oz", carb_g: 0, protein_g: 40, fat_g: 20 },
        { food_id: "00000000-0000-0000-0000-000000000037", name: "farro", portion: "1 cup cooked", carb_g: 46, protein_g: 8, fat_g: 2 },
        { food_id: "00000000-0000-0000-0000-000000000038", name: "lemon asparagus", portion: "1 cup", carb_g: 10, protein_g: 4, fat_g: 2 },
      ],
      totals: { carb_g: 56, protein_g: 52, fat_g: 24 },
    },
    {
      title: "turkey + sweet potato burrito bowl",
      method_tag: "stovetop · 15-min",
      components: [
        { food_id: "00000000-0000-0000-0000-000000000039", name: "ground turkey", portion: "5 oz", carb_g: 0, protein_g: 35, fat_g: 12 },
        { food_id: "00000000-0000-0000-0000-000000000008", name: "sweet potato", portion: "1 medium", carb_g: 37, protein_g: 3, fat_g: 0 },
        { food_id: "00000000-0000-0000-0000-000000000040", name: "black beans", portion: "1/2 cup", carb_g: 20, protein_g: 8, fat_g: 0 },
      ],
      totals: { carb_g: 57, protein_g: 46, fat_g: 12 },
    },
    {
      title: "tuna + quinoa power bowl + avocado",
      method_tag: "no-cook · 5-min",
      components: [
        { food_id: "00000000-0000-0000-0000-000000000027", name: "canned tuna", portion: "5 oz", carb_g: 0, protein_g: 34, fat_g: 2 },
        { food_id: "00000000-0000-0000-0000-000000000028", name: "quinoa", portion: "1 cup cooked", carb_g: 39, protein_g: 8, fat_g: 4 },
        { food_id: "00000000-0000-0000-0000-000000000012", name: "avocado", portion: "1/2 medium", carb_g: 6, protein_g: 1, fat_g: 15 },
      ],
      totals: { carb_g: 45, protein_g: 43, fat_g: 21 },
    },
  ];
  void slot;
  return alternatives;
}
