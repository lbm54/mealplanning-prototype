import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import MealPlanCard, { type MealPlanCardOutput } from "./meal-plan-card";

/**
 * MealCarousel — horizontal scroll-snap carousel of 2-4 MealPlanCards.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #14, §1 move #10
 *
 * Default-selects the middle card. Arrow buttons + pagination dots.
 * onSelect emits the chosen plan id.
 */

export interface MealCarouselOutput {
  plans: MealPlanCardOutput[];
  label?: string;
}

export interface MealCarouselProps {
  output: MealCarouselOutput;
  onExpand?: (plan: MealPlanCardOutput) => void;
  onSelect?: (plan: MealPlanCardOutput) => void;
  className?: string;
}

export default function MealCarousel({ output, onExpand, onSelect, className }: MealCarouselProps) {
  const { plans } = output;
  const defaultIdx = Math.floor(plans.length / 2);
  const [activeIdx, setActiveIdx] = useState(defaultIdx);

  function prev() {
    setActiveIdx((i) => Math.max(0, i - 1));
  }
  function next() {
    setActiveIdx((i) => Math.min(plans.length - 1, i + 1));
  }

  function handleSelect(idx: number) {
    setActiveIdx(idx);
    onSelect?.(plans[idx]);
  }

  if (!plans.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {output.label && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.label}
        </p>
      )}

      <div className="relative">
        {/* Previous arrow */}
        {plans.length > 1 && (
          <button
            onClick={prev}
            disabled={activeIdx === 0}
            aria-label="Previous plan"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10",
              "flex h-7 w-7 items-center justify-center rounded-full",
              "bg-card border border-border shadow-sm",
              "transition-all duration-150 hover:bg-muted",
              "disabled:opacity-30 disabled:cursor-not-allowed",
            )}
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Cards */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIdx * 100}%)` }}
          >
            {plans.map((plan, i) => (
              <div key={plan.id ?? i} className="w-full shrink-0 px-1">
                <MealPlanCard
                  output={plan}
                  isSelected={i === activeIdx}
                  onExpand={onExpand ? () => onExpand(plan) : undefined}
                  className={cn(
                    "cursor-pointer",
                    i !== activeIdx && "opacity-60 scale-[0.97]",
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow */}
        {plans.length > 1 && (
          <button
            onClick={next}
            disabled={activeIdx === plans.length - 1}
            aria-label="Next plan"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10",
              "flex h-7 w-7 items-center justify-center rounded-full",
              "bg-card border border-border shadow-sm",
              "transition-all duration-150 hover:bg-muted",
              "disabled:opacity-30 disabled:cursor-not-allowed",
            )}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Pagination dots */}
      {plans.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {plans.map((_, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              aria-label={`Go to plan ${i + 1}`}
              aria-current={i === activeIdx ? "true" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === activeIdx
                  ? "w-4 bg-[var(--color-orange)]"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}

      {/* Select CTA */}
      {onSelect && (
        <button
          onClick={() => handleSelect(activeIdx)}
          className={cn(
            "w-full rounded-[var(--radius-pill)] bg-primary py-2",
            "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
            "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
          )}
        >
          Choose this plan
        </button>
      )}
    </div>
  );
}
