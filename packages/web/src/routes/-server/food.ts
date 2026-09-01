// Route-local server functions for the Food tab. Read with the USER's session (RLS), never the service key.
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server.server";
import type { MealDetail, MealPlan, MealRef, Memory, PlanMeal, ShoppingItem } from "@/lib/vana/contracts";
import { resolveMealIcon } from "@/lib/vana/meal-icon";
import { embedText, vec } from "@/server/vana/embeddings";
import { rowToMealRef, getMealDetail, recentMeals, setSavedMealNotes, setMealFeedback as setMealFeedbackImpl } from "@/server/vana/meals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, "public", any>;
async function sb(): Promise<{ sb: SB; userId: string | null }> {
  const client = (await getServerSupabase()) as unknown as SB;
  const { data } = await client.auth.getUser();
  return { sb: client, userId: data.user?.id ?? null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPlanMeal(r: any): PlanMeal {
  return {
    id: r.id, planId: r.plan_id, source: r.source, libraryMealId: r.library_meal_id ?? null, savedMealId: r.saved_meal_id ?? null, name: r.name, mealType: r.meal_type, session: r.session ?? null,
    servings: r.servings ?? 1, servingsLeft: r.servings_left ?? r.servings ?? 1, kcal: r.kcal ?? null, carbsG: r.carbs_g == null ? null : Number(r.carbs_g), proteinG: r.protein_g == null ? null : Number(r.protein_g), fatG: r.fat_g == null ? null : Number(r.fat_g),
    swapsApplied: r.swaps_applied ?? [], comments: r.comments ?? [], position: r.position ?? 0, icon: resolveMealIcon(r.icon, { name: r.name }),
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlan(p: any, meals: any[]): MealPlan {
  const pm = meals.map(rowToPlanMeal).sort((a, b) => a.position - b.position);
  const ld = pm.filter((m) => m.mealType === "lunch" || m.mealType === "dinner");
  const covered = Math.min(14, ld.reduce((a, m) => a + m.servings, 0));
  const sum = (k: "kcal" | "carbsG" | "proteinG") => pm.reduce((a, m) => a + (m[k] ?? 0) * m.servings, 0) / 7;
  return {
    id: p.id, weekStart: p.week_start, status: p.status, batchCooking: !!p.batch_cooking, brief: p.brief ?? null, rules: p.rules ?? [], meals: pm, shopping: (p.shopping ?? []) as ShoppingItem[], dayNotes: (p.day_notes ?? {}) as Record<string, string>, dayNotesStale: p.day_notes_stale !== false,
    coverage: { lunchDinnerSlots: 14, covered, perDay: { kcal: sum("kcal"), carbsG: sum("carbsG"), proteinG: sum("proteinG") } },
  };
}

export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { sb: c, userId } = await sb();
  if (!userId) return null;
  const { data } = await c.from("users").select("id, first_name, allergies, dietary_preference").eq("id", userId).maybeSingle();
  return { id: userId, firstName: (data?.first_name as string | null) ?? null, allergies: (data?.allergies as string[]) ?? [], diet: (data?.dietary_preference as string | null) ?? null };
});

async function loadPlan(c: SB, userId: string): Promise<MealPlan | null> {
  // The week's ACTIVE plan: the confirmed one first ('confirmed' sorts before 'draft'), else the most recently edited draft.
  const { data: p } = await c.from("meal_plans").select("*").eq("user_id", userId).eq("is_deleted", false).neq("status", "archived").order("week_start", { ascending: false }).order("status", { ascending: true }).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!p) return null;
  const { data: meals } = await c.from("plan_meals").select("*").eq("plan_id", p.id);
  return toPlan(p, meals ?? []);
}

export const getPlan = createServerFn({ method: "GET" }).handler(async () => {
  const { sb: c, userId } = await sb(); if (!userId) return null; return loadPlan(c, userId);
});

export const searchMeals = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; mealType?: string | null; contexts?: string[] | null; batch?: boolean | null; mine?: boolean; exclude?: string[]; kind?: "assembly" | "recipe" | null; limit?: number }) => d)
  .handler(async ({ data }) => {
    const { sb: c, userId } = await sb(); if (!userId) return { meals: [] as MealRef[], excluded: [] as MealRef[] };
    // Semantic search: embed the query so search_meals ranks by vector similarity (trigram text match is the fallback when embedding fails).
    const q = data.q?.trim() || null; let embedding: string | null = null;
    if (q && q.length >= 3) { try { embedding = vec(await embedText(q, userId)); } catch { embedding = null; } }
    const { data: rows } = await c.rpc("search_meals", { p_user_id: userId, p_query: q, p_embedding: embedding, p_meal_type: data.mealType ?? null, p_contexts: data.contexts?.length ? data.contexts : null, p_batch: data.batch ?? null, p_include_saved: data.mine !== false, p_limit: data.limit ?? 40, p_exclude_allergens: null, p_require_diet: null, p_kind: data.kind ?? null, p_include_disliked: true });   // browsing shows everything, thumb state and all — only suggestions filter dislikes
    let meals = (rows ?? []).map(rowToMealRef);
    if (data.mine) meals = meals.filter((m: any) => m.source === "saved");
    if (data.exclude?.length) { const ex = new Set(data.exclude); meals = meals.filter((m: MealRef) => !ex.has(m.id)); }
    // show what the allergy hid (greyed) — the RPC already excluded them; fetch a couple for transparency
    const { data: me } = await c.from("users").select("allergies").eq("id", userId).maybeSingle();
    const allergies: string[] = me?.allergies ?? [];
    let excluded: MealRef[] = [];
    if (allergies.length && !data.mine) {
      const { data: ex } = await c.from("meal_library").select("*").overlaps("allergens", allergies).eq("is_active", true).eq("meal_type", data.mealType ?? "dinner").limit(2);
      excluded = (ex ?? []).map((r) => rowToMealRef({ ...r, source: "library", attribution: r.source }));
    }
    return { meals, excluded, allergies };
  });

/** Thin wrappers over server/vana/meals.ts — the same implementation the `recent_meals` / `set_saved_meal_notes` / `get_meal` /
 *  `set_meal_feedback` actions run for the app. */
export const getRecentMeals = createServerFn({ method: "GET" }).inputValidator((d: { limit?: number }) => d).handler(async ({ data }) => {
  const { userId } = await sb(); if (!userId) return [] as (MealRef & { lastUsedAt: string })[];
  return recentMeals(userId, data.limit ?? 20);
});
export const updateSavedMealNotes = createServerFn({ method: "POST" }).inputValidator((d: { id: string; notes: string }) => d).handler(async ({ data }) => {
  const { userId } = await sb(); if (!userId) return { ok: false as const };
  const r = await setSavedMealNotes(userId, data.id, data.notes);
  return r.ok ? { ok: true as const, notes: r.notes } : { ok: false as const, error: r.error };
});
export const getMeal = createServerFn({ method: "GET" }).inputValidator((d: { id: string }) => d).handler(async ({ data }): Promise<MealDetail | null> => {
  const { userId } = await sb(); if (!userId) return null;
  return getMealDetail(userId, data.id);
});
/** Thumbs up / down. Tapping the lit thumb again clears the vote. A thumbs-down stops the meal being suggested (search_meals filters it) — browsing still shows it. */
export const setMealFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; vote: -1 | 0 | 1; reason?: string }) => d)
  .handler(async ({ data }) => {
    const { sb: c, userId } = await sb();
    if (!userId) return { ok: false as const, error: "not signed in", vote: 0 as const };
    const isUuid = /^[0-9a-f-]{36}$/i.test(data.id);
    try { return { ok: true as const, vote: await setMealFeedbackImpl(userId, isUuid ? { savedMealId: data.id } : { libraryMealId: data.id }, data.vote, data.reason ?? null, c) }; }
    catch (e) { return { ok: false as const, error: (e as Error).message, vote: 0 as const }; }
  });

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { sb: c, userId } = await sb(); if (!userId) return null;
  const { data } = await c.from("user_memories").select("id, kind, key, fact, value, confidence, last_confirmed_at").eq("user_id", userId).eq("is_deleted", false).order("last_confirmed_at", { ascending: false });
  type SMemory = Omit<Memory, "value"> & { value: string | number | boolean | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memories: SMemory[] = (data ?? []).map((m: any) => ({ id: m.id, kind: m.kind, key: m.key, fact: m.fact, value: (m.value == null ? null : typeof m.value === "object" ? JSON.stringify(m.value) : m.value) as SMemory["value"], confidence: Number(m.confidence), lastConfirmedAt: m.last_confirmed_at }));
  const setting = (k: string, dflt: boolean) => { const s = memories.find((m) => m.kind === "setting" && m.key === k); return s ? s.value !== false : dflt; };
  return { batchCooking: setting("batch_cooking", true), showMacros: setting("show_macros", false), memories: memories.filter((m) => m.kind !== "setting") };
});
