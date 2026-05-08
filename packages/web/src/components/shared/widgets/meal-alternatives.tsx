import { useState } from "react";
import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";
import { MacroBar } from "@/components/shared/macro-bar";

/**
 * MealAlternatives — 3 stacked swap options with "Use this" button.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #16
 *
 * Reuses KyleCard + MacroBar. Each row: title + components + macros + "Use this" pill.
 * onSelect emits the chosen alternative. Disabled after one selection.
 */

export interface MealAlt {
  id: string;
  title: string;
  components: string[];
  carbG: number;
  proteinG: number;
  fatG: number;
  kcal?: number;
}

export interface MealAlternativesOutput {
  label?: string;
  slot?: string;
  alternatives: MealAlt[];
}

export interface MealAlternativesProps {
  output: MealAlternativesOutput;
  onUserResponse?: (response: { id: string; title: string }) => void;
  className?: string;
}

export default function MealAlternatives({ output, onUserResponse, className }: MealAlternativesProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(alt: MealAlt) {
    if (submitted) return;
    setSelected(alt.id);
    setSubmitted(true);
    onUserResponse?.({ id: alt.id, title: alt.title });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {output.label && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className="space-y-2">
        {output.alternatives.map((alt) => {
          const isChosen = selected === alt.id;
          return (
            <KyleCard
              key={alt.id}
              variant={isChosen ? "elevated" : "default"}
              className={cn(
                "transition-all duration-200",
                isChosen && "ring-1 ring-[var(--color-orange)]/40",
                submitted && !isChosen && "opacity-50",
              )}
            >
              <KyleCardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium leading-snug">
                      {alt.title}
                    </p>
                    {alt.components.length > 0 && (
                      <p className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground line-clamp-2">
                        {alt.components.join(" · ")}
                      </p>
                    )}
                    <MacroBar
                      carbG={alt.carbG}
                      protG={alt.proteinG}
                      fatG={alt.fatG}
                      className="mt-2"
                    />
                    {alt.kcal && (
                      <span className="mt-1 inline-block font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground tabular-nums">
                        {alt.kcal} kcal
                      </span>
                    )}
                  </div>
                  {!submitted && (
                    <button
                      onClick={() => handleSelect(alt)}
                      className={cn(
                        "shrink-0 rounded-[var(--radius-pill)] bg-primary px-3 py-1",
                        "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
                        "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
                      )}
                    >
                      Use this
                    </button>
                  )}
                  {isChosen && submitted && (
                    <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/50 px-3 py-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
                      Chosen
                    </span>
                  )}
                </div>
              </KyleCardContent>
            </KyleCard>
          );
        })}
      </div>
    </div>
  );
}
