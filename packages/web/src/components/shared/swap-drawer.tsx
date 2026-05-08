import { cn } from "@/lib/utils";
import { MealCell, type MealAssembly } from "./meal-cell";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * SwapDrawer — the right-side Sheet for meal swapping.
 *
 * Design source: 05_design_proposal.md §4.5
 * Used by Approach A, D (shared).
 *
 * Shows: current meal + 3 alternatives from Jade.
 * Refined: glass header, Electrolyte loading shimmer, polish.
 */
export interface SwapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  slot: string;
  currentMeal?: MealAssembly | null;
  alternatives?: MealAssembly[];
  isLoading?: boolean;
  onAccept?: (meal: MealAssembly) => void;
  className?: string;
}

export function SwapDrawer({
  isOpen,
  onClose,
  date,
  slot,
  currentMeal,
  alternatives = [],
  isLoading,
  onAccept,
  className,
}: SwapDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col",
        "border-l border-border bg-background shadow-[var(--shadow-kyle-elevated-dark)]",
        className,
      )}
    >
      {/* Header — glass tint */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-border/70 p-4",
          "bg-background/90 backdrop-blur-sm",
        )}
      >
        <div>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            Swap Meal
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
            {date} · {slot.replace("_", " ")}
          </p>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            "hover:bg-muted transition-colors duration-150",
          )}
          aria-label="Close swap drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current meal */}
        {currentMeal && (
          <div>
            <p className="mb-2 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
              Current
            </p>
            <MealCell meal={currentMeal} slot={slot} />
          </div>
        )}

        {/* Alternatives */}
        <div>
          <p className="mb-2 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
            {isLoading ? "Jade is finding alternatives…" : "Alternatives"}
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-24 rounded-[var(--radius-card)] bg-muted overflow-hidden",
                    "relative before:absolute before:inset-0",
                    "before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
                    "before:animate-[shimmer_1.5s_infinite]",
                    "before:bg-[length:200%_100%]",
                  )}
                />
              ))}
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3">
              {alternatives.map((alt, i) => (
                <div key={i} className="group relative">
                  <MealCell meal={alt} slot={slot} />
                  {onAccept && (
                    <Button
                      size="sm"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onAccept(alt)}
                    >
                      Use this
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Alternatives will appear here once AI is configured.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/70 p-4">
        <input
          type="text"
          placeholder="Custom: 'I have leftover salmon' or 'make it vegetarian'"
          className={cn(
            "w-full rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
            "font-[var(--font-apercu)] text-[var(--font-size-input)]",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "h-[var(--spacing-input-h)]",
            "transition-shadow duration-150",
          )}
        />
      </div>
    </div>
  );
}
