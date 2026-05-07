/**
 * Server-side Supabase clients.
 *
 * - getServerSupabase(): uses the Clerk-issued JWT (via the "supabase" template)
 *   so RLS policies apply to the authenticated user.
 * - getServiceRoleSupabase(): bypasses RLS. Server-only. Used ONLY in the Clerk
 *   webhook handler to look up users by email before they are authenticated.
 *
 * MANUAL STEP: Create a Clerk JWT template named "supabase" with:
 *   Algorithm: HS256
 *   Signing key: your Supabase JWT secret
 *   Claims: { "aud": "authenticated", "role": "authenticated",
 *             "sub": "{{user.public_metadata.supabaseUserId}}",
 *             "email": "{{user.primary_email_address}}" }
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Lazy check — fails gracefully with a descriptive error so the dev server
// can still boot for local testing when env vars are not yet set.
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. See .env.example for documentation.`,
    );
  }
  return value;
}

export async function getServerSupabase(): Promise<SupabaseClient<Database>> {
  // Dynamic import avoids import-time auth() call (safe for server routes).
  let token: string | null = null;
  try {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    const authState = await auth();
    if (authState.userId) {
      token = await authState.getToken({ template: "supabase" });
    }
  } catch {
    // Clerk not configured — continue with anon access (RLS will restrict data)
  }

  return createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export function getServiceRoleSupabase(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
