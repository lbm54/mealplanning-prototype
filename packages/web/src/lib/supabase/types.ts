export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type_enum"]
          actual_distance_miles: number | null
          actual_duration_minutes: number | null
          actual_time: string | null
          average_heart_rate: number | null
          average_pace_minutes_per_mile: number | null
          brick_id: string | null
          brick_metadata: Json | null
          calories_burned: number | null
          completed_at: string | null
          completion_notes: string | null
          completion_rating: number | null
          completion_type: string | null
          created_at: string | null
          cycling_elevation_gain_ft: number | null
          cycling_ftp_watts: number | null
          cycling_indoor_outdoor:
            | Database["public"]["Enums"]["indoor_outdoor_enum"]
            | null
          cycling_power_watts: number | null
          cycling_session_goal:
            | Database["public"]["Enums"]["cycling_goal_enum"]
            | null
          cycling_speed_mph: number | null
          cycling_terrain:
            | Database["public"]["Enums"]["cycling_terrain_enum"]
            | null
          deleted_at: string | null
          distance_meters: number | null
          distance_miles: number | null
          duration_minutes: number | null
          effort_rating: number | null
          fuel_log_data: Json | null
          garmin_device_name: string | null
          garmin_last_synced_at: string | null
          garmin_summary_id: string | null
          has_voice_recording: boolean | null
          humidity_percent: number | null
          id: string
          intensity_level: Database["public"]["Enums"]["intensity_enum"] | null
          intensity_target: string | null
          intensity_z1_z2_pct: number | null
          intensity_z3_z4_pct: number | null
          intensity_z5_pct: number | null
          is_fasted: boolean
          last_synced_at: string | null
          local_updated_at: string | null
          max_heart_rate: number | null
          needs_nutrition_refresh: boolean
          needs_upload: boolean | null
          notes: string | null
          nutrition_adherence_score: number | null
          nutrition_plan_data: Json | null
          nutrition_rating: number | null
          overall_satisfaction: number | null
          pace_max_minutes_per_mile: number | null
          pace_min_minutes_per_mile: number | null
          pace_target_minutes_per_mile: number | null
          performance_vs_target: number | null
          planned_time: string | null
          provider_deleted_at: string | null
          provider_scheduled_at: string | null
          provider_workout_id: string | null
          provider_workout_url: string | null
          schedule_changed_at: string | null
          scheduled_date_time: string
          status: Database["public"]["Enums"]["activity_status_enum"] | null
          swimming_css_seconds_per_100m: number | null
          swimming_pace_per_100m_seconds: number | null
          swimming_pool_or_open_water: string | null
          swimming_speed_per_100m: number | null
          swimming_water_temp_c: number | null
          synced_from_provider: string | null
          temperature_fahrenheit: number | null
          time_before_minutes: number | null
          title: string
          tss: number | null
          updated_at: string | null
          user_id: string
          voice_note_id: string | null
          weather_conditions: string | null
          workout_subtype: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type_enum"]
          actual_distance_miles?: number | null
          actual_duration_minutes?: number | null
          actual_time?: string | null
          average_heart_rate?: number | null
          average_pace_minutes_per_mile?: number | null
          brick_id?: string | null
          brick_metadata?: Json | null
          calories_burned?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_rating?: number | null
          completion_type?: string | null
          created_at?: string | null
          cycling_elevation_gain_ft?: number | null
          cycling_ftp_watts?: number | null
          cycling_indoor_outdoor?:
            | Database["public"]["Enums"]["indoor_outdoor_enum"]
            | null
          cycling_power_watts?: number | null
          cycling_session_goal?:
            | Database["public"]["Enums"]["cycling_goal_enum"]
            | null
          cycling_speed_mph?: number | null
          cycling_terrain?:
            | Database["public"]["Enums"]["cycling_terrain_enum"]
            | null
          deleted_at?: string | null
          distance_meters?: number | null
          distance_miles?: number | null
          duration_minutes?: number | null
          effort_rating?: number | null
          fuel_log_data?: Json | null
          garmin_device_name?: string | null
          garmin_last_synced_at?: string | null
          garmin_summary_id?: string | null
          has_voice_recording?: boolean | null
          humidity_percent?: number | null
          id: string
          intensity_level?: Database["public"]["Enums"]["intensity_enum"] | null
          intensity_target?: string | null
          intensity_z1_z2_pct?: number | null
          intensity_z3_z4_pct?: number | null
          intensity_z5_pct?: number | null
          is_fasted?: boolean
          last_synced_at?: string | null
          local_updated_at?: string | null
          max_heart_rate?: number | null
          needs_nutrition_refresh?: boolean
          needs_upload?: boolean | null
          notes?: string | null
          nutrition_adherence_score?: number | null
          nutrition_plan_data?: Json | null
          nutrition_rating?: number | null
          overall_satisfaction?: number | null
          pace_max_minutes_per_mile?: number | null
          pace_min_minutes_per_mile?: number | null
          pace_target_minutes_per_mile?: number | null
          performance_vs_target?: number | null
          planned_time?: string | null
          provider_deleted_at?: string | null
          provider_scheduled_at?: string | null
          provider_workout_id?: string | null
          provider_workout_url?: string | null
          schedule_changed_at?: string | null
          scheduled_date_time: string
          status?: Database["public"]["Enums"]["activity_status_enum"] | null
          swimming_css_seconds_per_100m?: number | null
          swimming_pace_per_100m_seconds?: number | null
          swimming_pool_or_open_water?: string | null
          swimming_speed_per_100m?: number | null
          swimming_water_temp_c?: number | null
          synced_from_provider?: string | null
          temperature_fahrenheit?: number | null
          time_before_minutes?: number | null
          title: string
          tss?: number | null
          updated_at?: string | null
          user_id: string
          voice_note_id?: string | null
          weather_conditions?: string | null
          workout_subtype?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type_enum"]
          actual_distance_miles?: number | null
          actual_duration_minutes?: number | null
          actual_time?: string | null
          average_heart_rate?: number | null
          average_pace_minutes_per_mile?: number | null
          brick_id?: string | null
          brick_metadata?: Json | null
          calories_burned?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_rating?: number | null
          completion_type?: string | null
          created_at?: string | null
          cycling_elevation_gain_ft?: number | null
          cycling_ftp_watts?: number | null
          cycling_indoor_outdoor?:
            | Database["public"]["Enums"]["indoor_outdoor_enum"]
            | null
          cycling_power_watts?: number | null
          cycling_session_goal?:
            | Database["public"]["Enums"]["cycling_goal_enum"]
            | null
          cycling_speed_mph?: number | null
          cycling_terrain?:
            | Database["public"]["Enums"]["cycling_terrain_enum"]
            | null
          deleted_at?: string | null
          distance_meters?: number | null
          distance_miles?: number | null
          duration_minutes?: number | null
          effort_rating?: number | null
          fuel_log_data?: Json | null
          garmin_device_name?: string | null
          garmin_last_synced_at?: string | null
          garmin_summary_id?: string | null
          has_voice_recording?: boolean | null
          humidity_percent?: number | null
          id?: string
          intensity_level?: Database["public"]["Enums"]["intensity_enum"] | null
          intensity_target?: string | null
          intensity_z1_z2_pct?: number | null
          intensity_z3_z4_pct?: number | null
          intensity_z5_pct?: number | null
          is_fasted?: boolean
          last_synced_at?: string | null
          local_updated_at?: string | null
          max_heart_rate?: number | null
          needs_nutrition_refresh?: boolean
          needs_upload?: boolean | null
          notes?: string | null
          nutrition_adherence_score?: number | null
          nutrition_plan_data?: Json | null
          nutrition_rating?: number | null
          overall_satisfaction?: number | null
          pace_max_minutes_per_mile?: number | null
          pace_min_minutes_per_mile?: number | null
          pace_target_minutes_per_mile?: number | null
          performance_vs_target?: number | null
          planned_time?: string | null
          provider_deleted_at?: string | null
          provider_scheduled_at?: string | null
          provider_workout_id?: string | null
          provider_workout_url?: string | null
          schedule_changed_at?: string | null
          scheduled_date_time?: string
          status?: Database["public"]["Enums"]["activity_status_enum"] | null
          swimming_css_seconds_per_100m?: number | null
          swimming_pace_per_100m_seconds?: number | null
          swimming_pool_or_open_water?: string | null
          swimming_speed_per_100m?: number | null
          swimming_water_temp_c?: number | null
          synced_from_provider?: string | null
          temperature_fahrenheit?: number | null
          time_before_minutes?: number | null
          title?: string
          tss?: number | null
          updated_at?: string | null
          user_id?: string
          voice_note_id?: string | null
          weather_conditions?: string | null
          workout_subtype?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_brick_id"
            columns: ["brick_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          cost_usd: number | null
          created_at: string
          function_name: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          function_name: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          function_name?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      app_content: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          environment: string
          id: string
          is_active: boolean
          locale: string
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          locale?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          locale?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      athlete_pairing_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          used_by_coach_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used_at?: string | null
          used_by_coach_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by_coach_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      carb_loading_day_meals: {
        Row: {
          carb_loading_day_id: string | null
          carb_loading_food_id: string | null
          carb_loading_plan_id: string
          carb_loading_user_food_id: string | null
          carbs_consumed: number
          created_at: string | null
          food_display_name: string | null
          id: string
          meal_type: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          carb_loading_day_id?: string | null
          carb_loading_food_id?: string | null
          carb_loading_plan_id: string
          carb_loading_user_food_id?: string | null
          carbs_consumed: number
          created_at?: string | null
          food_display_name?: string | null
          id?: string
          meal_type: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          carb_loading_day_id?: string | null
          carb_loading_food_id?: string | null
          carb_loading_plan_id?: string
          carb_loading_user_food_id?: string | null
          carbs_consumed?: number
          created_at?: string | null
          food_display_name?: string | null
          id?: string
          meal_type?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carb_loading_day_meals_carb_loading_food_id_fkey"
            columns: ["carb_loading_food_id"]
            isOneToOne: false
            referencedRelation: "carb_loading_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carb_loading_day_meals_carb_loading_user_food_id_fkey"
            columns: ["carb_loading_user_food_id"]
            isOneToOne: false
            referencedRelation: "carb_loading_user_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carb_loading_day_meals_day_fk"
            columns: ["carb_loading_day_id"]
            isOneToOne: false
            referencedRelation: "carb_loading_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carb_loading_day_meals_plan_fk"
            columns: ["carb_loading_plan_id"]
            isOneToOne: false
            referencedRelation: "carb_loading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      carb_loading_days: {
        Row: {
          afternoon_snack_percent: number | null
          breakfast_percent: number | null
          calorie_target: number | null
          carb_loading_plan_id: string | null
          carb_protocol_g_per_kg: number
          carb_target_grams: number
          completed: boolean | null
          day_number: number
          dinner_percent: number | null
          evening_snack_percent: number | null
          id: string
          local_updated_at: string | null
          logged_calories: number | null
          logged_carbs_grams: number | null
          lunch_percent: number | null
          meal_count: number | null
          morning_snack_percent: number | null
          needs_upload: boolean | null
          plan_date: string
          updated_at: string | null
        }
        Insert: {
          afternoon_snack_percent?: number | null
          breakfast_percent?: number | null
          calorie_target?: number | null
          carb_loading_plan_id?: string | null
          carb_protocol_g_per_kg?: number
          carb_target_grams: number
          completed?: boolean | null
          day_number: number
          dinner_percent?: number | null
          evening_snack_percent?: number | null
          id: string
          local_updated_at?: string | null
          logged_calories?: number | null
          logged_carbs_grams?: number | null
          lunch_percent?: number | null
          meal_count?: number | null
          morning_snack_percent?: number | null
          needs_upload?: boolean | null
          plan_date: string
          updated_at?: string | null
        }
        Update: {
          afternoon_snack_percent?: number | null
          breakfast_percent?: number | null
          calorie_target?: number | null
          carb_loading_plan_id?: string | null
          carb_protocol_g_per_kg?: number
          carb_target_grams?: number
          completed?: boolean | null
          day_number?: number
          dinner_percent?: number | null
          evening_snack_percent?: number | null
          id?: string
          local_updated_at?: string | null
          logged_calories?: number | null
          logged_carbs_grams?: number | null
          lunch_percent?: number | null
          meal_count?: number | null
          morning_snack_percent?: number | null
          needs_upload?: boolean | null
          plan_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carb_loading_days_plan_fk"
            columns: ["carb_loading_plan_id"]
            isOneToOne: false
            referencedRelation: "carb_loading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      carb_loading_foods: {
        Row: {
          carbs_per_serving: number
          created_at: string | null
          display_name: string
          display_name_plural: string | null
          id: string
          image_address: string | null
          is_default: boolean | null
          meal_types: string[]
          name: string
          updated_at: string | null
        }
        Insert: {
          carbs_per_serving: number
          created_at?: string | null
          display_name: string
          display_name_plural?: string | null
          id?: string
          image_address?: string | null
          is_default?: boolean | null
          meal_types?: string[]
          name: string
          updated_at?: string | null
        }
        Update: {
          carbs_per_serving?: number
          created_at?: string | null
          display_name?: string
          display_name_plural?: string | null
          id?: string
          image_address?: string | null
          is_default?: boolean | null
          meal_types?: string[]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      carb_loading_plans: {
        Row: {
          adherence_score: number | null
          algorithm_version: string | null
          completed_at: string | null
          daily_calorie_target: number | null
          daily_carb_target_grams: number
          end_date: string
          event_id: string | null
          generated_at: string
          id: string
          local_updated_at: string | null
          needs_upload: boolean | null
          start_date: string
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adherence_score?: number | null
          algorithm_version?: string | null
          completed_at?: string | null
          daily_calorie_target?: number | null
          daily_carb_target_grams: number
          end_date: string
          event_id?: string | null
          generated_at: string
          id: string
          local_updated_at?: string | null
          needs_upload?: boolean | null
          start_date: string
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adherence_score?: number | null
          algorithm_version?: string | null
          completed_at?: string | null
          daily_calorie_target?: number | null
          daily_carb_target_grams?: number
          end_date?: string
          event_id?: string | null
          generated_at?: string
          id?: string
          local_updated_at?: string | null
          needs_upload?: boolean | null
          start_date?: string
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carb_loading_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_carb_loading_plans_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      carb_loading_user_foods: {
        Row: {
          barcode: string | null
          carbs_per_serving: number
          client_food_id: string | null
          created_at: string | null
          device_id: string
          display_name: string
          display_name_plural: string | null
          id: string
          image_address: string | null
          is_deleted: boolean | null
          meal_types: string[]
          name: string
          source_food_id: string | null
          source_user_food_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          carbs_per_serving: number
          client_food_id?: string | null
          created_at?: string | null
          device_id: string
          display_name: string
          display_name_plural?: string | null
          id?: string
          image_address?: string | null
          is_deleted?: boolean | null
          meal_types?: string[]
          name: string
          source_food_id?: string | null
          source_user_food_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          carbs_per_serving?: number
          client_food_id?: string | null
          created_at?: string | null
          device_id?: string
          display_name?: string
          display_name_plural?: string | null
          id?: string
          image_address?: string | null
          is_deleted?: boolean | null
          meal_types?: string[]
          name?: string
          source_food_id?: string | null
          source_user_food_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carb_loading_user_foods_source_food_id_fkey"
            columns: ["source_food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carb_loading_user_foods_source_food_id_fkey"
            columns: ["source_food_id"]
            isOneToOne: false
            referencedRelation: "v_food_sport_phase_settings"
            referencedColumns: ["food_id"]
          },
          {
            foreignKeyName: "carb_loading_user_foods_source_user_food_id_fkey"
            columns: ["source_user_food_id"]
            isOneToOne: false
            referencedRelation: "user_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carb_loading_user_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_carb_loading_user_foods_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_products: {
        Row: {
          activity_types: string[] | null
          allergens: string[] | null
          brand: string | null
          categories: string[] | null
          classification_confidence: number | null
          classification_source: string | null
          classified_at: string | null
          created_at: string
          excluded_diets: string[] | null
          handle: string
          id: string
          image_url: string | null
          ingredients: string | null
          is_electrolyte: boolean
          is_liquid: boolean
          product_type_id: string | null
          product_url: string | null
          shopify_product_id: string
          shopify_product_type: string | null
          shopify_updated_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_types?: string[] | null
          allergens?: string[] | null
          brand?: string | null
          categories?: string[] | null
          classification_confidence?: number | null
          classification_source?: string | null
          classified_at?: string | null
          created_at?: string
          excluded_diets?: string[] | null
          handle: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_electrolyte?: boolean
          is_liquid?: boolean
          product_type_id?: string | null
          product_url?: string | null
          shopify_product_id: string
          shopify_product_type?: string | null
          shopify_updated_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_types?: string[] | null
          allergens?: string[] | null
          brand?: string | null
          categories?: string[] | null
          classification_confidence?: number | null
          classification_source?: string | null
          classified_at?: string | null
          created_at?: string
          excluded_diets?: string[] | null
          handle?: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_electrolyte?: boolean
          is_liquid?: boolean
          product_type_id?: string | null
          product_url?: string | null
          shopify_product_id?: string
          shopify_product_type?: string | null
          shopify_updated_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_sync_runs: {
        Row: {
          completed_at: string | null
          errors: Json | null
          id: string
          nutrition_enriched: number | null
          nutrition_failed: number | null
          script_version: string | null
          started_at: string
          status: string
          total_products_fetched: number | null
          variants_imported: number | null
          variants_skipped: number | null
        }
        Insert: {
          completed_at?: string | null
          errors?: Json | null
          id?: string
          nutrition_enriched?: number | null
          nutrition_failed?: number | null
          script_version?: string | null
          started_at?: string
          status?: string
          total_products_fetched?: number | null
          variants_imported?: number | null
          variants_skipped?: number | null
        }
        Update: {
          completed_at?: string | null
          errors?: Json | null
          id?: string
          nutrition_enriched?: number | null
          nutrition_failed?: number | null
          script_version?: string | null
          started_at?: string
          status?: string
          total_products_fetched?: number | null
          variants_imported?: number | null
          variants_skipped?: number | null
        }
        Relationships: []
      }
      catalog_variants: {
        Row: {
          available_for_sale: boolean
          barcode: string | null
          caffeine_mg: number | null
          calories_per_serving: number | null
          carbs_g: number | null
          catalog_product_id: string
          created_at: string
          currency_code: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          image_url: string | null
          nutrition_confidence: number | null
          nutrition_enriched_at: string | null
          nutrition_source: string | null
          price_cents: number | null
          protein_g: number | null
          raw_payload: Json | null
          serving_grams: number | null
          serving_size: string | null
          servings_per_container: number | null
          shopify_updated_at: string | null
          shopify_variant_id: string | null
          sku: string | null
          sodium_mg: number | null
          sugar_g: number | null
          updated_at: string
          variant_title: string | null
        }
        Insert: {
          available_for_sale?: boolean
          barcode?: string | null
          caffeine_mg?: number | null
          calories_per_serving?: number | null
          carbs_g?: number | null
          catalog_product_id: string
          created_at?: string
          currency_code?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          nutrition_confidence?: number | null
          nutrition_enriched_at?: string | null
          nutrition_source?: string | null
          price_cents?: number | null
          protein_g?: number | null
          raw_payload?: Json | null
          serving_grams?: number | null
          serving_size?: string | null
          servings_per_container?: number | null
          shopify_updated_at?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string
          variant_title?: string | null
        }
        Update: {
          available_for_sale?: boolean
          barcode?: string | null
          caffeine_mg?: number | null
          calories_per_serving?: number | null
          carbs_g?: number | null
          catalog_product_id?: string
          created_at?: string
          currency_code?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          nutrition_confidence?: number | null
          nutrition_enriched_at?: string | null
          nutrition_source?: string | null
          price_cents?: number | null
          protein_g?: number | null
          raw_payload?: Json | null
          serving_grams?: number | null
          serving_size?: string | null
          servings_per_container?: number | null
          shopify_updated_at?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string
          variant_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_variants_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athlete_relationships: {
        Row: {
          accepted_at: string | null
          archived_at: string | null
          athlete_user_id: string
          coach_user_id: string
          created_at: string | null
          declined_at: string | null
          id: string
          requested_at: string | null
          requested_by: string
          status: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          archived_at?: string | null
          athlete_user_id: string
          coach_user_id: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          requested_at?: string | null
          requested_by: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          archived_at?: string | null
          athlete_user_id?: string
          coach_user_id?: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          requested_at?: string | null
          requested_by?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_athlete_relationships_athlete_user_id_fkey"
            columns: ["athlete_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_relationships_coach_user_id_fkey"
            columns: ["coach_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          activity_id: string | null
          athlete_user_id: string
          coach_user_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          nutrition_plan_id: string | null
          sender_user_id: string
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          athlete_user_id: string
          coach_user_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          nutrition_plan_id?: string | null
          sender_user_id: string
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          athlete_user_id?: string
          coach_user_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          nutrition_plan_id?: string | null
          sender_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_athlete_user_id_fkey"
            columns: ["athlete_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_coach_user_id_fkey"
            columns: ["coach_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_pairing_codes: {
        Row: {
          coach_user_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          used_by_athlete_id: string | null
        }
        Insert: {
          coach_user_id: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by_athlete_id?: string | null
        }
        Update: {
          coach_user_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by_athlete_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_pairing_codes_coach_user_id_fkey"
            columns: ["coach_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_pairing_codes_used_by_athlete_id_fkey"
            columns: ["used_by_athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          application_status: string
          approved_at: string | null
          bio: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_status?: string
          approved_at?: string | null
          bio?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_status?: string
          approved_at?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_macro_targets: {
        Row: {
          algorithm_version: string
          calculation_input: Json | null
          carb_g: number
          created_at: string | null
          ea: number | null
          ea_status: string | null
          fat_g: number
          id: string
          mode: string
          neat_kcal: number | null
          needs_upload: boolean | null
          prot_g: number
          rmr: number
          session_kcal: number
          target_date: string
          tdee: number
          tef_kcal: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          algorithm_version?: string
          calculation_input?: Json | null
          carb_g: number
          created_at?: string | null
          ea?: number | null
          ea_status?: string | null
          fat_g: number
          id?: string
          mode?: string
          neat_kcal?: number | null
          needs_upload?: boolean | null
          prot_g: number
          rmr: number
          session_kcal?: number
          target_date: string
          tdee: number
          tef_kcal?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          algorithm_version?: string
          calculation_input?: Json | null
          carb_g?: number
          created_at?: string | null
          ea?: number | null
          ea_status?: string | null
          fat_g?: number
          id?: string
          mode?: string
          neat_kcal?: number | null
          needs_upload?: boolean | null
          prot_g?: number
          rmr?: number
          session_kcal?: number
          target_date?: string
          tdee?: number
          tef_kcal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_macro_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      during_workout_templates: {
        Row: {
          activity_types: string[]
          allergens: string[]
          component_carb_ratios: Json | null
          component_food_names: string[]
          created_at: string
          duration_brackets: string[]
          excluded_diets: string[]
          food_form: string
          formula: string
          gut_training_levels: string[]
          id: string
          is_active: boolean
          name: string
          notes: string | null
          primary_to_secondary_ratio: string | null
          selection_priority: number
          template_number: number
          updated_at: string
        }
        Insert: {
          activity_types?: string[]
          allergens?: string[]
          component_carb_ratios?: Json | null
          component_food_names?: string[]
          created_at?: string
          duration_brackets?: string[]
          excluded_diets?: string[]
          food_form: string
          formula: string
          gut_training_levels?: string[]
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          primary_to_secondary_ratio?: string | null
          selection_priority?: number
          template_number: number
          updated_at?: string
        }
        Update: {
          activity_types?: string[]
          allergens?: string[]
          component_carb_ratios?: Json | null
          component_food_names?: string[]
          created_at?: string
          duration_brackets?: string[]
          excluded_diets?: string[]
          food_form?: string
          formula?: string
          gut_training_levels?: string[]
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          primary_to_secondary_ratio?: string | null
          selection_priority?: number
          template_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      education_content: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          sort_order: number
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_type?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          sort_order?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          sort_order?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          activity_id: string | null
          actual_finish_time_minutes: number | null
          age_group_placement: number | null
          bib_number: string | null
          carb_loading_days: number | null
          carb_loading_start_date: string | null
          created_at: string | null
          event_date: string | null
          event_name: string | null
          event_subtype:
            | Database["public"]["Enums"]["event_subtype_enum"]
            | null
          event_type: Database["public"]["Enums"]["activity_type_enum"]
          final_placement: number | null
          goal_pace_minutes_per_mile: number | null
          goal_time_minutes: number | null
          has_carb_loading: boolean | null
          has_nutrition_plan: boolean | null
          id: string
          local_updated_at: string | null
          location: string | null
          needs_upload: boolean | null
          packet_pickup_info: string | null
          predicted_finish_time_minutes: number | null
          registration_url: string | null
          start_time: string | null
          updated_at: string | null
          user_id: string
          wave_start_time: string | null
        }
        Insert: {
          activity_id?: string | null
          actual_finish_time_minutes?: number | null
          age_group_placement?: number | null
          bib_number?: string | null
          carb_loading_days?: number | null
          carb_loading_start_date?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_subtype?:
            | Database["public"]["Enums"]["event_subtype_enum"]
            | null
          event_type: Database["public"]["Enums"]["activity_type_enum"]
          final_placement?: number | null
          goal_pace_minutes_per_mile?: number | null
          goal_time_minutes?: number | null
          has_carb_loading?: boolean | null
          has_nutrition_plan?: boolean | null
          id: string
          local_updated_at?: string | null
          location?: string | null
          needs_upload?: boolean | null
          packet_pickup_info?: string | null
          predicted_finish_time_minutes?: number | null
          registration_url?: string | null
          start_time?: string | null
          updated_at?: string | null
          user_id: string
          wave_start_time?: string | null
        }
        Update: {
          activity_id?: string | null
          actual_finish_time_minutes?: number | null
          age_group_placement?: number | null
          bib_number?: string | null
          carb_loading_days?: number | null
          carb_loading_start_date?: string | null
          created_at?: string | null
          event_date?: string | null
          event_name?: string | null
          event_subtype?:
            | Database["public"]["Enums"]["event_subtype_enum"]
            | null
          event_type?: Database["public"]["Enums"]["activity_type_enum"]
          final_placement?: number | null
          goal_pace_minutes_per_mile?: number | null
          goal_time_minutes?: number | null
          has_carb_loading?: boolean | null
          has_nutrition_plan?: boolean | null
          id?: string
          local_updated_at?: string | null
          location?: string | null
          needs_upload?: boolean | null
          packet_pickup_info?: string | null
          predicted_finish_time_minutes?: number | null
          registration_url?: string | null
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
          wave_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events_coverage: {
        Row: {
          bucket_key: string
          category: string
          created_at: string
          id: string
          last_found_count: number | null
          last_swept_at: string | null
          state: string
          updated_at: string
        }
        Insert: {
          bucket_key: string
          category: string
          created_at?: string
          id?: string
          last_found_count?: number | null
          last_swept_at?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          bucket_key?: string
          category?: string
          created_at?: string
          id?: string
          last_found_count?: number | null
          last_swept_at?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      events_refresh_runs: {
        Row: {
          buckets_swept: number
          completed_at: string | null
          errors: Json
          events_added: number
          events_flagged: number
          events_updated: number
          id: string
          mode: string | null
          notes: string | null
          started_at: string
          status: string
        }
        Insert: {
          buckets_swept?: number
          completed_at?: string | null
          errors?: Json
          events_added?: number
          events_flagged?: number
          events_updated?: number
          id?: string
          mode?: string | null
          notes?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          buckets_swept?: number
          completed_at?: string | null
          errors?: Json
          events_added?: number
          events_flagged?: number
          events_updated?: number
          id?: string
          mode?: string | null
          notes?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      feature_survey_responses: {
        Row: {
          device_id: string
          id: number
          local_updated_at: string | null
          needs_upload: boolean | null
          selected_features: string
          voted_at: string
        }
        Insert: {
          device_id: string
          id?: number
          local_updated_at?: string | null
          needs_upload?: boolean | null
          selected_features: string
          voted_at?: string
        }
        Update: {
          device_id?: string
          id?: number
          local_updated_at?: string | null
          needs_upload?: boolean | null
          selected_features?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_survey_responses_user_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          confidence_label: string | null
          confidence_level: number | null
          created_at: string | null
          id: string
          missed_other: string | null
          missed_reasons: string | null
          plan_name: string | null
          reminder_day_of_week: number | null
          reminder_hour: number | null
          reminder_minute: number | null
          reminder_recurring: boolean | null
          reminder_requested: boolean | null
          reuse_intent: string | null
          satisfaction_emoji: string | null
          satisfaction_label: string | null
          satisfaction_level: number | null
          timestamp: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          confidence_label?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          missed_other?: string | null
          missed_reasons?: string | null
          plan_name?: string | null
          reminder_day_of_week?: number | null
          reminder_hour?: number | null
          reminder_minute?: number | null
          reminder_recurring?: boolean | null
          reminder_requested?: boolean | null
          reuse_intent?: string | null
          satisfaction_emoji?: string | null
          satisfaction_label?: string | null
          satisfaction_level?: number | null
          timestamp?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          confidence_label?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          missed_other?: string | null
          missed_reasons?: string | null
          plan_name?: string | null
          reminder_day_of_week?: number | null
          reminder_hour?: number | null
          reminder_minute?: number | null
          reminder_recurring?: boolean | null
          reminder_requested?: boolean | null
          reuse_intent?: string | null
          satisfaction_emoji?: string | null
          satisfaction_label?: string | null
          satisfaction_level?: number | null
          timestamp?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      food_preferences: {
        Row: {
          created_at: string
          food_name: string
          id: string
          preference: string
          preference_level: number
          preference_source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_name: string
          id?: string
          preference: string
          preference_level?: number
          preference_source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_name?: string
          id?: string
          preference?: string
          preference_level?: number
          preference_source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      food_sport_phases: {
        Row: {
          created_at: string
          food_id: string
          id: string
          is_suitable: boolean
          max_servings: number | null
          notes: string | null
          phase: Database["public"]["Enums"]["phase_enum"]
          sport: Database["public"]["Enums"]["activity_type_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          is_suitable?: boolean
          max_servings?: number | null
          notes?: string | null
          phase: Database["public"]["Enums"]["phase_enum"]
          sport: Database["public"]["Enums"]["activity_type_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          is_suitable?: boolean
          max_servings?: number | null
          notes?: string | null
          phase?: Database["public"]["Enums"]["phase_enum"]
          sport?: Database["public"]["Enums"]["activity_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_sport_phases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_sport_phases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "v_food_sport_phase_settings"
            referencedColumns: ["food_id"]
          },
        ]
      }
      foods: {
        Row: {
          activity_types:
            | Database["public"]["Enums"]["activity_type_enum"][]
            | null
          affiliate_source: string | null
          after_run_suitable: boolean | null
          allergens: Database["public"]["Enums"]["allergy_enum"][] | null
          before_run_suitable: boolean | null
          caffeine_mg: number | null
          calories_per_serving: number | null
          carbs_per_serving: number | null
          categories: Database["public"]["Enums"]["category_enum"][]
          created_at: string | null
          description: string | null
          display_name: string | null
          display_name_plural: string | null
          during_run_suitable: boolean | null
          excluded_diets:
            | Database["public"]["Enums"]["dietary_preference_enum"][]
            | null
          fat_per_serving: number | null
          fluid_ml_per_serving: number | null
          id: string
          image_address: string | null
          instructions: string | null
          is_electrolyte: boolean | null
          is_essential: boolean | null
          is_other_food: boolean | null
          max_servings_after: number | null
          max_servings_before: number | null
          max_servings_during: number | null
          name: string | null
          nutritional_info: string | null
          potassium_mg: number | null
          preference_priority: number | null
          product_type: Database["public"]["Enums"]["product_type_enum"] | null
          protein_per_serving: number | null
          purchase_url: string | null
          serving_amount: number | null
          serving_description: string | null
          serving_qualifier: string | null
          serving_size: string | null
          serving_unit: string | null
          serving_unit_plural: string | null
          show_in_preferences: boolean | null
          sodium_mg: number | null
          to_exclude_from_solver: boolean | null
          updated_at: string | null
        }
        Insert: {
          activity_types?:
            | Database["public"]["Enums"]["activity_type_enum"][]
            | null
          affiliate_source?: string | null
          after_run_suitable?: boolean | null
          allergens?: Database["public"]["Enums"]["allergy_enum"][] | null
          before_run_suitable?: boolean | null
          caffeine_mg?: number | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          categories?: Database["public"]["Enums"]["category_enum"][]
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          display_name_plural?: string | null
          during_run_suitable?: boolean | null
          excluded_diets?:
            | Database["public"]["Enums"]["dietary_preference_enum"][]
            | null
          fat_per_serving?: number | null
          fluid_ml_per_serving?: number | null
          id?: string
          image_address?: string | null
          instructions?: string | null
          is_electrolyte?: boolean | null
          is_essential?: boolean | null
          is_other_food?: boolean | null
          max_servings_after?: number | null
          max_servings_before?: number | null
          max_servings_during?: number | null
          name?: string | null
          nutritional_info?: string | null
          potassium_mg?: number | null
          preference_priority?: number | null
          product_type?: Database["public"]["Enums"]["product_type_enum"] | null
          protein_per_serving?: number | null
          purchase_url?: string | null
          serving_amount?: number | null
          serving_description?: string | null
          serving_qualifier?: string | null
          serving_size?: string | null
          serving_unit?: string | null
          serving_unit_plural?: string | null
          show_in_preferences?: boolean | null
          sodium_mg?: number | null
          to_exclude_from_solver?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activity_types?:
            | Database["public"]["Enums"]["activity_type_enum"][]
            | null
          affiliate_source?: string | null
          after_run_suitable?: boolean | null
          allergens?: Database["public"]["Enums"]["allergy_enum"][] | null
          before_run_suitable?: boolean | null
          caffeine_mg?: number | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          categories?: Database["public"]["Enums"]["category_enum"][]
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          display_name_plural?: string | null
          during_run_suitable?: boolean | null
          excluded_diets?:
            | Database["public"]["Enums"]["dietary_preference_enum"][]
            | null
          fat_per_serving?: number | null
          fluid_ml_per_serving?: number | null
          id?: string
          image_address?: string | null
          instructions?: string | null
          is_electrolyte?: boolean | null
          is_essential?: boolean | null
          is_other_food?: boolean | null
          max_servings_after?: number | null
          max_servings_before?: number | null
          max_servings_during?: number | null
          name?: string | null
          nutritional_info?: string | null
          potassium_mg?: number | null
          preference_priority?: number | null
          product_type?: Database["public"]["Enums"]["product_type_enum"] | null
          protein_per_serving?: number | null
          purchase_url?: string | null
          serving_amount?: number | null
          serving_description?: string | null
          serving_qualifier?: string | null
          serving_size?: string | null
          serving_unit?: string | null
          serving_unit_plural?: string | null
          show_in_preferences?: boolean | null
          sodium_mg?: number | null
          to_exclude_from_solver?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      formula_pins: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          template_id: string
          template_kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          template_id: string
          template_kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          template_id?: string
          template_kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      garmin_health_data: {
        Row: {
          calendar_date: string
          created_at: string | null
          data: Json
          data_type: string
          garmin_user_id: string
          id: string
          summary_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_date: string
          created_at?: string | null
          data?: Json
          data_type: string
          garmin_user_id: string
          id?: string
          summary_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_date?: string
          created_at?: string | null
          data?: Json
          data_type?: string
          garmin_user_id?: string
          id?: string
          summary_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garmin_health_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      garmin_user_mappings: {
        Row: {
          access_token: string | null
          created_at: string | null
          garmin_user_id: string
          id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          garmin_user_id: string
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          garmin_user_id?: string
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garmin_user_mappings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string
          athlete_zones_json: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          provider: string
          provider_athlete_birth_month: string | null
          provider_athlete_body_fat_pct: number | null
          provider_athlete_email: string | null
          provider_athlete_gender: string | null
          provider_athlete_id: string
          provider_athlete_name: string | null
          provider_athlete_weight_kg: number | null
          refresh_token: string | null
          threshold_pace_min_per_mile: number | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          athlete_zones_json?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          provider: string
          provider_athlete_birth_month?: string | null
          provider_athlete_body_fat_pct?: number | null
          provider_athlete_email?: string | null
          provider_athlete_gender?: string | null
          provider_athlete_id: string
          provider_athlete_name?: string | null
          provider_athlete_weight_kg?: number | null
          refresh_token?: string | null
          threshold_pace_min_per_mile?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          athlete_zones_json?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          provider?: string
          provider_athlete_birth_month?: string | null
          provider_athlete_body_fat_pct?: number | null
          provider_athlete_email?: string | null
          provider_athlete_gender?: string | null
          provider_athlete_id?: string
          provider_athlete_name?: string | null
          provider_athlete_weight_kg?: number | null
          refresh_token?: string | null
          threshold_pace_min_per_mile?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jade_calls: {
        Row: {
          conversation_id: string | null
          created_at: string
          function_name: string
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          function_name: string
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          function_name?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      jade_conversations: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jade_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jade_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "jade_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_library: {
        Row: {
          allergens: Database["public"]["Enums"]["allergy_enum"][]
          batch: boolean
          carbs_g: number | null
          contexts: string[]
          created_at: string
          cuisine: string | null
          diets_ok: Database["public"]["Enums"]["dietary_preference_enum"][]
          embedding: string | null
          excluded_diets: Database["public"]["Enums"]["dietary_preference_enum"][]
          fat_g: number | null
          id: string
          ingredients: string
          ingredients_json: Json
          is_active: boolean
          kcal: number | null
          meal_type: string
          name: string
          prep: string | null
          prep_minutes: number | null
          protein_g: number | null
          search_text: string | null
          servings: number
          source: string | null
          swaps: string | null
          updated_at: string
          why: string | null
        }
        Insert: {
          allergens?: Database["public"]["Enums"]["allergy_enum"][]
          batch?: boolean
          carbs_g?: number | null
          contexts?: string[]
          created_at?: string
          cuisine?: string | null
          diets_ok?: Database["public"]["Enums"]["dietary_preference_enum"][]
          embedding?: string | null
          excluded_diets?: Database["public"]["Enums"]["dietary_preference_enum"][]
          fat_g?: number | null
          id: string
          ingredients: string
          ingredients_json?: Json
          is_active?: boolean
          kcal?: number | null
          meal_type: string
          name: string
          prep?: string | null
          prep_minutes?: number | null
          protein_g?: number | null
          search_text?: string | null
          servings?: number
          source?: string | null
          swaps?: string | null
          updated_at?: string
          why?: string | null
        }
        Update: {
          allergens?: Database["public"]["Enums"]["allergy_enum"][]
          batch?: boolean
          carbs_g?: number | null
          contexts?: string[]
          created_at?: string
          cuisine?: string | null
          diets_ok?: Database["public"]["Enums"]["dietary_preference_enum"][]
          embedding?: string | null
          excluded_diets?: Database["public"]["Enums"]["dietary_preference_enum"][]
          fat_g?: number | null
          id?: string
          ingredients?: string
          ingredients_json?: Json
          is_active?: boolean
          kcal?: number | null
          meal_type?: string
          name?: string
          prep?: string | null
          prep_minutes?: number | null
          protein_g?: number | null
          search_text?: string | null
          servings?: number
          source?: string | null
          swaps?: string | null
          updated_at?: string
          why?: string | null
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          eaten_at: string | null
          fat_g: number | null
          id: string
          is_deleted: boolean
          items: Json
          log_date: string
          name: string
          notes: string | null
          photo_path: string | null
          plan_meal_id: string | null
          protein_g: number | null
          recipe_id: string | null
          saved_meal_id: string | null
          slot: string | null
          sodium_mg: number | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          eaten_at?: string | null
          fat_g?: number | null
          id?: string
          is_deleted?: boolean
          items?: Json
          log_date: string
          name: string
          notes?: string | null
          photo_path?: string | null
          plan_meal_id?: string | null
          protein_g?: number | null
          recipe_id?: string | null
          saved_meal_id?: string | null
          slot?: string | null
          sodium_mg?: number | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          eaten_at?: string | null
          fat_g?: number | null
          id?: string
          is_deleted?: boolean
          items?: Json
          log_date?: string
          name?: string
          notes?: string | null
          photo_path?: string | null
          plan_meal_id?: string | null
          protein_g?: number | null
          recipe_id?: string | null
          saved_meal_id?: string | null
          slot?: string | null
          sodium_mg?: number | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_plan_meal_id_fkey"
            columns: ["plan_meal_id"]
            isOneToOne: false
            referencedRelation: "plan_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          batch_cooking: boolean
          brief: string | null
          created_at: string
          id: string
          is_deleted: boolean
          rules: Json
          shopping: Json
          status: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          batch_cooking?: boolean
          brief?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          rules?: Json
          shopping?: Json
          status?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          batch_cooking?: boolean
          brief?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          rules?: Json
          shopping?: Json
          status?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_products: {
        Row: {
          barcode: string
          brand_name: string | null
          caffeine_mg: number | null
          calories_per_100g: number | null
          calories_per_serving: number | null
          carbohydrates_per_100g: number | null
          carbohydrates_per_serving: number | null
          categories: string | null
          confidence_score: number | null
          fat_per_100g: number | null
          fat_per_serving: number | null
          fiber_g: number | null
          first_cached_at: string
          hit_count: number
          id: string
          image_url: string | null
          ingredients: string | null
          last_seen_at: string
          nutrition_data_per: string | null
          potassium_mg: number | null
          product_name: string | null
          protein_per_100g: number | null
          protein_per_serving: number | null
          raw_payload: Json | null
          resale_ok: boolean | null
          serving_grams: number | null
          serving_size: string | null
          sodium_mg_per_100g: number | null
          sodium_mg_per_serving: number | null
          source: string
          sugar_g: number | null
          suggested_product_type: string | null
          updated_at: string
        }
        Insert: {
          barcode: string
          brand_name?: string | null
          caffeine_mg?: number | null
          calories_per_100g?: number | null
          calories_per_serving?: number | null
          carbohydrates_per_100g?: number | null
          carbohydrates_per_serving?: number | null
          categories?: string | null
          confidence_score?: number | null
          fat_per_100g?: number | null
          fat_per_serving?: number | null
          fiber_g?: number | null
          first_cached_at?: string
          hit_count?: number
          id?: string
          image_url?: string | null
          ingredients?: string | null
          last_seen_at?: string
          nutrition_data_per?: string | null
          potassium_mg?: number | null
          product_name?: string | null
          protein_per_100g?: number | null
          protein_per_serving?: number | null
          raw_payload?: Json | null
          resale_ok?: boolean | null
          serving_grams?: number | null
          serving_size?: string | null
          sodium_mg_per_100g?: number | null
          sodium_mg_per_serving?: number | null
          source: string
          sugar_g?: number | null
          suggested_product_type?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string
          brand_name?: string | null
          caffeine_mg?: number | null
          calories_per_100g?: number | null
          calories_per_serving?: number | null
          carbohydrates_per_100g?: number | null
          carbohydrates_per_serving?: number | null
          categories?: string | null
          confidence_score?: number | null
          fat_per_100g?: number | null
          fat_per_serving?: number | null
          fiber_g?: number | null
          first_cached_at?: string
          hit_count?: number
          id?: string
          image_url?: string | null
          ingredients?: string | null
          last_seen_at?: string
          nutrition_data_per?: string | null
          potassium_mg?: number | null
          product_name?: string | null
          protein_per_100g?: number | null
          protein_per_serving?: number | null
          raw_payload?: Json | null
          resale_ok?: boolean | null
          serving_grams?: number | null
          serving_size?: string | null
          sodium_mg_per_100g?: number | null
          sodium_mg_per_serving?: number | null
          source?: string
          sugar_g?: number | null
          suggested_product_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_surveys: {
        Row: {
          completed_at: string
          created_at: string
          goals: Json
          pitfalls: Json
          sports: Json
          survey_payload: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at: string
          created_at?: string
          goals?: Json
          pitfalls?: Json
          sports?: Json
          survey_payload?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          goals?: Json
          pitfalls?: Json
          sports?: Json
          survey_payload?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_surveys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_formulas: {
        Row: {
          activities: Json | null
          coach_insight_marker: string | null
          coach_insight_text: string | null
          components: Json
          created_at: string
          digest_speed: string | null
          durations: Json | null
          gut_training: string | null
          id: string
          is_deleted: boolean
          name: string
          notes: string | null
          phase: string
          provenance: string
          source_template_id: string | null
          source_template_kind: string | null
          sub_phase: string | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fluids_ml: number | null
          total_protein_g: number | null
          total_sodium_mg: number | null
          travel_friendliness: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activities?: Json | null
          coach_insight_marker?: string | null
          coach_insight_text?: string | null
          components?: Json
          created_at?: string
          digest_speed?: string | null
          durations?: Json | null
          gut_training?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          notes?: string | null
          phase: string
          provenance: string
          source_template_id?: string | null
          source_template_kind?: string | null
          sub_phase?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fluids_ml?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          travel_friendliness?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activities?: Json | null
          coach_insight_marker?: string | null
          coach_insight_text?: string | null
          components?: Json
          created_at?: string
          digest_speed?: string | null
          durations?: Json | null
          gut_training?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          notes?: string | null
          phase?: string
          provenance?: string
          source_template_id?: string | null
          source_template_kind?: string | null
          sub_phase?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fluids_ml?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          travel_friendliness?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_templates: {
        Row: {
          activities: Json | null
          activity_type: string
          brick_segment_order: string[] | null
          created_at: string | null
          custom_food_ids: Json | null
          digest_speed: string | null
          durations: Json | null
          gut_training: string | null
          id: string
          name: string
          original_activity_title: string | null
          original_distance: number | null
          original_duration_minutes: number | null
          phase: string | null
          plan_data: Json
          provenance: string
          source_template_id: string | null
          sub_phase: string | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fluids_ml: number | null
          total_protein_g: number | null
          total_sodium_mg: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities?: Json | null
          activity_type: string
          brick_segment_order?: string[] | null
          created_at?: string | null
          custom_food_ids?: Json | null
          digest_speed?: string | null
          durations?: Json | null
          gut_training?: string | null
          id?: string
          name: string
          original_activity_title?: string | null
          original_distance?: number | null
          original_duration_minutes?: number | null
          phase?: string | null
          plan_data: Json
          provenance?: string
          source_template_id?: string | null
          sub_phase?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fluids_ml?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities?: Json | null
          activity_type?: string
          brick_segment_order?: string[] | null
          created_at?: string | null
          custom_food_ids?: Json | null
          digest_speed?: string | null
          durations?: Json | null
          gut_training?: string | null
          id?: string
          name?: string
          original_activity_title?: string | null
          original_distance?: number | null
          original_duration_minutes?: number | null
          phase?: string | null
          plan_data?: Json
          provenance?: string
          source_template_id?: string | null
          sub_phase?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fluids_ml?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_generation_log: {
        Row: {
          activity_type: string | null
          created_at: string
          delivered: Json | null
          device_id: string | null
          duration_minutes: number | null
          during_path: string | null
          gut_training_level: string | null
          id: string
          pin_decision: Json | null
          plan_id: string | null
          shortfalls: Json | null
          targets: Json | null
          warnings: Json | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          delivered?: Json | null
          device_id?: string | null
          duration_minutes?: number | null
          during_path?: string | null
          gut_training_level?: string | null
          id?: string
          pin_decision?: Json | null
          plan_id?: string | null
          shortfalls?: Json | null
          targets?: Json | null
          warnings?: Json | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          delivered?: Json | null
          device_id?: string | null
          duration_minutes?: number | null
          during_path?: string | null
          gut_training_level?: string | null
          id?: string
          pin_decision?: Json | null
          plan_id?: string | null
          shortfalls?: Json | null
          targets?: Json | null
          warnings?: Json | null
        }
        Relationships: []
      }
      plan_meals: {
        Row: {
          carbs_g: number | null
          comments: Json
          created_at: string
          fat_g: number | null
          id: string
          kcal: number | null
          library_meal_id: string | null
          meal_type: string
          name: string
          plan_id: string
          position: number
          protein_g: number | null
          saved_meal_id: string | null
          servings: number
          servings_left: number
          session: string | null
          source: string
          swaps_applied: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          comments?: Json
          created_at?: string
          fat_g?: number | null
          id?: string
          kcal?: number | null
          library_meal_id?: string | null
          meal_type: string
          name: string
          plan_id: string
          position?: number
          protein_g?: number | null
          saved_meal_id?: string | null
          servings?: number
          servings_left?: number
          session?: string | null
          source: string
          swaps_applied?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          comments?: Json
          created_at?: string
          fat_g?: number | null
          id?: string
          kcal?: number | null
          library_meal_id?: string | null
          meal_type?: string
          name?: string
          plan_id?: string
          position?: number
          protein_g?: number | null
          saved_meal_id?: string | null
          servings?: number
          servings_left?: number
          session?: string | null
          source?: string
          swaps_applied?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_meals_library_meal_id_fkey"
            columns: ["library_meal_id"]
            isOneToOne: false
            referencedRelation: "meal_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_meals_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_recalc_log: {
        Row: {
          created_at: string
          delta: Json | null
          device_id: string | null
          ea_status_after: string | null
          ea_status_before: string | null
          id: string
          local_sync_time: string | null
          sessions: Json | null
        }
        Insert: {
          created_at?: string
          delta?: Json | null
          device_id?: string | null
          ea_status_after?: string | null
          ea_status_before?: string | null
          id?: string
          local_sync_time?: string | null
          sessions?: Json | null
        }
        Update: {
          created_at?: string
          delta?: Json | null
          device_id?: string | null
          ea_status_after?: string | null
          ea_status_before?: string | null
          id?: string
          local_sync_time?: string | null
          sessions?: Json | null
        }
        Relationships: []
      }
      post_workout_templates: {
        Row: {
          activity_types: string[]
          allergens: string[]
          carb_sources: string[]
          component_food_names: string[]
          component_ratios: Json | null
          created_at: string
          default_servings: Json
          excluded_diets: string[]
          flavor_profile: string | null
          formula: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          portions: string | null
          prep_effort: string | null
          protein_anchor: string | null
          recovery_type: string | null
          recovery_window: string | null
          selection_priority: number
          target_carb_protein_ratio: string | null
          template_number: number
          travel_friendliness: string | null
          updated_at: string
          workout_intensity: string[]
        }
        Insert: {
          activity_types?: string[]
          allergens?: string[]
          carb_sources?: string[]
          component_food_names?: string[]
          component_ratios?: Json | null
          created_at?: string
          default_servings?: Json
          excluded_diets?: string[]
          flavor_profile?: string | null
          formula: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          portions?: string | null
          prep_effort?: string | null
          protein_anchor?: string | null
          recovery_type?: string | null
          recovery_window?: string | null
          selection_priority?: number
          target_carb_protein_ratio?: string | null
          template_number: number
          travel_friendliness?: string | null
          updated_at?: string
          workout_intensity?: string[]
        }
        Update: {
          activity_types?: string[]
          allergens?: string[]
          carb_sources?: string[]
          component_food_names?: string[]
          component_ratios?: Json | null
          created_at?: string
          default_servings?: Json
          excluded_diets?: string[]
          flavor_profile?: string | null
          formula?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          portions?: string | null
          prep_effort?: string | null
          protein_anchor?: string | null
          recovery_type?: string | null
          recovery_window?: string | null
          selection_priority?: number
          target_carb_protein_ratio?: string | null
          template_number?: number
          travel_friendliness?: string | null
          updated_at?: string
          workout_intensity?: string[]
        }
        Relationships: []
      }
      pre_workout_templates: {
        Row: {
          allergens: string[] | null
          base_category: string
          carbs_per_serving: number
          component_food_names: string[] | null
          component_quantities: Json | null
          created_at: string
          digestion_speed: string
          excluded_diets: string[] | null
          fat_per_serving: number
          fiber_per_serving: number
          fluid_ml: number
          id: string
          is_active: boolean
          is_indivisible: boolean
          max_servings: number
          min_servings: number
          name: string
          notes: string | null
          plus_banana: boolean
          plus_sports_drink: boolean
          protein_per_serving: number
          serving_unit: string
          sodium_mg: number
          sub_phase: string
          template_type: string
          time_window: string
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          base_category: string
          carbs_per_serving?: number
          component_food_names?: string[] | null
          component_quantities?: Json | null
          created_at?: string
          digestion_speed: string
          excluded_diets?: string[] | null
          fat_per_serving?: number
          fiber_per_serving?: number
          fluid_ml?: number
          id?: string
          is_active?: boolean
          is_indivisible?: boolean
          max_servings: number
          min_servings?: number
          name: string
          notes?: string | null
          plus_banana?: boolean
          plus_sports_drink?: boolean
          protein_per_serving?: number
          serving_unit: string
          sodium_mg?: number
          sub_phase: string
          template_type?: string
          time_window: string
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          base_category?: string
          carbs_per_serving?: number
          component_food_names?: string[] | null
          component_quantities?: Json | null
          created_at?: string
          digestion_speed?: string
          excluded_diets?: string[] | null
          fat_per_serving?: number
          fiber_per_serving?: number
          fluid_ml?: number
          id?: string
          is_active?: boolean
          is_indivisible?: boolean
          max_servings?: number
          min_servings?: number
          name?: string
          notes?: string | null
          plus_banana?: boolean
          plus_sports_drink?: boolean
          protein_per_serving?: number
          serving_unit?: string
          sodium_mg?: number
          sub_phase?: string
          template_type?: string
          time_window?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_name: string
          event_subtype:
            | Database["public"]["Enums"]["event_subtype_enum"]
            | null
          event_type: Database["public"]["Enums"]["activity_type_enum"]
          external_id: string | null
          id: number
          is_active: boolean | null
          location: string | null
          organizer_name: string | null
          registration_url: string | null
          search_vector: unknown
          source: string | null
          start_time: string | null
          state: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_name: string
          event_subtype?:
            | Database["public"]["Enums"]["event_subtype_enum"]
            | null
          event_type: Database["public"]["Enums"]["activity_type_enum"]
          external_id?: string | null
          id?: number
          is_active?: boolean | null
          location?: string | null
          organizer_name?: string | null
          registration_url?: string | null
          search_vector?: unknown
          source?: string | null
          start_time?: string | null
          state?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string
          event_subtype?:
            | Database["public"]["Enums"]["event_subtype_enum"]
            | null
          event_type?: Database["public"]["Enums"]["activity_type_enum"]
          external_id?: string | null
          id?: number
          is_active?: boolean | null
          location?: string | null
          organizer_name?: string | null
          registration_url?: string | null
          search_vector?: unknown
          source?: string | null
          start_time?: string | null
          state?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          description: string
          fat_g: number
          fiber_g: number
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_active: boolean
          name: string
          prep_time_minutes: number
          protein_g: number
          servings: number
          sodium_mg: number
          sugar_g: number
          tags: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          description?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_active?: boolean
          name: string
          prep_time_minutes?: number
          protein_g?: number
          servings?: number
          sodium_mg?: number
          sugar_g?: number
          tags?: Json | null
          type?: string
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          description?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_active?: boolean
          name?: string
          prep_time_minutes?: number
          protein_g?: number
          servings?: number
          sodium_mg?: number
          sugar_g?: number
          tags?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          batch: boolean | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          embedding: string | null
          fat_g: number | null
          id: string
          is_deleted: boolean
          items: Json
          last_used_at: string | null
          library_meal_id: string | null
          meal_types: string[]
          name: string
          photo_path: string | null
          protein_g: number | null
          sodium_mg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          batch?: boolean | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          embedding?: string | null
          fat_g?: number | null
          id?: string
          is_deleted?: boolean
          items?: Json
          last_used_at?: string | null
          library_meal_id?: string | null
          meal_types?: string[]
          name: string
          photo_path?: string | null
          protein_g?: number | null
          sodium_mg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          batch?: boolean | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          embedding?: string | null
          fat_g?: number | null
          id?: string
          is_deleted?: boolean
          items?: Json
          last_used_at?: string | null
          library_meal_id?: string | null
          meal_types?: string[]
          name?: string
          photo_path?: string | null
          protein_g?: number | null
          sodium_mg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_meals_library_meal_id_fkey"
            columns: ["library_meal_id"]
            isOneToOne: false
            referencedRelation: "meal_library"
            referencedColumns: ["id"]
          },
        ]
      }
      template_foods: {
        Row: {
          activity_types: string[] | null
          allergens: string[] | null
          caffeine_mg: number | null
          calories: number | null
          carbs_g: number
          categories: string[] | null
          created_at: string | null
          default_during: boolean
          description: string | null
          digestion_speed: string | null
          display_name: string
          display_name_plural: string | null
          drink_pool_phases: string[] | null
          excluded_diets: string[] | null
          fat_g: number
          fiber_g: number | null
          fluid_ml: number | null
          food_group: string | null
          id: string
          image_address: string | null
          is_active: boolean | null
          is_drink_pool: boolean | null
          is_electrolyte: boolean | null
          is_essential: boolean | null
          is_indivisible: boolean | null
          is_liquid: boolean | null
          max_per_hr_high: number | null
          max_per_hr_low: number | null
          max_per_hr_moderate: number | null
          max_servings_after: number | null
          max_servings_before: number | null
          max_servings_during: number | null
          min_increment: number | null
          min_servings_during: number | null
          name: string
          potassium_mg: number | null
          product_type: string | null
          protein_g: number
          requires_preparation: boolean | null
          serving_amount: number | null
          serving_qualifier: string | null
          serving_size: string
          serving_unit: string | null
          serving_weight_g: number | null
          show_in_preferences: boolean | null
          sodium_mg: number
          sodium_top_up_eligible: boolean
          to_exclude_from_solver: boolean | null
          updated_at: string | null
        }
        Insert: {
          activity_types?: string[] | null
          allergens?: string[] | null
          caffeine_mg?: number | null
          calories?: number | null
          carbs_g?: number
          categories?: string[] | null
          created_at?: string | null
          default_during?: boolean
          description?: string | null
          digestion_speed?: string | null
          display_name: string
          display_name_plural?: string | null
          drink_pool_phases?: string[] | null
          excluded_diets?: string[] | null
          fat_g?: number
          fiber_g?: number | null
          fluid_ml?: number | null
          food_group?: string | null
          id?: string
          image_address?: string | null
          is_active?: boolean | null
          is_drink_pool?: boolean | null
          is_electrolyte?: boolean | null
          is_essential?: boolean | null
          is_indivisible?: boolean | null
          is_liquid?: boolean | null
          max_per_hr_high?: number | null
          max_per_hr_low?: number | null
          max_per_hr_moderate?: number | null
          max_servings_after?: number | null
          max_servings_before?: number | null
          max_servings_during?: number | null
          min_increment?: number | null
          min_servings_during?: number | null
          name: string
          potassium_mg?: number | null
          product_type?: string | null
          protein_g?: number
          requires_preparation?: boolean | null
          serving_amount?: number | null
          serving_qualifier?: string | null
          serving_size: string
          serving_unit?: string | null
          serving_weight_g?: number | null
          show_in_preferences?: boolean | null
          sodium_mg?: number
          sodium_top_up_eligible?: boolean
          to_exclude_from_solver?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activity_types?: string[] | null
          allergens?: string[] | null
          caffeine_mg?: number | null
          calories?: number | null
          carbs_g?: number
          categories?: string[] | null
          created_at?: string | null
          default_during?: boolean
          description?: string | null
          digestion_speed?: string | null
          display_name?: string
          display_name_plural?: string | null
          drink_pool_phases?: string[] | null
          excluded_diets?: string[] | null
          fat_g?: number
          fiber_g?: number | null
          fluid_ml?: number | null
          food_group?: string | null
          id?: string
          image_address?: string | null
          is_active?: boolean | null
          is_drink_pool?: boolean | null
          is_electrolyte?: boolean | null
          is_essential?: boolean | null
          is_indivisible?: boolean | null
          is_liquid?: boolean | null
          max_per_hr_high?: number | null
          max_per_hr_low?: number | null
          max_per_hr_moderate?: number | null
          max_servings_after?: number | null
          max_servings_before?: number | null
          max_servings_during?: number | null
          min_increment?: number | null
          min_servings_during?: number | null
          name?: string
          potassium_mg?: number | null
          product_type?: string | null
          protein_g?: number
          requires_preparation?: boolean | null
          serving_amount?: number | null
          serving_qualifier?: string | null
          serving_size?: string
          serving_unit?: string | null
          serving_weight_g?: number | null
          show_in_preferences?: boolean | null
          sodium_mg?: number
          sodium_top_up_eligible?: boolean
          to_exclude_from_solver?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          allergens: string[] | null
          base_category: string
          created_at: string | null
          digestion_speed: string | null
          excluded_diets: string[] | null
          food_names: string[] | null
          foods: Json
          has_liquid_base: boolean | null
          id: string
          is_active: boolean | null
          meal_type: string
          name: string
          notes: string | null
          phase: string
          slug: string
          sort_order: number | null
          timing_max_minutes: number
          timing_min_minutes: number
          timing_window: string
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fluid_ml: number | null
          total_protein_g: number | null
          total_sodium_mg: number | null
          updated_at: string | null
          validation_status: string | null
        }
        Insert: {
          allergens?: string[] | null
          base_category: string
          created_at?: string | null
          digestion_speed?: string | null
          excluded_diets?: string[] | null
          food_names?: string[] | null
          foods?: Json
          has_liquid_base?: boolean | null
          id?: string
          is_active?: boolean | null
          meal_type?: string
          name: string
          notes?: string | null
          phase?: string
          slug: string
          sort_order?: number | null
          timing_max_minutes: number
          timing_min_minutes: number
          timing_window: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fluid_ml?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          updated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          allergens?: string[] | null
          base_category?: string
          created_at?: string | null
          digestion_speed?: string | null
          excluded_diets?: string[] | null
          food_names?: string[] | null
          foods?: Json
          has_liquid_base?: boolean | null
          id?: string
          is_active?: boolean | null
          meal_type?: string
          name?: string
          notes?: string | null
          phase?: string
          slug?: string
          sort_order?: number | null
          timing_max_minutes?: number
          timing_min_minutes?: number
          timing_window?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fluid_ml?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          updated_at?: string | null
          validation_status?: string | null
        }
        Relationships: []
      }
      token_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          reason: string
          ref: string | null
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_wallets: {
        Row: {
          balance: number
          created_at: string
          free_period: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          free_period?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          free_period?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_foods: {
        Row: {
          activity_types:
            | Database["public"]["Enums"]["activity_type_enum"][]
            | null
          barcode: string | null
          calories_per_serving: number | null
          carbs_per_serving: number | null
          categories: Database["public"]["Enums"]["category_enum"][]
          client_food_id: string | null
          client_updated_at: string | null
          created_at: string | null
          description: string | null
          device_id: string
          display_name: string | null
          display_name_plural: string | null
          fat_per_serving: number | null
          fluid_ml_per_serving: number | null
          id: string
          image_address: string | null
          is_deleted: boolean | null
          is_electrolyte: boolean | null
          name: string
          product_type: Database["public"]["Enums"]["product_type_enum"] | null
          protein_per_serving: number | null
          serving_amount: number | null
          serving_size: string | null
          serving_unit: string | null
          sodium_mg: number | null
          to_exclude_from_solver: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_types?:
            | Database["public"]["Enums"]["activity_type_enum"][]
            | null
          barcode?: string | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          categories?: Database["public"]["Enums"]["category_enum"][]
          client_food_id?: string | null
          client_updated_at?: string | null
          created_at?: string | null
          description?: string | null
          device_id: string
          display_name?: string | null
          display_name_plural?: string | null
          fat_per_serving?: number | null
          fluid_ml_per_serving?: number | null
          id?: string
          image_address?: string | null
          is_deleted?: boolean | null
          is_electrolyte?: boolean | null
          name: string
          product_type?: Database["public"]["Enums"]["product_type_enum"] | null
          protein_per_serving?: number | null
          serving_amount?: number | null
          serving_size?: string | null
          serving_unit?: string | null
          sodium_mg?: number | null
          to_exclude_from_solver?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_types?:
            | Database["public"]["Enums"]["activity_type_enum"][]
            | null
          barcode?: string | null
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          categories?: Database["public"]["Enums"]["category_enum"][]
          client_food_id?: string | null
          client_updated_at?: string | null
          created_at?: string | null
          description?: string | null
          device_id?: string
          display_name?: string | null
          display_name_plural?: string | null
          fat_per_serving?: number | null
          fluid_ml_per_serving?: number | null
          id?: string
          image_address?: string | null
          is_deleted?: boolean | null
          is_electrolyte?: boolean | null
          name?: string
          product_type?: Database["public"]["Enums"]["product_type_enum"] | null
          protein_per_serving?: number | null
          serving_amount?: number | null
          serving_size?: string | null
          serving_unit?: string | null
          sodium_mg?: number | null
          to_exclude_from_solver?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_foods_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memories: {
        Row: {
          confidence: number
          created_at: string
          embedding: string | null
          expires_at: string | null
          fact: string
          id: string
          is_deleted: boolean
          key: string | null
          kind: string
          last_confirmed_at: string
          source: string
          user_id: string
          value: Json | null
        }
        Insert: {
          confidence?: number
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          fact: string
          id?: string
          is_deleted?: boolean
          key?: string | null
          kind: string
          last_confirmed_at?: string
          source?: string
          user_id: string
          value?: Json | null
        }
        Update: {
          confidence?: number
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          fact?: string
          id?: string
          is_deleted?: boolean
          key?: string | null
          kind?: string
          last_confirmed_at?: string
          source?: string
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          allergies: Database["public"]["Enums"]["allergy_enum"][] | null
          app_version: string | null
          auth_provider: Database["public"]["Enums"]["auth_provider_enum"]
          auth_skipped_at: string | null
          auth_user_id: string | null
          auto_generate_nutrition: boolean
          birthday: string | null
          body_fat_pct: number | null
          body_fat_pct_updated_at: string | null
          calendar_week_start: string
          carb_cycle_opt_in: boolean
          completion_reminders: boolean
          created_at: string | null
          cycling_ftp_watts: number | null
          default_activity_day: string
          default_activity_time: string
          default_cycling_speed_mph: number | null
          default_reminder_day: number | null
          default_reminder_hour: number | null
          default_reminder_minute: number | null
          default_reminder_recurring: boolean | null
          default_running_pace_min_per_mile: number | null
          default_swimming_pace_per_100_sec: number | null
          device_id: string
          dietary_preference:
            | Database["public"]["Enums"]["dietary_preference_enum"]
            | null
          email: string | null
          first_name: string | null
          food_preferences: Json | null
          gender: Database["public"]["Enums"]["gender_enum"] | null
          gi_sensitivity: boolean | null
          gut_training_level:
            | Database["public"]["Enums"]["gut_training_enum"]
            | null
          has_aero_bottle: boolean | null
          has_bento_box: boolean | null
          height_feet: number | null
          height_inches: number | null
          id: string
          is_anonymous: boolean
          is_internal: boolean
          known_sodium_concentration_mg_per_liter: number | null
          known_sweat_rate_ml_per_hour: number | null
          last_active_at: string | null
          last_name: string | null
          lifestyle: string | null
          notifications_enabled: boolean | null
          nutrition_target_overrides: Json | null
          onboarding_completed: boolean | null
          preferred_distance_unit:
            | Database["public"]["Enums"]["distance_unit_enum"]
            | null
          preferred_pace_unit:
            | Database["public"]["Enums"]["pace_unit_enum"]
            | null
          prefers_cycling_power: boolean | null
          prefers_swimming_pace: boolean | null
          runs_with_water_bottle: boolean | null
          sender_name: string | null
          sweat_rate: string
          sweat_sodium: string | null
          sweat_test_date: string | null
          sweat_test_source: string | null
          swimming_css_seconds_per_100m: number | null
          training_phase: string | null
          typical_bike_bottles: number | null
          typical_swim_cap_type: string | null
          typical_weekly_hours: number | null
          typical_wetsuit: boolean | null
          unit_system: string | null
          updated_at: string | null
          weight_pounds: number | null
          weight_pounds_updated_at: string | null
        }
        Insert: {
          allergies?: Database["public"]["Enums"]["allergy_enum"][] | null
          app_version?: string | null
          auth_provider?: Database["public"]["Enums"]["auth_provider_enum"]
          auth_skipped_at?: string | null
          auth_user_id?: string | null
          auto_generate_nutrition?: boolean
          birthday?: string | null
          body_fat_pct?: number | null
          body_fat_pct_updated_at?: string | null
          calendar_week_start?: string
          carb_cycle_opt_in?: boolean
          completion_reminders?: boolean
          created_at?: string | null
          cycling_ftp_watts?: number | null
          default_activity_day?: string
          default_activity_time?: string
          default_cycling_speed_mph?: number | null
          default_reminder_day?: number | null
          default_reminder_hour?: number | null
          default_reminder_minute?: number | null
          default_reminder_recurring?: boolean | null
          default_running_pace_min_per_mile?: number | null
          default_swimming_pace_per_100_sec?: number | null
          device_id: string
          dietary_preference?:
            | Database["public"]["Enums"]["dietary_preference_enum"]
            | null
          email?: string | null
          first_name?: string | null
          food_preferences?: Json | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          gi_sensitivity?: boolean | null
          gut_training_level?:
            | Database["public"]["Enums"]["gut_training_enum"]
            | null
          has_aero_bottle?: boolean | null
          has_bento_box?: boolean | null
          height_feet?: number | null
          height_inches?: number | null
          id?: string
          is_anonymous?: boolean
          is_internal?: boolean
          known_sodium_concentration_mg_per_liter?: number | null
          known_sweat_rate_ml_per_hour?: number | null
          last_active_at?: string | null
          last_name?: string | null
          lifestyle?: string | null
          notifications_enabled?: boolean | null
          nutrition_target_overrides?: Json | null
          onboarding_completed?: boolean | null
          preferred_distance_unit?:
            | Database["public"]["Enums"]["distance_unit_enum"]
            | null
          preferred_pace_unit?:
            | Database["public"]["Enums"]["pace_unit_enum"]
            | null
          prefers_cycling_power?: boolean | null
          prefers_swimming_pace?: boolean | null
          runs_with_water_bottle?: boolean | null
          sender_name?: string | null
          sweat_rate?: string
          sweat_sodium?: string | null
          sweat_test_date?: string | null
          sweat_test_source?: string | null
          swimming_css_seconds_per_100m?: number | null
          training_phase?: string | null
          typical_bike_bottles?: number | null
          typical_swim_cap_type?: string | null
          typical_weekly_hours?: number | null
          typical_wetsuit?: boolean | null
          unit_system?: string | null
          updated_at?: string | null
          weight_pounds?: number | null
          weight_pounds_updated_at?: string | null
        }
        Update: {
          allergies?: Database["public"]["Enums"]["allergy_enum"][] | null
          app_version?: string | null
          auth_provider?: Database["public"]["Enums"]["auth_provider_enum"]
          auth_skipped_at?: string | null
          auth_user_id?: string | null
          auto_generate_nutrition?: boolean
          birthday?: string | null
          body_fat_pct?: number | null
          body_fat_pct_updated_at?: string | null
          calendar_week_start?: string
          carb_cycle_opt_in?: boolean
          completion_reminders?: boolean
          created_at?: string | null
          cycling_ftp_watts?: number | null
          default_activity_day?: string
          default_activity_time?: string
          default_cycling_speed_mph?: number | null
          default_reminder_day?: number | null
          default_reminder_hour?: number | null
          default_reminder_minute?: number | null
          default_reminder_recurring?: boolean | null
          default_running_pace_min_per_mile?: number | null
          default_swimming_pace_per_100_sec?: number | null
          device_id?: string
          dietary_preference?:
            | Database["public"]["Enums"]["dietary_preference_enum"]
            | null
          email?: string | null
          first_name?: string | null
          food_preferences?: Json | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          gi_sensitivity?: boolean | null
          gut_training_level?:
            | Database["public"]["Enums"]["gut_training_enum"]
            | null
          has_aero_bottle?: boolean | null
          has_bento_box?: boolean | null
          height_feet?: number | null
          height_inches?: number | null
          id?: string
          is_anonymous?: boolean
          is_internal?: boolean
          known_sodium_concentration_mg_per_liter?: number | null
          known_sweat_rate_ml_per_hour?: number | null
          last_active_at?: string | null
          last_name?: string | null
          lifestyle?: string | null
          notifications_enabled?: boolean | null
          nutrition_target_overrides?: Json | null
          onboarding_completed?: boolean | null
          preferred_distance_unit?:
            | Database["public"]["Enums"]["distance_unit_enum"]
            | null
          preferred_pace_unit?:
            | Database["public"]["Enums"]["pace_unit_enum"]
            | null
          prefers_cycling_power?: boolean | null
          prefers_swimming_pace?: boolean | null
          runs_with_water_bottle?: boolean | null
          sender_name?: string | null
          sweat_rate?: string
          sweat_sodium?: string | null
          sweat_test_date?: string | null
          sweat_test_source?: string | null
          swimming_css_seconds_per_100m?: number | null
          training_phase?: string | null
          typical_bike_bottles?: number | null
          typical_swim_cap_type?: string | null
          typical_weekly_hours?: number | null
          typical_wetsuit?: boolean | null
          unit_system?: string | null
          updated_at?: string | null
          weight_pounds?: number | null
          weight_pounds_updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_usage_per_user: {
        Row: {
          calls: number | null
          cost_usd: number | null
          email: string | null
          first_call: string | null
          function_name: string | null
          input_tokens: number | null
          last_call: string | null
          model: string | null
          output_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          activity_types: string[] | null
          allergens: string[] | null
          available_for_sale: boolean | null
          barcode: string | null
          brand: string | null
          caffeine_mg: number | null
          calories_per_serving: number | null
          carbs_g: number | null
          categories: string[] | null
          classification_confidence: number | null
          classification_source: string | null
          created_at: string | null
          currency_code: string | null
          excluded_diets: string[] | null
          fat_g: number | null
          fiber_g: number | null
          handle: string | null
          id: string | null
          image_url: string | null
          ingredients: string | null
          is_electrolyte: boolean | null
          is_liquid: boolean | null
          nutrition_confidence: number | null
          nutrition_enriched_at: string | null
          nutrition_source: string | null
          price_cents: number | null
          product_type: string | null
          product_type_id: string | null
          product_url: string | null
          protein_g: number | null
          raw_payload: Json | null
          serving_grams: number | null
          serving_size: string | null
          servings_per_container: number | null
          shopify_product_id: string | null
          shopify_updated_at: string | null
          shopify_variant_id: string | null
          sku: string | null
          sodium_mg: number | null
          sugar_g: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          variant_title: string | null
        }
        Relationships: []
      }
      v_food_sport_phase_settings: {
        Row: {
          display_name: string | null
          effective_max_servings: number | null
          food_id: string | null
          food_name: string | null
          is_suitable: boolean | null
          legacy_max_after: number | null
          legacy_max_before: number | null
          legacy_max_during: number | null
          notes: string | null
          phase: Database["public"]["Enums"]["phase_enum"] | null
          product_type: Database["public"]["Enums"]["product_type_enum"] | null
          sport: Database["public"]["Enums"]["activity_type_enum"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      debit_credits: {
        Args: {
          p_amount: number
          p_reason: string
          p_ref?: string
          p_user_id: string
        }
        Returns: Json
      }
      delete_nutrition_plan_by_device_plan_id: {
        Args: { p_device_id: string; p_plan_id: string }
        Returns: boolean
      }
      delete_nutrition_plan_versioned: {
        Args: {
          p_client_version?: number
          p_device_id: string
          p_plan_id: string
        }
        Returns: Json
      }
      ensure_free_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      grant_credits: {
        Args: {
          p_amount: number
          p_reason: string
          p_ref?: string
          p_user_id: string
        }
        Returns: number
      }
      is_active_coach_for: { Args: { athlete: string }; Returns: boolean }
      is_approved_coach: { Args: { _uid: string }; Returns: boolean }
      match_library: {
        Args: { p_embedding: string; p_limit?: number; p_meal_type?: string }
        Returns: {
          id: string
          meal_type: string
          name: string
          score: number
        }[]
      }
      recall_memories: {
        Args: { p_embedding: string; p_limit?: number; p_user_id: string }
        Returns: {
          confidence: number
          fact: string
          id: string
          key: string
          kind: string
          last_confirmed_at: string
          score: number
          value: Json
        }[]
      }
      search_catalog_ranked: {
        Args: {
          lim?: number
          p_product_type?: string
          p_product_type_id?: string
          q: string
        }
        Returns: {
          allergens: string[]
          available_for_sale: boolean
          barcode: string
          brand: string
          caffeine_mg: number
          calories_per_serving: number
          carbs_g: number
          categories: string[]
          currency_code: string
          excluded_diets: string[]
          fat_g: number
          id: string
          image_url: string
          is_electrolyte: boolean
          is_liquid: boolean
          nutrition_confidence: number
          nutrition_source: string
          price_cents: number
          product_type: string
          product_type_id: string
          product_url: string
          protein_g: number
          score: number
          serving_grams: number
          serving_size: string
          sodium_mg: number
          title: string
          variant_title: string
        }[]
      }
      search_meals: {
        Args: {
          p_batch?: boolean
          p_contexts?: string[]
          p_embedding?: string
          p_include_saved?: boolean
          p_limit?: number
          p_meal_type?: string
          p_query?: string
          p_user_id: string
        }
        Returns: {
          allergens: string[]
          attribution: string
          batch: boolean
          carbs_g: number
          contexts: string[]
          diets_ok: string[]
          fat_g: number
          id: string
          ingredients: string
          kcal: number
          library_meal_id: string
          meal_type: string
          name: string
          prep_minutes: number
          protein_g: number
          score: number
          source: string
          swaps: string
          why: string
        }[]
      }
      search_public_events_hybrid: {
        Args: {
          event_type_filter?: string
          limit_count?: number
          min_similarity?: number
          search_term: string
          state_filter?: string
        }
        Returns: {
          city: string
          country: string
          description: string
          event_date: string
          event_name: string
          event_subtype: string
          event_type: string
          id: number
          location: string
          match_type: string
          organizer_name: string
          registration_url: string
          relevance_score: number
          start_time: string
          state: string
          website_url: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      upsert_food_preferences: {
        Args: { p_device_id: string; p_preferences: Json }
        Returns: boolean
      }
      upsert_nutrition_plan_versioned: {
        Args: {
          p_client_updated_at?: string
          p_client_version?: number
          p_device_id: string
          p_plan_data: Json
          p_plan_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      activity_status_enum:
        | "draft"
        | "planned"
        | "inProgress"
        | "completed"
        | "skipped"
        | "archivedForBrick"
        | "archived_for_brick"
        | "deleted"
      activity_type_enum:
        | "running"
        | "cycling"
        | "swimming"
        | "triathlon"
        | "duathlon"
        | "multisport"
        | "brick"
        | "transition"
        | "other"
      allergy_enum:
        | "dairy"
        | "eggs"
        | "fish"
        | "gluten"
        | "peanuts"
        | "sesame"
        | "shellfish"
        | "soy"
        | "tree_nuts"
      auth_provider_enum: "anonymous" | "email" | "google" | "apple"
      category_enum:
        | "before_run"
        | "during_run"
        | "after_run"
        | "transition"
        | "during_bike"
        | "during_swim"
      cycling_goal_enum: "endurance" | "tempo" | "intervals"
      cycling_terrain_enum: "flat" | "rolling" | "hilly"
      dietary_preference_enum:
        | "omnivore"
        | "vegetarian"
        | "pescatarian"
        | "vegan"
        | "mediterranean"
        | "paleo"
        | "keto"
        | "low_carb"
      distance_unit_enum: "miles" | "kilometers"
      event_subtype_enum:
        | "5k"
        | "10k"
        | "15k"
        | "10_mile"
        | "half_marathon"
        | "25k"
        | "30k"
        | "marathon"
        | "ultra_50k"
        | "ultra_50m"
        | "ultra_100k"
        | "ultra_100m"
        | "ultra_12h"
        | "ultra_24h"
        | "20k"
        | "40k_tt"
        | "50k"
        | "half_century"
        | "metric_century"
        | "century"
        | "gran_fondo"
        | "200k"
        | "1k"
        | "1.5k"
        | "2.5k"
        | "sprint"
        | "olympic"
        | "half_ironman"
        | "ironman"
        | "standard"
        | "long_course"
        | "aquathlon"
        | "aquabike"
        | "custom"
      gender_enum: "male" | "female" | "other" | "unknown"
      gut_training_enum: "low" | "moderate" | "high"
      indoor_outdoor_enum: "indoor" | "outdoor"
      intensity_enum: "easy" | "moderate" | "hard" | "race"
      pace_unit_enum: "min_per_mile" | "min_per_km"
      phase_enum: "before" | "during" | "after"
      plan_type_enum: "standard" | "carb_loading" | "recovery"
      product_type_enum:
        | "bar"
        | "capsule"
        | "chew"
        | "drink_mix"
        | "electrolyte_only"
        | "electrolytes_fluids"
        | "gel"
        | "hydration_with_carbs"
        | "import"
        | "protein_recovery"
        | "quick_carbs"
        | "real_food"
        | "real_food_carbs"
        | "recovery_shake"
        | "solid_carb_snacks"
        | "sports_drink"
        | "waffle"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_status_enum: [
        "draft",
        "planned",
        "inProgress",
        "completed",
        "skipped",
        "archivedForBrick",
        "archived_for_brick",
        "deleted",
      ],
      activity_type_enum: [
        "running",
        "cycling",
        "swimming",
        "triathlon",
        "duathlon",
        "multisport",
        "brick",
        "transition",
        "other",
      ],
      allergy_enum: [
        "dairy",
        "eggs",
        "fish",
        "gluten",
        "peanuts",
        "sesame",
        "shellfish",
        "soy",
        "tree_nuts",
      ],
      auth_provider_enum: ["anonymous", "email", "google", "apple"],
      category_enum: [
        "before_run",
        "during_run",
        "after_run",
        "transition",
        "during_bike",
        "during_swim",
      ],
      cycling_goal_enum: ["endurance", "tempo", "intervals"],
      cycling_terrain_enum: ["flat", "rolling", "hilly"],
      dietary_preference_enum: [
        "omnivore",
        "vegetarian",
        "pescatarian",
        "vegan",
        "mediterranean",
        "paleo",
        "keto",
        "low_carb",
      ],
      distance_unit_enum: ["miles", "kilometers"],
      event_subtype_enum: [
        "5k",
        "10k",
        "15k",
        "10_mile",
        "half_marathon",
        "25k",
        "30k",
        "marathon",
        "ultra_50k",
        "ultra_50m",
        "ultra_100k",
        "ultra_100m",
        "ultra_12h",
        "ultra_24h",
        "20k",
        "40k_tt",
        "50k",
        "half_century",
        "metric_century",
        "century",
        "gran_fondo",
        "200k",
        "1k",
        "1.5k",
        "2.5k",
        "sprint",
        "olympic",
        "half_ironman",
        "ironman",
        "standard",
        "long_course",
        "aquathlon",
        "aquabike",
        "custom",
      ],
      gender_enum: ["male", "female", "other", "unknown"],
      gut_training_enum: ["low", "moderate", "high"],
      indoor_outdoor_enum: ["indoor", "outdoor"],
      intensity_enum: ["easy", "moderate", "hard", "race"],
      pace_unit_enum: ["min_per_mile", "min_per_km"],
      phase_enum: ["before", "during", "after"],
      plan_type_enum: ["standard", "carb_loading", "recovery"],
      product_type_enum: [
        "bar",
        "capsule",
        "chew",
        "drink_mix",
        "electrolyte_only",
        "electrolytes_fluids",
        "gel",
        "hydration_with_carbs",
        "import",
        "protein_recovery",
        "quick_carbs",
        "real_food",
        "real_food_carbs",
        "recovery_shake",
        "solid_carb_snacks",
        "sports_drink",
        "waffle",
      ],
    },
  },
} as const
