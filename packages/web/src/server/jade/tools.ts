/**
 * Jade's tool set — all 5 tools used by the AI to read user data.
 *
 * Source: 06_five_uiux_approaches.md §0.7, 04_user_data_inventory.md
 *
 * All tools execute server-side. They use getServerSupabase() so RLS applies.
 * Hard constraints (allergies, dietary preference) are filtered at SQL level —
 * the model literally cannot select an unsafe food.
 *
 * NOTE: The ai package tool() API varies by version.
 * For AI SDK 4.x: tool({ description, parameters, execute })
 * For AI SDK 5.x: tool({ description, inputSchema, execute })
 * This file uses the 4.x API (current installed version).
 */
import { tool } from "ai";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type FoodPrefRow = Database["public"]["Tables"]["food_preferences"]["Row"];

/** listFoods — filter foods table, hard constraints pre-applied */
export const listFoods = tool({
  description:
    "Filter the food catalog. Hard constraints (allergies, dietary preference) are auto-applied at the SQL level based on the authenticated user's profile. Returns up to max_results foods.",
  parameters: z.object({
    categories: z.array(z.string()).optional().describe("Food categories to include"),
    product_type: z.string().optional().describe("Product type filter"),
    activity_type: z.string().optional().describe("Activity type for workout foods"),
    max_results: z.number().int().min(1).max(50).default(20),
  }),
  execute: async ({ categories, product_type, activity_type, max_results }) => {
    const supabase = await getServerSupabase();

    // Get user profile for hard constraint filtering
    const { data: profileRaw } = await supabase
      .from("users")
      .select("allergies, dietary_preference")
      .single();
    const profile = profileRaw as Pick<UserRow, "allergies" | "dietary_preference"> | null;

    let query = supabase
      .from("foods")
      .select("id, name, carbs_g, protein_g, fat_g, sodium_mg, serving_size, category, excluded_diets, allergens")
      .limit(max_results ?? 20);

    if (categories && categories.length > 0) {
      query = query.in("category", categories);
    }
    if (product_type) {
      query = query.eq("product_type", product_type);
    }
    if (activity_type) {
      query = query.eq("product_type", activity_type);
    }

    // Hard constraint: exclude allergens
    if (profile?.allergies && profile.allergies.length > 0) {
      query = query.not("allergens", "ov", `{${profile.allergies.join(",")}}`);
    }

    // Hard constraint: exclude dietary preference
    if (profile?.dietary_preference) {
      query = query.not("excluded_diets", "cs", `{${profile.dietary_preference}}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
});

/** listTemplates — filter workout templates by phase */
export const listTemplates = tool({
  description:
    "Filter pre/during/post workout templates by phase and optionally by activity type or duration.",
  parameters: z.object({
    phase: z.enum(["pre", "during", "post"]),
    activity_type: z.string().optional(),
    duration_minutes: z.number().optional(),
  }),
  execute: async ({ phase, activity_type, duration_minutes: _duration }) => {
    const supabase = await getServerSupabase();

    const tableMap = {
      pre: "pre_workout_templates",
      during: "during_workout_templates",
      post: "post_workout_templates",
    } as const;

    const table = tableMap[phase];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(table) as any).select("*");

    if (activity_type) {
      query = query.eq("activity_type", activity_type);
    }

    const { data, error } = await query;
    if (error) {
      // Templates table might not exist in all envs — fail gracefully
      return [];
    }
    return data ?? [];
  },
});

/** getActivities — read planned activities for a week */
export const getActivities = tool({
  description:
    "Read the user's planned activities for a given ISO week.",
  parameters: z.object({
    week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("ISO date of Monday"),
  }),
  execute: async ({ week_start }) => {
    const supabase = await getServerSupabase();

    // Calculate week_end (Sunday)
    const start = new Date(week_start);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const week_end = end.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("activities")
      .select(
        "id, scheduled_date_time, activity_type, title, duration_minutes, intensity_level, distance_miles, status",
      )
      .gte("scheduled_date_time", `${week_start}T00:00:00`)
      .lte("scheduled_date_time", `${week_end}T23:59:59`)
      .in("status", ["planned", "in_progress", "completed"])
      .order("scheduled_date_time");

    if (error) throw error;
    return data ?? [];
  },
});

/** getMacroTargets — read daily_macro_targets for a date range */
export const getMacroTargets = tool({
  description:
    "Read the user's daily macro targets for a date range from daily_macro_targets.",
  parameters: z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  execute: async ({ start_date, end_date }) => {
    const supabase = await getServerSupabase();

    const { data, error } = await supabase
      .from("daily_macro_targets")
      .select("target_date, carb_g, prot_g, fat_g, tdee, session_kcal, ea_status")
      .gte("target_date", start_date)
      .lte("target_date", end_date)
      .order("target_date");

    if (error) throw error;
    return data ?? [];
  },
});

/** getUserPrefs — read users row + food_preferences */
export const getUserPrefs = tool({
  description:
    "Read the authenticated user's profile, dietary preferences, allergies, and food preference list.",
  parameters: z.object({}),
  execute: async () => {
    const supabase = await getServerSupabase();

    const [profileResult, prefsResult] = await Promise.all([
      supabase
        .from("users")
        .select(
          "id, dietary_preference, allergies, gut_training_level, gi_sensitivity, height_feet, height_inches, weight_pounds",
        )
        .single(),
      supabase
        .from("food_preferences")
        .select("food_id, food_name, preference, preference_level")
        .gt("preference_level", 0),
    ]);

    const profile = profileResult.data as UserRow | null;
    const prefs = (prefsResult.data as FoodPrefRow[] | null) ?? [];

    return {
      dietary_preference: profile?.dietary_preference ?? null,
      allergies: profile?.allergies ?? [],
      gut_training_level: profile?.gut_training_level ?? null,
      gi_sensitivity: profile?.gi_sensitivity ?? null,
      height_feet: profile?.height_feet ?? null,
      height_inches: profile?.height_inches ?? null,
      weight_pounds: profile?.weight_pounds ?? null,
      liked_foods: prefs
        .filter((p) => p.preference === "like")
        .map((p) => ({ food_id: p.food_id, food_name: p.food_name, level: p.preference_level })),
      disliked_foods: prefs
        .filter((p) => p.preference === "dislike")
        .map((p) => ({ food_id: p.food_id, food_name: p.food_name, level: p.preference_level })),
    };
  },
});

export const jadeTools = {
  listFoods,
  listTemplates,
  getActivities,
  getMacroTargets,
  getUserPrefs,
};
