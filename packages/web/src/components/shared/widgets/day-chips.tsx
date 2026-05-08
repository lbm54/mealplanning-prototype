import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * DayChips — Mon–Sun chip row.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #2
 *
 * Modes:
 * - single: one selected at a time. Selected = Mango fill.
 * - multi:  toggle each. Selected = Electrolyte highlight.
 * Disabled after single-mode selection to prevent double-submit.
 */

export interface DayChipsOutput {
  mode?: "single" | "multi";
  preSelected?: string[];
  label?: string;
}

export interface DayChipsProps {
  output: DayChipsOutput;
  onUserResponse?: (response: { days: string[] }) => void;
  className?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DayChips({ output, onUserResponse, className }: DayChipsProps) {
  const mode = output.mode ?? "single";
  const [selected, setSelected] = useState<Set<string>>(
    new Set(output.preSelected ?? []),
  );
  const [submitted, setSubmitted] = useState(false);

  function toggle(day: string) {
    if (mode === "single") {
      if (submitted) return;
      setSelected(new Set([day]));
      setSubmitted(true);
      onUserResponse?.({ days: [day] });
    } else {
      // multi — toggle freely
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(day) ? next.delete(day) : next.add(day);
        return next;
      });
    }
  }

  function handleMultiConfirm() {
    if (submitted) return;
    setSubmitted(true);
    onUserResponse?.({ days: Array.from(selected) });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {output.label && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((day) => {
          const isOn = selected.has(day);
          return (
            <button
              key={day}
              onClick={() => toggle(day)}
              disabled={mode === "single" && submitted && !isOn}
              aria-pressed={isOn}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3 py-1",
                "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                mode === "single"
                  ? isOn
                    ? "bg-[var(--color-orange)] border-[var(--color-orange)] text-[var(--color-blackberry)]"
                    : "border-[var(--color-orange)] text-[var(--color-orange)] hover:bg-[var(--color-orange)]/10"
                  : isOn
                    ? "bg-[var(--color-electrolyte)]/20 border-[var(--color-electrolyte)] text-[var(--color-electrolyte)]"
                    : "border-border text-foreground hover:bg-[var(--color-electrolyte)]/10 hover:border-[var(--color-electrolyte)]/50",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
      {mode === "multi" && !submitted && (
        <button
          onClick={handleMultiConfirm}
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
