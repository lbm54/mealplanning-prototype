import fs from 'node:fs'; import { createClient } from '@supabase/supabase-js';
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const sb=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const email=process.argv[2]||'test@test.com';
const {data,error}=await sb.auth.admin.generateLink({type:'magiclink',email});
if(error){console.error(error.message);process.exit(1)}
console.log(`http://localhost:3000/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/food/plan`);
