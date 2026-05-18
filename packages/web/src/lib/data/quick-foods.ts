/**
 * Quick-foods — athlete shortcuts. Not recipes, just ingredient combos
 * with approximate macros. Surfaced in the SwapSheet's "Quick foods" tab
 * for the moments when the user doesn't want a full recipe — they're
 * just eating "yogurt and honey" or "rice cakes with peanut butter."
 */

export type QuickFoodSlot =
  | "breakfast"
  | "pre_workout"
  | "during_workout"
  | "post_workout"
  | "lunch"
  | "dinner"
  | "snack";

export interface QuickFood {
  id: string;
  title: string;
  components: { name: string; portion: string }[];
  carbG: number;
  protG: number;
  fatG: number;
  slots: QuickFoodSlot[];
  /** Optional emoji icon shown when no recipe image exists */
  emoji?: string;
}

export const QUICK_FOODS: QuickFood[] = [
  // ─── Breakfast / pre-workout ──────────────────────────────────────────
  {
    id: "qf-pb-banana",
    title: "Banana + peanut butter",
    emoji: "🍌",
    slots: ["breakfast", "pre_workout", "snack"],
    components: [
      { name: "Banana", portion: "1 large" },
      { name: "Peanut butter", portion: "1 tbsp" },
    ],
    carbG: 32,
    protG: 5,
    fatG: 9,
  },
  {
    id: "qf-yogurt-honey",
    title: "Greek yogurt + honey",
    emoji: "🍯",
    slots: ["breakfast", "post_workout", "snack"],
    components: [
      { name: "Greek yogurt", portion: "1 cup" },
      { name: "Honey", portion: "1 tbsp" },
    ],
    carbG: 26,
    protG: 20,
    fatG: 4,
  },
  {
    id: "qf-oatmeal-eggs",
    title: "Oatmeal + eggs",
    emoji: "🥣",
    slots: ["breakfast"],
    components: [
      { name: "Rolled oats", portion: "½ cup dry" },
      { name: "Egg, scrambled", portion: "2 large" },
      { name: "Berries", portion: "½ cup" },
    ],
    carbG: 38,
    protG: 18,
    fatG: 12,
  },
  {
    id: "qf-toast-jam",
    title: "Toast + jam",
    emoji: "🍞",
    slots: ["breakfast", "pre_workout"],
    components: [
      { name: "Whole wheat bread", portion: "2 slices" },
      { name: "Jam", portion: "2 tbsp" },
    ],
    carbG: 56,
    protG: 6,
    fatG: 2,
  },
  {
    id: "qf-cottage-cheese-berries",
    title: "Cottage cheese + berries",
    emoji: "🍓",
    slots: ["breakfast", "snack", "post_workout"],
    components: [
      { name: "Cottage cheese", portion: "1 cup" },
      { name: "Mixed berries", portion: "¾ cup" },
    ],
    carbG: 20,
    protG: 24,
    fatG: 5,
  },

  // ─── Pre / during workout ─────────────────────────────────────────────
  {
    id: "qf-rice-cake-pb",
    title: "Rice cakes + peanut butter",
    emoji: "🥜",
    slots: ["pre_workout", "snack"],
    components: [
      { name: "Rice cakes", portion: "2" },
      { name: "Peanut butter", portion: "1 tbsp" },
    ],
    carbG: 22,
    protG: 5,
    fatG: 8,
  },
  {
    id: "qf-energy-gel",
    title: "Energy gel + water",
    emoji: "💧",
    slots: ["during_workout"],
    components: [
      { name: "Energy gel", portion: "1 packet" },
      { name: "Water", portion: "8 oz" },
    ],
    carbG: 25,
    protG: 0,
    fatG: 0,
  },
  {
    id: "qf-sport-drink",
    title: "Sport drink",
    emoji: "🥤",
    slots: ["during_workout"],
    components: [{ name: "Sport drink", portion: "20 oz" }],
    carbG: 36,
    protG: 0,
    fatG: 0,
  },

  // ─── Post-workout recovery ────────────────────────────────────────────
  {
    id: "qf-chocolate-milk",
    title: "Chocolate milk",
    emoji: "🥛",
    slots: ["post_workout", "snack"],
    components: [{ name: "Low-fat chocolate milk", portion: "16 oz" }],
    carbG: 52,
    protG: 16,
    fatG: 5,
  },
  {
    id: "qf-protein-shake",
    title: "Protein shake",
    emoji: "💪",
    slots: ["post_workout", "snack"],
    components: [
      { name: "Whey protein", portion: "1 scoop" },
      { name: "Banana", portion: "1 medium" },
      { name: "Milk", portion: "1 cup" },
    ],
    carbG: 38,
    protG: 30,
    fatG: 5,
  },

  // ─── Lunch / dinner ───────────────────────────────────────────────────
  {
    id: "qf-tuna-rice",
    title: "Tuna + rice",
    emoji: "🍚",
    slots: ["lunch", "dinner"],
    components: [
      { name: "Canned tuna", portion: "5 oz" },
      { name: "Jasmine rice", portion: "1 cup cooked" },
      { name: "Olive oil + lemon", portion: "1 tsp" },
    ],
    carbG: 45,
    protG: 32,
    fatG: 7,
  },
  {
    id: "qf-burrito-bowl",
    title: "Chicken burrito bowl",
    emoji: "🌯",
    slots: ["lunch", "dinner"],
    components: [
      { name: "Grilled chicken", portion: "4 oz" },
      { name: "Rice", portion: "¾ cup" },
      { name: "Black beans", portion: "½ cup" },
      { name: "Salsa + cheese", portion: "¼ cup" },
    ],
    carbG: 58,
    protG: 38,
    fatG: 12,
  },
  {
    id: "qf-turkey-sandwich",
    title: "Turkey sandwich",
    emoji: "🥪",
    slots: ["lunch"],
    components: [
      { name: "Whole grain bread", portion: "2 slices" },
      { name: "Turkey breast", portion: "4 oz" },
      { name: "Cheese + lettuce + tomato", portion: "—" },
      { name: "Mustard", portion: "1 tbsp" },
    ],
    carbG: 42,
    protG: 32,
    fatG: 10,
  },
  {
    id: "qf-leftover-pasta",
    title: "Leftover pasta",
    emoji: "🍝",
    slots: ["lunch", "dinner"],
    components: [
      { name: "Pasta", portion: "1 ½ cups cooked" },
      { name: "Marinara + parmesan", portion: "½ cup" },
    ],
    carbG: 78,
    protG: 14,
    fatG: 6,
  },

  // ─── Snacks ───────────────────────────────────────────────────────────
  {
    id: "qf-trail-mix",
    title: "Trail mix",
    emoji: "🥜",
    slots: ["snack"],
    components: [
      { name: "Almonds + cashews + raisins", portion: "¼ cup" },
    ],
    carbG: 18,
    protG: 5,
    fatG: 12,
  },
  {
    id: "qf-protein-bar",
    title: "Protein bar",
    emoji: "🍫",
    slots: ["snack", "post_workout"],
    components: [{ name: "Protein bar", portion: "1 bar" }],
    carbG: 24,
    protG: 20,
    fatG: 8,
  },
  {
    id: "qf-apple-almond",
    title: "Apple + almond butter",
    emoji: "🍎",
    slots: ["snack"],
    components: [
      { name: "Apple", portion: "1 medium" },
      { name: "Almond butter", portion: "1 tbsp" },
    ],
    carbG: 28,
    protG: 4,
    fatG: 9,
  },
];

export function quickFoodsForSlot(slot: string): QuickFood[] {
  const s = slot as QuickFoodSlot;
  const fit = QUICK_FOODS.filter((q) => q.slots.includes(s));
  return fit.length > 0 ? fit : QUICK_FOODS;
}
