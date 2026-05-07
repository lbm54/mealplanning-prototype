/**
 * WeekPlan Zod schema — the structured output Jade produces.
 *
 * Source: 05_design_proposal.md §6.1, 06_five_uiux_approaches.md
 *
 * The model emits a WeekPlan; the client resolves food_ids to display data.
 * Every food_id must come from a prior listFoods/listTemplates tool call.
 */
import { z } from "zod";

export const MealSlotSchema = z.enum([
  "breakfast",
  "pre_workout",
  "during_workout",
  "post_workout",
  "lunch",
  "dinner",
  "snack",
]);
export type MealSlot = z.infer<typeof MealSlotSchema>;

export const FoodComponentSchema = z.object({
  /** UUID from foods table */
  food_id: z.string().uuid(),
  /** Human-readable name (resolved from foods.name) */
  name: z.string(),
  /** Portion description, e.g. "1 cup", "6 oz", "2 tbsp" */
  portion: z.string(),
  /** Serving weight in grams */
  weight_g: z.number().optional(),
  /** Macros for this component at stated portion */
  carb_g: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
});
export type FoodComponent = z.infer<typeof FoodComponentSchema>;

export const MealAssemblySchema = z.object({
  /** Internal ID — stable across regenerations for locking */
  id: z.string().optional(),
  /** Component-style title: "chicken + rice + broccoli" */
  title: z.string(),
  /** Short method note: "grilled · 5-min assembly" */
  method_tag: z.string().optional(),
  /** Components (never a recipe, always an ingredient assembly) */
  components: z.array(FoodComponentSchema),
  /** Template ID if this is a workout-phase slot */
  template_id: z.string().uuid().optional(),
  template_table: z.enum(["pre_workout_templates", "during_workout_templates", "post_workout_templates"]).optional(),
  /** Rolled-up totals for the whole assembly */
  totals: z.object({
    carb_g: z.number(),
    protein_g: z.number(),
    fat_g: z.number(),
    sodium_mg: z.number().optional(),
  }),
});
export type MealAssembly = z.infer<typeof MealAssemblySchema>;

export const DayPlanSchema = z.object({
  /** ISO date: 2026-05-06 */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Slots present on this day */
  meals: z.record(MealSlotSchema, MealAssemblySchema.nullable()).optional(),
  /** Jade's 1-sentence context for this day */
  day_note: z.string().optional(),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;

export const WeekPlanSchema = z.object({
  /** ISO week start date (Monday) */
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** ISO week number */
  iso_week: z.number().int(),
  /** ISO year */
  iso_year: z.number().int(),
  /** 1-line coach strip: "High-carb week — long run Saturday." */
  coach_strip: z.string().max(200),
  /** Jade's rationale for the overall plan structure */
  rationale: z.string().optional(),
  /** Approach used (a|b|c|d|e) */
  approach_used: z.enum(["a", "b", "c", "d", "e"]).optional(),
  /** 7 days, keyed by ISO date */
  days: z.array(DayPlanSchema).length(7),
});
export type WeekPlan = z.infer<typeof WeekPlanSchema>;

/** Swap result — 3 alternatives for a single slot */
export const MealSwapResultSchema = z.object({
  alternatives: z.array(MealAssemblySchema).length(3),
  swap_note: z.string().optional(),
});
export type MealSwapResult = z.infer<typeof MealSwapResultSchema>;

/** Per-slot change from a tweak operation */
export const MealChangeSchema = z.object({
  date: z.string(),
  slot: MealSlotSchema,
  new_meal: MealAssemblySchema,
  change_reason: z.string(),
});
export type MealChange = z.infer<typeof MealChangeSchema>;
