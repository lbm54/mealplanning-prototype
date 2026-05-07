/**
 * MessagePartMealCard — single meal swap response card in Jade's bubble.
 *
 * Design source: 06_five_uiux_approaches.md §1.E wireframe
 *
 * Shows:
 * - Meal title + components list
 * - Macro totals
 * - Optional swap note from Jade
 * - [keep] [undo] [swap again] buttons
 */
import { cn } from "@/lib/utils";
import type { MealAssembly } from "@/server/jade/schema";
import { Utensils } from "lucide-react";

export interface MessagePartMealCardProps {
  meal: MealAssembly;
  note?: string;
  onKeep?: () => void;
  onUndo?: () => void;
  onSwapAgain?: () => void;
  className?: string;
}

export function MessagePartMealCard({
  meal,
  note,
  onKeep,
  onUndo,
  onSwapAgain,
  className,
}: MessagePartMealCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-card",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "overflow-hidden",
        className,
      )}
    >
      {/* Meal header */}
      <div className="p-4 flex gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          aria-hidden
        >
          <Utensils size={18} />
        </span>
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-[var(--font-apercu)] font-medium text-[var(--font-size-body)] leading-snug">
            {meal.title}
          </p>

          {/* Method tag */}
          {meal.method_tag && (
            <p className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] italic text-muted-foreground/70">
              {meal.method_tag}
            </p>
          )}

          {/* Components list */}
          {meal.components.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {meal.components.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground"
                >
                  <span className="shrink-0">·</span>
                  <span>{c.portion} {c.name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Macro line */}
          <p className="mt-2 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
            {Math.round(meal.totals.carb_g)}g C · {Math.round(meal.totals.protein_g)}g P · {Math.round(meal.totals.fat_g)}g F
          </p>
        </div>
      </div>

      {/* Swap note */}
      {note && (
        <div className="px-4 pb-3">
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {note}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex gap-2 flex-wrap">
        {onKeep && (
          <button
            onClick={onKeep}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5",
              "bg-primary text-primary-foreground",
              "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
              "transition-colors hover:bg-[var(--color-orange-light)]",
            )}
          >
            keep
          </button>
        )}
        {onUndo && (
          <button
            onClick={onUndo}
            className={cn(
              "rounded-[var(--radius-pill)] border border-border px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground",
              "transition-colors hover:bg-muted",
            )}
          >
            undo
          </button>
        )}
        {onSwapAgain && (
          <button
            onClick={onSwapAgain}
            className={cn(
              "rounded-[var(--radius-pill)] border border-border px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground",
              "transition-colors hover:bg-muted",
            )}
          >
            swap again
          </button>
        )}
      </div>
    </div>
  );
}
