/**
 * MessagePartChips — inline follow-up chip suggestions in Jade's reply.
 *
 * Design source: 06_five_uiux_approaches.md §1.E
 *
 * Chips appear below recent assistant messages when Jade detects an
 * editable plan. Clicking a chip sends it as a user message.
 */
import { cn } from "@/lib/utils";
import type { ChatChip } from "./types";

export interface MessagePartChipsProps {
  chips: ChatChip[];
  onChipClick: (label: string) => void;
  className?: string;
}

export function MessagePartChips({
  chips,
  onChipClick,
  className,
}: MessagePartChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onChipClick(chip.label)}
          className={cn(
            "rounded-[var(--radius-pill)] border border-border px-3 py-1.5",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground",
            "transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent",
            "active:scale-95",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
