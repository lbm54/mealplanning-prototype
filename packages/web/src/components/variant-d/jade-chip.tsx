/**
 * JadeChip — inline chip suggestion from Jade's chat replies.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 *
 * Example: [vegetarian week] [more protein] [no fish] [simpler dinners]
 * Clicking a chip is equivalent to typing its label into the chat input.
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
        "rounded-[var(--radius-pill)] border px-3 py-1 transition-all",
        "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        isActive
          ? "bg-foreground text-background border-foreground"
          : "border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent",
        className,
      )}
      type="button"
    >
      {label}
    </button>
  );
}
