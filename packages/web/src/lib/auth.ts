/**
 * Auth helpers for server-side use in TanStack Start loaders and actions.
 */

export type AuthState =
  | { authenticated: true; userId: string; supabaseUserId: string | null }
  | { authenticated: false };

export async function getAuthState(): Promise<AuthState> {
  try {
    const { auth } = await import("@clerk/tanstack-react-start/server");
    const authResult = await auth();
    if (!authResult.userId) {
      return { authenticated: false };
    }
    const supabaseUserId =
      (authResult.sessionClaims?.publicMetadata as Record<string, string>)
        ?.supabaseUserId ?? null;
    return {
      authenticated: true,
      userId: authResult.userId,
      supabaseUserId,
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
  supabaseUserId: string | null;
}> {
  const { redirect } = await import("@tanstack/react-router");
  const state = await getAuthState();
  if (!state.authenticated) {
    throw redirect({ to: "/sign-in" });
  }
  return { userId: state.userId, supabaseUserId: state.supabaseUserId };
}
