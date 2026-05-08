import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SlotChips — 7 meal-slot chips (B / L / D / Snack / Pre / During / Post).
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #3
 *
 * Compadre Wide uppercase labels. Multi-select by default (Jade typically
 * asks "which slots to plan?"). Single-select if mode="single".
 */

export interface SlotChipsOutput {
  mode?: "single" | "multi";
  preSelected?: string[];
  label?: string;
}

export interface SlotChipsProps {
  output: SlotChipsOutput;
  onUserResponse?: (response: { slots: string[] }) => void;
  className?: string;
}

const SLOTS = [
  { id: "breakfast", label: "B" },
  { id: "lunch", label: "L" },
  { id: "dinner", label: "D" },
  { id: "snack", label: "Snack" },
  { id: "pre_workout", label: "Pre" },
  { id: "during_workout", label: "During" },
  { id: "post_workout", label: "Post" },
];

export default function SlotChips({ output, onUserResponse, className }: SlotChipsProps) {
  const mode = output.mode ?? "multi";
  const [selected, setSelected] = useState<Set<string>>(
    new Set(output.preSelected ?? []),
  );
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    if (mode === "single") {
      if (submitted) return;
      setSelected(new Set([id]));
      setSubmitted(true);
      onUserResponse?.({ slots: [id] });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  }

  function handleConfirm() {
    if (submitted) return;
    setSubmitted(true);
    onUserResponse?.({ slots: Array.from(selected) });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {output.label && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {SLOTS.map((slot) => {
          const isOn = selected.has(slot.id);
          return (
            <button
              key={slot.id}
              onClick={() => toggle(slot.id)}
              disabled={submitted && mode === "single" && !isOn}
              aria-pressed={isOn}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3 py-1",
                "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isOn
                  ? "bg-[var(--color-blackberry-light)] border-[var(--color-blackberry-light)] text-white dark:bg-[var(--color-electrolyte)]/20 dark:border-[var(--color-electrolyte)] dark:text-[var(--color-electrolyte)]"
                  : "border-border text-foreground hover:bg-[var(--color-electrolyte)]/10 hover:border-[var(--color-electrolyte)]/40",
              )}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
      {mode === "multi" && !submitted && (
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className={cn(
            "mt-1 rounded-[var(--radius-pill)] bg-primary px-4 py-1",
            "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
            "transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:bg-[var(--color-orange-light)]",
          )}
        >
          Confirm
        </button>
      )}
    </div>
  );
}
