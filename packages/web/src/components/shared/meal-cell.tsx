import { cn } from "@/lib/utils";
import { MacroBar } from "./macro-bar";
import { Utensils, Plus } from "lucide-react";

/**
 * MealCell — the basic meal display unit.
 *
 * Design source: 05_design_proposal.md §5.7, 03_kyle_design_for_web.md §6
 *
 * Empty state: dashed border, centered "+" icon, Electrolyte hover tint.
 * Filled state: slot label in Compadre Wide, components in Apercu,
 * macro chip at bottom-right in Apercu Mono.
 *
 * Touch-friendly: min-h-20 on mobile, auto on desktop.
 */
export interface FoodComponent {
  name: string;
  portion: string;
}

export interface MealAssembly {
  id?: string;
  title: string;
  methodTag?: string;
  components: FoodComponent[];
  carbG: number;
  protG: number;
  fatG: number;
  /** When this meal was sourced from a cookbook recipe */
  recipeId?: string;
  /** Direct image URL (recipe thumbnail or user upload) */
  imageUrl?: string;
}

export interface MealCellProps {
  meal?: MealAssembly | null;
  slot: string;
  density?: "compact" | "normal";
  isPlaceholder?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MealCell({
  meal,
  slot: _slot,
  density = "normal",
  isPlaceholder,
  onClick,
  className,
}: MealCellProps) {
  if (!meal || isPlaceholder) {
    return (
      <div
        className={cn(
          "group relative rounded-[var(--radius-card)] border border-dashed border-border p-3",
          "flex flex-col items-center justify-center",
          "min-h-20 md:min-h-[5rem]",
          "font-[var(--font-apercu)] text-[var(--font-size-body)]",
          "text-muted-foreground/50",
          "transition-all duration-150",
          onClick && [
            "cursor-pointer",
            "hover:border-[var(--color-electrolyte)]/60",
            "hover:bg-[var(--color-electrolyte)]/[0.04]",
            "hover:text-[var(--color-electrolyte)]",
          ],
          className,
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      >
        {onClick ? (
          <Plus
            size={density === "compact" ? 14 : 18}
            className="opacity-40 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <span className="text-[var(--font-size-caption)]">—</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-card)] border border-border bg-card",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "dark:shadow-[var(--shadow-card-elevated-dark)]",
        "transition-all duration-150",
        "hover:shadow-[var(--shadow-kyle-elevated)] hover:-translate-y-0.5",
        "dark:hover:shadow-[var(--shadow-glow-electrolyte)]",
        density === "normal" ? "p-3" : "p-2",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Swap affordance — reveals on hover */}
      {onClick && (
        <button
          className={cn(
            "absolute right-2 top-2 opacity-0 group-hover:opacity-100",
            "flex h-6 w-6 items-center justify-center rounded-full",
            "bg-accent text-accent-foreground text-xs",
            "transition-all duration-150 hover:scale-110",
          )}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label="Swap this meal"
          tabIndex={-1}
        >
          ⟳
        </button>
      )}

      <div className="flex items-start gap-2">
        {/* Electrolyte icon circle (36px) */}
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            "bg-accent text-accent-foreground",
            density === "compact" ? "h-7 w-7" : "h-9 w-9",
          )}
          aria-hidden
        >
          <Utensils size={density === "compact" ? 14 : 18} />
        </span>

        <div className="min-w-0 flex-1">
          {/* Title */}
          <p
            className={cn(
              "font-[var(--font-apercu)] font-medium leading-snug",
              density === "compact"
                ? "text-[var(--font-size-caption)]"
                : "text-[var(--font-size-body)]",
            )}
          >
            {meal.title}
          </p>

          {/* Components list */}
          {density === "normal" && meal.components.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-[var(--font-size-caption)] text-muted-foreground font-[var(--font-apercu)]">
              {meal.components.map((c, i) => (
                <li key={i} className="flex gap-1 items-baseline">
                  <span className="shrink-0">·</span>
                  <span>{c.portion} {c.name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Method tag */}
          {density === "normal" && meal.methodTag && (
            <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] italic text-muted-foreground/70">
              {meal.methodTag}
            </p>
          )}

          {/* Macro chip — Apercu Mono at bottom right in normal, inline in compact */}
          <MacroBar
            carbG={meal.carbG}
            protG={meal.protG}
            fatG={meal.fatG}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );
}
