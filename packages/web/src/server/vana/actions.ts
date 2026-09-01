/** UiActions — structured edits that never need the model. POST /api/vana/action { type, payload }. */
import type { UiAction, VanaPart, DaySlot } from "@/lib/vana/contracts";
import * as plan from "./plan";
import { setSetting, forgetMemory, listMemories } from "./memory";
import { diagnoseStaples, dayGuidance, planDayPart } from "./tools";
import { buildAthleteContext } from "./context";
import { getMeal, saveLibraryMeal, getMealDetail, recentMeals, setSavedMealNotes, setMealFeedback } from "./meals";
import type { SupabaseClient } from "@supabase/supabase-js";
import { today } from "./env";
import { ensureDayNotes, refreshDayNotesSoon } from "./daynotes";

const shop = (items: import("@/lib/vana/contracts").ShoppingItem[]): VanaPart => ({ kind: "shopping_list", items, itemCount: items.filter((x) => !x.have).length, skipped: items.filter((x) => x.have).map((x) => x.name) });

/** Per-request context: `userDb` is the caller's own session client (RLS + auth.uid()), needed only by the set_meal_feedback RPC. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionCtx { userDb?: SupabaseClient<any, "public", any> }

export async function runAction(userId: string, a: UiAction, ctx: ActionCtx = {}): Promise<{ parts: VanaPart[] } & Record<string, unknown>> {
  const p = a.payload as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  // Chat actions carry the conversation (→ its own draft plan); Plan-tab actions carry nothing (→ the week's active plan).
  const scope: plan.PlanScope | null = p.planId ? { planId: String(p.planId) } : p.conversationId ? { conversationId: String(p.conversationId) } : null;
  switch (a.type) {
    case "pick_meals": { // { meals: [{source,id}], servings?: number, session?: Session, conversationId? }
      let out = null; for (const m of p.meals as { source: "library" | "saved"; id: string }[]) out = await plan.addMealById(userId, m.source, m.id, Number(p.servings ?? 4), p.session, scope);
      return { parts: [{ kind: "batch", plan: out ?? (await plan.resolvePlan(userId, scope, true))! }] };
    }
    case "unpick_meal": return { parts: [{ kind: "batch", plan: await plan.removeMealByRef(userId, p.source, String(p.id), scope) }] };
    case "swap_meal": return { parts: [{ kind: "batch", plan: await plan.swapMeal(userId, String(p.planMealId), p.source, String(p.id)) }] };
    case "remove_meal": return { parts: [{ kind: "batch", plan: await plan.setServings(userId, String(p.planMealId), 0) }] };
    case "set_servings": return { parts: [{ kind: "batch", plan: await plan.setServings(userId, String(p.planMealId), Number(p.servings)) }] };
    case "confirm_plan": { const pl = await plan.confirmPlan(userId, scope); refreshDayNotesSoon(userId, String(p.date ?? today())); return { parts: [{ kind: "batch", plan: pl }, shop(pl.shopping)] }; }
    case "toggle_shopping": { const items = await plan.toggleShopping(userId, String(p.name), p.field === "have" ? "have" : "checked", !!p.value); return { parts: [shop(items)] }; }
    case "log_from_plan": { const r = await plan.logFromPlan(userId, String(p.planMealId), p.mealType); return { parts: [{ kind: "logged", planMealId: String(p.planMealId), name: r.name, servingsLeft: r.servingsLeft }, { kind: "batch", plan: (await plan.getPlan(userId))! }] }; }
    case "set_setting": { const m = await setSetting(userId, p.key, !!p.value, "settings"); if (p.key === "batch_cooking") { const pl = await plan.setBatchCooking(userId, !!p.value, scope); return { parts: [{ kind: "memory_saved", memory: m }, { kind: "batch", plan: pl }] }; } return { parts: [{ kind: "memory_saved", memory: m }] }; }
    case "delete_memory": { await forgetMemory(userId, String(p.id)); return { parts: [], memories: await listMemories(userId) }; }
    // ---- day planner
    case "set_day_slot": { // { date?, slot, source: 'plan'|'saved'|'library', id }
      const date = String(p.date ?? today()); const slot = p.slot as DaySlot;
      let name = String(p.name ?? ""); let kcal: number | null = null; let carbsG: number | null = null;
      if (p.source === "plan") { const pl = await plan.getOrCreatePlan(userId); const m = pl.meals.find((x) => x.id === p.id); if (m) { name = m.name; kcal = m.kcal; carbsG = m.carbsG; } }
      else { const m = await getMeal(userId, p.source, String(p.id)); if (m) { name = m.name; kcal = m.kcal; carbsG = m.carbsG; } }
      const slots = await plan.setDaySlot(userId, date, slot, { source: p.source, id: String(p.id), name, kcal, carbsG });
      return { parts: [{ kind: "day", date, label: "", slots, filled: [slot] }] };
    }
    case "clear_day_slot": { const date = String(p.date ?? today()); const slots = await plan.setDaySlot(userId, date, p.slot as DaySlot, null); return { parts: [{ kind: "day", date, label: "", slots, filled: [] }] }; }
    case "plan_day": { const ctx = await buildAthleteContext(userId); return { parts: [await planDayPart(userId, ctx, String(p.date ?? today()))] }; }
    // ---- plans
    case "get_plan": { const pl = p.id ? await plan.getPlanById(userId, String(p.id)) : await plan.resolvePlan(userId, scope, false); return { parts: pl ? [{ kind: "batch", plan: pl }] : [] }; }
    case "list_plans": return { parts: [], plans: await plan.listPlans(userId) };
    // ---- app-only (the Flutter client's read/write channel for what the web does through server fns)
    case "get_home": { const home = await homePayload(userId, p.date ? String(p.date) : undefined); return { parts: home.batch ? [home.batch] : [], home }; }
    case "get_meal": { const meal = await getMealDetail(userId, String(p.id)); if (!meal) throw new Error(`meal not found: ${p.id}`); return { parts: [], meal }; }
    case "recent_meals": return { parts: [], meals: await recentMeals(userId, Math.min(Number(p.limit ?? 20), 200)) };
    case "set_saved_meal_notes": { const r = await setSavedMealNotes(userId, String(p.savedMealId ?? p.saved_meal_id), String(p.notes ?? "")); if (!r.ok) throw new Error(r.error ?? "update failed"); return { parts: [], notes: r.notes }; }
    case "set_meal_feedback": { const vote = await setMealFeedback(userId, { libraryMealId: p.libraryMealId ?? p.library_meal_id ?? null, savedMealId: p.savedMealId ?? p.saved_meal_id ?? null }, Number(p.vote) as -1 | 0 | 1, p.reason ?? null, ctx.userDb); return { parts: [], vote }; }
    default: throw new Error(`unknown action ${a.type}`);
  }
}

/** Extra actions the UI needs that aren't in UiAction (additive): */
export async function extraAction(userId: string, type: string, p: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (type) {
    case "remove_meal": return { parts: [{ kind: "batch", plan: await plan.setServings(userId, String(p.planMealId), 0) }] };
    case "set_session": return { parts: [{ kind: "batch", plan: await plan.setSession(userId, String(p.planMealId), p.session ?? null) }] };
    case "apply_swap": return { parts: [{ kind: "batch", plan: await plan.applySwap(userId, String(p.planMealId), { from: String(p.from), to: String(p.to), effect: p.effect }) }] };
    case "add_comment": return { parts: [{ kind: "batch", plan: await plan.addComment(userId, String(p.planMealId), p.role === "vana" ? "vana" : "user", String(p.text)) }] };
    case "accept_rule": { const pl = await plan.setRule(userId, { day: p.day, rule: String(p.rule), mealId: p.mealId, accepted: !!p.accepted }); return { parts: [{ kind: "batch", plan: pl }] }; }
    case "list_memories": return { parts: [], memories: await listMemories(userId) };
    case "save_meal": return { parts: [], meal: await saveLibraryMeal(userId, String(p.libraryMealId)) };   // heart on the detail page
    default: return null;
  }
}

/** GET /api/vana/home?date= — what the Food → Plan screen needs: the plan, the day planner, a small day card, staples when there is no plan. No model call. */
export async function homePayload(userId: string, date = today()) {
  const ctx = await buildAthleteContext(userId, undefined, date);
  const [day, pl] = await Promise.all([dayGuidance(userId, ctx, date), plan.getPlan(userId)]);
  const staples = pl && pl.meals.length ? null : await diagnoseStaples(userId);
  const slots = (pl?.days?.[date] ?? {}) as import("@/lib/vana/contracts").DayPlan;
  const target = ctx.budget.week.find((t) => t.date === date) ?? (date === today() ? ctx.budget.today : null);
  // Vana's message for the day: precomputed on the plan (regenerated here only when an edit made it stale).
  const { notes: dayNotes, stale } = await ensureDayNotes(userId, pl, date);
  const vana = { date, stale, text: dayNotes[date] ?? (pl && pl.meals.length ? null : (day.note ? `${day.label}. At least ${day.minCarbsG}g carbs — ${day.note}.` : null)) };
  return { context: ctx, brief: null, day, target, weekTargets: ctx.budget.week, staples, batch: pl ? ({ kind: "batch", plan: pl ? { ...pl, dayNotes } : pl } as VanaPart) : null, shopping: pl ? shop(pl.shopping) : null, days: { date, slots }, vana, memories: await listMemories(userId) };
}
