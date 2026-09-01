#!/usr/bin/env node
// Apply the HIGH-CONFIDENCE half of data/source-scrape.json to meal_library:
//   • method_steps verbatim from a schema.org Recipe whose name matches the meal (directions_origin='source')
//   • image_url from that same matched Recipe object
// Deliberately conservative on images: an article's og:image is usually a photo of the athlete,
// not the dish, so only a matched Recipe.image is taken. Everything else is left for the agent pass.
//
// Run: node scripts/apply_source_scrape.mjs [--env <file>] [--dry] [--overwrite]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const envFile = opt('--env', path.join(ROOT, '.env.local'));
if (fs.existsSync(envFile)) for (const l of fs.readFileSync(envFile, 'utf8').split('\n')) {
  if (!l.includes('=') || l.startsWith('#')) continue;
  const k = l.slice(0, l.indexOf('=')).trim(), v = l.slice(l.indexOf('=') + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const DRY = flag('--dry'), OVERWRITE = flag('--overwrite');

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
async function rest(q, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${q} ${r.status}: ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

const scrape = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/source-scrape.json'), 'utf8'));
const rows = [];
for (let off = 0; ; off += 1000) {
  const p = await rest(`meal_library?select=id,kind,name,meal_type,ingredients,method_steps,image_url,directions_origin&order=id&offset=${off}&limit=1000`);
  rows.push(...p); if (p.length < 1000) break;
}
const byId = new Map(rows.map((r) => [r.id, r]));

// meal id -> the pages that cite it
const pagesOf = new Map();
for (const p of scrape) for (const id of p.mealIds ?? []) {
  if (!pagesOf.has(id)) pagesOf.set(id, []);
  pagesOf.get(id).push(p);
}

const STOP = new Set(['with','and','the','a','an','of','in','on','for','my','your','recipe','recipes','easy','best','homemade','simple','quick','healthy','&']);
const toks = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
/** Jaccard-ish overlap weighted toward the meal's own words — "Porridge with banana" vs "Banana porridge" scores high. */
function similarity(mealName, recipeName) {
  const a = toks(mealName), b = toks(recipeName);
  if (!a.size || !b.size) return 0;
  let hit = 0; for (const w of a) if (b.has(w)) hit++;
  return hit / Math.min(a.size, b.size);
}
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

const MATCH_MIN = 0.6;      // a matched Recipe object must really be this meal
const patch = [];
const report = { steps: 0, images: 0, skippedHaveSteps: 0, considered: 0 };
for (const [id, pages] of pagesOf) {
  const row = byId.get(id); if (!row) continue;
  report.considered++;
  let best = null;
  for (const p of pages) for (const rec of p.recipes ?? []) {
    const score = similarity(row.name, rec.name);
    if (score >= MATCH_MIN && (!best || score > best.score)) best = { score, rec, page: p };
  }
  if (!best) continue;
  const upd = { id, name: row.name, meal_type: row.meal_type, ingredients: row.ingredients };
  let touched = false;
  const haveSteps = (row.method_steps ?? []).length > 0;
  if (best.rec.steps.length && (OVERWRITE || !haveSteps)) {
    upd.method_steps = best.rec.steps.slice(0, 14);
    upd.directions_origin = 'source';
    upd.directions_source_url = best.page.finalUrl ?? best.page.url;
    upd.directions_source_name = host(best.page.url);
    upd.directions_verbatim = true;
    upd.directions_at = new Date().toISOString();
    report.steps++; touched = true;
  } else if (haveSteps) report.skippedHaveSteps++;
  if (best.rec.image && (OVERWRITE || !row.image_url)) {
    upd.image_url = best.rec.image;
    upd.image_source_url = best.page.finalUrl ?? best.page.url;
    upd.image_credit = host(best.page.url);
    report.images++; touched = true;
  }
  if (touched) patch.push(upd);
}
console.log(`meals with a cited page: ${report.considered}`);
console.log(`  verbatim steps matched: ${report.steps}`);
console.log(`  images matched:         ${report.images}`);
console.log(`  already had steps:      ${report.skippedHaveSteps}`);
if (!patch.length) { console.log('nothing to write'); process.exit(0); }
if (DRY) { console.log(JSON.stringify(patch.slice(0, 3), null, 1)); process.exit(0); }
// PATCH per row: the updates have heterogeneous key sets (steps-only, image-only, both) and a
// bulk PostgREST upsert requires every object to carry identical keys (PGRST102).
let n = 0;
for (const u of patch) {
  const { id, name, meal_type, ingredients, ...fields } = u;   // eslint-disable-line no-unused-vars
  await rest(`meal_library?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }) });
  if (++n % 20 === 0) process.stdout.write(`  wrote ${n}/${patch.length}\n`);
}
console.log(`wrote ${patch.length} rows`);
