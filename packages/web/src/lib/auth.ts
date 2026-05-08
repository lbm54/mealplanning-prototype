/**
 * Auth helpers — Supabase Auth via cookie session.
 */
import { getServerSupabase } from "./supabase/server";

export type AuthState =
  | { authenticated: true; userId: string; email: string | null }
  | { authenticated: false };

export async function getAuthState(): Promise<AuthState> {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { authenticated: false };
    return {
      authenticated: true,
      userId: data.user.id,
      email: data.user.email ?? null,
    };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Returns the auth state or throws a redirect to /sign-in.
 * Use in loaders that require authentication.
 */
export async function requireAuth(): Promise<{
  userId: string;
  email: string | null;
}> {
  const { redirect } = await import("@tanstack/react-router");
  const state = await getAuthState();
  if (!state.authenticated) {
    throw redirect({ to: "/sign-in" });
  }
  return { userId: state.userId, email: state.email };
}
