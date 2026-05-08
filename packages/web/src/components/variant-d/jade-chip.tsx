/**
 * JadeChip — inline prompt suggestion chip for Variant D.
 *
 * Styled as a micro-badge: subtle border, Electrolyte hover tint, lift on hover.
 * Clicking is equivalent to typing the label into the chat composer.
 */
import { cn } from "@/lib/utils";

export interface JadeChipProps {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export function JadeChip({ label, onClick, isActive, className }: JadeChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border px-3 py-1",
        "font-[var(--font-apercu)] text-[var(--font-size-caption)] leading-none",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        // Hover: electrolyte tint + lift
        "hover:-translate-y-0.5 hover:border-[var(--color-electrolyte-dark)]/40",
        "hover:bg-[var(--color-electrolyte)]/8 hover:text-[var(--color-electrolyte-dark)]",
        "hover:shadow-[0_2px_8px_-2px_rgba(28,249,207,0.18)]",
        isActive
          ? "bg-foreground text-background border-foreground"
          : "border-border/60 text-muted-foreground",
        className,
      )}
      type="button"
    >
      {label}
    </button>
  );
}
