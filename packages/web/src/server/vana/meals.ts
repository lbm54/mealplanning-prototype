/** Meal search + library access. ONE call to search_meals(): hard filters first, vector rank, saved + library together. */
import type { MealRef, MealType, MealContext } from "@/lib/vana/contracts";
import { dbAny } from "./env";
import { embedText, vec } from "./embeddings";
import { resolveMealIcon } from "@/lib/vana/meal-icon";

/** ≤40-char attribution label: the first named person/source before ' — ', ';', ' (' or a URL. Cards and the model only ever see this. */
export function attributionShort(full: string | null | undefined): string {
  if (!full) return "";
  let s = String(full).split(/\s+—\s+|;|\s+\(|https?:\/\//)[0].trim();
  s = s.replace(/^(reported|commonly reported|the|a)\s+/i, "").replace(/'s\s+(stated|reported|fixed|regular|race-day|daily|actual|pre-race|post-stage)\s.*$/i, "").replace(/\s+(stated|reported)\s.*$/i, "");
  if (s.length > 40) s = s.slice(0, 38).replace(/\s+\S*$/, "") + "…";
  return s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToMealRef(r: any): MealRef {
  return {
    source: r.source, id: String(r.id), name: r.name, mealType: r.meal_type as MealType,
    contexts: (r.contexts ?? []) as MealContext[], batch: !!r.batch, prepMinutes: r.prep_minutes ?? null,
    kcal: r.kcal ?? null, carbsG: r.carbs_g == null ? null : Number(r.carbs_g), proteinG: r.protein_g == null ? null : Number(r.protein_g), fatG: r.fat_g == null ? null : Number(r.fat_g),
    allergens: r.allergens ?? [], dietsOk: r.diets_ok ?? [], swaps: r.swaps ?? null,
    why: r.why ?? "", attribution: r.attribution ?? r.source_text ?? "", attributionShort: r.attribution_short ?? attributionShort(r.attribution ?? r.source_text ?? ""), ingredients: r.ingredients ?? "",
    libraryMealId: r.library_meal_id ?? (r.source === "library" ? String(r.id) : null), score: Number(r.score ?? 0),
    kind: r.kind === "assembly" ? "assembly" : r.kind === "recipe" ? "recipe" : undefined,
    pattern: r.pattern ?? null, frequency: r.frequency ?? null,
    icon: resolveMealIcon(r.icon, { name: r.name, ingredients: r.ingredients ?? null, pattern: r.pattern ?? null }),
    myVote: (r.my_vote ?? 0) as -1 | 0 | 1,
  };
}

export interface SearchOpts { userId: string; query?: string; mealType?: MealType; contexts?: MealContext[]; batch?: boolean; includeSaved?: boolean; limit?: number; embed?: boolean; excludeAllergens?: string[]; requireDiet?: string; excludeIds?: string[]; kind?: "assembly" | "recipe" | null }
export async function searchMeals(o: SearchOpts): Promise<MealRef[]> {
  let embedding: string | null = null;
  if (o.query && o.embed !== false) { try { embedding = vec(await embedText(o.query, o.userId)); } catch { embedding = null; } }
  const ex = new Set((o.excludeIds ?? []).map(String));
  const limit = (o.limit ?? 12) + ex.size;
  const { data, error } = await dbAny().rpc("search_meals", {
    p_user_id: o.userId, p_query: o.query ?? null, p_embedding: embedding, p_meal_type: o.mealType ?? null,
    p_contexts: o.contexts?.length ? o.contexts : null, p_batch: o.batch ?? null, p_include_saved: o.includeSaved ?? true, p_limit: limit,
    p_exclude_allergens: o.excludeAllergens?.length ? o.excludeAllergens : null, p_require_diet: o.requireDiet ?? null,
    p_kind: o.kind ?? null,
  });
  if (error) throw new Error(`search_meals: ${error.message}`);
  return (data ?? []).map(rowToMealRef).filter((m: MealRef) => !ex.has(m.id)).slice(0, o.limit ?? 12);
}

/** Fetch one meal by ref, shaped as a MealRef (no scoring). */
export async function getMeal(userId: string, source: "library" | "saved", id: string): Promise<MealRef | null> {
  const d = dbAny();
  if (source === "library") {
    const { data } = await d.from("meal_library").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return rowToMealRef({ ...data, source: "library", attribution: data.source, score: 1, library_meal_id: data.id });
  }
  const { data } = await d.from("saved_meals").select("*, meal_library:library_meal_id(swaps, why)").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  const items = (data.items ?? []) as { name?: string; food_name?: string }[];
  return rowToMealRef({ source: "saved", id: data.id, name: data.name, meal_type: data.meal_types?.[0] ?? "dinner", contexts: [], batch: data.batch ?? false, prep_minutes: null,
    kcal: data.calories, carbs_g: data.carbs_g, protein_g: data.protein_g, fat_g: data.fat_g, allergens: [], diets_ok: [], swaps: data.meal_library?.swaps ?? null,
    why: data.meal_library?.why ?? "one of your saved meals", attribution: "your saved meal", ingredients: items.map((i) => i.name ?? i.food_name ?? "").filter(Boolean).join(", "), library_meal_id: data.library_meal_id, score: 1, icon: data.icon });
}

/** Library ingredient rows for the grocery builder. */
export async function libraryIngredients(id: string): Promise<{ name: string; qty: string }[]> {
  const { data } = await dbAny().from("meal_library").select("ingredients_json").eq("id", id).maybeSingle();
  return (data?.ingredients_json ?? []) as { name: string; qty: string }[];
}

/** "Save to mine": copy a library meal into saved_meals (name, items from ingredients_json, macros, link, meal type, icon).
 *  Idempotent per (user, library_meal_id) — a second save returns the existing row. Embedding is best-effort. */
export async function saveLibraryMeal(userId: string, libraryMealId: string): Promise<MealRef> {
  const d = dbAny();
  const { data: existing } = await d.from("saved_meals").select("id").eq("user_id", userId).eq("library_meal_id", libraryMealId).eq("is_deleted", false).limit(1).maybeSingle();
  if (existing) return (await getMeal(userId, "saved", existing.id))!;
  const { data: lib } = await d.from("meal_library").select("*").eq("id", libraryMealId).maybeSingle();
  if (!lib) throw new Error(`library meal not found: ${libraryMealId}`);
  const items = ((lib.ingredients_json ?? []) as { name: string; qty?: string; role?: string }[]).map((i) => ({ name: i.name, portion: i.qty ?? "", role: i.role ?? null }));
  let embedding: string | null = null;
  try { embedding = vec(await embedText(`${lib.meal_type}: ${lib.name}. Ingredients: ${lib.ingredients}`, userId)); } catch { embedding = null; }
  const { data, error } = await d.from("saved_meals").insert({ user_id: userId, name: lib.name, items, calories: lib.kcal, carbs_g: lib.carbs_g, protein_g: lib.protein_g, fat_g: lib.fat_g, library_meal_id: lib.id, meal_types: [lib.meal_type], batch: lib.batch, icon: lib.icon ?? null, last_used_at: new Date().toISOString(), ...(embedding ? { embedding } : {}) }).select("id").single();
  if (error) throw new Error(error.message);
  return (await getMeal(userId, "saved", data.id))!;
}
