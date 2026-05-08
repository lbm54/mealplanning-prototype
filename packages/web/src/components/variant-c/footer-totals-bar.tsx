/**
 * FooterTotalsBar — sticky bottom bar.
 *
 * Left:   MacroProgressRings (c/p/f current vs weekly target)
 * Center: "X of 21 meals filled" with Mango progress bar
 * Right:  KyleButton "SAVE WEEK"
 *
 * weeklyTargets is optional — if not provided the rings render without target
 * fill (shows current only, rings appear at 0% fill).
 */

import { Save } from "lucide-react";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
import MacroProgressRings from "@/components/shared/widgets/macro-progress-rings";
import { cn } from "@/lib/utils";
import type { CellTotals } from "@/lib/hooks/use-column-picks";

export interface FooterTotalsBarProps {
  weekTotals:    CellTotals;
  filledCount:   number;
  totalCount:    number;
  isSaving:      boolean;
  isDirty:       boolean;
  onSave:        () => void;
  /** Weekly macro targets (daily target × 7). Optional — rings show 0 fill if omitted. */
  weeklyTargets?: CellTotals;
  className?:    string;
}

export function FooterTotalsBar({
  weekTotals,
  filledCount,
  totalCount,
  isSaving,
  isDirty,
  onSave,
  weeklyTargets,
  className,
}: FooterTotalsBarProps) {
  const progressPct = totalCount > 0 ? (filledCount / totalCount) * 100 : 0;

  // Derive sensible targets: fall back to a generous default so rings render
  const targets: CellTotals = weeklyTargets ?? {
    carb_g:    250 * 7,
    protein_g: 150 * 7,
    fat_g:     70  * 7,
  };

  return (
    <KyleCard
      variant="glass"
      className={cn("sticky bottom-0 z-30 px-4 py-3", className)}
    >
      <div className="flex items-center justify-between gap-4 min-w-0">
        {/* Left — MacroProgressRings: week totals vs weekly target */}
        <div className="hidden sm:block shrink-0">
          <MacroProgressRings
            output={{
              label: "Week totals",
              carb:    { currentG: weekTotals.carb_g,    targetG: targets.carb_g    },
              protein: { currentG: weekTotals.protein_g, targetG: targets.protein_g },
              fat:     { currentG: weekTotals.fat_g,     targetG: targets.fat_g     },
            }}
            size="compact"
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
