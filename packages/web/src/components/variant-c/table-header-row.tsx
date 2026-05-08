/**
 * TableHeaderRow — sticky column headers for the data table.
 *
 * DAY | SLOT | PROTEIN | CARB | VEG/SAUCE | (macro bar)
 * Compadre Wide uppercase, tracking-widest.
 * Food columns get a "Why?" tooltip and a filter icon placeholder.
 */

import { Filter } from "lucide-react";
import { WhyTooltip } from "./why-tooltip";
import { cn } from "@/lib/utils";

export interface TableHeaderRowProps {
  /** Rationale strings for the header-level why tooltips (use generic copy) */
  rationale?: {
    protein: string;
    carb: string;
    veg: string;
  };
  className?: string;
}

const DEFAULT_RATIONALE = {
  protein: "Protein picks are scored by proximity to your daily protein target, filtered for allergies and dietary preference.",
  carb: "Carb picks reflect your daily carb tier. High-training days get denser sources; rest days get lighter options.",
  veg: "Veg and sauce picks are chosen for low caloric cost, high micronutrient return, and minimal GI load.",
};

export function TableHeaderRow({ rationale = DEFAULT_RATIONALE, className }: TableHeaderRowProps) {
  return (
    <div
      className={cn(
        // Match grid of the data rows
        "grid gap-0 items-end pb-1.5",
        // Layout: day-rail(88px) + slot(80px) + 3×food(1fr each) + macro-bar(148px)
        "grid-cols-[88px_80px_1fr_1fr_1fr_148px]",
        className,
      )}
    >
      {/* Day */}
      <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60 px-2 pb-1">
        Day
      </span>

      {/* Slot */}
      <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60 px-2 pb-1">
        Slot
      </span>

      {/* Protein */}
      <FoodColHeader
        label="Protein"
        rationale={rationale.protein}
        column="protein"
      />

      {/* Carb */}
      <FoodColHeader
        label="Carb"
        rationale={rationale.carb}
        column="carb"
      />

      {/* Veg / Sauce */}
      <FoodColHeader
        label="Veg / Sauce"
        rationale={rationale.veg}
        column="veg"
      />

      {/* Macro bar column */}
      <div className="flex items-center justify-end pr-2 pb-1">
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60">
          Macros
        </span>
      </div>
    </div>
  );
}

interface FoodColHeaderProps {
  label:    string;
  rationale: string;
  column:   "protein" | "carb" | "veg";
}

function FoodColHeader({ label, rationale, column }: FoodColHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 pb-1">
      <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <WhyTooltip rationale={rationale} column={column} />
      {/* Filter placeholder — future: opens a filter sheet */}
      <button
        type="button"
        aria-label={`Filter ${label} options`}
        className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors"
      >
        <Filter size={10} />
      </button>
    </div>
  );
}
