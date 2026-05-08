/**
 * Column — single column (Protein / Carb / Veg) for one meal slot.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.1 + 1.C.3)
 *
 * Shows 4–6 ColumnTiles, with the recommended option at top.
 * Header has Compadre uppercase label + WhyTooltip "?".
 * Footer has AddMorePopover "+ show more".
 */

import { useState } from "react";
import { ColumnTile } from "./column-tile";
import { WhyTooltip } from "./why-tooltip";
import { AddMorePopover } from "./add-more-popover";
import { cn } from "@/lib/utils";
import type { FoodOption } from "@/lib/queries/columns-data.c";

export interface ColumnProps {
  column:     "protein" | "carb" | "veg";
  options:    FoodOption[];
  selectedId: string | null;
  rationale:  string;
  onSelect:   (foodId: string) => void;
  date:       string;
  slot:       string;
  /** "Why?" label context, e.g. "TUE Lunch" */
  rowLabel?:  string;
  className?: string;
}

const COLUMN_LABELS: Record<"protein" | "carb" | "veg", string> = {
  protein: "Protein",
  carb:    "Carb",
  veg:     "Veg / Sauce",
};

export function Column({
  column,
  options: initialOptions,
  selectedId,
  rationale,
  onSelect,
  date,
  slot,
  rowLabel,
  className,
}: ColumnProps) {
  const [options, setOptions] = useState<FoodOption[]>(initialOptions);

  function handleAddMore(newOptions: FoodOption[]) {
    // Prepend new options, deduplicating by id
    setOptions((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const fresh = newOptions.filter((o) => !existingIds.has(o.id));
      return [...fresh, ...prev];
    });
  }

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {/* Column header */}
      <div className="flex items-center gap-1.5 px-0.5 pb-1.5">
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-foreground/70">
          {COLUMN_LABELS[column]}
        </span>
        <WhyTooltip
          rationale={rationale}
          column={column}
          label={rowLabel}
        />
      </div>

      {/* Option tiles */}
      {options.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border px-3 py-4 text-center font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          No options
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.map((opt) => (
            <ColumnTile
              key={opt.id}
              option={opt}
              isSelected={selectedId === opt.id}
              onClick={() => onSelect(opt.id)}
            />
          ))}
        </div>
      )}

      {/* + show more */}
      <div className="mt-1.5">
        <AddMorePopover
          date={date}
          slot={slot}
          column={column}
          onAdd={handleAddMore}
        />
      </div>
    </div>
  );
}
