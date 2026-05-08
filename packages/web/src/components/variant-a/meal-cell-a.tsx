/**
 * MealCellA — Variant A's upgraded meal cell.
 *
 * 2026 facelift:
 * - Empty: dashed border + plus icon + "Add" label on hover (150ms)
 * - Filled: slot label top-left in Compadre Wide (muted), component
 *   bullet list in Apercu, macro chip bottom-right in ai-active Badge style
 * - Hover: 2px lift + Electrolyte border tint
 * - Shimmer flash on swap-accept (class applied externally)
 */
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { MealAssembly } from "@/components/shared/meal-cell";
import { Badge } from "@/components/ui/badge";

export interface MealCellAProps {
  meal?: MealAssembly | null;
  slot: string;
  onClick?: () => void;
  className?: string;
  shimmer?: boolean;
}

export function MealCellA({ meal, slot: _slot, onClick, className, shimmer }: MealCellAProps) {
  if (!meal) {
    return (
      <div
        className={cn(
          "group/cell relative rounded-[var(--radius-card)]",
          "border border-dashed border-border/60",
          "flex flex-col items-center justify-center",
          "min-h-[4.5rem] p-2",
          "transition-all duration-150",
          onClick && [
            "cursor-pointer",
            "hover:border-[var(--color-electrolyte)]/50",
            "hover:bg-[var(--color-electrolyte)]/[0.03]",
          ],
          className,
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      >
        {onClick ? (
          <div className="flex flex-col items-center gap-1">
            <Plus
              size={14}
              className={cn(
                "text-muted-foreground/30",
                "group-hover/cell:text-[var(--color-electrolyte)]/70",
                "transition-colors duration-150",
              )}
            />
            <span
              className={cn(
                "font-[var(--font-compadre)] text-[7px] uppercase tracking-widest",
                "text-transparent group-hover/cell:text-[var(--color-electrolyte)]/50",
                "transition-colors duration-150",
              )}
            >
              Add
            </span>
          </div>
        ) : (
          <span className="text-[var(--font-size-caption)] text-muted-foreground/20">—</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/cell relative rounded-[var(--radius-card)] border border-border/60",
        "bg-card",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "dark:shadow-[var(--shadow-card-elevated-dark)]",
        "p-2 flex flex-col gap-1.5 min-h-[4.5rem]",
        "transition-all duration-150",
        onClick && [
          "cursor-pointer",
          "hover:-translate-y-0.5",
          "hover:border-[var(--color-electrolyte)]/40",
          "hover:shadow-[var(--shadow-kyle-elevated)]",
          "dark:hover:shadow-[var(--shadow-glow-electrolyte)]",
        ],
        shimmer && "animate-shimmer-flash",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Swap affordance — top-right on hover */}
      {onClick && (
        <button
          className={cn(
            "absolute right-1.5 top-1.5",
            "flex h-5 w-5 items-center justify-center rounded-full",
            "bg-accent text-accent-foreground text-[9px]",
            "opacity-0 group-hover/cell:opacity-100",
            "transition-all duration-150 hover:scale-110",
          )}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label="Swap this meal"
          tabIndex={-1}
        >
          ⟳
        </button>
      )}

      {/* Meal title */}
      <p
        className={cn(
          "font-[var(--font-apercu)] font-medium leading-snug text-foreground",
          "text-[var(--font-size-caption)] pr-5",
        )}
      >
        {meal.title}
      </p>

      {/* Components bullet list — compact */}
      {meal.components.length > 0 && (
        <ul className="space-y-0 text-[7px] text-muted-foreground font-[var(--font-apercu)]">
          {meal.components.slice(0, 3).map((c, i) => (
            <li key={i} className="flex gap-0.5 items-baseline truncate">
              <span className="shrink-0 text-muted-foreground/50">·</span>
              <span className="truncate">{c.name}</span>
            </li>
          ))}
          {meal.components.length > 3 && (
            <li className="text-muted-foreground/40">+{meal.components.length - 3} more</li>
          )}
        </ul>
      )}

      {/* Macro chip — bottom right */}
      <div className="mt-auto flex justify-end">
        <Badge
          variant="ai-active"
          className="text-[6px] px-1.5 py-0 leading-none h-4"
        >
          {meal.carbG}C · {meal.protG}P · {meal.fatG}F
        </Badge>
      </div>
    </div>
  );
}
