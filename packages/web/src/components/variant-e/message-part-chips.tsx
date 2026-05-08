/**
 * MessagePartChips — inline follow-up chip suggestions.
 *
 * 2026 facelift:
 * - Stagger-in 100ms apart via animation-delay
 * - Hover: lift + subtle Electrolyte border
 * - Slightly larger touch target, Apercu normal case
 * - Onboarding chips and refinement chips use same component
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
    <div className={cn("flex flex-wrap gap-2 mt-1", className)}>
      {chips.map((chip, idx) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChipClick(chip.label)}
          className={cn(
            // Base shape
            "rounded-[var(--radius-pill)] border px-3.5 py-1.5",
            // Typography
            "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground/70",
            // Colors
            "border-border/40 bg-card/40 backdrop-blur-sm",
            // States
            "hover:border-[var(--color-electrolyte)]/50 hover:text-foreground",
            "hover:bg-[var(--color-electrolyte)]/8 hover:-translate-y-0.5",
            "active:translate-y-0",
            // Animation
            "animate-fade-up opacity-0",
            // Transition
            "transition-all duration-150",
          )}
          style={{
            animationDelay: `${idx * 80}ms`,
            animationFillMode: "both",
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
