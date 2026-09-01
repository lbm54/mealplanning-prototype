// Backfill meal_library.icon / plan_meals.icon / saved_meals.icon from the shared classifier.
// Run from packages/web:  npx tsx scripts/backfill-meal-icons.ts   (reads .env.local; service role)
import fs from "node:fs"; import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { mealIconFor } from "../src/lib/vana/meal-icon";

const env = Object.fromEntries(fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ingNames = (j: unknown) => (Array.isArray(j) ? j.map((x) => (x as { name?: string; food_name?: string }).name ?? (x as { food_name?: string }).food_name ?? "").join(", ") : "");

async function all<T>(table: string, cols: string): Promise<T[]> { const out: T[] = []; for (let from = 0; ; from += 1000) { const { data, error } = await sb.from(table).select(cols).range(from, from + 999); if (error) throw error; out.push(...((data ?? []) as T[])); if (!data || data.length < 1000) break; } return out; }
async function update(table: string, rows: { id: string; icon: string }[]) { let n = 0; for (const r of rows) { const { error } = await sb.from(table).update({ icon: r.icon }).eq("id", r.id); if (error) throw error; n++; if (n % 200 === 0) process.stdout.write(`  ${table} ${n}/${rows.length}\n`); } }

const dist: Record<string, number> = {};
const lib = await all<{ id: string; name: string; ingredients_json: unknown; pattern: string | null; icon: string | null }>("meal_library", "id, name, ingredients_json, pattern, icon");
const libRows = lib.map((r) => ({ id: r.id, icon: mealIconFor({ name: r.name, ingredients: ingNames(r.ingredients_json), pattern: r.pattern }) }));
for (const r of libRows) dist[r.icon] = (dist[r.icon] ?? 0) + 1;
console.log(`meal_library: ${libRows.length} rows`, dist);
await update("meal_library", libRows.filter((r, i) => lib[i].icon !== r.icon));
const libIcon = new Map(libRows.map((r) => [r.id, r.icon]));

const saved = await all<{ id: string; name: string; items: unknown; library_meal_id: string | null; icon: string | null }>("saved_meals", "id, name, items, library_meal_id, icon");
const savedRows = saved.map((r) => ({ id: r.id, icon: (r.library_meal_id && libIcon.get(r.library_meal_id)) || mealIconFor({ name: r.name, ingredients: ingNames(r.items) }) }));
console.log(`saved_meals: ${savedRows.length} rows`);
await update("saved_meals", savedRows.filter((r, i) => saved[i].icon !== r.icon));
const savedIcon = new Map(savedRows.map((r) => [r.id, r.icon]));

const pm = await all<{ id: string; name: string; library_meal_id: string | null; saved_meal_id: string | null; icon: string | null }>("plan_meals", "id, name, library_meal_id, saved_meal_id, icon");
const pmRows = pm.map((r) => ({ id: r.id, icon: (r.library_meal_id && libIcon.get(r.library_meal_id)) || (r.saved_meal_id && savedIcon.get(r.saved_meal_id)) || mealIconFor({ name: r.name }) }));
console.log(`plan_meals: ${pmRows.length} rows`);
await update("plan_meals", pmRows.filter((r, i) => pm[i].icon !== r.icon));
console.log("done");
