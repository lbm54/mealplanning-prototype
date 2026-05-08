import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * AppFooter — minimal footer.
 *
 * Design source: 07_parallel_build_plans.md §1.5
 *
 * Shows copyright on the left, styleguide link on the right.
 * Refined: dimmer text, hover-color on all links, consistent Apercu caption.
 */
export function AppFooter({ className }: { className?: string }) {
  const isDev = import.meta.env.DEV;

  return (
    <footer
      className={cn(
        "border-t border-border/50 px-6 py-4",
        "flex items-center justify-between",
        className,
      )}
    >
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/60">
        © 2026 Mealvana Endurance
        <span className="mx-1.5 opacity-40">·</span>
        <span className="opacity-60">Prototype</span>
      </p>

      {isDev && (
        <Link
          to="/styleguide"
          className={cn(
            "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
            "text-muted-foreground/60 hover:text-primary",
            "transition-colors duration-150",
          )}
        >
          Styleguide →
        </Link>
      )}
    </footer>
  );
}
