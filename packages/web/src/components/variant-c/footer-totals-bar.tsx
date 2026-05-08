/**
 * FooterTotalsBar — sticky bottom bar.
 *
 * Left:   MacroTotalsRail rings (compact mode)
 * Center: "X of 21 meals filled" with Mango progress bar
 * Right:  KyleButton "SAVE WEEK"
 */

import { Save } from "lucide-react";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
import { MacroTotalsRail } from "@/components/shared/macro-totals-rail";
import { cn } from "@/lib/utils";
import type { CellTotals } from "@/lib/hooks/use-column-picks";

export interface FooterTotalsBarProps {
  weekTotals:   CellTotals;
  filledCount:  number;
  totalCount:   number;
  isSaving:     boolean;
  isDirty:      boolean;
  onSave:       () => void;
  className?:   string;
}

export function FooterTotalsBar({
  weekTotals,
  filledCount,
  totalCount,
  isSaving,
  isDirty,
  onSave,
  className,
}: FooterTotalsBarProps) {
  const progressPct = totalCount > 0 ? (filledCount / totalCount) * 100 : 0;

  return (
    <KyleCard
      variant="glass"
      className={cn("sticky bottom-0 z-30 px-4 py-3", className)}
    >
      <div className="flex items-center justify-between gap-4 min-w-0">
        {/* Left — macro rings */}
        <div className="hidden sm:block shrink-0">
          <MacroTotalsRail
            weekTotals={{
              carbG:  weekTotals.carb_g,
              protG:  weekTotals.protein_g,
              fatG:   weekTotals.fat_g,
            }}
            daysPlanned={Math.ceil(filledCount / 3)}
            daysLocked={0}
            compact
            className="border-0 shadow-none bg-transparent p-0"
          />
        </div>

        {/* Center — progress */}
        <div className="flex-1 min-w-0 max-w-[200px]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{filledCount}</span> of {totalCount} filled
            </span>
          </div>
          <div className="h-[4px] w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-orange-light)] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Right — save */}
        <KyleButton
          size="sm"
          onClick={onSave}
          loading={isSaving}
          disabled={isSaving || !isDirty}
          className={cn("shrink-0 gap-1.5", !isDirty && "opacity-50")}
        >
          <Save size={14} />
          {isSaving ? "Saving…" : "Save Week"}
        </KyleButton>
      </div>
    </KyleCard>
  );
}
