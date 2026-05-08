/**
 * /auth/callback — handles the magic-link redirect from Supabase.
 *
 * Supabase sends users here with `?token_hash=...&type=...` (PKCE) or
 * `#access_token=...` (implicit). We let the browser client exchange it
 * for a session cookie, then redirect to the landing page.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const supabase = getBrowserSupabase();

        // Two flavors of magic link:
        //  PKCE: ?token_hash=...&type=email
        //  Hash: #access_token=...&refresh_token=...
        const search = new URLSearchParams(window.location.search);
        const tokenHash = search.get("token_hash");
        const otpType = search.get("type") as "email" | "magiclink" | "recovery" | "invite" | null;
        const code = search.get("code");

        if (tokenHash && otpType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (error) throw error;
        } else if (code) {
          // PKCE code-exchange variant
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (window.location.hash.includes("access_token")) {
          // Hash-style: supabase-js auto-detects this on init
          // Wait a tick for it to settle
          await new Promise((r) => setTimeout(r, 250));
        } else {
          throw new Error("No auth tokens found in callback URL");
        }

        if (!cancelled) {
          // Clear hash + query before navigating
          window.history.replaceState({}, "", "/");
          navigate({ to: "/" });
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Sign-in failed");
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-card p-8 text-center space-y-3">
        {status === "working" ? (
          <>
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Signing you in…
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Hang tight, we're verifying your link.
            </p>
          </>
        ) : (
          <>
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Couldn't sign you in
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-destructive">
              {errorMsg}
            </p>
            <a
              href="/sign-in"
              className="inline-block mt-2 font-[var(--font-apercu)] text-[var(--font-size-body)] text-primary hover:underline"
            >
              Try again →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
