import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/**
 * AppHeader — the top navigation bar present on all routes.
 *
 * Design source: 07_parallel_build_plans.md §1.5, 05_design_proposal.md §4.3
 *
 * Left:  "MEALVANA" wordmark in Sansita Bold + a small Electrolyte dot
 *        signaling "Prototype" status
 * Right: Theme toggle, Settings link (both as 36px circular icon-buttons),
 *        Clerk UserButton when configured
 *
 * Shell: backdrop-blur-md + translucent Blackberry/Cream (~0.72 opacity),
 *        1px bottom border at low opacity.
 */
export function AppHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center px-4 md:px-6",
        // Glass surface
        "border-b border-white/[0.06] dark:border-white/[0.06] border-black/[0.06]",
        "bg-[var(--color-cream)]/72 dark:bg-[var(--color-blackberry)]/72",
        "backdrop-blur-md",
        className,
      )}
    >
      {/* Brand mark */}
      <Link
        to="/"
        className="flex items-center gap-2 group"
        aria-label="Mealvana home"
      >
        <span className="font-[var(--font-sansita)] text-[var(--font-size-section)] font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors duration-150">
          Mealvana
        </span>
        {/* Prototype status dot — subtle Electrolyte pulse */}
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)] animate-status-pulse"
          aria-label="Prototype"
          title="Prototype"
        />
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        <Link
          to="/settings"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "transition-all duration-150",
          )}
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>

        {/* Supabase auth — sign-in link or signed-in user pill */}
        <SupabaseAuthButton />
      </div>
    </header>
  );
}

/**
 * Shows a Sign-in pill when logged out, and an email + sign-out button when logged in.
 */
function SupabaseAuthButton() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <div className="h-8 w-20" aria-hidden />;

  if (!email) {
    return (
      <Link
        to="/sign-in"
        className="inline-flex h-9 items-center rounded-[var(--radius-pill)] bg-primary px-4 font-[var(--font-sansita)] text-[0.8125rem] font-bold uppercase tracking-wider text-primary-foreground hover:bg-[var(--color-orange-light)] active:bg-[var(--color-orange-dark)] transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] border border-border/60 bg-card px-3 font-[var(--font-apercu)] text-[0.8125rem] text-foreground hover:bg-muted transition-colors"
      title="Click to sign out"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)]" aria-hidden />
      <span className="max-w-[140px] truncate">{email}</span>
    </button>
  );
}
