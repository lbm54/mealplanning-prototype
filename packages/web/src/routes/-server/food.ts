// Route-local server functions for the Food tab. Read with the USER's session (RLS), never the service key.
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server.server";
import type { MealPlan, MealRef, Memory, PlanMeal, ShoppingItem } from "@/lib/vana/contracts";
import { resolveMealIcon } from "@/lib/vana/meal-icon";
import { embedText, vec } from "@/server/vana/embeddings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, "public", any>;
async function sb(): Promise<{ sb: SB; userId: string | null }> {
  const client = (await getServerSupabase()) as unknown as SB;
  const { data } = await client.auth.getUser();
  return { sb: client, userId: data.user?.id ?? null };
}

/** Shorten a library `source` line to a human attribution: drop URLs, keep the first clause. */
export function shortAttribution(src: string | null | undefined): string {
  if (!src) return "";
  const noUrls = src.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const first = noUrls.split(/\s[—;(]|\s—\s|\s-\s/)[0].replace(/[\s,;:—-]+$/, "").trim();
  return first.length > 64 ? first.slice(0, 61).trimEnd() + "…" : first;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToMealRef(r: any): MealRef {
  return {
    source: r.source === "saved" ? "saved" : "library", id: String(r.id), name: r.name, mealType: r.meal_type, contexts: r.contexts ?? [], batch: !!r.batch,
    prepMinutes: r.prep_minutes ?? null, kcal: r.kcal ?? null, carbsG: r.carbs_g == null ? null : Number(r.carbs_g), proteinG: r.protein_g == null ? null : Number(r.protein_g), fatG: r.fat_g == null ? null : Number(r.fat_g),
    allergens: r.allergens ?? [], dietsOk: r.diets_ok ?? [], swaps: r.swaps ?? null, why: r.why ?? "", attribution: r.attribution === "your saved meal" || r.attribution === "from your log" ? r.attribution : shortAttribution(r.attribution ?? r.source_text ?? ""), ingredients: r.ingredients ?? "",
    attributionShort: r.attribution === "your saved meal" || r.attribution === "from your log" ? r.attribution : shortAttribution(r.attribution ?? r.source).slice(0, 40),
    libraryMealId: r.library_meal_id ?? null, score: Number(r.score ?? 0),
    kind: r.kind === "assembly" ? "assembly" : r.kind === "recipe" ? "recipe" : undefined, pattern: r.pattern ?? null, frequency: r.frequency ?? null,
    icon: resolveMealIcon(r.icon, { name: r.name, ingredients: r.ingredients ?? null, pattern: r.pattern ?? null }),
    myVote: (r.my_vote ?? 0) as -1 | 0 | 1,
  };
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

/** Recents = meals logged OR planned, most recent first. The search_meals RPC ranks by score only,
 *  so this walks meal_logs + plan_meals, merges by recency, then resolves the meal rows in bulk. */
export const getRecentMeals = createServerFn({ method: "GET" }).inputValidator((d: { limit?: number }) => d).handler(async ({ data }) => {
  const { sb: c, userId } = await sb(); if (!userId) return [] as (MealRef & { lastUsedAt: string })[];
  const limit = data.limit ?? 20;
  const [{ data: logs }, { data: planned }] = await Promise.all([
    c.from("meal_logs").select("name, saved_meal_id, plan_meal_id, eaten_at, log_date, created_at").eq("user_id", userId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(200),
    c.from("plan_meals").select("library_meal_id, saved_meal_id, name, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
  ]);
  // most recent touch per meal key: saved:<uuid> | lib:<id>
  const recent = new Map<string, string>();
  const touch = (key: string, at: string | null | undefined) => { const prev = recent.get(key); if (!prev || !at || at > prev) recent.set(key, at ?? prev ?? ""); };
  const savedIds = new Set<string>(); const libIds = new Set<string>(); const namesOnly: { name: string; at: string }[] = [];
  for (const l of logs ?? []) {
    const at = (l.eaten_at ?? l.created_at ?? l.log_date) as string | null;
    if (l.saved_meal_id) { savedIds.add(l.saved_meal_id); touch(`saved:${l.saved_meal_id}`, at); }
    else namesOnly.push({ name: (l.name as string).trim(), at: at ?? "" });
  }
  for (const p of planned ?? []) {
    const at = (p.created_at ?? "") as string;
    if (p.saved_meal_id) { savedIds.add(p.saved_meal_id); touch(`saved:${p.saved_meal_id}`, at); }
    else if (p.library_meal_id) { libIds.add(p.library_meal_id); touch(`lib:${p.library_meal_id}`, at); }
    else namesOnly.push({ name: (p.name as string).trim(), at });
  }
  const out: (MealRef & { lastUsedAt: string })[] = [];
  const resolveSaved = async (ids: string[]) => { if (!ids.length) return; const { data: rows } = await c.from("saved_meals").select("*").in("id", ids).eq("is_deleted", false); for (const s of rows ?? []) out.push({ ...rowToMealRef({ source: "saved", id: s.id, name: s.name, meal_type: s.meal_types?.[0] ?? "dinner", kcal: s.calories, carbs_g: s.carbs_g, protein_g: s.protein_g, fat_g: s.fat_g, library_meal_id: s.library_meal_id, icon: s.icon, batch: s.batch, ingredients: (s.items ?? []).map((i: { name?: string }) => i.name).filter(Boolean).join(", "), why: "one of your meals", attribution: "your saved meal" }), lastUsedAt: recent.get(`saved:${s.id}`) ?? "" }); };
  const resolveLib = async (ids: string[]) => { if (!ids.length) return; const { data: rows } = await c.from("meal_library").select("*").in("id", ids).eq("is_active", true); for (const r of rows ?? []) out.push({ ...rowToMealRef({ ...r, source: "library", attribution: r.source }), lastUsedAt: recent.get(`lib:${r.id}`) ?? "" }); };
  await Promise.all([resolveSaved([...savedIds]), resolveLib([...libIds])]);
  // log/plan rows with no link: try an exact-ish library name match, else drop silently
  for (const n of namesOnly.slice(0, 30)) {
    if (out.some((m) => m.name.toLowerCase() === n.name.toLowerCase())) continue;
    const { data: r } = await c.from("meal_library").select("*").ilike("name", n.name).eq("is_active", true).limit(1);
    if (r?.[0]) out.push({ ...rowToMealRef({ ...r[0], attribution: r[0].source }), lastUsedAt: n.at });
  }
  return out.sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")).slice(0, limit);
});

export const updateSavedMealNotes = createServerFn({ method: "POST" }).inputValidator((d: { id: string; notes: string }) => d).handler(async ({ data }) => {
  const { sb: c, userId } = await sb(); if (!userId) return { ok: false as const };
  const notes = data.notes.slice(0, 2000);
  const { error } = await c.from("saved_meals").update({ notes, updated_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", userId);
  return error ? { ok: false as const, error: error.message } : { ok: true as const, notes };
});

/** Directions provenance, shared by the detail page and cooking mode. `origin` drives the
 *  "AI-written steps" badge; `verbatim` means the steps are the publisher's own words. */
export type Directions = {
  steps: string[];
  origin: "source" | "alt_source" | "ai_generated" | "assembly_simple" | null;
  sourceUrl: string | null;
  sourceName: string | null;
  verbatim: boolean;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const directionsOf = (r: any): Directions => ({
  steps: (r?.method_steps ?? []) as string[],
  origin: (r?.directions_origin ?? null) as Directions["origin"],
  sourceUrl: r?.directions_source_url ?? null,
  sourceName: r?.directions_source_name ?? null,
  verbatim: !!r?.directions_verbatim,
});

async function myVote(c: SB, userId: string, libraryMealId: string | null, savedMealId: string | null): Promise<-1 | 0 | 1> {
  let q = c.from("meal_feedback").select("vote").eq("user_id", userId);
  q = libraryMealId ? q.eq("library_meal_id", libraryMealId) : q.eq("saved_meal_id", savedMealId!);
  const { data } = await q.maybeSingle();
  return ((data?.vote as number | undefined) ?? 0) as -1 | 0 | 1;
}

export const getMeal = createServerFn({ method: "GET" }).inputValidator((d: { id: string }) => d).handler(async ({ data }) => {
  const { sb: c, userId } = await sb(); if (!userId) return null;
  const isUuid = /^[0-9a-f-]{36}$/i.test(data.id);
  if (!isUuid) {
    const { data: r } = await c.from("meal_library").select("*").eq("id", data.id).maybeSingle();
    if (!r) return null;
    return {
      meal: rowToMealRef({ ...r, source: "library", attribution: r.source }),
      ingredients: (r.ingredients_json ?? []) as { name: string; qty: string }[],
      swaps: String(r.swaps ?? "").split(";").map((s) => s.trim()).filter(Boolean),
      servings: r.servings ?? 1, prep: r.prep ?? null, source: r.source ?? "",
      methodSteps: (r.method_steps ?? []) as string[],
      directions: directionsOf(r),
      sourceUrl: (r.source_url ?? null) as string | null,
      imageUrl: (r.image_url ?? null) as string | null,
      imageCredit: (r.image_credit ?? null) as string | null,
      imageSourceUrl: (r.image_source_url ?? null) as string | null,
      imageLicense: (r.image_license ?? null) as string | null,
      vote: await myVote(c, userId, r.id, null),
      notes: null as string | null,
    };
  }
  const { data: s } = await c.from("saved_meals").select("*").eq("id", data.id).maybeSingle();
  if (!s) return null;
  // a saved meal linked to a recipe carries that recipe's method; otherwise it's assembly-style (no method)
  let swaps: string[] = []; let prep: string | null = null; let servings = 1;
  let directions: Directions = { steps: [], origin: null, sourceUrl: null, sourceName: null, verbatim: false };
  let sourceUrl: string | null = null; let imageUrl: string | null = null; let imageCredit: string | null = null;
  let imageSourceUrl: string | null = null; let imageLicense: string | null = null;
  const ingredientsOut: { name: string; qty: string }[] | null = null;
  if (s.library_meal_id) {
    const { data: r } = await c.from("meal_library").select("*").eq("id", s.library_meal_id).maybeSingle();
    if (r) {
      directions = directionsOf(r);
      swaps = String(r.swaps ?? "").split(";").map((x) => x.trim()).filter(Boolean);
      prep = r.prep ?? null; servings = r.servings ?? 1;
      sourceUrl = r.source_url ?? null; imageUrl = r.image_url ?? null; imageCredit = r.image_credit ?? null;
      imageSourceUrl = r.image_source_url ?? null; imageLicense = r.image_license ?? null;
    }
  }
  return {
    meal: rowToMealRef({ source: "saved", id: s.id, name: s.name, meal_type: s.meal_types?.[0] ?? "dinner", kcal: s.calories, carbs_g: s.carbs_g, protein_g: s.protein_g, fat_g: s.fat_g, library_meal_id: s.library_meal_id, icon: s.icon, why: "one of your saved meals", attribution: "your saved meal", batch: s.batch }),
    ingredients: ingredientsOut ?? ((s.items ?? []) as { name?: string; food_name?: string; quantity?: string; serving?: string }[]).map((i) => ({ name: i.name ?? i.food_name ?? "", qty: i.quantity ?? i.serving ?? "" })),
    swaps, servings, prep, source: "",
    methodSteps: directions.steps, directions, sourceUrl, imageUrl, imageCredit, imageSourceUrl, imageLicense,
    vote: await myVote(c, userId, null, s.id),
    notes: (s.notes ?? null) as string | null,
  };
});

/** Thumbs up / down. Tapping the lit thumb again clears the vote. A thumbs-down stops the meal
 *  being suggested (search_meals filters it) — browsing still shows it. */
export const setMealFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; vote: -1 | 0 | 1; reason?: string }) => d)
  .handler(async ({ data }) => {
    const { sb: c, userId } = await sb();
    if (!userId) return { ok: false as const, error: "not signed in", vote: 0 as const };
    const isUuid = /^[0-9a-f-]{36}$/i.test(data.id);
    const { data: vote, error } = await c.rpc("set_meal_feedback", {
      p_library_meal_id: isUuid ? null : data.id,
      p_saved_meal_id: isUuid ? data.id : null,
      p_vote: data.vote,
      p_reason: data.reason ?? null,
    });
    if (error) return { ok: false as const, error: error.message, vote: 0 as const };
    return { ok: true as const, vote: (vote ?? 0) as -1 | 0 | 1 };
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
