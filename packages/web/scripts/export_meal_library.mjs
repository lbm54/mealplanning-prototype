#!/usr/bin/env node
// Snapshot public.meal_library from the env's project → data/meal-library.snapshot.json (every row, every column except
// `embedding` (re-computed on load) and `search_text` (generated)). This file is the one-command seed for another project:
//   node scripts/seed_meal_library.mjs --snapshot [--env <prod env file>]
//
// Run:  node scripts/export_meal_library.mjs [--env <file>] [--out <file>]
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Default --env: packages/web/.env.local.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
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
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) if (!v) { console.error('Missing env ' + k); process.exit(1); }
const OUT = opt('--out', path.join(ROOT, 'data/meal-library.snapshot.json'));
const SKIP = new Set(['embedding', 'search_text']);

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
async function rest(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${q} ${r.status}: ${await r.text()}`);
  return r.json();
}
// Column list = the keys of one row minus the skipped ones (no information_schema access through PostgREST).
const probe = await rest('meal_library?select=*&limit=1');
if (!probe.length) { console.error('meal_library is empty'); process.exit(1); }
const cols = Object.keys(probe[0]).filter((c) => !SKIP.has(c));
const rows = [];
for (let off = 0; ; off += 500) {
  const b = await rest(`meal_library?select=${cols.join(',')}&order=id&limit=500&offset=${off}`);
  rows.push(...b); if (b.length < 500) break;
}
const snapshot = { exported_at: new Date().toISOString(), project: new URL(SUPABASE_URL).host.split('.')[0], columns: cols, count: rows.length, rows };
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 1) + '\n');
const kinds = rows.reduce((a, r) => ((a[r.kind] = (a[r.kind] || 0) + 1), a), {});
console.log(`wrote ${path.relative(process.cwd(), OUT)} — ${rows.length} rows, ${cols.length} columns (${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(', ')}), with method_steps: ${rows.filter((r) => (r.method_steps || []).length).length}, with image: ${rows.filter((r) => r.image_url).length}`);
