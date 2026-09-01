#!/usr/bin/env node
// Validate + write agent-produced directions into public.meal_library.
// Input: data/direction-results/{recipes,assemblies}/*.json
//   [{ id, steps: string[], origin, sourceUrl?, sourceName?, verbatim?, imageUrl?, imageCredit? }, …]
// Idempotent: rows that already have non-empty method_steps are skipped unless --overwrite.
//
// Run: node scripts/apply_agent_directions.mjs [--dry] [--overwrite] [--only recipes|assemblies]
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
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('Missing SUPABASE env'); process.exit(1); }
const DRY = flag('--dry'), OVERWRITE = flag('--overwrite'), ONLY = opt('--only', null);
const DIR = path.join(ROOT, 'data/direction-results');

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
async function rest(q, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${q} ${r.status}: ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

const ORIGINS = new Set(['source', 'alt_source', 'ai_generated', 'assembly_simple']);
const files = [];
for (const sub of ['recipes', 'assemblies']) {
  if (ONLY && ONLY !== sub) continue;
  const d = path.join(DIR, sub);
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) files.push(path.join(d, f));
}
if (!files.length) { console.error(`No result files under ${path.relative(ROOT, DIR)}`); process.exit(1); }

const entries = []; const bad = []; const seen = new Set();
for (const f of files) {
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { bad.push(`${path.basename(f)}: unparseable — ${e.message}`); continue; }
  const list = Array.isArray(parsed) ? parsed : (parsed.results ?? parsed.meals ?? []);
  for (const e of list) {
    const where = `${path.basename(f)}/${e?.id ?? '?'}`;
    if (!e || typeof e.id !== 'string') { bad.push(`${where}: missing id`); continue; }
    if (!Array.isArray(e.steps) || !e.steps.length || e.steps.length > 14 || !e.steps.every((s) => typeof s === 'string' && s.trim().length > 3)) { bad.push(`${where}: steps must be 1-14 non-empty strings`); continue; }
    if (!ORIGINS.has(e.origin)) { bad.push(`${where}: bad origin "${e.origin}"`); continue; }
    if ((e.origin === 'source' || e.origin === 'alt_source') && !e.sourceUrl) { bad.push(`${where}: origin ${e.origin} needs sourceUrl`); continue; }
    if (seen.has(e.id)) { bad.push(`${where}: duplicate id`); continue; }
    seen.add(e.id);
    entries.push(e);
  }
}
if (bad.length) { console.error(`${bad.length} invalid entries:\n  ${bad.slice(0, 40).join('\n  ')}`); process.exit(1); }
console.log(`parsed ${entries.length} entries from ${files.length} files`);

const ids = entries.map((e) => e.id);
const rows = [];
for (let i = 0; i < ids.length; i += 150)
  rows.push(...await rest(`meal_library?select=id,kind,method_steps,image_url&id=in.(${ids.slice(i, i + 150).map((x) => `"${x}"`).join(',')})`));
const byId = new Map(rows.map((r) => [r.id, r]));
const missing = ids.filter((i) => !byId.has(i));
if (missing.length) { console.error(`${missing.length} ids not in meal_library: ${missing.slice(0, 15).join(', ')}`); process.exit(1); }

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };
const now = new Date().toISOString();
const writes = [];
let skipped = 0;
for (const e of entries) {
  const row = byId.get(e.id);
  if ((row.method_steps ?? []).length && !OVERWRITE) { skipped++; continue; }
  const f = {
    method_steps: e.steps.map((s) => s.replace(/\s+/g, ' ').trim()),
    directions_origin: e.origin,
    directions_source_url: e.sourceUrl ?? null,
    directions_source_name: e.sourceName ?? (e.sourceUrl ? host(e.sourceUrl) : null),
    directions_verbatim: e.origin === 'source' || e.origin === 'alt_source' ? e.verbatim !== false : false,
    directions_at: now,
    updated_at: now,
  };
  if (e.imageUrl && (OVERWRITE || !row.image_url)) {
    f.image_url = e.imageUrl;
    f.image_source_url = e.sourceUrl ?? null;
    f.image_credit = e.imageCredit ?? (e.sourceUrl ? host(e.sourceUrl) : null);
  }
  writes.push({ id: e.id, f });
}
const tally = writes.reduce((a, w) => { a[w.f.directions_origin] = (a[w.f.directions_origin] ?? 0) + 1; return a; }, {});
console.log(`to write ${writes.length} (skipped ${skipped} that already had steps)`);
console.log('by origin:', tally, '· with image:', writes.filter((w) => w.f.image_url).length);
if (DRY) { console.log(JSON.stringify(writes.slice(0, 2), null, 1)); process.exit(0); }
let n = 0;
for (const w of writes) {
  await rest(`meal_library?id=eq.${encodeURIComponent(w.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(w.f) });
  if (++n % 100 === 0) process.stdout.write(`  wrote ${n}/${writes.length}\n`);
}
console.log(`wrote ${writes.length} rows`);
