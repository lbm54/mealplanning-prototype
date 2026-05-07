import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AppHeader — the top navigation bar present on all routes.
 *
 * Design source: 07_parallel_build_plans.md §1.5, 05_design_proposal.md §4.3
 *
 * Left:  "MEALVANA" wordmark in Sansita Bold, links to /
 * Right: Theme toggle, Settings link, Clerk UserButton
 */
export function AppHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background px-4 md:px-6",
        className,
      )}
    >
      {/* Brand mark */}
      <Link
        to="/"
        className="font-[var(--font-sansita)] text-[var(--font-size-section)] font-bold uppercase tracking-wider text-foreground hover:text-primary transition-colors"
      >
        Mealvana
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Link
          to="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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

  // Dynamic import to avoid server-side issues when Clerk isn't configured
  try {
    const { UserButton } = require("@clerk/tanstack-react-start");
    return <UserButton afterSignOutUrl="/" />;
  } catch {
    return null;
  }
}
