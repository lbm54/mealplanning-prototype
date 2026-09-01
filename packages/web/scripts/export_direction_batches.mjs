#!/usr/bin/env node
// Split the meal_library rows that still need method_steps into per-agent work files.
// Recipes and assemblies are separated because they need different treatment:
//   recipes    → find real directions (cached page → web → written by us), needs judgement + web
//   assemblies → 2-4 trivial assemble-and-serve steps written from the components, no web
//
// Run: node scripts/export_direction_batches.mjs [--recipe-batch 14] [--assembly-batch 120]
// Out: data/direction-batches/{recipes,assemblies}/batch-NN.json
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const envFile = opt('--env', path.join(ROOT, '.env.local'));
if (fs.existsSync(envFile)) for (const l of fs.readFileSync(envFile, 'utf8').split('\n')) {
  if (!l.includes('=') || l.startsWith('#')) continue;
  const k = l.slice(0, l.indexOf('=')).trim(), v = l.slice(l.indexOf('=') + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
const OUTDIR = path.join(ROOT, 'data/direction-batches');

const rows = [];
for (let off = 0; ; off += 1000) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/meal_library?select=id,kind,name,meal_type,cuisine,ingredients,ingredients_json,pattern,prep,prep_minutes,servings,source,source_url,source_urls,method_steps&order=id&offset=${off}&limit=1000`, { headers: H });
  const p = await r.json(); rows.push(...p); if (p.length < 1000) break;
}
const scrape = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/source-scrape.json'), 'utf8'));
const page = new Map(scrape.map((p) => [p.url, p]));

const todo = rows.filter((r) => !(r.method_steps ?? []).length);
const recipes = todo.filter((r) => r.kind === 'recipe');
const assemblies = todo.filter((r) => r.kind !== 'recipe');
console.log(`need steps: ${todo.length}  (recipes ${recipes.length}, assemblies ${assemblies.length})`);

fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.mkdirSync(path.join(OUTDIR, 'recipes'), { recursive: true });
fs.mkdirSync(path.join(OUTDIR, 'assemblies'), { recursive: true });

const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const pad = (i) => String(i + 1).padStart(2, '0');

const RB = Number(opt('--recipe-batch', '14'));
chunk(recipes, RB).forEach((meals, i) => {
  const out = {
    batch: `R-${pad(i)}`, kind: 'recipe',
    meals: meals.map((m) => ({
      id: m.id, name: m.name, mealType: m.meal_type, cuisine: m.cuisine, servings: m.servings ?? 1,
      ingredients: m.ingredients, prep: m.prep, prepMinutes: m.prep_minutes,
      attribution: m.source, sourceUrl: m.source_url,
      cachedPages: (m.source_urls ?? []).map((u) => page.get(u)).filter(Boolean).map((p) => ({
        url: p.url, title: p.title ?? null, ok: !p.error,
        textFile: p.textFile ?? null,
        schemaRecipeNames: (p.recipes ?? []).filter((x) => x.steps.length).map((x) => x.name),
      })),
    })),
  };
  fs.writeFileSync(path.join(OUTDIR, 'recipes', `batch-${pad(i)}.json`), JSON.stringify(out, null, 1));
});

const AB = Number(opt('--assembly-batch', '120'));
chunk(assemblies, AB).forEach((meals, i) => {
  const out = {
    batch: `A-${pad(i)}`, kind: 'assembly',
    meals: meals.map((m) => ({
      id: m.id, name: m.name, mealType: m.meal_type, pattern: m.pattern,
      components: (m.ingredients_json ?? []).map((c) => (c && typeof c === 'object' ? `${c.name ?? c.food ?? ''}${c.qty ? ` (${c.qty})` : ''}` : String(c))),
      ingredients: m.ingredients, prep: m.prep,
    })),
  };
  fs.writeFileSync(path.join(OUTDIR, 'assemblies', `batch-${pad(i)}.json`), JSON.stringify(out, null, 1));
});

console.log(`recipes:    ${fs.readdirSync(path.join(OUTDIR, 'recipes')).length} batches of <=${RB}`);
console.log(`assemblies: ${fs.readdirSync(path.join(OUTDIR, 'assemblies')).length} batches of <=${AB}`);
