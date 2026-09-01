#!/usr/bin/env node
// Fetch every URL cited in public.meal_library.source, cache the page, and extract
// whatever structured recipe data it carries (schema.org Recipe instructions, og:image,
// title, plaintext body). Also backfills meal_library.source_url / source_urls, which is
// what the detail page's "See the original recipe" link uses.
//
// This is the MECHANICAL half of the directions backfill. It makes no judgement about
// whether a page's instructions actually describe our meal — that is the agent pass,
// which reads data/source-scrape.json plus the cached page text.
//
// Run:  node scripts/fetch_recipe_sources.mjs [--env <file>] [--dry] [--refetch] [--concurrency 8] [--limit N]
// Env:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Out:  .cache/source-pages/<sha1>.html      raw HTML (gitignored)
//       data/source-scrape.json   per-URL extraction
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

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

const DRY = flag('--dry'), REFETCH = flag('--refetch');
const CONC = Number(opt('--concurrency', '8'));
const LIMIT = Number(opt('--limit', '0'));
const CACHE = path.join(ROOT, '.cache/source-pages');
const OUT = path.join(ROOT, 'data/source-scrape.json');
fs.mkdirSync(CACHE, { recursive: true });

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
async function rest(pathq, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathq}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${pathq} ${r.status}: ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

// ---------------------------------------------------------------- load the library
const rows = [];
for (let off = 0; ; off += 1000) {
  const page = await rest(`meal_library?select=id,kind,name,meal_type,ingredients,source,source_url&order=id&offset=${off}&limit=1000`);
  rows.push(...page);
  if (page.length < 1000) break;
}
console.log(`meal_library: ${rows.length} rows`);

// A URL inside a free-text attribution line. Trailing punctuation is attribution prose, not the URL.
const URL_RE = /https?:\/\/[^\s<>"')\];,]+/g;
const cleanUrl = (u) => u.replace(/[.,;:)\]]+$/, '');
const urlsOf = (src) => [...new Set((String(src || '').match(URL_RE) || []).map(cleanUrl))];

const byUrl = new Map();          // url -> [mealId, …]
for (const r of rows) for (const u of urlsOf(r.source)) {
  if (!byUrl.has(u)) byUrl.set(u, []);
  byUrl.get(u).push(r.id);
}
let urls = [...byUrl.keys()];
if (LIMIT) urls = urls.slice(0, LIMIT);
console.log(`unique URLs: ${urls.length} (cited by ${new Set([...byUrl.values()].flat()).size} meals)`);

// ---------------------------------------------------------------- 1. backfill source_url / source_urls
const patch = rows
  .map((r) => ({ r, u: urlsOf(r.source) }))
  .filter(({ r, u }) => u.length && r.source_url !== u[0])
  // merge-duplicates needs every NOT NULL column without a default, so carry name/meal_type/ingredients through unchanged
  .map(({ r, u }) => ({ id: r.id, name: r.name, meal_type: r.meal_type, ingredients: r.ingredients, source_url: u[0], source_urls: u }));
console.log(`source_url backfill: ${patch.length} rows`);
if (patch.length && !DRY) {
  for (let i = 0; i < patch.length; i += 200)
    await rest('meal_library?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(patch.slice(i, i + 200)) });
  console.log('  written');
}

// ---------------------------------------------------------------- 2. fetch + extract
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
const decode = (s) => String(s)
  .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(parseInt(e[1] === 'x' || e[1] === 'X' ? e.slice(2) : e.slice(1), e[1] === 'x' || e[1] === 'X' ? 16 : 10));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', deg: '°', frac12: '½', frac14: '¼', frac34: '¾' }[e.toLowerCase()] ?? m;
  });
const stripTags = (html) => decode(html
  .replace(/<(script|style|noscript|svg|head)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')).replace(/[ \t ]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

// schema.org recipeInstructions comes in five shapes; flatten them all to strings.
function flattenInstructions(ri, depth = 0) {
  if (!ri || depth > 3) return [];
  if (typeof ri === 'string') return stripTags(ri).split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(ri)) return ri.flatMap((x) => flattenInstructions(x, depth + 1));
  if (typeof ri === 'object') {
    if (ri.itemListElement) return flattenInstructions(ri.itemListElement, depth + 1);   // HowToSection
    const t = ri.text ?? ri.name ?? ri.description;
    return t ? flattenInstructions(t, depth + 1) : [];
  }
  return [];
}
const imageOf = (img, depth = 0) => {
  if (!img || depth > 3) return null;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) { for (const x of img) { const v = imageOf(x, depth + 1); if (v) return v; } return null; }
  if (typeof img === 'object') return imageOf(img.url ?? img.contentUrl ?? null, depth + 1);
  return null;
};
const typeOf = (t) => (Array.isArray(t) ? t : [t]).filter(Boolean).map(String);

function extractJsonLd(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let parsed;
    try { parsed = JSON.parse(m[1].trim().replace(/^﻿/, '')); } catch { continue; }
    const stack = [parsed];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      if (Array.isArray(n)) { stack.push(...n); continue; }
      if (n['@graph']) stack.push(...[].concat(n['@graph']));
      if (typeOf(n['@type']).some((t) => /Recipe/i.test(t))) out.push(n);
      for (const v of Object.values(n)) if (v && typeof v === 'object') stack.push(v);
    }
  }
  return out;
}
const meta = (html, ...keys) => {
  for (const k of keys) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]+content=["']([^"']+)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${k}["']`, 'i');
    const m = html.match(re) || html.match(re2);
    if (m) return decode(m[1]);
  }
  return null;
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
async function fetchPage(url) {
  const file = path.join(CACHE, sha(url) + '.html');
  if (!REFETCH && fs.existsSync(file)) return { html: fs.readFileSync(file, 'utf8'), cached: true, status: 200 };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctl = AbortSignal.timeout(25000);
      const r = await fetch(url, { redirect: 'follow', signal: ctl, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' } });
      const ct = r.headers.get('content-type') || '';
      if (!r.ok) { if (attempt) return { status: r.status, error: `HTTP ${r.status}` }; await new Promise((z) => setTimeout(z, 1200)); continue; }
      if (!/html|text/i.test(ct)) return { status: r.status, error: `content-type ${ct}` };
      const html = await r.text();
      fs.writeFileSync(file, html);
      return { html, cached: false, status: r.status, finalUrl: r.url };
    } catch (e) {
      if (attempt) return { status: 0, error: String(e.message || e).slice(0, 120) };
      await new Promise((z) => setTimeout(z, 1200));
    }
  }
  return { status: 0, error: 'unreachable' };
}

const results = [];
let done = 0;
async function worker(queue) {
  for (;;) {
    const url = queue.shift();
    if (!url) return;
    const res = await fetchPage(url);
    const rec = { url, mealIds: byUrl.get(url) ?? [], status: res.status, cached: !!res.cached };
    if (res.error) rec.error = res.error;
    if (res.html) {
      const html = res.html;
      if (res.finalUrl && res.finalUrl !== url) rec.finalUrl = res.finalUrl;
      rec.title = meta(html, 'og:title', 'twitter:title') ?? (decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim() || null);
      rec.ogImage = meta(html, 'og:image', 'og:image:secure_url', 'twitter:image');
      const ld = extractJsonLd(html);
      rec.recipes = ld.map((n) => ({
        name: typeof n.name === 'string' ? decode(n.name) : null,
        steps: flattenInstructions(n.recipeInstructions).map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 2),
        ingredients: [].concat(n.recipeIngredient ?? n.ingredients ?? []).filter((x) => typeof x === 'string').map(decode),
        image: imageOf(n.image),
        yield: typeof n.recipeYield === 'string' ? n.recipeYield : Array.isArray(n.recipeYield) ? String(n.recipeYield[0]) : null,
      })).filter((r) => r.steps.length || r.ingredients.length);
      const text = stripTags(html);
      rec.textChars = text.length;
      rec.textFile = path.relative(ROOT, path.join(CACHE, sha(url) + '.txt'));
      fs.writeFileSync(path.join(CACHE, sha(url) + '.txt'), text.slice(0, 120000));
    }
    results.push(rec);
    if (++done % 25 === 0) process.stdout.write(`  fetched ${done}/${urls.length}\n`);
  }
}
const queue = [...urls];
await Promise.all(Array.from({ length: Math.min(CONC, queue.length) }, () => worker(queue)));

results.sort((a, b) => a.url.localeCompare(b.url));
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
const ok = results.filter((r) => !r.error);
const withRecipe = results.filter((r) => (r.recipes ?? []).some((x) => x.steps.length));
const withImage = results.filter((r) => r.ogImage || (r.recipes ?? []).some((x) => x.image));
console.log(`\nfetched ${results.length}  ok ${ok.length}  failed ${results.length - ok.length}`);
console.log(`pages with schema.org recipe steps: ${withRecipe.length}`);
console.log(`pages with an image:                ${withImage.length}`);
console.log(`meals reachable via a stepped page: ${new Set(withRecipe.flatMap((r) => r.mealIds)).size}`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
