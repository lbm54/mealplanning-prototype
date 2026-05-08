/**
 * Grocery list builder — aggregates meal_plan_meals.components into an
 * aisle-grouped, deduped shopping list.
 *
 * Component shape (from server/jade/schema.ts FoodComponentSchema):
 *   { food_id, name, portion, weight_g?, carb_g, protein_g, fat_g }
 *
 * Output shape matches GroceryListOutput from components/shared/widgets/grocery-list.tsx:
 *   { label?, aisles: [{ id, name, items: [{ id, name, quantity?, unit? }] }] }
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroceryListOutput, GroceryAisle, GroceryItem } from "@/components/shared/widgets/grocery-list";

// ─────────────────────────────────────────────────────────────────────────────
// Aisle classification — keyword heuristics. Earlier rules win.
// ─────────────────────────────────────────────────────────────────────────────

const AISLE_RULES: Array<[string, string[]]> = [
  ["Produce", [
    "lettuce", "spinach", "kale", "arugula", "cabbage", "broccoli", "cauliflower",
    "carrot", "celery", "onion", "garlic", "shallot", "leek", "scallion", "potato",
    "sweet potato", "yam", "pepper", "tomato", "cucumber", "zucchini", "squash",
    "mushroom", "avocado", "lemon", "lime", "orange", "apple", "banana", "berry",
    "blueberry", "blueberries", "strawberry", "strawberries", "raspberry", "raspberries",
    "blackberry", "blackberries", "grape", "pear", "peach", "plum", "cherry",
    "cilantro", "parsley", "basil", "mint", "rosemary", "thyme", "sage", "ginger",
    "fennel", "asparagus", "bok choy", "radish", "beet", "corn", "edamame",
    "snap pea", "watermelon", "melon", "mixed berries", "fresh herbs",
  ]],
  ["Protein", [
    "chicken", "turkey", "beef", "pork", "lamb", "veal", "bacon", "sausage",
    "ham", "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "shrimp",
    "prawn", "scallop", "mussel", "clam", "lobster", "crab", "tofu", "tempeh",
    "seitan", "egg", "eggs", "ground beef", "ground turkey", "ground chicken",
    "ground pork", "deli turkey", "deli chicken", "sliced turkey", "sliced chicken",
    "rotisserie chicken", "chicken breast", "chicken thigh",
  ]],
  ["Dairy", [
    "milk", "butter", "cream", "half and half", "yogurt", "greek yogurt", "cheese",
    "cheddar", "mozzarella", "parmesan", "feta", "goat cheese", "ricotta",
    "cottage cheese", "sour cream", "cream cheese", "ghee", "kefir",
  ]],
  ["Bakery & Grains", [
    "bread", "tortilla", "pita", "bagel", "english muffin", "naan", "rice",
    "brown rice", "white rice", "quinoa", "couscous", "barley", "oats", "rolled oats",
    "oatmeal", "pasta", "noodle", "spaghetti", "fettuccine", "linguine", "rigatoni",
    "penne", "lasagna", "ramen", "soba", "bun", "cornmeal", "polenta",
  ]],
  ["Pantry", [
    "flour", "sugar", "honey", "maple syrup", "molasses", "salt", "pepper",
    "baking powder", "baking soda", "yeast", "vanilla", "olive oil", "vegetable oil",
    "canola oil", "sesame oil", "coconut oil", "vinegar", "soy sauce", "fish sauce",
    "hot sauce", "ketchup", "mustard", "mayo", "mayonnaise", "tahini", "peanut butter",
    "almond butter", "jam", "jelly", "broth", "stock", "bouillon", "tomato sauce",
    "tomato paste", "marinara", "canned tomato", "coconut milk", "bread crumb",
    "panko", "cornstarch", "crackers", "raisin", "almond", "walnut", "cashew",
    "pecan", "pistachio", "sunflower seed", "pumpkin seed", "chia", "flax",
  ]],
  ["Sports Nutrition", [
    "gel", "chew", "maurten", "skratch", "sports drink", "tailwind", "gu ", "honey stinger",
    "electrolyte", "sports gel", "energy bar", "protein bar", "protein powder", "shake",
    "recovery shake", "bcaa",
  ]],
  ["Spices & Herbs (dry)", [
    "cumin", "paprika", "oregano", "chili powder", "garlic powder", "onion powder",
    "cinnamon", "nutmeg", "clove", "cardamom", "coriander", "fennel seed", "bay leaf",
    "italian seasoning", "curry powder", "garam masala", "smoked paprika",
    "red pepper flake",
  ]],
  ["Frozen", [
    "frozen", "ice cream",
  ]],
  ["Beverages", [
    "coffee", "tea", "juice", "soda", "wine", "beer", "sparkling water", "kombucha",
  ]],
];

const PANTRY_OVERRIDES = ["chickpea", "garbanzo", "black bean", "kidney bean", "pinto", "lentil"];

function classifyAisle(name: string): string {
  const f = (name || "").toLowerCase();
  if (!f) return "Other";
  for (const term of PANTRY_OVERRIDES) if (f.includes(term)) return "Pantry";
  for (const [aisle, keywords] of AISLE_RULES) {
    for (const k of keywords) {
      // word-boundary match so "pea" doesn't match "chickpea"
      const re = new RegExp(`(?<![a-z])${escapeRegex(k)}(?![a-z])`);
      if (re.test(f)) return aisle;
    }
  }
  return "Other";
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical key + portion aggregation
// ─────────────────────────────────────────────────────────────────────────────

const COLLAPSE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(yellow|red|white|sweet|spanish|vidalia)\s+onion\b/, "onion"],
  [/\bgarlic\s+cloves?\b/, "garlic"],
  [/\bcloves?\s+of\s+garlic\b/, "garlic"],
  [/\bbaby\s+spinach\b/, "spinach"],
  [/\bgrilled\s+/, ""],     // "grilled chicken" → "chicken"
  [/\bbaked\s+/, ""],
  [/\broasted\s+/, ""],
  [/\braw\s+/, ""],
];

function canonicalKey(name: string): string {
  let f = (name || "").toLowerCase().trim().replace(/\s+/g, " ");
  for (const [pat, repl] of COLLAPSE_PATTERNS) f = f.replace(pat, repl);
  f = f.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return f;
}

function displayName(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : "";
}

/**
 * Parse a portion string like "1 cup", "6 oz", "2 tbsp", "1/2 medium",
 * "2 cups cooked", "1 large" into { qty, unit, suffix }. Best-effort.
 */
const PRETTY_FRACTIONS: Record<string, string> = {
  "0.25": "¼", "0.5": "½", "0.75": "¾", "0.33": "⅓", "0.67": "⅔",
};

function parsePortion(portion: string): { qty: number | null; unit: string } {
  if (!portion) return { qty: null, unit: "" };
  const trimmed = portion.trim();
  // "1/2 cup", "1 1/2 cups", "1.5 cup"
  const m = trimmed.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/);
  if (!m) return { qty: null, unit: trimmed };
  const qtyRaw = m[1];
  const unit = (m[2] || "").trim().toLowerCase();
  let qty: number;
  if (qtyRaw.includes("/")) {
    const parts = qtyRaw.split(/\s+/);
    if (parts.length === 2) {
      // "1 1/2"
      const whole = parseFloat(parts[0]);
      const [a, b] = parts[1].split("/").map(Number);
      qty = whole + a / b;
    } else {
      const [a, b] = qtyRaw.split("/").map(Number);
      qty = a / b;
    }
  } else {
    qty = parseFloat(qtyRaw);
  }
  return { qty, unit };
}

function formatQty(qty: number): string {
  const whole = Math.floor(qty);
  const frac = +(qty - whole).toFixed(2);
  const pretty = PRETTY_FRACTIONS[frac.toString()];
  if (whole === 0 && pretty) return pretty;
  if (pretty) return `${whole} ${pretty}`;
  if (Math.abs(qty - Math.round(qty)) < 0.01) return String(Math.round(qty));
  return qty.toString();
}

function aggregatePortions(portions: string[]): string {
  const byUnit = new Map<string, number>();
  const unparsed: string[] = [];
  for (const p of portions) {
    const { qty, unit } = parsePortion(p);
    if (qty === null) {
      unparsed.push(p);
      continue;
    }
    byUnit.set(unit, (byUnit.get(unit) ?? 0) + qty);
  }
  const parts: string[] = [];
  for (const [unit, total] of byUnit.entries()) {
    parts.push(unit ? `${formatQty(total)} ${unit}` : formatQty(total));
  }
  if (unparsed.length === 1) parts.push(unparsed[0]);
  else if (unparsed.length > 1) parts.push(`+ ${unparsed.length} more`);
  return parts.join(" + ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const AISLE_ORDER: string[] = [
  "Produce", "Protein", "Dairy", "Bakery & Grains", "Pantry",
  "Sports Nutrition", "Spices & Herbs (dry)", "Frozen", "Beverages", "Other",
];

interface RawComponent {
  food_id?: string;
  name?: string;
  portion?: string;
  weight_g?: number;
}

interface BuildOptions {
  supabase: SupabaseClient;
  userId: string;
  mealPlanId?: string;
  weekStart?: string;
  approachUsed?: "a" | "b" | "c" | "d" | "e";
}

export interface BuildGroceryListResult extends GroceryListOutput {
  meta: {
    meal_plan_id: string | null;
    week_start: string | null;
    meal_count: number;
    component_count: number;
    item_count: number;
    warning?: string;
  };
}

/**
 * Resolve a meal_plan_id from optional inputs. Prefer explicit id, then week_start
 * (with optional approach), else the user's most recently updated plan.
 */
async function resolvePlanId(opts: BuildOptions): Promise<{ id: string | null; week_start: string | null }> {
  const { supabase, userId, mealPlanId, weekStart, approachUsed } = opts;
  if (mealPlanId) {
    const { data } = await supabase
      .from("meal_plans")
      .select("id, week_start")
      .eq("id", mealPlanId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return { id: data.id, week_start: data.week_start };
  }
  if (weekStart) {
    let q = supabase
      .from("meal_plans")
      .select("id, week_start, approach_used, updated_at")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (approachUsed) q = q.eq("approach_used", approachUsed);
    const { data } = await q;
    if (data && data.length) return { id: data[0].id, week_start: data[0].week_start };
  }
  // Latest plan for this user (optionally for this approach)
  let q = supabase
    .from("meal_plans")
    .select("id, week_start, approach_used, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (approachUsed) q = q.eq("approach_used", approachUsed);
  const { data } = await q;
  if (data && data.length) return { id: data[0].id, week_start: data[0].week_start };
  return { id: null, week_start: null };
}

export async function buildGroceryListFromPlan(opts: BuildOptions): Promise<BuildGroceryListResult> {
  const { id: planId, week_start } = await resolvePlanId(opts);
  if (!planId) {
    return {
      label: "Grocery List",
      aisles: [],
      meta: {
        meal_plan_id: null,
        week_start: null,
        meal_count: 0,
        component_count: 0,
        item_count: 0,
        warning: "No meal plan found for this user yet. Build a plan first.",
      },
    };
  }

  const { data: meals, error } = await opts.supabase
    .from("meal_plan_meals")
    .select("id, date, slot, components")
    .eq("meal_plan_id", planId)
    .eq("user_id", opts.userId);

  if (error) throw error;

  const mealCount = meals?.length ?? 0;
  if (!mealCount) {
    return {
      label: "Grocery List",
      aisles: [],
      meta: {
        meal_plan_id: planId,
        week_start,
        meal_count: 0,
        component_count: 0,
        item_count: 0,
        warning: "This plan has no meals yet.",
      },
    };
  }

  // Aggregate by canonical key
  type Bucket = {
    key: string;
    food: string;
    aisle: string;
    portions: string[];
    foodIds: Set<string>;
  };
  const buckets = new Map<string, Bucket>();
  let componentCount = 0;

  for (const m of meals) {
    const components = (m.components as RawComponent[] | null) ?? [];
    for (const c of components) {
      const name = (c?.name || "").trim();
      if (!name) continue;
      componentCount += 1;
      const key = canonicalKey(name);
      if (!key) continue;
      let b = buckets.get(key);
      if (!b) {
        b = {
          key,
          food: displayName(key),
          aisle: classifyAisle(key),
          portions: [],
          foodIds: new Set<string>(),
        };
        buckets.set(key, b);
      }
      if (c.portion) b.portions.push(c.portion);
      if (c.food_id) b.foodIds.add(c.food_id);
    }
  }

  // Group by aisle
  const aisleMap = new Map<string, GroceryItem[]>();
  for (const b of buckets.values()) {
    const item: GroceryItem = {
      id: b.foodIds.size === 1 ? Array.from(b.foodIds)[0] : `agg:${b.key}`,
      name: b.food,
      quantity: aggregatePortions(b.portions) || undefined,
    };
    const arr = aisleMap.get(b.aisle) ?? [];
    arr.push(item);
    aisleMap.set(b.aisle, arr);
  }
  // Sort items alphabetically within each aisle
  for (const arr of aisleMap.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }

  const aisles: GroceryAisle[] = AISLE_ORDER.flatMap((aisleName) => {
    const items = aisleMap.get(aisleName);
    if (!items || !items.length) return [];
    return [{ id: aisleName.toLowerCase().replace(/\s+/g, "-"), name: aisleName, items }];
  });

  const itemCount = aisles.reduce((s, a) => s + a.items.length, 0);

  return {
    label: "Grocery List",
    aisles,
    meta: {
      meal_plan_id: planId,
      week_start,
      meal_count: mealCount,
      component_count: componentCount,
      item_count: itemCount,
    },
  };
}
