/**
 * Server-side Supabase clients (Supabase Auth via cookie session).
 *
 * - getServerSupabase(): reads sb-* cookies, returns a client where RLS
 *   applies to the authenticated user. Use in route loaders + server fns.
 * - getServiceRoleSupabase(): bypasses RLS. Server-only.
 *
 * Auth flow:
 *   1. /sign-in submits email → supabase.auth.signInWithOtp() → magic link
 *   2. Email link → /auth/callback?token_hash=… → exchange for session
 *   3. Session stored in sb-<ref>-auth-token cookie (httpOnly + signed)
 *   4. getServerSupabase() reads that cookie → user is authenticated
 */
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getRequest, getResponse } from "@tanstack/react-start/server";
import type { Database } from "./types";

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
  const url = requireEnv("VITE_SUPABASE_URL");
  const anonKey = requireEnv("VITE_SUPABASE_ANON_KEY");

  let request: Request | undefined;
  // getResponse() returns a partial Response-like object; we only use .headers.append
  let response: { headers: Headers } | undefined;
  try {
    request = getRequest();
    response = getResponse() as unknown as { headers: Headers };
  } catch {
    // Outside a request context — return an unauthenticated client
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request?.headers.get("cookie") ?? "";
        if (!cookieHeader) return [];
        return cookieHeader.split(";").map((pair) => {
          const [name, ...rest] = pair.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        if (!response) return;
        for (const { name, value, options } of cookiesToSet) {
          let cookie = `${name}=${value}; Path=${options?.path ?? "/"}`;
          if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
          if (options?.httpOnly) cookie += "; HttpOnly";
          if (options?.secure) cookie += "; Secure";
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
          response.headers.append("set-cookie", cookie);
        }
      },
    },
  });
}

export function getServiceRoleSupabase(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
