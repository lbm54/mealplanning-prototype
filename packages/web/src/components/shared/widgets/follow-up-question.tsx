import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * FollowUpQuestion — Jade's question text + 2-4 quick-reply chips.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #12
 *
 * Jade's question text in italic Apercu. Quick-reply chips below.
 * Tap a chip → onUserResponse. Disabled after one tap.
 */

export interface FollowUpChip {
  id: string;
  label: string;
}

export interface FollowUpQuestionOutput {
  question: string;
  chips: FollowUpChip[];
}

export interface FollowUpQuestionProps {
  output: FollowUpQuestionOutput;
  onUserResponse?: (response: { id: string; label: string }) => void;
  className?: string;
}

export default function FollowUpQuestion({ output, onUserResponse, className }: FollowUpQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  function handlePick(chip: FollowUpChip) {
    if (disabled) return;
    setSelected(chip.id);
    setDisabled(true);
    onUserResponse?.({ id: chip.id, label: chip.label });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] italic text-foreground leading-relaxed">
        {output.question}
      </p>
      <div className="flex flex-wrap gap-2">
        {output.chips.map((chip) => {
          const isSelected = selected === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => handlePick(chip)}
              disabled={disabled && !isSelected}
              aria-pressed={isSelected}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3 py-1.5",
                "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isSelected
                  ? "bg-[var(--color-blackberry-light)] border-[var(--color-blackberry-light)] text-white"
                  : "border-[var(--color-electrolyte)]/40 text-foreground hover:bg-[var(--color-electrolyte)]/10 hover:border-[var(--color-electrolyte)]/60",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
