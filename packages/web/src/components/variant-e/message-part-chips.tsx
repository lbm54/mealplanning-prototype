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
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
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
    <Suggestions className={cn("mt-1 flex-wrap", className)}>
      {chips.map((chip, idx) => (
        <Suggestion
          key={chip.label}
          suggestion={chip.label}
          onClick={onChipClick}
          className={cn(
            // Kyle pill styling overlaid on AI Elements default
            "border-border/40 bg-card/40 backdrop-blur-sm",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground/70",
            "hover:border-[var(--color-electrolyte)]/50 hover:text-foreground",
            "hover:bg-[var(--color-electrolyte)]/8 hover:-translate-y-0.5",
            // Stagger fade-up
            "animate-fade-up opacity-0 transition-all duration-150",
          )}
          style={{
            animationDelay: `${idx * 80}ms`,
            animationFillMode: "both",
          }}
        />
      ))}
    </Suggestions>
  );
}
