import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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

        {/* Clerk UserButton — rendered only when Clerk is configured */}
        <ClerkUserButton />
      </div>
    </header>
  );
}

/**
 * Lazy wrapper for Clerk UserButton.
 * Renders nothing if Clerk is not configured (no publishable key).
 */
function ClerkUserButton() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return null;

  try {
    const { UserButton } = require("@clerk/tanstack-react-start");
    return <UserButton afterSignOutUrl="/" />;
  } catch {
    return null;
  }
}
