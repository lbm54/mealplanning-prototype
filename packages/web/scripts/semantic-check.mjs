import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js'; import { embed } from 'ai'; import { createGateway } from '@ai-sdk/gateway';
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const sb=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}); const gw=createGateway({apiKey:env.AI_GATEWAY_API_KEY});
const {data:u}=await sb.from('saved_meals').select('user_id').limit(1); const uid=u[0].user_id;
const {data:me}=await sb.from('users').select('allergies,dietary_preference').eq('id',uid).single(); console.log('user',uid.slice(0,8),'allergies',me.allergies,'diet',me.dietary_preference);
for (const [q,type,ctx] of [['something light and low-fiber the night before a race','dinner',['race-week','carb-load']],['quick high-carb breakfast before a long ride','breakfast',['pre-session']],['salty savoury snack for a long ride','snack',null],['vegan batch dinner without nuts','dinner',null]]) {
  const {embedding}=await embed({model:gw.textEmbeddingModel(env.VANA_EMBED_MODEL),value:q});
  const {data,error}=await sb.rpc('search_meals',{p_user_id:uid,p_query:q,p_embedding:JSON.stringify(embedding),p_meal_type:type,p_contexts:ctx,p_batch:null,p_include_saved:true,p_limit:4});
  if(error){console.error(error);process.exit(1)}
  console.log('\nQ:',q); for(const r of data) console.log(' ',r.source.padEnd(7),r.id.slice(0,8).padEnd(9),r.name.slice(0,52).padEnd(53),'score',r.score.toFixed(3),'allergens',r.allergens.join(',')||'-');
}
// allergy hard filter proof: temporarily count tree_nuts meals visible to a tree-nut-allergic view
const {data:tn}=await sb.from('meal_library').select('id').contains('allergens',['tree_nuts']); console.log('\nlibrary meals containing tree_nuts:',tn.length);
