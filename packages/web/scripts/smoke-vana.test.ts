/** Real smoke against dev Supabase (service role). Run: node scripts/smoke-vana.mjs */
import { it, expect } from "vitest";
import fs from "node:fs";
for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) { const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i)] ??= l.slice(i + 1); }

it("vana smoke: search → staples → batch → shopping", { timeout: 120_000 }, async () => {
  const { dbAny } = await import("@/server/vana/env");
  const { searchMeals } = await import("@/server/vana/meals");
  const { diagnoseStaples, dayGuidance } = await import("@/server/vana/tools");
  const plan = await import("@/server/vana/plan");
  const { buildAthleteContext, contextBlock } = await import("@/server/vana/context");
  const { data: sm } = await dbAny().from("saved_meals").select("user_id").limit(1); const userId = sm![0].user_id as string;
  const log = (t: string, v: unknown) => console.log(`\n== ${t}\n` + (typeof v === "string" ? v : JSON.stringify(v, null, 1).slice(0, 1400)));

  const hits = await searchMeals({ userId, query: "low fiber race-eve dinner", mealType: "dinner", contexts: ["race-week", "carb-load"], limit: 4 });
  log("searchMeals", hits.map((h) => `${h.source} ${h.id} ${h.name} · ${h.attribution.slice(0, 40)} · ${h.score.toFixed(3)}`));
  expect(hits.length).toBeGreaterThan(0); expect(hits.some((h) => h.source === "library")).toBe(true);

  const ctx = await buildAthleteContext(userId, "race week dinners"); log("context", contextBlock(ctx));
  const staples = await diagnoseStaples(userId); log("staples", staples.meals.map((m) => `${m.source} ${m.id} ${m.name} ×${m.timesLogged}`));
  const dg = await dayGuidance(userId, ctx); log("dayGuidance", `${dg.label} · ≥${dg.minCarbsG}g C · ${dg.note} · ${dg.suggestions.map((s) => s.name).join(" / ")}`);

  const before = await plan.getOrCreatePlan(userId);
  for (const m of before.meals) await plan.setServings(userId, m.id, 0);      // reset the smoke plan
  let p = await plan.addMealById(userId, "library", "D-001", 5);
  p = await plan.addMealById(userId, "library", "D-048", 4);
  p = await plan.addMealById(userId, "library", "D-002", 1);
  log("batch", { batchCooking: p.batchCooking, meals: p.meals.map((m) => `${m.name} ×${m.servings} [${m.session}]`), coverage: p.coverage });
  expect(p.meals.find((m) => m.libraryMealId === "D-048")?.servings).toBe(4);
  const list = await plan.refreshShopping(userId);
  log("shopping", list.shopping.map((i) => `${i.aisle} · ${i.name} · ${i.qty}${i.have ? " (have)" : ""}`));
  expect(list.shopping.length).toBeGreaterThan(5);
  const r = await plan.logFromPlan(userId, p.meals[0].id); log("logFromPlan", r);
  expect(r.servingsLeft).toBe(4);
  await dbAny().from("meal_logs").delete().eq("plan_meal_id", p.meals[0].id);  // clean the smoke log row
});
