/**
 * Variant C — server-side column curation logic.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.2)
 *
 * selectFoodsFor() is the pure SQL-filter implementation of Jade's listFoods
 * tool. It applies the same hard constraints (allergies, dietary_preference)
 * and soft-deprioritises disliked foods. It scores options by proximity to
 * the slot's macro targets and returns 4–6 options per column bucket.
 *
 * This runs server-side in the route loader — no LLM call.
 */

import { getServerSupabase } from "@/lib/supabase/server";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "during_workout" | "post_workout";

export interface SlotMacroTarget {
  carb_g: number;
  protein_g: number;
  fat_g: number;
}

export interface FoodOption {
  id: string;
  name: string;
  carb_g: number;
  protein_g: number;
  fat_g: number;
  sodium_mg: number;
  serving_size: string | null;
  category: string | null;
  isDisliked: boolean;
  isRecommended: boolean;
  /** Jade's pre-generated rationale for this column (set once per slot) */
  columnRationale?: string;
}

export interface ColumnOptions {
  protein: FoodOption[];
  carb: FoodOption[];
  veg: FoodOption[];
  /** Column-level rationale Jade computed for this row */
  rationale: {
    protein: string;
    carb: string;
    veg: string;
  };
}

// ─── Macro split by slot ────────────────────────────────────────────────────
// Approximate fraction of daily target for each slot.
// These match the proportional splits in 05_design_proposal.md §5.5.
const SLOT_SPLITS: Record<MealSlot, { protein: number; carb: number; fat: number }> = {
  breakfast: { protein: 0.25, carb: 0.25, fat: 0.25 },
  lunch:     { protein: 0.30, carb: 0.30, fat: 0.30 },
  dinner:    { protein: 0.30, carb: 0.30, fat: 0.30 },
  snack:     { protein: 0.10, carb: 0.10, fat: 0.10 },
  pre_workout:    { protein: 0.05, carb: 0.20, fat: 0.05 },
  during_workout: { protein: 0.00, carb: 0.15, fat: 0.00 },
  post_workout:   { protein: 0.20, carb: 0.15, fat: 0.10 },
};

// Category buckets — maps food category values to Protein/Carb/Veg columns
const PROTEIN_CATEGORIES = ["meat", "poultry", "fish", "seafood", "eggs", "dairy", "legumes", "protein"];
const CARB_CATEGORIES    = ["grains", "bread", "pasta", "rice", "potato", "fruit", "cereal", "carb", "oats"];
const VEG_CATEGORIES     = ["vegetable", "veg", "greens", "salad", "sauce", "condiment"];

/** Score a food by macro proximity to target — lower is better. */
function proximityScore(
  food: { carb_g: number; protein_g: number; fat_g: number },
  target: { carb_g: number; protein_g: number; fat_g: number },
): number {
  return (
    Math.abs(food.carb_g - target.carb_g) +
    Math.abs(food.protein_g - target.protein_g) +
    Math.abs(food.fat_g - target.fat_g)
  );
}

function slotTargetMacros(daily: SlotMacroTarget, slot: MealSlot): SlotMacroTarget {
  const split = SLOT_SPLITS[slot] ?? SLOT_SPLITS.lunch;
  return {
    carb_g:    Math.round(daily.carb_g    * split.carb),
    protein_g: Math.round(daily.protein_g * split.protein),
    fat_g:     Math.round(daily.fat_g     * split.fat),
  };
}

/** Rule-based "Why these?" rationale per column + slot type.  */
function buildRationale(slot: MealSlot, dailyCarb: number): { protein: string; carb: string; veg: string } {
  const isHighCarb = dailyCarb >= 250;
  const isLowCarb  = dailyCarb < 150;

  const rationales: Record<MealSlot, { protein: string; carb: string; veg: string }> = {
    breakfast: {
      protein: "Morning proteins — quick-prep picks that keep you full through your training window.",
      carb:    isHighCarb
        ? "High-carb day — prioritising starchy options to start glycogen loading early."
        : "Moderate morning carbs; you have room for more at lunch.",
      veg:     "Light veg or fruit for morning micronutrients without GI load.",
    },
    lunch: {
      protein: isHighCarb
        ? "Leaner proteins so lunch carbs can hit the target without excess fat."
        : "Balanced proteins — room for a fuller fat profile today.",
      carb:    isHighCarb
        ? "Training day carbs — dense sources to keep glycogen topped."
        : isLowCarb
          ? "Low-carb day — lighter options and smaller portions."
          : "Moderate carb sources — flexible choices for today's load.",
      veg:    "Volume veg for satiety; low caloric cost, high micronutrient return.",
    },
    dinner: {
      protein: "Evening protein for overnight recovery and muscle repair.",
      carb:    isHighCarb
        ? "Evening carb replenishment — prioritised after a hard training day."
        : "Lower dinner carbs — most glycogen work is done for the day.",
      veg:    "Fibre-rich veg to slow digestion and support overnight recovery.",
    },
    snack: {
      protein: "Snack proteins — small, easy-to-prep picks that bridge meals.",
      carb:    "Quick-release carbs for between-session energy.",
      veg:    "Light veg or dip options — minimal prep.",
    },
    pre_workout: {
      protein: "Low-fat protein to prevent GI distress during the workout.",
      carb:    "Fast-digesting carbs timed 45–90 min before effort.",
      veg:    "Minimal veg pre-workout — keep it light.",
    },
    during_workout: {
      protein: "Minimal protein during effort — focus is on fast carbs.",
      carb:    "Portable, fast carbs to sustain effort. Aim for 30–60 g/hr.",
      veg:    "No veg needed during workout — carb-only is optimal.",
    },
    post_workout: {
      protein: "Recovery protein — prioritised within 30 min of finishing.",
      carb:    "Replenishment carbs — combine with protein to spike insulin for uptake.",
      veg:    "Post-workout veg — anti-inflammatory picks to support recovery.",
    },
  };

  return rationales[slot] ?? rationales.lunch;
}

/**
 * Load column options for a single slot.
 * Called from the route loader — all constraint logic lives here.
 */
export async function selectFoodsFor(params: {
  slot: MealSlot;
  dailyMacros: SlotMacroTarget;
  maxPerColumn?: number;
}): Promise<ColumnOptions> {
  const { slot, dailyMacros, maxPerColumn = 6 } = params;
  const supabase = await getServerSupabase();
  const slotTarget = slotTargetMacros(dailyMacros, slot);

  // Fetch user profile for hard constraints
  const { data: profileRaw } = await supabase
    .from("users")
    .select("allergies, dietary_preference")
    .maybeSingle();

  // Fetch food preferences (soft constraints)
  const { data: prefsRaw } = await supabase
    .from("food_preferences")
    .select("food_name, preference, preference_level")
    .in("preference", ["dislike", "like", "love"]);

  const allergies: string[]       = (profileRaw as { allergies?: string[] } | null)?.allergies ?? [];
  const dietPref: string | null   = (profileRaw as { dietary_preference?: string } | null)?.dietary_preference ?? null;
  const dislikedNames = new Set<string>(
    (prefsRaw ?? [])
      .filter((p) => (p as { preference?: string }).preference === "dislike")
      .map((p) => ((p as { food_name?: string }).food_name ?? "").toLowerCase()),
  );
  const likedNames = new Set<string>(
    (prefsRaw ?? [])
      .filter((p) => (p as { preference?: string }).preference === "like" || (p as { preference?: string }).preference === "love")
      .map((p) => ((p as { food_name?: string }).food_name ?? "").toLowerCase()),
  );

  // Build base query — fetch enough rows to fill all three columns
  let query = supabase
    .from("foods")
    .select("id, name, carbs_g, protein_g, fat_g, sodium_mg, serving_size, category, allergens, excluded_diets")
    .limit(120);

  // Hard: exclude allergens
  if (allergies.length > 0) {
    query = query.not("allergens", "ov", `{${allergies.join(",")}}`);
  }
  // Hard: exclude dietary preference mismatches
  if (dietPref) {
    query = query.not("excluded_diets", "cs", `{${dietPref}}`);
  }

  const { data: foods, error } = await query;
  if (error) {
    console.error("[columns-data.c] Supabase error:", error.message);
    return emptyColumns(slot, dailyMacros.carb_g);
  }

  type RawFood = {
    id: string;
    name: string;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    sodium_mg: number;
    serving_size: string | null;
    category: string | null;
  };

  const rows = (foods ?? []) as RawFood[];

  // Bucket foods by column
  const proteins: RawFood[] = [];
  const carbs:    RawFood[] = [];
  const vegs:     RawFood[] = [];

  for (const f of rows) {
    const cat = (f.category ?? "").toLowerCase();
    if (PROTEIN_CATEGORIES.some((c) => cat.includes(c))) proteins.push(f);
    else if (CARB_CATEGORIES.some((c) => cat.includes(c))) carbs.push(f);
    else if (VEG_CATEGORIES.some((c) => cat.includes(c))) vegs.push(f);
  }

  function rankAndSelect(bucket: RawFood[], targetMacro: SlotMacroTarget, n: number): FoodOption[] {
    // Sort: liked first, then by proximity, disliked last
    const scored = bucket.map((f) => ({
      food: f,
      score: proximityScore(
        { carb_g: f.carbs_g, protein_g: f.protein_g, fat_g: f.fat_g },
        targetMacro,
      ),
      isDisliked: dislikedNames.has(f.name.toLowerCase()),
      isLiked:    likedNames.has(f.name.toLowerCase()),
    }));

    scored.sort((a, b) => {
      if (a.isLiked !== b.isLiked) return a.isLiked ? -1 : 1;
      if (a.isDisliked !== b.isDisliked) return a.isDisliked ? 1 : -1;
      return a.score - b.score;
    });

    return scored.slice(0, n).map((s, idx) => ({
      id:           s.food.id,
      name:         s.food.name,
      carb_g:       s.food.carbs_g,
      protein_g:    s.food.protein_g,
      fat_g:        s.food.fat_g,
      sodium_mg:    s.food.sodium_mg,
      serving_size: s.food.serving_size,
      category:     s.food.category,
      isDisliked:   s.isDisliked,
      isRecommended: idx === 0, // top-scored gets Recommended chip
    }));
  }

  const rationale = buildRationale(slot, dailyMacros.carb_g);

  return {
    protein: rankAndSelect(proteins, slotTarget, maxPerColumn),
    carb:    rankAndSelect(carbs,    slotTarget, maxPerColumn),
    veg:     rankAndSelect(vegs,     slotTarget, maxPerColumn),
    rationale,
  };
}

function emptyColumns(slot: MealSlot, dailyCarb: number): ColumnOptions {
  return {
    protein: [],
    carb:    [],
    veg:     [],
    rationale: buildRationale(slot, dailyCarb),
  };
}

// ─── Week-level loader ────────────────────────────────────────────────────────

export type DayLabel = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export const MAIN_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export interface DayMacroRow {
  date: string;      // YYYY-MM-DD
  label: DayLabel;
  carb_g: number;
  protein_g: number;
  fat_g: number;
  isWorkoutDay: boolean;
  workoutNote: string | null;
}

export interface WeekColumnsData {
  weekStart: string;
  days: DayMacroRow[];
  /** Keyed by `${date}:${slot}` */
  columns: Record<string, ColumnOptions>;
  /** Existing saved meal plan (if any) */
  savedPlan: SavedMealPlan | null;
}

export interface SavedMealPlan {
  id: string;
  meals: Record<string, SavedMeal>;  // keyed by `${date}:${slot}`
}

export interface SavedMeal {
  proteinId: string | null;
  carbId:    string | null;
  vegId:     string | null;
  locked:    boolean;
}

/** ISO Monday of the current week */
export function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

/** Generate the 7 dates for a week starting on monday. */
function weekDates(weekStart: string): string[] {
  const base = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const DAY_LABELS: DayLabel[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Load the full week's column data for the route loader.
 * Loads macro targets, then fetches column options for all 21 slots in parallel.
 */
export async function loadWeekColumns(weekStart?: string): Promise<WeekColumnsData> {
  const ws = weekStart ?? currentWeekStart();
  const dates = weekDates(ws);
  const supabase = await getServerSupabase();

  // Fetch macro targets for the week
  const { data: macroRows } = await supabase
    .from("daily_macro_targets")
    .select("target_date, carb_g, prot_g, fat_g")
    .gte("target_date", ws)
    .lte("target_date", dates[6])
    .order("target_date");

  // Build macro lookup
  const macroByDate: Record<string, SlotMacroTarget> = {};
  for (const row of (macroRows ?? [])) {
    const r = row as { target_date: string; carb_g: number; prot_g: number; fat_g: number };
    macroByDate[r.target_date] = { carb_g: r.carb_g, protein_g: r.prot_g, fat_g: r.fat_g };
  }

  // Fetch activities to detect workout days
  const { data: activityRows } = await supabase
    .from("activities")
    .select("scheduled_date, name, training_type")
    .gte("scheduled_date", ws)
    .lte("scheduled_date", dates[6]);

  const workoutByDate: Record<string, string> = {};
  for (const row of (activityRows ?? [])) {
    const r = row as { scheduled_date: string; name?: string; training_type?: string };
    workoutByDate[r.scheduled_date] = r.name ?? r.training_type ?? "workout";
  }

  // Default macros fallback
  const defaultMacros: SlotMacroTarget = { carb_g: 250, protein_g: 150, fat_g: 70 };

  // Build day rows
  const days: DayMacroRow[] = dates.map((date, i) => ({
    date,
    label: DAY_LABELS[i],
    ...(macroByDate[date] ?? defaultMacros),
    isWorkoutDay: Boolean(workoutByDate[date]),
    workoutNote: workoutByDate[date] ?? null,
  }));

  // Load column options for all 21 slots in parallel
  const slotKeys = dates.flatMap((date) =>
    MAIN_SLOTS.map((slot) => ({ date, slot })),
  );

  const columnResults = await Promise.allSettled(
    slotKeys.map(({ date, slot }) =>
      selectFoodsFor({ slot, dailyMacros: macroByDate[date] ?? defaultMacros }),
    ),
  );

  const columns: Record<string, ColumnOptions> = {};
  slotKeys.forEach(({ date, slot }, i) => {
    const result = columnResults[i];
    const key = `${date}:${slot}`;
    if (result.status === "fulfilled") {
      columns[key] = result.value;
    } else {
      columns[key] = emptyColumns(slot, (macroByDate[date] ?? defaultMacros).carb_g);
    }
  });

  // Load existing saved plan
  const { data: planRow } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("week_start", ws)
    .maybeSingle();

  let savedPlan: SavedMealPlan | null = null;
  if (planRow && (planRow as { id: string }).id) {
    const planId = (planRow as { id: string }).id;
    const { data: mealRows } = await supabase
      .from("meal_plan_meals")
      .select("date, slot, components, locked")
      .eq("meal_plan_id", planId);

    const meals: Record<string, SavedMeal> = {};
    for (const row of (mealRows ?? [])) {
      const r = row as { date: string; slot: string; components: unknown; locked: boolean };
      const comps = (r.components as Array<{ category?: string; food_id?: string }> | null) ?? [];
      const key = `${r.date}:${r.slot}`;
      meals[key] = {
        proteinId: comps.find((c) => c.category === "protein")?.food_id ?? null,
        carbId:    comps.find((c) => c.category === "carb")?.food_id    ?? null,
        vegId:     comps.find((c) => c.category === "veg")?.food_id     ?? null,
        locked:    r.locked,
      };
    }
    savedPlan = { id: planId, meals };
  }

  return { weekStart: ws, days, columns, savedPlan };
}
