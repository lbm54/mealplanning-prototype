/**
 * ColumnTile — 62×74 selectable food option tile.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.1), 03_kyle_design_for_web.md §6
 *
 * Dimensions match Kyle's selection_button.dart (62×74).
 * Selected state: 2px blackberry border, electrolyte accent ring.
 * Recommended chip: small Electrolyte badge on first/top option.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FoodOption } from "@/lib/queries/columns-data.c";

export interface ColumnTileProps {
  option:     FoodOption;
  isSelected: boolean;
  onClick:    () => void;
  className?: string;
}

export function ColumnTile({ option, isSelected, onClick, className }: ColumnTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        // Base — Kyle selection_button dimensions + radius
        "relative flex w-full flex-col items-start gap-0.5 rounded-[var(--radius-card)]",
        "border-2 px-2.5 py-2 text-left transition-all",
        // Default state
        "border-border bg-card",
        "hover:border-primary hover:bg-accent/30",
        // Selected: blackberry (dark) or primary border, electrolyte accent fill
        isSelected && [
          "border-[var(--color-blackberry)] dark:border-[var(--color-electrolyte)]",
          "bg-accent/20 shadow-sm",
        ],
        // Disliked: muted
        option.isDisliked && !isSelected && "opacity-60",
        className,
      )}
    >
      {/* Recommended chip */}
      {option.isRecommended && (
        <Badge
          className={cn(
            "absolute -top-2 left-2 h-4 px-1.5 text-[9px] uppercase tracking-wider",
            "bg-accent text-accent-foreground border-0",
          )}
        >
          Rec
        </Badge>
      )}

      {/* Food name */}
      <span
        className={cn(
          "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-snug",
          isSelected ? "font-medium text-foreground" : "text-foreground/80",
        )}
      >
        {option.name}
      </span>

      {/* Serving size */}
      {option.serving_size && (
        <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wide leading-none">
          {option.serving_size}
        </span>
      )}

      {/* Macro line */}
      <span className="font-[var(--font-apercu-mono)] text-[9px] text-muted-foreground/70 uppercase tracking-wide leading-none">
        {option.carb_g}C · {option.protein_g}P · {option.fat_g}F
      </span>
    </button>
  );
}
