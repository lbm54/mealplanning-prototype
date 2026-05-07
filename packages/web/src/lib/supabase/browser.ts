/**
 * Browser-side Supabase client.
 *
 * Used only for optional realtime subscriptions. Most data fetching happens
 * server-side via getServerSupabase() in loaders.
 *
 * The accessToken callback is supported in @supabase/supabase-js >= 2.45.
 */
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/tanstack-react-start";
import { useMemo } from "react";
import type { Database } from "./types";

export function useBrowserSupabase() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createClient<Database>(
        import.meta.env.VITE_SUPABASE_URL ?? "",
        import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
        {
          accessToken: async () =>
            (await getToken({ template: "supabase" })) ?? null,
        },
      ),
    [getToken],
  );
}
