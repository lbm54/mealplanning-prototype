#!/usr/bin/env node
// Seed / refresh public.meal_library from the two content libraries:
//   data/meal-library-400.json   (recipe-style; kind decided by heuristic, see isAssembly)
//   data/assembly-library.json   (kind = 'assembly')
// then refresh meal_library_pairs. Idempotent (upsert on id). Embeddings (openai/text-embedding-3-small via
// Vercel AI Gateway) are computed only for rows that don't have one yet, unless --reembed.
//
// --snapshot: seed from data/meal-library.snapshot.json instead (every column as exported from dev by
// scripts/export_meal_library.mjs — directions, images, icons and all). This is the one-command prod seed.
//
// Run:  node scripts/seed_meal_library.mjs [--env <file>] [--reembed] [--dry] [--snapshot [<file>]]
// Env (from --env file or process.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_GATEWAY_API_KEY
// Default --env: packages/web/.env.local.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const envFile = opt('--env', path.join(ROOT, '.env.local'));
if (fs.existsSync(envFile)) {
  for (const l of fs.readFileSync(envFile, 'utf8').split('\n')) {
    if (!l.includes('=') || l.startsWith('#')) continue;
    const k = l.slice(0, l.indexOf('=')).trim(), v = l.slice(l.indexOf('=') + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_GATEWAY_API_KEY } = process.env;
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_GATEWAY_API_KEY }))
  if (!v) { console.error('Missing env ' + k); process.exit(1); }
const EMBED_MODEL = process.env.VANA_EMBED_MODEL || 'openai/text-embedding-3-small';
const DRY = flag('--dry'), REEMBED = flag('--reembed'), SNAPSHOT = flag('--snapshot');
const SNAPSHOT_FILE = (() => { const i = args.indexOf('--snapshot'); const n = i >= 0 ? args[i + 1] : null; return n && !n.startsWith('--') ? n : path.join(ROOT, 'data/meal-library.snapshot.json'); })();
const LIB400 = path.join(ROOT, 'data/meal-library-400.json');
const LIBASM = path.join(ROOT, 'data/assembly-library.json');

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
async function rest(pathq, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathq}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${pathq} ${r.status}: ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += 200)
    await rest(`${table}?on_conflict=id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 200)) });
}
async function embed(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const r = await fetch('https://ai-gateway.vercel.sh/v1/embeddings', {
      method: 'POST', headers: { Authorization: `Bearer ${AI_GATEWAY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts.slice(i, i + 100) }),
    });
    if (!r.ok) throw new Error(`embeddings ${r.status}: ${await r.text()}`);
    const b = await r.json();
    out.push(...b.data.sort((a, c) => a.index - c.index).map((d) => d.embedding));
    process.stdout.write(`  embedded ${Math.min(i + 100, texts.length)}/${texts.length}\n`);
  }
  return out;
}

// ---- parsing helpers (same as the prototype's seed-meal-library.mjs for the 400)
const macros = (s) => { const m = /~?(\d+)\s*kcal\s*·\s*(\d+)g C\s*·\s*(\d+)g P\s*·\s*(\d+)g F/.exec(s || ''); return m ? { kcal: +m[1], carbs_g: +m[2], protein_g: +m[3], fat_g: +m[4] } : {}; };
const prepMinutes = (p) => { if (!p) return null; if (/no-cook|none/i.test(p)) return 0; if (/overnight/i.test(p)) return 10; const m = /(\d+)\s*min/.exec(p); return m ? +m[1] : null; };
const servings = (ing, prep) => { const m = /(\d+)(?:–\d+)?\s*servings?/.exec(prep || '') || /makes\s+(\d+)/.exec(ing || ''); return m ? +m[1] : 1; };
const ingredientsJson = (ing) => ing.replace(/\s*\(makes.*?\)\s*$/i, '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const m = /^(.*?)\s+((?:[\d½¼¾⅓⅔/.]+\s*)[^,]*)$/.exec(x); return m ? { name: m[1], qty: m[2] } : { name: x, qty: '' }; });
const DIETS = ['omnivore', 'vegetarian', 'pescatarian', 'vegan', 'mediterranean', 'paleo', 'keto', 'low_carb'];

// Heuristic split of the 400: an assembly has ≤6 ingredients, ≤15 min prep, and no method-word in the name.
const RECIPE_WORDS = /\b(curry|stew|chil+i|bake|casserole|pancakes?|waffles?|soup|risotto|stir-?fry|muffins?|lasagn\w*|burgers?|pie|frittata|omelet+e?|shakshuka|bolognese|ragu|tagine|paella|fried rice|patties|fritters?|loaf|bars?|balls?|bites?|cookies?|stuffed|pilaf|biryani|kitchari|dal|dahl|chowder|meatballs?|kedgeree|hash|gratin|enchiladas?|quesadilla|pizza|quiche|scramble|pudding|crumble|flapjacks?|granola|overnight)\b/i;
const isAssembly = (m) => ingredientsJson(m.ingredients).length <= 6 && (prepMinutes(m.prep) ?? 99) <= 15 && !RECIPE_WORDS.test(m.name);

const embedText = (r) => `${r.meal_type}: ${r.name}. ${r.why || ''} Ingredients: ${r.ingredients}. Contexts: ${(r.contexts || []).join(', ')}. Cuisine: ${r.cuisine || ''}. ${r.batch ? 'Batch-cookable.' : ''}`;

// ---- build rows
let all;
if (SNAPSHOT) {
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
  const cols = snap.columns.filter((c) => c !== 'embedding' && c !== 'search_text');
  // identical keys on every object (PostgREST batch upsert); the snapshot never carries embedding/search_text
  all = snap.rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] === undefined ? null : r[c]])));
  console.log(`snapshot ${path.relative(process.cwd(), SNAPSHOT_FILE)} — exported ${snap.exported_at} from ${snap.project}: ${all.length} rows, ${cols.length} columns`);
  if (DRY) { console.log('kinds:', all.reduce((a, r) => ((a[r.kind] = (a[r.kind] || 0) + 1), a), {})); process.exit(0); }
} else {
const lib400 = JSON.parse(fs.readFileSync(LIB400, 'utf8'));
const rows400 = lib400.map((m) => ({
  id: m.id, kind: isAssembly(m) ? 'assembly' : 'recipe', name: m.name, meal_type: m.meal_type, contexts: m.context || [], cuisine: m.cuisine || null,
  ingredients: m.ingredients, ingredients_json: ingredientsJson(m.ingredients),
  diets_ok: m.diets_ok || [], excluded_diets: m.excluded_diets || DIETS.filter((d) => !(m.diets_ok || []).includes(d)),
  allergens: (m.allergens || []).filter((a) => a !== 'none'), swaps: m.swaps || null, ...macros(m.approx_macros),
  prep: m.prep || null, prep_minutes: prepMinutes(m.prep), batch: !!m.batch, servings: servings(m.ingredients, m.prep),
  source: m.source || null, why: m.why || null, is_active: true, updated_at: new Date().toISOString(),
}));

const libAsm = JSON.parse(fs.readFileSync(LIBASM, 'utf8'));
const rowsAsm = libAsm.map((a) => {
  const ingredients = a.components.map((c) => (c.qty ? `${c.food} ${c.qty}` : c.food)).join(', ');
  return {
    id: a.id, kind: 'assembly', shard_id: a.shard_id || null, name: a.name, meal_type: a.meal_type, contexts: a.context || [], cuisine: a.cuisine || null,
    ingredients, ingredients_json: a.components.map((c) => ({ name: c.food, qty: c.qty || '', role: c.role })),
    diets_ok: a.diets_ok || [], excluded_diets: a.excluded_diets || DIETS.filter((d) => !(a.diets_ok || []).includes(d)),
    allergens: a.allergens || [], swaps: a.swaps && a.swaps !== 'none noted' ? a.swaps : null, ...macros(a.approx_macros),
    prep: a.prep || null, prep_minutes: prepMinutes(a.prep), batch: !!a.batch, servings: 1,
    source: a.source || null, why: a.evidence || null, pattern: a.pattern || null, frequency: a.frequency || null,
    evidence: a.evidence || null, reconstructed_from_snippet: !!a.reconstructed_from_snippet, is_active: true, updated_at: new Date().toISOString(),
  };
});

const COLS = ['id','kind','shard_id','name','meal_type','contexts','cuisine','ingredients','ingredients_json','diets_ok','excluded_diets','allergens','swaps','kcal','carbs_g','protein_g','fat_g','prep','prep_minutes','batch','servings','source','why','pattern','frequency','evidence','reconstructed_from_snippet','is_active','updated_at'];
const normalize = (r) => Object.fromEntries(COLS.map((c) => [c, r[c] === undefined ? (c === 'reconstructed_from_snippet' ? false : null) : r[c]]));
all = [...rows400, ...rowsAsm].map(normalize);  // PostgREST batch upsert requires identical keys on every object
console.log(`400-library: ${rows400.filter((r) => r.kind === 'assembly').length} assembly / ${rows400.filter((r) => r.kind === 'recipe').length} recipe; assembly-library: ${rowsAsm.length}; total ${all.length}`);
if (DRY) { console.log('reclassified as assembly (first 30):', rows400.filter((r) => r.kind === 'assembly').slice(0, 30).map((r) => r.name)); process.exit(0); }
}
const ids = new Set(); for (const r of all) { if (ids.has(r.id)) { console.error('duplicate id ' + r.id); process.exit(1); } ids.add(r.id); }

// ---- embeddings: only rows without one (or all with --reembed)
const have = new Set();
if (!REEMBED) {
  for (let off = 0; ; off += 1000) {
    const b = await rest(`meal_library?select=id&embedding=not.is.null&order=id&limit=1000&offset=${off}`);
    b.forEach((x) => have.add(x.id)); if (b.length < 1000) break;
  }
}
const need = all.filter((r) => !have.has(r.id));
console.log(`embedding ${need.length} rows (${have.size} already embedded)`);
const CACHE = path.join(os.tmpdir(), 'meal_library_embeddings.json');
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const toEmbed = need.filter((r) => !cache[r.id + '|' + embedText(r)]);
if (toEmbed.length) {
  const vecs = await embed(toEmbed.map(embedText));
  toEmbed.forEach((r, i) => { cache[r.id + '|' + embedText(r)] = vecs[i]; });
  fs.writeFileSync(CACHE, JSON.stringify(cache));
}
need.forEach((r) => { r.embedding = JSON.stringify(cache[r.id + '|' + embedText(r)]); });

// ---- upsert (rows without `embedding` leave the existing column untouched)
const withE = all.filter((r) => r.embedding), withoutE = all.filter((r) => !r.embedding);
if (withE.length) await upsert('meal_library', withE);
if (withoutE.length) await upsert('meal_library', withoutE);
console.log(`upserted ${all.length} rows`);

await rest('rpc/refresh_meal_library_pairs', { method: 'POST', body: '{}' });
async function count(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}&limit=1`, { headers: { ...H, Prefer: 'count=exact' } });
  return (r.headers.get('content-range') || '?/?').split('/')[1];
}
console.log(`done — meal_library rows: ${await count('meal_library?select=id')}, with embeddings: ${await count('meal_library?select=id&embedding=not.is.null')}, ` +
  `assemblies: ${await count('meal_library?select=id&kind=eq.assembly')}, pairs: ${await count('meal_library_pairs?select=comp_a')}`);
