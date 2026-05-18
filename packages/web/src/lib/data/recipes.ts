/**
 * Curated endurance-athlete recipe catalog (demo data).
 *
 * Real photos via Unsplash CDN. Macros are realistic for an
 * endurance-athlete daily diet. Tags drive Cookbook filtering and
 * power Jade's "swap to a recovery-heavy meal" suggestions.
 *
 * Replace with Supabase-backed recipes when shipping.
 */

export type RecipeTag =
  | "pre-workout"
  | "during-workout"
  | "post-workout"
  | "race-day"
  | "high-carb"
  | "high-protein"
  | "vegetarian"
  | "quick"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack";

export type RecipeSlot =
  | "breakfast"
  | "pre_workout"
  | "during_workout"
  | "post_workout"
  | "lunch"
  | "dinner"
  | "snack";

export interface RecipeComponent {
  name: string;
  portion: string;
  carbG?: number;
  protG?: number;
  fatG?: number;
}

export interface Recipe {
  id: string;
  title: string;
  blurb: string;
  imageUrl: string;
  slots: RecipeSlot[];
  tags: RecipeTag[];
  prepMinutes: number;
  servings: number;
  carbG: number;
  protG: number;
  fatG: number;
  kcal: number;
  components: RecipeComponent[];
  steps: string[];
  /** Optional badge: "Jade pick", "Coach favorite", etc. */
  badge?: string;
}

// Unsplash photo IDs — direct CDN URLs, stable.
const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const RECIPES: Recipe[] = [
  {
    id: "overnight-oats-berries",
    title: "Overnight Oats with Berries",
    blurb:
      "Slow-release carbs and a hit of antioxidants — set it the night before a long run.",
    imageUrl: img("photo-1517673400267-0251440c45dc"),
    slots: ["breakfast", "pre_workout"],
    tags: ["pre-workout", "high-carb", "breakfast", "vegetarian", "quick"],
    prepMinutes: 5,
    servings: 1,
    carbG: 78,
    protG: 18,
    fatG: 9,
    kcal: 470,
    components: [
      { name: "Rolled oats", portion: "1 cup", carbG: 54, protG: 10, fatG: 5 },
      { name: "Greek yogurt", portion: "½ cup", carbG: 4, protG: 8, fatG: 2 },
      { name: "Mixed berries", portion: "¾ cup", carbG: 18, protG: 0, fatG: 0 },
      { name: "Honey", portion: "1 tbsp", carbG: 17, protG: 0, fatG: 0 },
    ],
    steps: [
      "Combine oats, yogurt, and milk in a jar.",
      "Refrigerate overnight (≥4h).",
      "Top with berries and honey in the morning.",
    ],
    badge: "Jade pick",
  },
  {
    id: "banana-almond-toast",
    title: "Banana & Almond Butter Toast",
    blurb: "60g quick carbs in 3 minutes — the classic pre-run breakfast.",
    imageUrl: img("photo-1525351484163-7529414344d8"),
    slots: ["pre_workout", "breakfast", "snack"],
    tags: ["pre-workout", "high-carb", "quick", "vegetarian", "breakfast"],
    prepMinutes: 3,
    servings: 1,
    carbG: 58,
    protG: 9,
    fatG: 12,
    kcal: 380,
    components: [
      { name: "Whole grain bread", portion: "2 slices", carbG: 30, protG: 6, fatG: 3 },
      { name: "Almond butter", portion: "1 tbsp", carbG: 3, protG: 3, fatG: 9 },
      { name: "Banana", portion: "1 medium", carbG: 27, protG: 1, fatG: 0 },
      { name: "Honey drizzle", portion: "1 tsp", carbG: 6, protG: 0, fatG: 0 },
    ],
    steps: [
      "Toast bread.",
      "Spread almond butter, layer banana slices.",
      "Drizzle honey and pinch of cinnamon.",
    ],
  },
  {
    id: "salmon-sweet-potato",
    title: "Baked Salmon & Sweet Potato",
    blurb:
      "Omega-3s for recovery, complex carbs for tomorrow's session.",
    imageUrl: img("photo-1467003909585-2f8a72700288"),
    slots: ["dinner", "post_workout"],
    tags: ["post-workout", "high-protein", "dinner", "race-day"],
    prepMinutes: 35,
    servings: 1,
    carbG: 52,
    protG: 42,
    fatG: 16,
    kcal: 540,
    components: [
      { name: "Salmon fillet", portion: "5 oz", carbG: 0, protG: 35, fatG: 12 },
      { name: "Roasted sweet potato", portion: "1 medium", carbG: 42, protG: 4, fatG: 0 },
      { name: "Asparagus", portion: "8 spears", carbG: 6, protG: 3, fatG: 0 },
      { name: "Olive oil + lemon", portion: "1 tbsp", carbG: 0, protG: 0, fatG: 14 },
    ],
    steps: [
      "Roast sweet potato at 200°C for 25 min.",
      "Season salmon, add to oven for last 12 min.",
      "Steam asparagus, finish with olive oil and lemon.",
    ],
    badge: "Race-day favorite",
  },
  {
    id: "pasta-marinara-chicken",
    title: "Pasta with Chicken & Marinara",
    blurb: "Classic carb-load the night before a long race.",
    imageUrl: img("photo-1551183053-bf91a1d81141"),
    slots: ["dinner"],
    tags: ["race-day", "high-carb", "dinner", "high-protein"],
    prepMinutes: 25,
    servings: 1,
    carbG: 95,
    protG: 38,
    fatG: 10,
    kcal: 640,
    components: [
      { name: "Whole wheat pasta", portion: "120g dry", carbG: 84, protG: 14, fatG: 2 },
      { name: "Grilled chicken breast", portion: "4 oz", carbG: 0, protG: 24, fatG: 4 },
      { name: "Marinara sauce", portion: "½ cup", carbG: 11, protG: 2, fatG: 1 },
      { name: "Parmesan", portion: "1 tbsp", carbG: 0, protG: 2, fatG: 3 },
    ],
    steps: [
      "Boil pasta to al dente.",
      "Grill chicken, slice.",
      "Toss pasta with warmed marinara, top with chicken and parmesan.",
    ],
    badge: "Carb-load classic",
  },
  {
    id: "greek-yogurt-parfait",
    title: "Greek Yogurt Recovery Parfait",
    blurb: "3:1 carb-to-protein ratio — the recovery sweet spot.",
    imageUrl: img("photo-1488477181946-6428a0291777"),
    slots: ["post_workout", "snack", "breakfast"],
    tags: ["post-workout", "high-protein", "snack", "vegetarian", "quick"],
    prepMinutes: 4,
    servings: 1,
    carbG: 46,
    protG: 22,
    fatG: 6,
    kcal: 340,
    components: [
      { name: "Greek yogurt 2%", portion: "1 cup", carbG: 9, protG: 20, fatG: 5 },
      { name: "Granola", portion: "¼ cup", carbG: 22, protG: 4, fatG: 4 },
      { name: "Mixed berries", portion: "¾ cup", carbG: 15, protG: 1, fatG: 0 },
      { name: "Honey", portion: "1 tsp", carbG: 6, protG: 0, fatG: 0 },
    ],
    steps: [
      "Layer half the yogurt in a glass.",
      "Add half the berries and granola, repeat.",
      "Drizzle honey on top.",
    ],
  },
  {
    id: "quinoa-power-bowl",
    title: "Quinoa Power Bowl",
    blurb: "Complete-protein base with all the veg you'll actually eat.",
    imageUrl: img("photo-1543339308-43e59d6b73a6"),
    slots: ["lunch", "dinner"],
    tags: ["lunch", "vegetarian", "high-protein", "high-carb"],
    prepMinutes: 20,
    servings: 1,
    carbG: 68,
    protG: 26,
    fatG: 18,
    kcal: 560,
    components: [
      { name: "Cooked quinoa", portion: "1 cup", carbG: 39, protG: 8, fatG: 4 },
      { name: "Chickpeas", portion: "½ cup", carbG: 22, protG: 7, fatG: 2 },
      { name: "Roasted veg mix", portion: "1 cup", carbG: 12, protG: 4, fatG: 2 },
      { name: "Tahini dressing", portion: "2 tbsp", carbG: 4, protG: 4, fatG: 10 },
      { name: "Feta crumble", portion: "2 tbsp", carbG: 1, protG: 3, fatG: 4 },
    ],
    steps: [
      "Roast veg at 200°C for 20 min with olive oil.",
      "Warm quinoa and chickpeas.",
      "Build bowl, drizzle tahini, finish with feta.",
    ],
  },
  {
    id: "chicken-rice-broccoli",
    title: "Grilled Chicken, Rice & Broccoli",
    blurb: "The reliable training meal — every macro in the right place.",
    imageUrl: img("photo-1546069901-ba9599a7e63c"),
    slots: ["lunch", "dinner"],
    tags: ["high-protein", "lunch", "dinner", "high-carb"],
    prepMinutes: 25,
    servings: 1,
    carbG: 62,
    protG: 48,
    fatG: 12,
    kcal: 560,
    components: [
      { name: "Grilled chicken breast", portion: "6 oz", carbG: 0, protG: 38, fatG: 6 },
      { name: "Jasmine rice", portion: "1 cup cooked", carbG: 45, protG: 4, fatG: 0 },
      { name: "Steamed broccoli", portion: "1 cup", carbG: 11, protG: 4, fatG: 1 },
      { name: "Olive oil + lemon", portion: "1 tbsp", carbG: 0, protG: 0, fatG: 14 },
    ],
    steps: [
      "Cook rice. Steam broccoli.",
      "Season chicken, grill 5 min/side.",
      "Plate with olive oil drizzle and lemon.",
    ],
  },
  {
    id: "recovery-smoothie",
    title: "Recovery Smoothie",
    blurb: "Liquid recovery in 90 seconds. Drink within 30 min of finishing.",
    imageUrl: img("photo-1505252585461-04db1eb84625"),
    slots: ["post_workout", "snack", "breakfast"],
    tags: ["post-workout", "quick", "high-protein", "vegetarian"],
    prepMinutes: 3,
    servings: 1,
    carbG: 54,
    protG: 28,
    fatG: 7,
    kcal: 410,
    components: [
      { name: "Banana", portion: "1 large", carbG: 31, protG: 1, fatG: 0 },
      { name: "Whey protein", portion: "1 scoop", carbG: 4, protG: 24, fatG: 2 },
      { name: "Frozen berries", portion: "½ cup", carbG: 10, protG: 1, fatG: 0 },
      { name: "Oats", portion: "¼ cup", carbG: 14, protG: 3, fatG: 2 },
      { name: "Almond milk", portion: "1 cup", carbG: 1, protG: 1, fatG: 2 },
    ],
    steps: [
      "Add all ingredients to blender.",
      "Blend 60s until smooth.",
      "Serve cold.",
    ],
    badge: "Post-long-run go-to",
  },
  {
    id: "avocado-toast-egg",
    title: "Avocado Toast with Egg",
    blurb: "Big breakfast for rest days — healthy fats and steady energy.",
    imageUrl: img("photo-1525351484163-7529414344d8"),
    slots: ["breakfast"],
    tags: ["breakfast", "vegetarian", "quick"],
    prepMinutes: 8,
    servings: 1,
    carbG: 38,
    protG: 18,
    fatG: 22,
    kcal: 430,
    components: [
      { name: "Sourdough", portion: "2 slices", carbG: 32, protG: 8, fatG: 2 },
      { name: "Avocado", portion: "½", carbG: 6, protG: 2, fatG: 15 },
      { name: "Egg, soft-boiled", portion: "1 large", carbG: 0, protG: 6, fatG: 5 },
      { name: "Chili flakes + sea salt", portion: "to taste", carbG: 0, protG: 0, fatG: 0 },
    ],
    steps: [
      "Toast sourdough.",
      "Mash avocado, season, spread on toast.",
      "Top with halved soft-boiled egg, chili flakes.",
    ],
  },
  {
    id: "lentil-veggie-stew",
    title: "Lentil & Veggie Stew",
    blurb: "Iron + slow carbs — Sunday meal-prep magic.",
    imageUrl: img("photo-1547592180-85f173990554"),
    slots: ["dinner", "lunch"],
    tags: ["dinner", "vegetarian", "high-protein", "high-carb"],
    prepMinutes: 40,
    servings: 4,
    carbG: 52,
    protG: 20,
    fatG: 6,
    kcal: 360,
    components: [
      { name: "Green lentils", portion: "¾ cup dry", carbG: 32, protG: 14, fatG: 1 },
      { name: "Carrots + celery", portion: "1 cup", carbG: 12, protG: 1, fatG: 0 },
      { name: "Diced tomatoes", portion: "1 can", carbG: 8, protG: 2, fatG: 0 },
      { name: "Olive oil + spices", portion: "1 tbsp", carbG: 0, protG: 0, fatG: 5 },
    ],
    steps: [
      "Sauté carrots/celery in olive oil.",
      "Add lentils, tomatoes, broth. Simmer 30 min.",
      "Season with cumin, paprika, salt.",
    ],
  },
  {
    id: "race-morning-pancakes",
    title: "Race-Morning Pancakes",
    blurb: "100g carbs three hours out — proven race-day fuel.",
    imageUrl: img("photo-1567620905732-2d1ec7ab7445"),
    slots: ["breakfast", "pre_workout"],
    tags: ["race-day", "pre-workout", "high-carb", "breakfast"],
    prepMinutes: 12,
    servings: 1,
    carbG: 98,
    protG: 16,
    fatG: 6,
    kcal: 520,
    components: [
      { name: "Pancake mix (oat)", portion: "1 cup", carbG: 60, protG: 10, fatG: 4 },
      { name: "Banana slices", portion: "1 medium", carbG: 27, protG: 1, fatG: 0 },
      { name: "Maple syrup", portion: "2 tbsp", carbG: 26, protG: 0, fatG: 0 },
      { name: "Berries", portion: "¼ cup", carbG: 6, protG: 0, fatG: 0 },
    ],
    steps: [
      "Whisk pancake mix with water/milk.",
      "Cook on medium griddle, 3 small pancakes.",
      "Top with banana, berries, and a generous pour of maple syrup.",
    ],
    badge: "Race-morning classic",
  },
  {
    id: "sport-drink-mix",
    title: "Homemade Sport Drink",
    blurb: "30g carbs/hour during long sessions — DIY beats supermarket.",
    imageUrl: img("photo-1622597467836-f3285f2131b8"),
    slots: ["during_workout"],
    tags: ["during-workout", "quick", "vegetarian"],
    prepMinutes: 2,
    servings: 1,
    carbG: 32,
    protG: 0,
    fatG: 0,
    kcal: 130,
    components: [
      { name: "Maltodextrin", portion: "2 tbsp", carbG: 26, protG: 0, fatG: 0 },
      { name: "Sea salt", portion: "¼ tsp", carbG: 0, protG: 0, fatG: 0 },
      { name: "Lemon juice", portion: "1 tbsp", carbG: 6, protG: 0, fatG: 0 },
      { name: "Water", portion: "500 ml", carbG: 0, protG: 0, fatG: 0 },
    ],
    steps: [
      "Combine in a flask, shake.",
      "Sip every 10–15 min during workouts ≥60 min.",
    ],
  },
];

export const RECIPE_FILTERS: { label: string; tag: RecipeTag | "all" }[] = [
  { label: "All", tag: "all" },
  { label: "Pre-workout", tag: "pre-workout" },
  { label: "Recovery", tag: "post-workout" },
  { label: "Race day", tag: "race-day" },
  { label: "High-carb", tag: "high-carb" },
  { label: "High-protein", tag: "high-protein" },
  { label: "Vegetarian", tag: "vegetarian" },
  { label: "Quick", tag: "quick" },
];

export function filterRecipes(
  all: Recipe[],
  tag: RecipeTag | "all",
  query: string,
): Recipe[] {
  const q = query.trim().toLowerCase();
  return all.filter((r) => {
    const tagMatch = tag === "all" || r.tags.includes(tag);
    if (!tagMatch) return false;
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.blurb.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q)) ||
      r.components.some((c) => c.name.toLowerCase().includes(q))
    );
  });
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function recipesForSlot(slot: RecipeSlot): Recipe[] {
  return RECIPES.filter((r) => r.slots.includes(slot));
}
