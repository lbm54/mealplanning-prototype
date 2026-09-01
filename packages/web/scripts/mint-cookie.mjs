// Mint a browser-equivalent session cookie header for a dev user (service role → magic link → verifyOtp → @supabase/ssr cookie).
// Run: node scripts/mint-cookie.mjs test@test.com  → prints "Cookie: ..." for curl / Chrome.
import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js'; import { createServerClient } from '@supabase/ssr';
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const admin=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const email=process.argv[2]||'test@test.com';
const {data:link,error:e1}=await admin.auth.admin.generateLink({type:'magiclink',email}); if(e1){console.error(e1.message);process.exit(1)}
const anon=createClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const {data:ver,error:e2}=await anon.auth.verifyOtp({type:'magiclink',token_hash:link.properties.hashed_token}); if(e2){console.error(e2.message);process.exit(1)}
const jar=[];
const ssr=createServerClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{cookies:{getAll:()=>[],setAll:(cs)=>{for(const c of cs) jar.push(`${c.name}=${c.value}`)}}});
await ssr.auth.setSession({access_token:ver.session.access_token,refresh_token:ver.session.refresh_token});
console.log(jar.join('; '));
