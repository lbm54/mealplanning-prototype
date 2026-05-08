import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * AllergyMultiSelect — 9 allergen chips in a compact 3-col grid.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #4
 *
 * Multi-select. Selected = Dragonfruit fill.
 * Submits the final selection as an array of allergen ids.
 */

export interface AllergyMultiSelectOutput {
  label?: string;
  preSelected?: string[];
}

export interface AllergyMultiSelectProps {
  output: AllergyMultiSelectOutput;
  onUserResponse?: (response: { allergies: string[] }) => void;
  className?: string;
}

const ALLERGENS = [
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "gluten", label: "Gluten" },
  { id: "peanuts", label: "Peanuts" },
  { id: "sesame", label: "Sesame" },
  { id: "shellfish", label: "Shellfish" },
  { id: "soy", label: "Soy" },
  { id: "tree_nuts", label: "Tree Nuts" },
];

export default function AllergyMultiSelect({
  output,
  onUserResponse,
  className,
}: AllergyMultiSelectProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(output.preSelected ?? []),
  );
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    if (submitted) return;
    setSubmitted(true);
    onUserResponse?.({ allergies: Array.from(selected) });
  }

  return (
    <div className={cn("space-y-3", className)}>
      {output.label && (
        <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
          {output.label}
        </p>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {ALLERGENS.map((a) => {
          const isOn = selected.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              disabled={submitted}
              aria-pressed={isOn}
              className={cn(
                "rounded-[var(--radius-pill)] border px-2 py-1 text-center",
                "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isOn
                  ? "bg-[var(--color-dragonfruit)] border-[var(--color-dragonfruit)] text-white"
                  : "border-border text-foreground hover:bg-[var(--color-dragonfruit)]/10 hover:border-[var(--color-dragonfruit)]/40",
              )}
            >
              {a.label}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button
          onClick={handleConfirm}
          className={cn(
            "w-full rounded-[var(--radius-pill)] bg-primary py-1.5",
            "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
            "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
          )}
        >
          {selected.size === 0 ? "No allergies" : `Save ${selected.size} allergen${selected.size > 1 ? "s" : ""}`}
        </button>
      )}
      {submitted && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          {selected.size === 0 ? "No allergies saved." : `Saved: ${Array.from(selected).join(", ")}`}
        </p>
      )}
    </div>
  );
}
