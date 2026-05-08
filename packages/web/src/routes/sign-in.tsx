/**
 * Sign-in — Supabase magic link.
 *
 * User enters email → Supabase emails a one-time link → click link →
 * /auth/callback exchanges the token for a session cookie → user is signed in.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { KyleButton } from "@/components/shared/kyle-button";
import { toast } from "sonner";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your email for the magic link.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-card p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
            Sign in
          </h1>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            Use the email from your Mealvana account. We'll send you a one-time link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius)] border border-[var(--color-electrolyte)]/30 bg-[var(--color-electrolyte)]/5 px-4 py-3">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground">
                Check <span className="font-semibold">{email}</span>. Click the link to finish signing in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full text-center font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              autoFocus
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[var(--spacing-input-h)] rounded-[var(--radius-input)] border border-input bg-background px-4 font-[var(--font-apercu)] text-[var(--font-size-body)] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <KyleButton
              type="submit"
              variant="pill"
              loading={loading}
              disabled={!email.trim() || loading}
              className="w-full"
            >
              Send magic link
            </KyleButton>
          </form>
        )}

        <p className="text-center font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          New to Mealvana?{" "}
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="text-primary hover:underline"
          >
            Browse without signing in
          </button>
        </p>
      </div>
    </div>
  );
}
