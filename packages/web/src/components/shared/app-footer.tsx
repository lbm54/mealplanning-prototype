import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * AppFooter — minimal footer.
 *
 * Design source: 07_parallel_build_plans.md §1.5
 *
 * Shows copyright + styleguide link (dev only).
 */
export function AppFooter({ className }: { className?: string }) {
  const isDev = import.meta.env.DEV;

  return (
    <footer
      className={cn(
        "border-t border-border px-6 py-4",
        "flex items-center justify-between",
        className,
      )}
    >
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
        © 2026 Mealvana Endurance. Prototype.
      </p>

      {isDev && (
        <Link
          to="/styleguide"
          className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground hover:text-primary transition-colors"
        >
          Styleguide
        </Link>
      )}
    </footer>
  );
}
