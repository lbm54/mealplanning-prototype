/**
 * MessagePartMealCard — single meal swap response card.
 *
 * 2026 facelift:
 * - KyleCard elevated, compact
 * - Electrolyte icon accent circle
 * - Macro line as small inline pills
 * - [Keep] = Mango primary · [Swap again] [Undo] = ghost bordered
 * - Smaller and lighter than the WeekPlan card — it's a detail action
 */
import { cn } from "@/lib/utils";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
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
    <KyleCard
      variant="elevated"
      className={cn("overflow-hidden max-w-sm", className)}
    >
      {/* Meal header */}
      <div className="p-3.5 flex gap-3">
        {/* Icon */}
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "bg-[var(--color-electrolyte)]/15 text-[var(--color-electrolyte)]",
            "border border-[var(--color-electrolyte)]/25",
          )}
          aria-hidden
        >
          <Utensils size={16} />
        </span>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-[var(--font-apercu)] font-medium text-[var(--font-size-body)] leading-snug">
            {meal.title}
          </p>

          {/* Method tag */}
          {meal.method_tag && (
            <p className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] italic text-muted-foreground/50">
              {meal.method_tag}
            </p>
          )}

          {/* Components */}
          {meal.components.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {meal.components.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-1.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70"
                >
                  <span className="shrink-0 text-[var(--color-electrolyte)]/50 mt-px">›</span>
                  <span>{c.portion} {c.name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Macro pills */}
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {[
              { label: "C", val: meal.totals.carb_g, color: "var(--color-orange)" },
              { label: "P", val: meal.totals.protein_g, color: "var(--color-electrolyte)" },
              { label: "F", val: meal.totals.fat_g, color: "var(--color-dragonfruit)" },
            ].map(({ label, val, color }) => (
              <span
                key={label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5",
                  "font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider",
                  "bg-background/40 border border-border/50 text-muted-foreground/60",
                )}
              >
                <span
                  className="inline-block w-1 h-1 rounded-full shrink-0"
                  style={{ background: color }}
                />
                {Math.round(val)}g {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Swap note */}
      {note && (
        <div className="px-3.5 pb-3">
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/60 italic border-l-2 border-[var(--color-electrolyte)]/30 pl-2">
            {note}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-3.5 py-2.5 border-t border-border/30 flex gap-1.5 flex-wrap">
        {onKeep && (
          <KyleButton size="sm" onClick={onKeep} className="h-auto py-1.5 px-3 text-[var(--font-size-caption)]">
            Keep
          </KyleButton>
        )}
        {onSwapAgain && (
          <button
            type="button"
            onClick={onSwapAgain}
            className={cn(
              "rounded-[var(--radius-pill)] border border-border/50 px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground/60",
              "hover:bg-muted/40 hover:text-foreground/80 transition-all duration-150",
            )}
          >
            Swap again
          </button>
        )}
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className={cn(
              "rounded-[var(--radius-pill)] border border-border/30 px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50",
              "hover:bg-muted/30 hover:text-muted-foreground/70 transition-all duration-150",
            )}
          >
            Undo
          </button>
        )}
      </div>
    </KyleCard>
  );
}
