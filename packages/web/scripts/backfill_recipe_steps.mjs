#!/usr/bin/env node
// Backfill public.meal_library.method_steps for kind='recipe' rows from
//   data/recipe-steps.json   — [{"id":"D-048","steps":["…","…"]}, …]
// The steps themselves are written offline (subagent batch reads id/name/ingredients/prep/prep_minutes
// and drafts 3-6 concise steps per recipe in one voice); this script only validates + upserts.
// Idempotent: rows that already have non-empty method_steps are skipped unless --overwrite.
//
// Run:  node scripts/backfill_recipe_steps.mjs [--env <file>] [--dry] [--overwrite]
// Env (from --env file or process.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }))
  if (!v) { console.error('Missing env ' + k); process.exit(1); }
const DRY = flag('--dry'), OVERWRITE = flag('--overwrite');
const STEPS_FILE = path.join(ROOT, 'data/recipe-steps.json');

if (!fs.existsSync(STEPS_FILE)) { console.error(`No ${STEPS_FILE} — generate it first (subagent batch over the 247 kind='recipe' rows).`); process.exit(1); }
const input = JSON.parse(fs.readFileSync(STEPS_FILE, 'utf8'));

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
async function rest(pathq, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathq}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${pathq} ${r.status}: ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

// ---- validate input shape
const bad = [];
const seen = new Set();
for (const e of input) {
  if (!e || typeof e.id !== 'string' || !Array.isArray(e.steps) || e.steps.length === 0 || e.steps.length > 12
    || !e.steps.every((s) => typeof s === 'string' && s.trim().length > 0)) bad.push(e?.id ?? JSON.stringify(e).slice(0, 40));
  if (seen.has(e?.id)) bad.push(`${e?.id} (duplicate)`);
  seen.add(e?.id);
}
if (bad.length) { console.error(`Invalid entries (need {id, steps: 1-12 non-empty strings}):\n  ${bad.join('\n  ')}`); process.exit(1); }

// ---- fetch the recipe rows we're allowed to touch
const ids = input.map((e) => e.id);
const rows = [];
for (let i = 0; i < ids.length; i += 200)
  rows.push(...await rest(`meal_library?select=id,kind,method_steps&id=in.(${JSON.stringify(ids.slice(i, i + 200)).slice(1, -1)})`));
const byId = new Map(rows.map((r) => [r.id, r]));
const notRecipe = input.filter((e) => byId.get(e.id)?.kind !== 'recipe').map((e) => `${e.id} (missing or kind != recipe)`);
if (notRecipe.length) { console.error(`Not recipe rows in meal_library:\n  ${notRecipe.join('\n  ')}`); process.exit(1); }
const skip = OVERWRITE ? [] : input.filter((e) => (byId.get(e.id)?.method_steps ?? []).length > 0).map((e) => e.id);
const todo = input.filter((e) => !skip.includes(e.id));
console.log(`${input.length} entries · ${skip.length} already have steps (skipped) · ${todo.length} to write${DRY ? ' · DRY' : ''}`);

// ---- upsert
if (!DRY && todo.length) {
  for (let i = 0; i < todo.length; i += 200) {
    const patch = todo.slice(i, i + 200).map((e) => ({ id: e.id, method_steps: e.steps.map((s) => s.trim()) }));
    await rest(`meal_library?on_conflict=id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(patch) });
    process.stdout.write(`  wrote ${Math.min(i + 200, todo.length)}/${todo.length}\n`);
  }
  console.log('Done.');
} else if (DRY) {
  console.log(`Would write method_steps for: ${todo.map((e) => e.id).join(', ')}`);
}
