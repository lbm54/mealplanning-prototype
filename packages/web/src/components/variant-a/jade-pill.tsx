/**
 * JadePill — the floating "Ask Jade" pill in the bottom-right corner.
 *
 * Design source: 06_five_uiux_approaches.md §1.A:
 *   "Jade is the floating 'Ask Jade' pill in the bottom-right corner of /plan/a.
 *    The pill is always visible but small (96px wide, Electrolyte cyan circle +
 *    'Ask Jade' in Sansita uppercase)."
 *
 * Click → parent opens the Ask Jade drawer.
 */
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";

export interface JadePillProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export function JadePill({ onClick, isOpen, className }: JadePillProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close Ask Jade" : "Ask Jade — your nutrition coach"}
      aria-expanded={isOpen}
      className={cn(
        // Fixed position — bottom-right corner
        "fixed bottom-6 right-6 z-40",
        // Pill shape: Electrolyte cyan background
        "flex items-center gap-2 rounded-[var(--radius-pill)]",
        "bg-accent text-accent-foreground",
        "px-4 h-10 shadow-[var(--shadow-kyle-elevated)]",
        // Typography
        "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider font-bold",
        // Hover / focus
        "transition-all hover:scale-105 hover:shadow-[var(--shadow-kyle-elevated-dark)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // When drawer is open: subtle inset appearance
        isOpen && "opacity-80",
        className,
      )}
    >
      <JadeAvatar size={24} state="idle" />
      <span>Ask Jade</span>
    </button>
  );
}
