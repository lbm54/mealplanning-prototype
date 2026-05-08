/**
 * Browser-side Supabase client (Supabase Auth via cookies).
 *
 * Use for client-side auth flows (sign-in/sign-out) and realtime subscriptions.
 * Most data fetching happens server-side via getServerSupabase() in loaders.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL ?? "",
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  );
  return _client;
}
