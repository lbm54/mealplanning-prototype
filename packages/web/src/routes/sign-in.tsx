/**
 * Sign-in — email + password (Supabase Auth).
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.info("Enter your email first");
      return;
    }
    setResetting(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      toast.error(msg);
    } finally {
      setResetting(false);
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
            Use your Mealvana account email and password.
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
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[var(--spacing-input-h)] rounded-[var(--radius-input)] border border-input bg-background px-4 font-[var(--font-apercu)] text-[var(--font-size-body)] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <KyleButton
            type="submit"
            variant="default"
            loading={loading}
            disabled={!email.trim() || !password || loading}
            className="w-full"
          >
            Sign in
          </KyleButton>
        </form>

        <div className="flex items-center justify-between text-[var(--font-size-caption)]">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetting}
            className="font-[var(--font-apercu)] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {resetting ? "Sending…" : "Forgot password?"}
          </button>
          <Link
            to="/sign-up"
            className="font-[var(--font-apercu)] text-muted-foreground hover:text-primary transition-colors"
          >
            Create account →
          </Link>
        </div>
      </div>
    </div>
  );
}
