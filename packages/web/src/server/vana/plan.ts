/** meal_plans + plan_meals — the batch. Coverage and sessions are computed here, never by the model.
 *
 *  Plan resolution (2026-08-31): one CONFIRMED plan per athlete-week (partial unique index `meal_plans_confirmed_week`);
 *  any number of DRAFTS, each owned by the Vana conversation building it (`meal_plans.conversation_id`).
 *  - `getPlan(userId)` → the week's ACTIVE plan for athlete-facing surfaces (Plan tab, shopping, context): confirmed first, else the newest draft.
 *  - `resolvePlan(userId, scope)` → the plan a write should land on: an explicit planId, else the conversation's own draft
 *    (created on first use), else the week's active plan. Edits keyed by planMealId derive the plan from the row. */
import type { MealPlan, PlanMeal, PlanRule, ShoppingItem, MealRef, Session, DayPlan, DaySlot, DaySlotRef } from "@/lib/vana/contracts";
import { dbAny, weekStartFor, today } from "./env";
import { getMeal } from "./meals";
import { getSetting } from "./memory";
import { buildShoppingList } from "./grocery";
import { resolveMealIcon } from "@/lib/vana/meal-icon";

export interface PlanScope { planId?: string | null; conversationId?: string | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPlanMeal = (r: any): PlanMeal => ({ id: r.id, planId: r.plan_id, source: r.source, libraryMealId: r.library_meal_id ?? null, savedMealId: r.saved_meal_id ?? null, name: r.name, mealType: r.meal_type, session: (r.session ?? null) as Session, servings: r.servings, servingsLeft: r.servings_left, kcal: r.kcal ?? null, carbsG: r.carbs_g == null ? null : Number(r.carbs_g), proteinG: r.protein_g == null ? null : Number(r.protein_g), fatG: r.fat_g == null ? null : Number(r.fat_g), swapsApplied: r.swaps_applied ?? [], comments: r.comments ?? [], position: r.position ?? 0, icon: resolveMealIcon(r.icon, { name: r.name }) });

export function coverageOf(meals: PlanMeal[]): MealPlan["coverage"] {
  const ld = meals.filter((m) => m.mealType === "lunch" || m.mealType === "dinner");
  const servings = ld.reduce((s, m) => s + m.servings, 0);
  const tot = meals.reduce((a, m) => ({ kcal: a.kcal + (m.kcal ?? 0) * m.servings, c: a.c + (m.carbsG ?? 0) * m.servings, p: a.p + (m.proteinG ?? 0) * m.servings }), { kcal: 0, c: 0, p: 0 });
  return { lunchDinnerSlots: 14, covered: Math.min(14, servings), perDay: { kcal: Math.round(tot.kcal / 7), carbsG: Math.round(tot.c / 7), proteinG: Math.round(tot.p / 7) } };
}

/** Default session for a meal given batch-cooking on. Library meals with batch=true cook Sunday; a second batch meal added later tops up Wednesday; non-batch meals are made fresh Friday. */
export function defaultSession(batchCooking: boolean, meal: { batch: boolean }, existing: PlanMeal[]): Session {
  if (!batchCooking) return null;
  if (!meal.batch) return "fresh-fri";
  const sundayCount = existing.filter((m) => m.session === "cook-sun").length;
  return sundayCount >= 2 ? "topup-wed" : "cook-sun";
}

// ---------------------------------------------------------------- resolution
/** The week's active plan: confirmed if there is one, else the most recently edited draft. */
export async function getPlan(userId: string, weekStart = weekStartFor(today())): Promise<MealPlan | null> {
  const { data } = await dbAny().from("meal_plans").select("*").eq("user_id", userId).eq("week_start", weekStart).eq("is_deleted", false).neq("status", "archived")
    .order("status", { ascending: true }) // 'confirmed' sorts before 'draft'
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data ? hydrate(data) : null;
}
export async function getOrCreatePlan(userId: string, weekStart = weekStartFor(today())): Promise<MealPlan> {
  const cur = await getPlan(userId, weekStart);
  return cur ?? insertDraft(userId, weekStart, null);
}
/** The draft owned by a conversation — created on first use so the plan bar starts empty. */
export async function getConversationPlan(userId: string, conversationId: string, create = true): Promise<MealPlan | null> {
  const { data } = await dbAny().from("meal_plans").select("*").eq("user_id", userId).eq("conversation_id", conversationId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data) return hydrate(data);
  return create ? insertDraft(userId, weekStartFor(today()), conversationId) : null;
}
export async function resolvePlan(userId: string, scope?: PlanScope | null, create = true): Promise<MealPlan | null> {
  if (scope?.planId) return getPlanById(userId, scope.planId);
  if (scope?.conversationId) return getConversationPlan(userId, scope.conversationId, create);
  return create ? getOrCreatePlan(userId) : getPlan(userId);
}
async function insertDraft(userId: string, weekStart: string, conversationId: string | null): Promise<MealPlan> {
  const batchCooking = (await getSetting<boolean>(userId, "batch_cooking")) ?? true;
  const { data, error } = await dbAny().from("meal_plans").insert({ user_id: userId, week_start: weekStart, batch_cooking: batchCooking, conversation_id: conversationId }).select("*").single();
  if (error) throw new Error(error.message);
  return hydrate(data);
}
/** plan_meals row → its plan id (edits keyed by planMealId never need a scope). */
async function planIdOfMeal(userId: string, planMealId: string): Promise<string> {
  const { data } = await dbAny().from("plan_meals").select("plan_id").eq("id", planMealId).eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("plan meal not found");
  return data.plan_id as string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hydrate(plan: any): Promise<MealPlan> {
  const { data: rows } = await dbAny().from("plan_meals").select("*").eq("plan_id", plan.id).order("position").order("created_at");
  const meals = (rows ?? []).map(toPlanMeal);
  return { id: plan.id, weekStart: plan.week_start, status: plan.status, batchCooking: plan.batch_cooking, conversationId: plan.conversation_id ?? null, brief: plan.brief ?? null, days: (plan.days ?? {}) as Record<string, DayPlan>, rules: (plan.rules ?? []) as PlanRule[], meals, shopping: (plan.shopping ?? []) as ShoppingItem[], coverage: coverageOf(meals), dayNotes: (plan.day_notes ?? {}) as Record<string, string>, dayNotesStale: plan.day_notes_stale !== false };
}

// ---------------------------------------------------------------- edits
export async function addMeal(userId: string, ref: MealRef, servings: number, session?: Session, scope?: PlanScope | null): Promise<MealPlan> {
  const plan = (await resolvePlan(userId, scope, true))!;
  const existing = plan.meals.find((m) => (ref.source === "library" ? m.libraryMealId === ref.id : m.savedMealId === ref.id));
  const d = dbAny();
  if (existing) {
    await d.from("plan_meals").update({ servings: existing.servings + servings, servings_left: existing.servingsLeft + servings, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    const s = session === undefined ? defaultSession(plan.batchCooking, ref, plan.meals) : session;
    const { error } = await d.from("plan_meals").insert({ plan_id: plan.id, user_id: userId, source: ref.source, library_meal_id: ref.source === "library" ? ref.id : null, saved_meal_id: ref.source === "saved" ? ref.id : null, name: ref.name, meal_type: ref.mealType, session: s, servings, servings_left: servings, kcal: ref.kcal, carbs_g: ref.carbsG, protein_g: ref.proteinG, fat_g: ref.fatG, position: plan.meals.length, icon: ref.icon ?? null });
    if (error) throw new Error(error.message);
  }
  return refreshShopping(userId, plan.id);
}
export async function addMealById(userId: string, source: "library" | "saved", id: string, servings: number, session?: Session, scope?: PlanScope | null) {
  const ref = await getMeal(userId, source, id); if (!ref) throw new Error(`meal not found: ${source}/${id}`);
  return addMeal(userId, ref, servings, session, scope);
}
export async function setServings(userId: string, planMealId: string, servings: number): Promise<MealPlan> {
  const d = dbAny(); const planId = await planIdOfMeal(userId, planMealId);
  if (servings <= 0) await d.from("plan_meals").delete().eq("id", planMealId).eq("user_id", userId);
  else { const { data: cur } = await d.from("plan_meals").select("servings, servings_left").eq("id", planMealId).eq("user_id", userId).maybeSingle(); const eaten = cur ? cur.servings - cur.servings_left : 0; await d.from("plan_meals").update({ servings, servings_left: Math.max(0, servings - eaten), updated_at: new Date().toISOString() }).eq("id", planMealId).eq("user_id", userId); }
  return refreshShopping(userId, planId);
}
export async function setSession(userId: string, planMealId: string, session: Session): Promise<MealPlan> {
  const planId = await planIdOfMeal(userId, planMealId);
  await dbAny().from("plan_meals").update({ session }).eq("id", planMealId).eq("user_id", userId);
  return (await getPlanById(userId, planId))!;
}
export async function applySwap(userId: string, planMealId: string, swap: { from: string; to: string; effect?: string }): Promise<MealPlan> {
  const d = dbAny(); const { data: cur } = await d.from("plan_meals").select("plan_id, swaps_applied, name").eq("id", planMealId).eq("user_id", userId).maybeSingle();
  if (!cur) throw new Error("plan meal not found");
  const swaps = [...((cur.swaps_applied ?? []) as unknown[]), swap];
  await d.from("plan_meals").update({ swaps_applied: swaps, updated_at: new Date().toISOString() }).eq("id", planMealId);
  return refreshShopping(userId, cur.plan_id);
}
export async function addComment(userId: string, planMealId: string, role: "user" | "vana", text: string): Promise<MealPlan> {
  const d = dbAny(); const { data: cur } = await d.from("plan_meals").select("plan_id, comments").eq("id", planMealId).eq("user_id", userId).maybeSingle();
  if (!cur) throw new Error("plan meal not found");
  await d.from("plan_meals").update({ comments: [...((cur.comments ?? []) as unknown[]), { role, text, at: new Date().toISOString() }] }).eq("id", planMealId);
  return (await getPlanById(userId, cur.plan_id))!;
}
export async function setRule(userId: string, rule: PlanRule, scope?: PlanScope | null): Promise<MealPlan> {
  const plan = (await resolvePlan(userId, scope, true))!;
  const rules = plan.rules.filter((r) => !(r.day === rule.day && r.rule === rule.rule)).concat(rule);
  await dbAny().from("meal_plans").update({ rules, updated_at: new Date().toISOString() }).eq("id", plan.id);
  return (await getPlanById(userId, plan.id))!;
}
export async function setBatchCooking(userId: string, on: boolean, scope?: PlanScope | null): Promise<MealPlan> {
  const plan = (await resolvePlan(userId, scope, true))!; const d = dbAny();
  await d.from("meal_plans").update({ batch_cooking: on, updated_at: new Date().toISOString() }).eq("id", plan.id);
  // re-derive sessions
  let sunday = 0;
  for (const m of plan.meals) {
    const ref = { batch: m.source === "library" ? (await getMeal(userId, "library", m.libraryMealId!))?.batch ?? true : true };
    let s: Session = null;
    if (on) { if (!ref.batch) s = "fresh-fri"; else { s = sunday >= 2 ? "topup-wed" : "cook-sun"; sunday++; } }
    await d.from("plan_meals").update({ session: s }).eq("id", m.id);
  }
  return (await getPlanById(userId, plan.id))!;
}
export async function setBrief(userId: string, brief: string, scope?: PlanScope | null) { const p = (await resolvePlan(userId, scope, true))!; await dbAny().from("meal_plans").update({ brief }).eq("id", p.id); }
/** Confirm: this plan becomes the week's one confirmed plan (the previous confirmed one is archived) and its shopping list is built. */
export async function confirmPlan(userId: string, scope?: PlanScope | null): Promise<MealPlan> {
  const target = (await resolvePlan(userId, scope, true))!;
  const plan = await refreshShopping(userId, target.id);
  const d = dbAny(); const now = new Date().toISOString();
  await d.from("meal_plans").update({ status: "archived", updated_at: now }).eq("user_id", userId).eq("week_start", plan.weekStart).eq("status", "confirmed").eq("is_deleted", false).neq("id", plan.id);
  await d.from("meal_plans").update({ status: "confirmed", updated_at: now }).eq("id", plan.id);
  return (await getPlanById(userId, plan.id))!;
}
export async function refreshShopping(userId: string, planId?: string | null): Promise<MealPlan> {
  const plan = (planId ? await getPlanById(userId, planId) : await getPlan(userId))!;
  const prev = new Map(plan.shopping.map((i) => [i.name.toLowerCase(), i]));
  const items = await buildShoppingList(userId, plan);
  const merged = items.map((i) => { const p = prev.get(i.name.toLowerCase()); return p ? { ...i, checked: p.checked, have: i.have || p.have } : i; });
  await dbAny().from("meal_plans").update({ shopping: merged, day_notes_stale: true, updated_at: new Date().toISOString() }).eq("id", plan.id);
  return { ...plan, shopping: merged, dayNotesStale: true };
}
export async function toggleShopping(userId: string, name: string, field: "checked" | "have", value: boolean): Promise<ShoppingItem[]> {
  const plan = (await getPlan(userId))!;
  const shopping = plan.shopping.map((i) => (i.name.toLowerCase() === name.toLowerCase() ? { ...i, [field]: value } : i));
  await dbAny().from("meal_plans").update({ shopping }).eq("id", plan.id);
  return shopping;
}
/** "Ate it": decrement servings_left and write a meal_logs row with source='plan'. */
export async function logFromPlan(userId: string, planMealId: string, mealType?: string): Promise<{ name: string; servingsLeft: number }> {
  const d = dbAny();
  const { data: m } = await d.from("plan_meals").select("*").eq("id", planMealId).eq("user_id", userId).maybeSingle();
  if (!m) throw new Error("plan meal not found");
  const left = Math.max(0, m.servings_left - 1);
  await d.from("plan_meals").update({ servings_left: left, updated_at: new Date().toISOString() }).eq("id", m.id);
  let items: unknown[] = [];
  if (m.source === "library") { const { data: lib } = await d.from("meal_library").select("ingredients_json").eq("id", m.library_meal_id).maybeSingle(); items = (lib?.ingredients_json ?? []) as unknown[]; }
  else { const { data: s } = await d.from("saved_meals").select("items").eq("id", m.saved_meal_id).maybeSingle(); items = (s?.items ?? []) as unknown[]; }
  const { error } = await d.from("meal_logs").insert({ user_id: userId, log_date: today(), slot: mealType ?? m.meal_type, name: m.name, source: "plan", items, calories: m.kcal, carbs_g: m.carbs_g, protein_g: m.protein_g, fat_g: m.fat_g, saved_meal_id: m.saved_meal_id, plan_meal_id: m.id, eaten_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { name: m.name, servingsLeft: left };
}

/** Find a plan meal by its source ref (library id or saved id). */
export async function findPlanMeal(userId: string, source: "library" | "saved", id: string, scope?: PlanScope | null): Promise<PlanMeal | null> {
  const p = await resolvePlan(userId, scope, false); if (!p) return null;
  return p.meals.find((m) => (source === "library" ? m.libraryMealId === id : m.savedMealId === id)) ?? null;
}
/** Untick in the picker: remove the meal that this ref added. */
export async function removeMealByRef(userId: string, source: "library" | "saved", id: string, scope?: PlanScope | null): Promise<MealPlan> {
  const m = await findPlanMeal(userId, source, id, scope);
  return m ? setServings(userId, m.id, 0) : (await resolvePlan(userId, scope, true))!;
}
/** Swap in place: same servings, session and position; new meal's name/macros/source. */
export async function swapMeal(userId: string, planMealId: string, source: "library" | "saved", id: string): Promise<MealPlan> {
  const d = dbAny();
  const { data: cur } = await d.from("plan_meals").select("*").eq("id", planMealId).eq("user_id", userId).maybeSingle();
  if (!cur) throw new Error("plan meal not found");
  const ref = await getMeal(userId, source, id); if (!ref) throw new Error(`meal not found: ${source}/${id}`);
  const eaten = cur.servings - cur.servings_left;
  await d.from("plan_meals").update({ source: ref.source, library_meal_id: ref.source === "library" ? ref.id : null, saved_meal_id: ref.source === "saved" ? ref.id : null, name: ref.name, meal_type: ref.mealType, kcal: ref.kcal, carbs_g: ref.carbsG, protein_g: ref.proteinG, fat_g: ref.fatG, icon: ref.icon ?? null, servings_left: Math.max(0, cur.servings - eaten), swaps_applied: [], comments: [...((cur.comments ?? []) as unknown[]), { role: "vana", text: `Swapped ${cur.name} → ${ref.name}`, at: new Date().toISOString() }], updated_at: new Date().toISOString() }).eq("id", planMealId);
  return refreshShopping(userId, cur.plan_id);
}

// ---------------------------------------------------------------- history / new plan
export async function getPlanById(userId: string, id: string): Promise<MealPlan | null> {
  const { data } = await dbAny().from("meal_plans").select("*").eq("id", id).eq("user_id", userId).eq("is_deleted", false).maybeSingle();
  return data ? hydrate(data) : null;
}
export async function listPlans(userId: string, limit = 20): Promise<Pick<MealPlan, "id" | "weekStart" | "status" | "batchCooking">[] & { mealCount?: number }[]> {
  const { data } = await dbAny().from("meal_plans").select("id, week_start, status, batch_cooking, updated_at").eq("user_id", userId).eq("is_deleted", false).order("week_start", { ascending: false }).order("updated_at", { ascending: false }).limit(limit);
  const out = [] as (Pick<MealPlan, "id" | "weekStart" | "status" | "batchCooking"> & { mealCount: number })[];
  for (const p of data ?? []) { const { count } = await dbAny().from("plan_meals").select("*", { count: "exact", head: true }).eq("plan_id", p.id); out.push({ id: p.id, weekStart: p.week_start, status: p.status, batchCooking: !!p.batch_cooking, mealCount: count ?? 0 }); }
  return out;
}
/** Archive the current week's plan and start a fresh (conversation-less) draft. */
export async function newPlan(userId: string): Promise<MealPlan> {
  const cur = await getPlan(userId);
  if (cur) await dbAny().from("meal_plans").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", cur.id);
  return getOrCreatePlan(userId);
}

// ---------------------------------------------------------------- day planner (meal_plans.days jsonb)
const SLOTS: DaySlot[] = ["breakfast", "lunch", "dinner", "snack"];
export async function getDay(userId: string, date: string): Promise<DayPlan> { const p = await getPlan(userId); return (p?.days?.[date] ?? {}) as DayPlan; }
export async function setDaySlot(userId: string, date: string, slot: DaySlot, ref: DaySlotRef | null): Promise<DayPlan> {
  const p = await getOrCreatePlan(userId);
  const days = { ...(p.days ?? {}) }; const day = { ...(days[date] ?? {}) }; if (ref) day[slot] = ref; else delete day[slot]; days[date] = day;
  await dbAny().from("meal_plans").update({ days, updated_at: new Date().toISOString() }).eq("id", p.id);
  return day;
}
/** Fill the empty slots of a day: plan meals by meal type first (fewest servings used first), else a library pick by context. */
export async function planDay(userId: string, date: string, pickLibrary: (mealType: DaySlot) => Promise<MealRef | null>): Promise<{ slots: DayPlan; filled: DaySlot[] }> {
  const p = await getOrCreatePlan(userId);
  const day = { ...((p.days ?? {})[date] ?? {}) } as DayPlan; const filled: DaySlot[] = [];
  const usedPlan = new Set(Object.values(day).map((r) => r?.id));
  for (const slot of SLOTS) {
    if (day[slot]) continue;
    const cands = p.meals.filter((m) => m.mealType === slot && m.servingsLeft > 0 && !usedPlan.has(m.id)).sort((a, b) => b.servingsLeft - a.servingsLeft);
    if (cands[0]) { day[slot] = { source: "plan", id: cands[0].id, name: cands[0].name, kcal: cands[0].kcal, carbsG: cands[0].carbsG }; usedPlan.add(cands[0].id); filled.push(slot); continue; }
    const lib = await pickLibrary(slot); if (lib) { day[slot] = { source: lib.source === "saved" ? "saved" : "library", id: lib.id, name: lib.name, kcal: lib.kcal, carbsG: lib.carbsG }; filled.push(slot); }
  }
  const days = { ...(p.days ?? {}), [date]: day };
  await dbAny().from("meal_plans").update({ days, updated_at: new Date().toISOString() }).eq("id", p.id);
  return { slots: day, filled };
}
