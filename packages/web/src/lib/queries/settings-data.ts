/**
 * Settings data query — fetches all data needed for the /settings page.
 *
 * Source: 07_parallel_build_plans.md §1.14
 *
 * Runs server-side via getServerSupabase() so RLS applies.
 * Returns null gracefully if any section is missing (offline-first approach:
 * never throw on missing optional data, just render "--").
 */
import { getServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import dayjs from "dayjs";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type FoodPrefRow = Database["public"]["Tables"]["food_preferences"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type MacroTargetRow = Database["public"]["Tables"]["daily_macro_targets"]["Row"];

export interface SettingsData {
  profile: {
    email: string | null;
    height_feet: number | null;
    height_inches: number | null;
    weight_pounds: number | null;
    cycling_ftp_watts: number | null;
    swimming_css_seconds_per_100m: number | null;
  } | null;
  dietary: {
    dietary_preference: string | null;
    allergies: string[];
    gut_training_level: string | null;
    gi_sensitivity: string | null;
  } | null;
  food_preferences: {
    liked: { food_name: string; preference_level: number }[];
    disliked: { food_name: string; preference_level: number }[];
  };
  current_week_targets: {
    target_date: string;
    carb_g: number;
    prot_g: number;
    fat_g: number;
  }[];
  upcoming_activities: {
    id: string;
    scheduled_date_time: string;
    activity_type: string;
    title: string | null;
    duration_minutes: number | null;
    intensity_level: string | null;
    distance_miles: number | null;
  }[];
}

export async function fetchSettingsData(): Promise<SettingsData> {
  const supabase = await getServerSupabase();

  const today = dayjs().format("YYYY-MM-DD");
  const nextWeek = dayjs().add(7, "day").format("YYYY-MM-DD");

  // Run all queries in parallel, failing gracefully on each
  const [profileResult, prefsResult, targetsResult, activitiesResult] =
    await Promise.allSettled([
      supabase
        .from("users")
        .select(
          "email, height_feet, height_inches, weight_pounds, cycling_ftp_watts, swimming_css_seconds_per_100m, dietary_preference, allergies, gut_training_level, gi_sensitivity",
        )
        .single(),
      supabase
        .from("food_preferences")
        .select("food_name, preference, preference_level")
        .gt("preference_level", 0),
      supabase
        .from("daily_macro_targets")
        .select("target_date, carb_g, prot_g, fat_g")
        .gte("target_date", today)
        .lte("target_date", nextWeek)
        .order("target_date"),
      supabase
        .from("activities")
        .select(
          "id, scheduled_date_time, activity_type, title, duration_minutes, intensity_level, distance_miles",
        )
        .gte("scheduled_date_time", `${today}T00:00:00`)
        .lte("scheduled_date_time", `${nextWeek}T23:59:59`)
        .in("status", ["planned", "in_progress", "completed"])
        .order("scheduled_date_time"),
    ]);

  const profileData: UserRow | null =
    profileResult.status === "fulfilled" ? (profileResult.value.data as UserRow | null) : null;
  const prefsData: FoodPrefRow[] =
    prefsResult.status === "fulfilled" ? ((prefsResult.value.data as FoodPrefRow[] | null) ?? []) : [];
  const targetsData: MacroTargetRow[] =
    targetsResult.status === "fulfilled"
      ? ((targetsResult.value.data as MacroTargetRow[] | null) ?? [])
      : [];
  const activitiesData: ActivityRow[] =
    activitiesResult.status === "fulfilled"
      ? ((activitiesResult.value.data as ActivityRow[] | null) ?? [])
      : [];

  return {
    profile: profileData
      ? {
          email: profileData.email,
          height_feet: profileData.height_feet,
          height_inches: profileData.height_inches,
          weight_pounds: profileData.weight_pounds,
          cycling_ftp_watts: profileData.cycling_ftp_watts,
          swimming_css_seconds_per_100m: profileData.swimming_css_seconds_per_100m,
        }
      : null,
    dietary: profileData
      ? {
          dietary_preference: profileData.dietary_preference,
          allergies: profileData.allergies ?? [],
          gut_training_level: profileData.gut_training_level,
          gi_sensitivity: profileData.gi_sensitivity,
        }
      : null,
    food_preferences: {
      liked: prefsData
        .filter((p) => p.preference === "like")
        .map((p) => ({ food_name: p.food_name, preference_level: p.preference_level })),
      disliked: prefsData
        .filter((p) => p.preference === "dislike")
        .map((p) => ({ food_name: p.food_name, preference_level: p.preference_level })),
    },
    current_week_targets: targetsData,
    upcoming_activities: activitiesData,
  };
}
