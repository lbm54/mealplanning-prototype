/**
 * Sign-up — email + password (Supabase Auth).
 *
 * Creates a new auth user. Note: this won't link to the existing Mealvana
 * Supabase profile unless your dev project has email-based linking. For now,
 * use this only if you don't already have a Mealvana account.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { KyleButton } from "@/components/shared/kyle-button";
import { toast } from "sonner";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created. Signed in.");
        navigate({ to: "/" });
      } else {
        toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-up failed";
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
            Create account
          </h1>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            New accounts won&apos;t have any training data. To use Lee&apos;s dev data, sign in instead.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            autoFocus
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[var(--spacing-input-h)] rounded-[var(--radius-input)] border border-input bg-background px-4 font-[var(--font-apercu)] text-[var(--font-size-body)] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[var(--spacing-input-h)] rounded-[var(--radius-input)] border border-input bg-background px-4 font-[var(--font-apercu)] text-[var(--font-size-body)] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <KyleButton
            type="submit"
            variant="default"
            loading={loading}
            disabled={!email.trim() || password.length < 6 || loading}
            className="w-full"
          >
            Create account
          </KyleButton>
        </form>

        <div className="text-center">
          <Link
            to="/sign-in"
            className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
