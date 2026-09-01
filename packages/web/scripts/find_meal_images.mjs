#!/usr/bin/env node
// Find an openly-licensed photograph for every meal_library row that lacks one.
//
// Engine is Wikimedia Commons (keyless, no daily cap, CC/PD with machine-readable
// licence metadata). Openverse is available as a booster but is capped at 200 requests/day
// for anonymous callers, so it is off unless OPENVERSE_TOKEN is set.
//
// The interesting part is query reduction: "Steel-cut oats with peanut butter & blueberries"
// matches nothing, "steel-cut oats" matches plenty. We try progressively shorter queries and
// take the first confident hit, recording which query won so a bad photo is debuggable.
//
// Run: node scripts/find_meal_images.mjs [--dry] [--limit N] [--overwrite] [--concurrency 4]
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
const DRY = flag('--dry'), OVERWRITE = flag('--overwrite');
const LIMIT = Number(opt('--limit', '0'));
const CONC = Number(opt('--concurrency', '4'));
const UA = 'MealvanaEndurance/1.0 (meal library image lookup; lee.b.martin@gmail.com)';
const REPORT = path.join(ROOT, 'data/meal-images.json');

const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
async function rest(q, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${q} ${r.status}: ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

// ---------------------------------------------------------------- query reduction
// Words that describe a serving rather than name a food. Left in a query they match anything:
// "Overnight oats, plain" once matched a photo of a grassy plain.
const STOP = new Set(['with','and','the','a','an','of','in','on','for','your','my','style','homemade','easy','quick','simple','fresh','plus','side','sides','topped','served','mixed','plate','bowl','pot','one','two','three','half','big','small','light','heavy','pre','post','race','training','recovery','athlete','runner','cyclist','breakfast','lunch','dinner','snack','plain','classic','basic','traditional','proper','hearty','loaded','leftover','batch','cold','hot','warm','overnight','quickie','large','extra','double','mini','whole','free','low','high','style']);
const clean = (s) => String(s || '')
  .replace(/\([^)]*\)/g, ' ')            // "(rice, bulgogi beef…)" is a gloss, not a dish name
  .replace(/[—–-]{1,2}\s.*$/, ' ')       // "Bibimbap — a recovery bowl" → drop the editorial tail
  .replace(/[^\p{L}\p{N}\s&]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const words = (s) => clean(s).toLowerCase().split(' ').filter(Boolean);

/** Progressively shorter queries, most specific first. */
function queriesFor(row) {
  const name = clean(row.name);
  const out = [];
  const push = (q) => { const t = clean(q); if (t && t.split(' ').length <= 6 && !out.includes(t)) out.push(t); };
  push(name);
  // everything before the first "with" / "&" / "," — usually the actual dish
  const head = name.split(/\s+with\s+|\s*&\s*|,/i)[0];
  push(head);
  // the head minus leading adjectives, down to the last two content words
  const hw = words(head).filter((w) => !STOP.has(w));
  if (hw.length > 2) push(hw.slice(-2).join(' '));
  // a bare single word ("oats", "turkey") is too generic to identify a dish — only allow it
  // when it is the whole dish name anyway
  if (hw.length === 1) push(hw[0]);
  // last resort: the biggest component by role
  const comps = Array.isArray(row.ingredients_json) ? row.ingredients_json : [];
  const primary = comps.find((c) => c && (c.role === 'starch' || c.role === 'protein'));
  if (primary?.name) push(String(primary.name).split(/[,(]/)[0]);
  return out.filter(Boolean).slice(0, 4);
}

// ---------------------------------------------------------------- Wikimedia Commons
const BAD_TITLE = /\b(map|logo|diagram|chart|coat of arms|flag|poster|banner|sign|menu|label|packaging|barcode|portrait|statue|building|street|monument)\b/i;
// Commons' bitmaps include a lot of scanned adverts, prints and paintings. They match the dish
// name perfectly and look nothing like dinner — "Cream of Wheat (1907) (ADVERT 446)".
const BAD_CONTEXT = /\b(advert|advertis\w*|ADVERT|trade card|lithograph|engraving|etching|woodcut|painting|drawing|illustration|postcard|stamp|book cover|magazine|newspaper|patent|scanned|\d{4} in advertising|19th[- ]century|18th[- ]century)\b/i;
const licenseOf = (meta) => {
  const short = meta?.LicenseShortName?.value || meta?.License?.value || '';
  const s = String(short).toLowerCase();
  if (/cc0|public domain|pd-/.test(s)) return 'cc0-or-pd';
  const m = s.match(/cc[\s-]?by(?:[\s-]?sa)?[\s-]?([\d.]+)?/);
  if (m) return `cc-${s.includes('sa') ? 'by-sa' : 'by'}${m[1] ? '-' + m[1] : ''}`;
  return null;                                            // unknown licence → we do not use it
};
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function commonsSearch(q) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*'
    + `&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap ' + q + ' food')}&gsrlimit=12&gsrnamespace=6`
    + '&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=900';
  const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`commons ${r.status}`);
  const b = await r.json();
  return Object.values(b.query?.pages ?? {});
}

/** Does this file plausibly show this dish?
 *  Commons search matches on full page text, which is far too loose for food — every content word
 *  of the query must appear in the FILE TITLE, and the file must look like food at all. Precision
 *  matters more than coverage here: a wrong photo on a recipe card is worse than no photo. */
const FOOD_HINT = /\b(food|dish|meal|cuisine|cooking|cooked|recipe|breakfast|lunch|dinner|snack|salad|soup|stew|bread|rice|pasta|noodle|oat|porridge|egg|cheese|yogh?urt|fruit|vegetable|meat|chicken|beef|pork|fish|seafood|bean|lentil|tofu|smoothie|sandwich|wrap|burrito|taco|curry|pizza|cake|pancake|toast|potato|quinoa|couscous|hummus|drink|beverage|dessert|snacks|plate|bowl|kitchen|restaurant|cuisine)\b/i;
function scoreCandidate(page, meal, query) {
  const ii = page.imageinfo?.[0];
  if (!ii?.thumburl) return null;
  if ((ii.width ?? 0) < 500) return null;
  const title = String(page.title || '').replace(/^File:/, '').replace(/\.\w+$/, '');
  if (BAD_TITLE.test(title)) return null;
  const meta = ii.extmetadata ?? {};
  const lic = licenseOf(meta);
  if (!lic) return null;

  const qw = words(query).filter((w) => !STOP.has(w) && w.length > 2);
  if (!qw.length) return null;
  // Every content word must be in the title itself, not merely somewhere on the description page,
  // AND in order and close together — otherwise "Cream of Wheat" happily matches
  // "Honey Wheat Bread with Cream Cheese", where both words appear but mean nothing together.
  const titleWords = words(title).map((w) => w.toLowerCase());
  let at = -1;
  for (const w of qw) {
    const next = titleWords.findIndex((t, i) => i > at && t.startsWith(w));
    if (next < 0) return null;                       // missing, or out of order
    if (at >= 0 && next - at > 3) return null;       // present but scattered across the title
    at = next;
  }

  // …and the file has to read as food somewhere, so "Turkey, Ontario" can't win on "turkey"
  const cats = stripHtml(meta.Categories?.value);
  const desc = stripHtml(meta.ImageDescription?.value);
  if (!FOOD_HINT.test(`${title} ${cats} ${desc}`)) return null;
  if (BAD_CONTEXT.test(`${title} ${cats}`)) return null;                 // artwork/adverts, not dinner
  const dated = title.match(/\b(1[6-9]\d{2}|200\d)\b/);                  // a year in the title is a scan tell
  if (dated) return null;

  const score = qw.length * 2 + (lic === 'cc0-or-pd' ? 1 : 0) + (FOOD_HINT.test(title) ? 1 : 0);
  return {
    score, license: lic,
    // the API hands back a non-canonical host with analytics params appended
    url: String(ii.thumburl).replace('thumb.wikimedia.org', 'upload.wikimedia.org').replace(/\?utm_[^\s]*$/, ''),
    sourceUrl: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    creator: stripHtml(meta.Artist?.value) || 'Wikimedia Commons contributor',
    title, query,
  };
}

// ---------------------------------------------------------------- run
const rows = [];
for (let off = 0; ; off += 1000) {
  const p = await rest(`meal_library?select=id,kind,name,meal_type,ingredients,ingredients_json,image_url,image_provider&order=id&offset=${off}&limit=1000`);
  rows.push(...p); if (p.length < 1000) break;
}
let todo = rows.filter((r) => OVERWRITE ? true : !r.image_url);
if (LIMIT) todo = todo.slice(0, LIMIT);
console.log(`${rows.length} meals, ${todo.length} need an image`);

// One photo shouldn't end up on 300 cards — the tab would look like a single dish. But a hard cap
// made meals miss entirely once a generic photo ("toast", "porridge") was used up, so reuse is a
// ranking penalty, not a veto: a slightly-repeated correct photo beats no photo at all.
const REUSE_CAP = Number(opt('--reuse-cap', '20'));
const useCount = new Map();
const cache = new Map();                                   // query -> candidates (many meals share a query)

const found = [];
let done = 0, missed = 0;
async function worker(queue) {
  for (;;) {
    const row = queue.shift();
    if (!row) return;
    let best = null;
    for (const q of queriesFor(row)) {
      let pages = cache.get(q);
      if (!pages) {
        try { pages = await commonsSearch(q); } catch { pages = []; }
        cache.set(q, pages);
        await new Promise((z) => setTimeout(z, 120));      // be a good Commons citizen
      }
      const cands = pages.map((p) => scoreCandidate(p, row, q)).filter(Boolean)
        .filter((c) => (useCount.get(c.url) ?? 0) < REUSE_CAP)
        .sort((a, b) => (b.score - (useCount.get(b.url) ?? 0) * 0.5) - (a.score - (useCount.get(a.url) ?? 0) * 0.5));
      if (cands.length) { best = cands[0]; break; }
    }
    if (best) {
      useCount.set(best.url, (useCount.get(best.url) ?? 0) + 1);
      found.push({ id: row.id, name: row.name, ...best });
    } else missed++;
    if (++done % 100 === 0) process.stdout.write(`  ${done}/${todo.length}  found ${found.length}  missed ${missed}\n`);
  }
}
const queue = [...todo];
await Promise.all(Array.from({ length: Math.min(CONC, queue.length) }, () => worker(queue)));

fs.writeFileSync(REPORT, JSON.stringify(found, null, 1));
console.log(`\nfound ${found.length} / ${todo.length}   (${Math.round(100 * found.length / Math.max(1, todo.length))}%)`);
console.log(`distinct photos: ${new Set(found.map((f) => f.url)).size}`);
console.log(`wrote ${path.relative(ROOT, REPORT)}`);
if (DRY) { console.log(found.slice(0, 5).map((f) => `  ${f.id} "${f.name}" ← [${f.query}] ${f.title} (${f.license})`).join('\n')); process.exit(0); }

let n = 0;
for (const f of found) {
  await rest(`meal_library?id=eq.${encodeURIComponent(f.id)}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      image_url: f.url, image_source_url: f.sourceUrl, image_license: f.license,
      image_creator: f.creator, image_provider: 'wikimedia', image_match_query: f.query,
      image_credit: `${f.creator} · ${f.license === 'cc0-or-pd' ? 'public domain' : f.license.toUpperCase()} · Wikimedia Commons`,
      image_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }),
  });
  if (++n % 100 === 0) process.stdout.write(`  wrote ${n}/${found.length}\n`);
}
console.log(`wrote ${found.length} rows`);
