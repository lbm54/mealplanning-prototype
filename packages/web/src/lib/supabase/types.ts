/**
 * Supabase TypeScript types — auto-generated stub.
 *
 * This file is normally generated via:
 *   SUPABASE_PROJECT_ID=<id> pnpm supabase:types
 *
 * The stub below provides the minimum types needed for TypeScript to compile
 * without a live Supabase connection. See MANUAL_STEPS.md §8 for how to
 * regenerate from the real schema.
 *
 * DO NOT hand-edit this file after it is generated from Supabase — run the
 * generation command instead.
 */

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          height_feet: number | null;
          height_inches: number | null;
          weight_pounds: number | null;
          cycling_ftp_watts: number | null;
          swimming_css_seconds_per_100m: number | null;
          dietary_preference: string | null;
          allergies: string[] | null;
          gut_training_level: string | null;
          gi_sensitivity: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      food_preferences: {
        Row: {
          id: string;
          user_id: string;
          food_id: string | null;
          food_name: string;
          preference: "like" | "dislike";
          preference_level: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["food_preferences"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["food_preferences"]["Row"]>;
      };
      foods: {
        Row: {
          id: string;
          name: string;
          carbs_g: number | null;
          protein_g: number | null;
          fat_g: number | null;
          sodium_mg: number | null;
          serving_size: string | null;
          category: string | null;
          excluded_diets: string[] | null;
          allergens: string[] | null;
          product_type: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["foods"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["foods"]["Row"]>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          scheduled_date_time: string;
          activity_type: string;
          title: string | null;
          duration_minutes: number | null;
          intensity_level: string | null;
          distance_miles: number | null;
          status: string;
          created_at: string;
          updated_at: string;
          needs_upload: boolean | null;
          synced_from_provider: string | null;
          provider_workout_id: string | null;
          brick_segments: Json | null;
        };
        Insert: Partial<Database["public"]["Tables"]["activities"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["activities"]["Row"]>;
      };
      daily_macro_targets: {
        Row: {
          id: string;
          user_id: string;
          target_date: string;
          carb_g: number;
          prot_g: number;
          fat_g: number;
          tdee: number | null;
          session_kcal: number | null;
          ea_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["daily_macro_targets"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["daily_macro_targets"]["Row"]>;
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          iso_week: number;
          iso_year: number;
          coach_strip: string | null;
          approach_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meal_plans"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["meal_plans"]["Row"]>;
      };
      meal_plan_meals: {
        Row: {
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
          components_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meal_plan_meals"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["meal_plan_meals"]["Row"]>;
      };
      pre_workout_templates: {
        Row: {
          id: string;
          user_id: string | null;
          activity_type: string | null;
          title: string;
          components_json: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pre_workout_templates"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["pre_workout_templates"]["Row"]>;
      };
      during_workout_templates: {
        Row: {
          id: string;
          user_id: string | null;
          activity_type: string | null;
          title: string;
          components_json: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["during_workout_templates"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["during_workout_templates"]["Row"]>;
      };
      post_workout_templates: {
        Row: {
          id: string;
          user_id: string | null;
          activity_type: string | null;
          title: string;
          components_json: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["post_workout_templates"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["post_workout_templates"]["Row"]>;
      };
      jade_calls: {
        Row: {
          id: string;
          user_id: string | null;
          surface: string | null;
          kind: string | null;
          tokens_in: number | null;
          tokens_out: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jade_calls"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["jade_calls"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
