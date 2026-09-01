// Seed public.meal_library from docs/new_mealplanning/meal-library-400.json with embeddings,
// then embed the user's saved_meals and match them to the library (staples matching).
// Run: node scripts/seed-meal-library.mjs   (reads packages/web/.env.local)
import fs from 'node:fs'; import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { embedMany } from 'ai';
import { createGateway } from '@ai-sdk/gateway';

const env = Object.fromEntries(fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });
const embedModel = gateway.textEmbeddingModel(env.VANA_EMBED_MODEL || 'openai/text-embedding-3-small');
const LIB = process.argv[2] || '/Users/leemartin/development/mealvana_endurance/docs/new_mealplanning/meal-library-400.json';
const meals = JSON.parse(fs.readFileSync(LIB, 'utf8'));

const num = (s) => { const m = /([\d.]+)/.exec(s || ''); return m ? Number(m[1]) : null; };
const macros = (s) => { const m = /~?(\d+)\s*kcal\s*·\s*(\d+)g C\s*·\s*(\d+)g P\s*·\s*(\d+)g F/.exec(s || ''); return m ? { kcal: +m[1], carbs_g: +m[2], protein_g: +m[3], fat_g: +m[4] } : {}; };
const prepMinutes = (p) => { if (!p) return null; if (/no-cook/i.test(p)) return 0; if (/overnight/i.test(p)) return 10; const m = /(\d+)\s*min/.exec(p); return m ? +m[1] : null; };
const servings = (ing, prep) => { const m = /(\d+)(?:–\d+)?\s*servings?/.exec(prep || '') || /makes\s+(\d+)/.exec(ing || ''); return m ? +m[1] : 1; };
const ingredientsJson = (ing) => ing.replace(/\s*\(makes.*?\)\s*$/i, '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const m = /^(.*?)\s+((?:[\d½¼¾⅓⅔/.]+\s*)[^,]*)$/.exec(x); return m ? { name: m[1], qty: m[2] } : { name: x, qty: '' }; });
const embedText = (m) => `${m.meal_type}: ${m.name}. ${m.why || ''} Ingredients: ${m.ingredients}. Contexts: ${(m.context || []).join(', ')}. Cuisine: ${m.cuisine || ''}. ${m.batch ? 'Batch-cookable.' : ''}`;

async function embedAll(texts) { const out = []; for (let i = 0; i < texts.length; i += 100) { const { embeddings } = await embedMany({ model: embedModel, values: texts.slice(i, i + 100) }); out.push(...embeddings); process.stdout.write(`  embedded ${Math.min(i + 100, texts.length)}/${texts.length}\n`); } return out; }

console.log(`Seeding ${meals.length} library meals…`);
const vecs = await embedAll(meals.map(embedText));
const rows = meals.map((m, i) => ({ id: m.id, name: m.name, meal_type: m.meal_type, contexts: m.context || [], cuisine: m.cuisine || null, ingredients: m.ingredients, ingredients_json: ingredientsJson(m.ingredients), diets_ok: m.diets_ok || [], excluded_diets: m.excluded_diets || [], allergens: (m.allergens || []).filter(a => a !== 'none'), swaps: m.swaps || null, ...macros(m.approx_macros), prep: m.prep || null, prep_minutes: prepMinutes(m.prep), batch: !!m.batch, servings: servings(m.ingredients, m.prep), source: m.source || null, why: m.why || null, embedding: JSON.stringify(vecs[i]), is_active: true, updated_at: new Date().toISOString() }));
for (let i = 0; i < rows.length; i += 50) { const { error } = await sb.from('meal_library').upsert(rows.slice(i, i + 50), { onConflict: 'id' }); if (error) { console.error('upsert failed', error); process.exit(1); } }
console.log('library upserted');

// ---- saved_meals: embed + match (only rows without an embedding)
const { data: saved, error: se } = await sb.from('saved_meals').select('id,name,items').is('embedding', null).eq('is_deleted', false).limit(500);
if (se) { console.error(se); process.exit(1); }
console.log(`Embedding ${saved.length} saved meals…`);
if (saved.length) {
  const texts = saved.map(s => `${s.name}. Ingredients: ${(s.items || []).map(i => i.name || i.food_name || '').filter(Boolean).join(', ')}`);
  const sv = await embedAll(texts);
  let matched = 0;
  for (let i = 0; i < saved.length; i++) {
    const { data: hits } = await sb.rpc('match_library', { p_embedding: JSON.stringify(sv[i]), p_limit: 1 });
    const best = hits && hits[0] && hits[0].score >= 0.82 ? hits[0] : null; if (best) matched++;
    const { error } = await sb.from('saved_meals').update({ embedding: JSON.stringify(sv[i]), library_meal_id: best ? best.id : null, meal_types: best ? [best.meal_type] : [] }).eq('id', saved[i].id);
    if (error) { console.error(error); process.exit(1); }
  }
  console.log(`saved meals embedded; ${matched} matched to a library meal (score ≥ 0.82)`);
}
const { count } = await sb.from('meal_library').select('*', { count: 'exact', head: true }).not('embedding', 'is', null);
console.log(`done — ${count} library meals with embeddings`);
