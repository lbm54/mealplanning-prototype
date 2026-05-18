/**
 * Stub URL → recipe import.
 *
 * Demo-only: any URL becomes a believable recipe. Domain-specific
 * recognizers make Instagram, Pinterest, and AllRecipes URLs return
 * thematic results so the demo feels like real scraping.
 */
import type { Recipe } from "./recipes";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

/** Domain-flavoured imports. Order matters — first match wins. */
const PATTERNS: Array<{
  test: (url: string) => boolean;
  build: (url: string) => Recipe;
}> = [
  {
    test: (u) => /instagram\.com|reels?\/|insta\.gram/i.test(u),
    build: (u) => ({
      id: `imported-${Date.now()}`,
      title: "Spicy Honey Salmon Bowl",
      blurb: "From Instagram · @endurance_chef — viral recovery meal.",
      imageUrl: IMG("photo-1467003909585-2f8a72700288"),
      slots: ["dinner", "post_workout"],
      tags: ["post-workout", "high-protein", "dinner"],
      prepMinutes: 18,
      servings: 1,
      carbG: 58,
      protG: 36,
      fatG: 14,
      kcal: 540,
      components: [
        { name: "Salmon", portion: "5 oz", carbG: 0, protG: 32, fatG: 12 },
        { name: "Rice", portion: "1 cup cooked", carbG: 45, protG: 4, fatG: 0 },
        { name: "Cucumber, edamame", portion: "1 cup", carbG: 9, protG: 4, fatG: 2 },
        { name: "Spicy honey glaze", portion: "2 tbsp", carbG: 14, protG: 0, fatG: 1 },
      ],
      steps: [
        "Glaze salmon with honey + sriracha + soy.",
        "Bake at 200°C for 10 min.",
        "Plate over rice with cucumber, edamame, sesame.",
      ],
      badge: "Imported · Instagram",
    }),
  },
  {
    test: (u) => /pinterest\.com|pin\.it/i.test(u),
    build: (u) => ({
      id: `imported-${Date.now()}`,
      title: "Sheet-Pan Chicken & Veggies",
      blurb: "From Pinterest · low-effort meal-prep dinner.",
      imageUrl: IMG("photo-1546069901-ba9599a7e63c"),
      slots: ["dinner", "lunch"],
      tags: ["dinner", "high-protein", "lunch"],
      prepMinutes: 30,
      servings: 2,
      carbG: 42,
      protG: 44,
      fatG: 14,
      kcal: 500,
      components: [
        { name: "Chicken thighs", portion: "8 oz", carbG: 0, protG: 38, fatG: 10 },
        { name: "Baby potatoes", portion: "1 cup", carbG: 32, protG: 4, fatG: 0 },
        { name: "Bell peppers", portion: "1 cup", carbG: 10, protG: 2, fatG: 0 },
        { name: "Olive oil + herbs", portion: "1 tbsp", carbG: 0, protG: 0, fatG: 4 },
      ],
      steps: [
        "Toss everything with olive oil, rosemary, garlic.",
        "Roast at 220°C on a sheet pan for 25 min.",
        "Squeeze lemon over the top.",
      ],
      badge: "Imported · Pinterest",
    }),
  },
  {
    test: (u) => /allrecipes|seriouseats|food52|nytimes\.com\/cooking/i.test(u),
    build: (u) => ({
      id: `imported-${Date.now()}`,
      title: "Brown Butter Banana Pancakes",
      blurb: "Imported from the web · indulgent rest-day breakfast.",
      imageUrl: IMG("photo-1567620905732-2d1ec7ab7445"),
      slots: ["breakfast"],
      tags: ["breakfast", "vegetarian", "high-carb"],
      prepMinutes: 15,
      servings: 2,
      carbG: 78,
      protG: 14,
      fatG: 14,
      kcal: 510,
      components: [
        { name: "Flour", portion: "1 cup", carbG: 76, protG: 12, fatG: 1 },
        { name: "Banana", portion: "1 ripe", carbG: 27, protG: 1, fatG: 0 },
        { name: "Brown butter", portion: "2 tbsp", carbG: 0, protG: 0, fatG: 22 },
        { name: "Maple syrup", portion: "2 tbsp", carbG: 26, protG: 0, fatG: 0 },
      ],
      steps: [
        "Brown butter on the stove until nutty.",
        "Whisk into batter with mashed banana.",
        "Cook on griddle, finish with syrup.",
      ],
      badge: "Imported · Web",
    }),
  },
];

const FALLBACK = (url: string): Recipe => ({
  id: `imported-${Date.now()}`,
  title: "Imported Recipe",
  blurb: `Pulled from ${tryHost(url) ?? "the link you shared"}.`,
  imageUrl: IMG("photo-1543339308-43e59d6b73a6"),
  slots: ["lunch", "dinner"],
  tags: ["lunch", "high-carb"],
  prepMinutes: 25,
  servings: 1,
  carbG: 55,
  protG: 25,
  fatG: 14,
  kcal: 460,
  components: [
    { name: "Protein", portion: "5 oz", carbG: 0, protG: 24, fatG: 6 },
    { name: "Grain", portion: "1 cup cooked", carbG: 45, protG: 4, fatG: 1 },
    { name: "Vegetables", portion: "1 cup", carbG: 10, protG: 3, fatG: 1 },
    { name: "Sauce", portion: "2 tbsp", carbG: 0, protG: 0, fatG: 6 },
  ],
  steps: [
    "Prep ingredients.",
    "Cook protein and grain.",
    "Combine and serve.",
  ],
  badge: "Imported",
});

function tryHost(u: string): string | null {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function importRecipeFromUrl(url: string): Recipe {
  const match = PATTERNS.find((p) => p.test(url));
  return (match ?? { build: FALLBACK }).build(url);
}
