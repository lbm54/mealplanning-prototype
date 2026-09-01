import { getServerSupabase } from "@/lib/supabase/server.server";
/** Resolve the signed-in user's id from the Supabase cookie session. Returns null when unauthenticated. */
export async function currentUserId(): Promise<string | null> {
  try { const sb = await getServerSupabase(); const { data } = await sb.auth.getUser(); if (!data.user) console.error("[vana] currentUserId: no user"); return data.user?.id ?? null; } catch (e) { console.error("[vana] currentUserId failed:", (e as Error).message); return null; }
}
