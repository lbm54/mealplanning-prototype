/**
 * Jade's full generative-UI tool set — 28 tools.
 *
 * Split into two categories:
 *   1. External-data tools: getWeather, getEvents, getUpcomingActivities,
 *      getMacroTargets, getUserProfile — Jade calls these to read live data.
 *   2. UI-rendering tools: showXxx — Jade calls these to inject typed React
 *      widgets into the chat thread. execute() is a pass-through; the payload
 *      streams to the client which resolves the widget via WIDGET_REGISTRY.
 *
 * Factory pattern: makeJadeTools({ supabase, userId }) closes over the
 * authenticated Supabase client so every execute() has RLS-scoped access.
 * The handler in vite.config.ts constructs the factory per request.
 *
 * AI SDK v6 API: tool({ description, inputSchema, execute })
 * No legacy "parameters" key.
 */
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildGroceryListFromPlan } from "./grocery";

// ─────────────────────────────────────────────────────────────────────────────
// Context shape passed to every data-fetching execute()
// ─────────────────────────────────────────────────────────────────────────────

export interface JadeToolContext {
  supabase: SupabaseClient;
  userId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: weather stub (real OpenWeather integration deferred to v2)
// ─────────────────────────────────────────────────────────────────────────────

function stubWeather(dateStr?: string) {
  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  // Stub with realistic summer training weather
  const temp_f = 72;
  const feels_like_f = 75;
  const humidity_pct = 55;
  const condition = "Partly Cloudy";
  const advisory: string | null =
    temp_f > 85
      ? "Heat advisory: increase fluid intake by 8–12 oz/hr"
      : temp_f < 40
        ? "Cold advisory: fuel early — perceived effort rises in cold"
        : null;
  return { date: today, temp_f, feels_like_f, condition, humidity_pct, advisory };
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function makeJadeTools(ctx: JadeToolContext) {
  const { supabase, userId } = ctx;

  return {
    // ── External-data tools ──────────────────────────────────────────────────

    getWeather: tool({
      description:
        "Get current weather + 7-day forecast for the user's location. Used for hydration recommendations and heat/cold advisories.",
      inputSchema: z.object({
        date: z
          .string()
          .optional()
          .describe("ISO date YYYY-MM-DD; defaults to today"),
      }),
      execute: async ({ date }) => {
        return stubWeather(date);
      },
    }),

    getEvents: tool({
      description:
        "Get upcoming calendar events (race, travel, social) for the next N days.",
      inputSchema: z.object({
        days: z.number().min(1).max(60).default(14),
      }),
      execute: async () => {
        // No events table yet — return empty; real integration deferred to v2
        return [] as Array<{
          id: string;
          date: string;
          title: string;
          type: string;
        }>;
      },
    }),

    getUpcomingActivities: tool({
      description:
        "Get the user's planned workouts (sport, duration, intensity, distance) for the next N days. Already used in chat context — exposed here so Jade can re-query when needed.",
      inputSchema: z.object({
        days: z.number().min(1).max(30).default(14),
      }),
      execute: async ({ days }) => {
        const today = new Date().toISOString().slice(0, 10);
        const future = new Date(Date.now() + days * 86400_000)
          .toISOString()
          .slice(0, 10);

        const { data, error } = await supabase
          .from("activities")
          .select(
            "id, scheduled_date_time, activity_type, title, duration_minutes, intensity_level, distance_miles, distance_meters, status",
          )
          .eq("user_id", userId)
          .gte("scheduled_date_time", `${today}T00:00:00`)
          .lte("scheduled_date_time", `${future}T23:59:59`)
          .order("scheduled_date_time")
          .limit(30);

        if (error) throw error;
        return data ?? [];
      },
    }),

    getMacroTargets: tool({
      description:
        "Get the user's daily macro targets (carb_g, prot_g, fat_g, tdee) for a date range.",
      inputSchema: z.object({
        from: z.string().describe("ISO date YYYY-MM-DD"),
        to: z.string().describe("ISO date YYYY-MM-DD"),
      }),
      execute: async ({ from, to }) => {
        const { data, error } = await supabase
          .from("daily_macro_targets")
          .select("target_date, carb_g, prot_g, fat_g, tdee, session_kcal")
          .eq("user_id", userId)
          .gte("target_date", from)
          .lte("target_date", to)
          .order("target_date");

        if (error) throw error;
        return data ?? [];
      },
    }),

    getUserProfile: tool({
      description:
        "Get the user's biometrics, allergies, dietary preference, athletic context.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("users")
          .select(
            "id, gender, birthday, height_feet, height_inches, weight_pounds, body_fat_percentage, dietary_preference, allergies, gut_training_level, cycling_ftp_watts, swimming_css_seconds_per_100m, activity_level",
          )
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
    }),

    // ── UI-rendering tools ───────────────────────────────────────────────────
    // execute() is a pass-through — payload streams to client for widget render.

    showCategoryPicker: tool({
      description:
        "Show 8 colored category pills letting the user pick a planning intent. Use this on first turn before generating a plan if the user hasn't stated an intent.",
      inputSchema: z.object({
        title: z
          .string()
          .default("What kind of week are we planning?"),
        categories: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              tone: z.enum(["primary", "warning", "accent", "muted"]),
            }),
          )
          .default([
            { id: "athletic", label: "Athletic Performance", tone: "accent" },
            { id: "race", label: "Race Prep", tone: "primary" },
            { id: "recovery", label: "Recovery Week", tone: "accent" },
            { id: "budget", label: "Budget Constraints", tone: "warning" },
            { id: "dietary", label: "Specific Dietary", tone: "muted" },
            { id: "weight", label: "Weight Loss", tone: "muted" },
            { id: "family", label: "Family-Friendly", tone: "muted" },
            { id: "pantry", label: "Ingredients on Hand", tone: "warning" },
          ]),
      }),
      execute: async (input) => input,
    }),

    showMealPlanCard: tool({
      description:
        "Show a meal plan as a rich inline card with kcal, day count, daily-avg macros, and an expand arrow that opens the day-breakdown modal.",
      inputSchema: z.object({
        planId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        week_kcal: z.number(),
        day_count: z.number().default(7),
        avg_carbs_g: z.number(),
        avg_protein_g: z.number(),
        avg_fat_g: z.number(),
        avg_fiber_g: z.number().optional(),
      }),
      execute: async (input) => input,
    }),

    showMealCarousel: tool({
      description:
        "Show 2-3 alternative meal plans as a swipeable carousel. User picks one. Default-select the middle plan.",
      inputSchema: z.object({
        plans: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string(),
              week_kcal: z.number(),
              avg_carbs_g: z.number(),
              avg_protein_g: z.number(),
              avg_fat_g: z.number(),
            }),
          )
          .min(2)
          .max(4),
      }),
      execute: async (input) => input,
    }),

    showMealAlternatives: tool({
      description: "Show 3 swap options for a single meal slot.",
      inputSchema: z.object({
        slot_label: z.string(),
        day_label: z.string(),
        alternatives: z
          .array(
            z.object({
              title: z.string(),
              components: z.array(z.string()),
              method_tag: z.string().optional(),
              carb_g: z.number(),
              protein_g: z.number(),
              fat_g: z.number(),
            }),
          )
          .length(3),
      }),
      execute: async (input) => input,
    }),

    showWeekHeatmap: tool({
      description: "Show a compact 7-day strip with carb-tier shading per day.",
      inputSchema: z.object({
        week_start: z.string(),
        days: z
          .array(
            z.object({
              date: z.string(),
              label: z.string(),
              tier: z.enum(["rest", "easy", "moderate", "hard", "race"]),
              carb_g: z.number().optional(),
            }),
          )
          .length(7),
      }),
      execute: async (input) => input,
    }),

    showWorkoutTimeline: tool({
      description:
        "Show pre/during/post fuel windows for a single workout.",
      inputSchema: z.object({
        workout_title: z.string(),
        workout_time: z.string(),
        pre: z.object({
          window: z.string(),
          carbs_g: z.number(),
          notes: z.string().optional(),
        }),
        during: z
          .object({
            window: z.string(),
            carbs_g: z.number().optional(),
            notes: z.string().optional(),
          })
          .optional(),
        post: z.object({
          window: z.string(),
          carbs_g: z.number(),
          protein_g: z.number(),
          notes: z.string().optional(),
        }),
      }),
      execute: async (input) => input,
    }),

    showWeatherCard: tool({
      description:
        "Show today's weather + a hydration recommendation pill.",
      inputSchema: z.object({
        date: z.string(),
        temp_f: z.number(),
        condition: z.string(),
        humidity_pct: z.number().optional(),
        advisory: z.string().optional(),
        hydration_oz: z.number().optional(),
      }),
      execute: async (input) => input,
    }),

    showRaceCountdown: tool({
      description:
        "Show days-until-race + carb-load tier recommendation.",
      inputSchema: z.object({
        race_name: z.string(),
        race_date: z.string(),
        days_out: z.number(),
        tier: z.enum(["base", "build", "taper", "load", "race"]),
      }),
      execute: async (input) => input,
    }),

    showInsightTile: tool({
      description:
        "Show a contextual insight ('I noticed X' / 'Heads up Y') with an optional action button.",
      inputSchema: z.object({
        tone: z
          .enum(["info", "warning", "celebration"])
          .default("info"),
        title: z.string(),
        body: z.string(),
        action_label: z.string().optional(),
        action_intent: z
          .string()
          .optional()
          .describe(
            "free-text intent the action should send back",
          ),
      }),
      execute: async (input) => input,
    }),

    showFollowUpQuestion: tool({
      description:
        "Ask the user a single clarifying question with 2-4 quick-reply chips.",
      inputSchema: z.object({
        question: z.string(),
        options: z
          .array(z.object({ id: z.string(), label: z.string() }))
          .min(2)
          .max(4),
      }),
      execute: async (input) => input,
    }),

    showMacroProgressRings: tool({
      description:
        "Show 3 SVG circular progress rings for c/p/f vs target.",
      inputSchema: z.object({
        target_label: z.string(),
        carbs: z.object({
          current_g: z.number(),
          target_g: z.number(),
        }),
        protein: z.object({
          current_g: z.number(),
          target_g: z.number(),
        }),
        fat: z.object({
          current_g: z.number(),
          target_g: z.number(),
        }),
      }),
      execute: async (input) => input,
    }),

    showHydrationTracker: tool({
      description:
        "Show hydration progress vs target with heat-adjusted goal.",
      inputSchema: z.object({
        current_oz: z.number(),
        target_oz: z.number(),
        heat_adjusted: z.boolean().default(false),
      }),
      execute: async (input) => input,
    }),

    showGroceryList: tool({
      description: "Show a checkable grocery list grouped by aisle.",
      inputSchema: z.object({
        aisles: z.array(
          z.object({
            aisle: z.string(),
            items: z.array(
              z.object({
                name: z.string(),
                qty: z.string().optional(),
              }),
            ),
          }),
        ),
      }),
      execute: async (input) => input,
    }),

    buildGroceryList: tool({
      description:
        "Build a real grocery list by aggregating ingredients from the user's saved meal plan in Supabase. " +
        "Use this whenever the user asks for a shopping/grocery list, what to buy, or 'what do I need'. " +
        "Prefer this over showGroceryList — it reads the actual meals, dedupes ingredients across the week, " +
        "groups them by supermarket aisle, and aggregates portions. Pass an explicit meal_plan_id when known " +
        "(e.g., from URL or earlier context); otherwise pass week_start (Monday ISO date) and/or approach_used " +
        "(a/b/c/d/e). With nothing passed, it falls back to the user's most recently updated plan.",
      inputSchema: z.object({
        meal_plan_id: z.string().uuid().optional()
          .describe("Explicit meal_plan UUID. Use when known."),
        week_start: z.string().optional()
          .describe("ISO Monday date (YYYY-MM-DD) to scope to a specific week."),
        approach_used: z.enum(["a", "b", "c", "d", "e"]).optional()
          .describe("Constrain to a specific UI variant's plan."),
      }),
      execute: async ({ meal_plan_id, week_start, approach_used }) => {
        return await buildGroceryListFromPlan({
          supabase,
          userId,
          mealPlanId: meal_plan_id,
          weekStart: week_start,
          approachUsed: approach_used,
        });
      },
    }),

    showPhotoUploadPrompt: tool({
      description:
        "Prompt the user to snap a photo of their fridge/pantry.",
      inputSchema: z.object({
        prompt: z
          .string()
          .default(
            "Snap your fridge — I'll plan around what you have.",
          ),
      }),
      execute: async (input) => input,
    }),

    showDayBreakdown: tool({
      description:
        "Show a single day's meals as a 2x2 photo-grid layout (B/L/D/Snack).",
      inputSchema: z.object({
        date: z.string(),
        day_label: z.string(),
        day_kcal: z.number().optional(),
        meals: z.array(
          z.object({
            slot: z.enum([
              "breakfast",
              "lunch",
              "dinner",
              "snack",
              "pre",
              "during",
              "post",
            ]),
            title: z.string(),
            kcal: z.number().optional(),
            components: z.array(z.string()),
          }),
        ),
      }),
      execute: async (input) => input,
    }),

    showMorningGreeting: tool({
      description:
        "Proactive morning card — context-aware greeting referencing today's training.",
      inputSchema: z.object({
        user_name: z.string().optional(),
        today_workout: z.string().optional(),
        headline: z.string(),
        body: z.string(),
      }),
      execute: async (input) => input,
    }),

    showWeekRangePicker: tool({
      description: "Show a mini calendar to pick which week to plan.",
      inputSchema: z.object({
        default_week_start: z.string(),
      }),
      execute: async (input) => input,
    }),

    showAllergyMultiSelect: tool({
      description:
        "Multi-select allergy chips. Use during onboarding or to override the user's saved allergies for one plan.",
      inputSchema: z.object({
        preselected: z.array(z.string()).default([]),
      }),
      execute: async (input) => input,
    }),

    showMacroSlider: tool({
      description:
        "Three-track slider for adjusting macro split (carb / protein / fat percentages summing to 100).",
      inputSchema: z.object({
        current: z.object({
          carb_pct: z.number(),
          prot_pct: z.number(),
          fat_pct: z.number(),
        }),
      }),
      execute: async (input) => input,
    }),

    showDayChips: tool({
      description: "Single or multi-select day-of-week chips.",
      inputSchema: z.object({
        mode: z.enum(["single", "multi"]).default("single"),
        preselected: z
          .array(
            z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
          )
          .default([]),
      }),
      execute: async (input) => input,
    }),

    showSlotChips: tool({
      description: "Pick a meal slot.",
      inputSchema: z.object({
        mode: z.enum(["single", "multi"]).default("single"),
      }),
      execute: async (input) => input,
    }),

    showYesNoChips: tool({
      description: "Yes / No / Maybe quick replies.",
      inputSchema: z.object({
        question: z.string(),
        options: z
          .array(z.enum(["yes", "no", "maybe", "unsure"]))
          .default(["yes", "no"]),
      }),
      execute: async (input) => input,
    }),

    showCompactMealList: tool({
      description:
        "Show a slot-by-slot summary list — compact text rendering of multiple meals.",
      inputSchema: z.object({
        title: z.string().optional(),
        meals: z.array(
          z.object({
            slot_label: z.string(),
            title: z.string(),
            components_summary: z.string(),
          }),
        ),
      }),
      execute: async (input) => input,
    }),

    showComparisonCard: tool({
      description:
        "Side-by-side macro+ingredient comparison of 2 meals.",
      inputSchema: z.object({
        label_a: z.string(),
        meal_a: z.object({
          title: z.string(),
          components: z.array(z.string()),
          carb_g: z.number(),
          prot_g: z.number(),
          fat_g: z.number(),
        }),
        label_b: z.string(),
        meal_b: z.object({
          title: z.string(),
          components: z.array(z.string()),
          carb_g: z.number(),
          prot_g: z.number(),
          fat_g: z.number(),
        }),
      }),
      execute: async (input) => input,
    }),

    showNutritionBreakdown: tool({
      description:
        "Full nutrition fact panel for one meal (carbs/protein/fat/fiber/sugar/sodium/kcal).",
      inputSchema: z.object({
        meal_title: z.string(),
        facts: z.object({
          kcal: z.number(),
          carb_g: z.number(),
          prot_g: z.number(),
          fat_g: z.number(),
          fiber_g: z.number().optional(),
          sugar_g: z.number().optional(),
          sodium_mg: z.number().optional(),
        }),
      }),
      execute: async (input) => input,
    }),
  } as const;
}

/** Convenience type: the return value of makeJadeTools */
export type JadeTools = ReturnType<typeof makeJadeTools>;
