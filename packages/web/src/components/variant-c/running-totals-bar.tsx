/**
 * RunningTotalsBar — per-row macro totals vs target, color-coded.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.3 + 1.C.6)
 *
 * Shows "94g C · 48g P · 21g F — target 90–105g C · 45g P"
 * Turns green when within ±10% of target, amber outside, grey if no picks yet.
 */

import { cn } from "@/lib/utils";
import type { CellTotals } from "@/lib/hooks/use-column-picks";
import type { SlotMacroTarget } from "@/lib/queries/columns-data.c";
import { Lock, Unlock } from "lucide-react";

export interface RunningTotalsBarProps {
  totals:     CellTotals;
  target:     SlotMacroTarget;
  isLocked:   boolean;
  onLockToggle?: () => void;
  className?: string;
}

function macroStatus(actual: number, target: number): "none" | "good" | "over" | "under" {
  if (actual === 0) return "none";
  const ratio = actual / target;
  if (ratio >= 0.90 && ratio <= 1.15) return "good";
  if (ratio > 1.15) return "over";
  return "under";
}

export function RunningTotalsBar({
  totals,
  target,
  isLocked,
  onLockToggle,
  className,
}: RunningTotalsBarProps) {
  const carbStatus = macroStatus(totals.carb_g, target.carb_g);
  const protStatus = macroStatus(totals.protein_g, target.protein_g);
  const hasAny     = totals.carb_g > 0 || totals.protein_g > 0 || totals.fat_g > 0;

  const carbColor = {
    none:  "text-muted-foreground",
    good:  "text-green-500 dark:text-green-400",
    over:  "text-orange-500 dark:text-orange-400",
    under: "text-amber-500 dark:text-amber-400",
  }[carbStatus];

  const protColor = {
    none:  "text-muted-foreground",
    good:  "text-green-500 dark:text-green-400",
    over:  "text-orange-500 dark:text-orange-400",
    under: "text-amber-500 dark:text-amber-400",
  }[protStatus];

  return (
    <div className={cn(
      "flex items-center justify-between gap-2 rounded-b-[var(--radius-card)] bg-muted/50 px-3 py-1.5",
      isLocked && "bg-secondary/30",
      className,
    )}>
      <div className="flex flex-wrap items-center gap-1.5 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] uppercase tracking-wide">
        {hasAny ? (
          <>
            <span className={carbColor}>{totals.carb_g}g C</span>
            <span className="text-muted-foreground">·</span>
            <span className={protColor}>{totals.protein_g}g P</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{totals.fat_g}g F</span>
            <span className="text-muted-foreground/50 ml-1">
              — tgt {target.carb_g}C · {target.protein_g}P
            </span>
          </>
        ) : (
          <span className="text-muted-foreground/50">
            tgt {target.carb_g}g C · {target.protein_g}g P · {target.fat_g}g F
          </span>
        )}
      </div>

      {onLockToggle && (
        <button
          type="button"
          onClick={onLockToggle}
          aria-label={isLocked ? "Unlock this meal" : "Lock this meal"}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
            isLocked
              ? "text-primary hover:text-primary/70"
              : "text-muted-foreground/40 hover:text-muted-foreground",
          )}
        >
          {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      )}
    </div>
  );
}
