import { cn } from "@/lib/utils";
import { MacroBar } from "./macro-bar";
import { Utensils } from "lucide-react";

/**
 * MealCell — the basic meal display unit.
 *
 * Design source: 05_design_proposal.md §5.7, 03_kyle_design_for_web.md §6
 *
 * Shows:
 * - 36px Electrolyte cyan icon circle (Lucide Utensils as FA Pro fallback)
 * - Title (component-style, lowercase joiners: "chicken + rice + broccoli")
 * - Bulleted list of components with portions
 * - 1-line method tag (e.g., "grilled · 5-min assembly")
 * - Macro line (carbs/protein/fat)
 *
 * Hover: elevated shadow + swap affordance reveals top-right.
 * Click: parent handles (opens swap drawer).
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
          "group relative rounded-[var(--radius-card)] border border-dashed border-border p-3 text-center text-muted-foreground",
          "font-[var(--font-apercu)] text-[var(--font-size-body)]",
          onClick && "cursor-pointer hover:border-primary hover:text-primary",
          className,
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-card)] border border-border bg-card p-3",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "transition-all hover:shadow-[var(--shadow-kyle-elevated)]",
        onClick && "cursor-pointer",
        density === "compact" && "p-2",
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
            "bg-accent text-accent-foreground text-xs transition-opacity",
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          aria-hidden
        >
          <Utensils size={18} />
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

          {/* Macro line */}
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
