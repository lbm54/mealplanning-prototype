/**
 * RowMacroBar — 120px wide, 8px tall stacked macro bar per table row.
 *
 * Green-tinted when within ±10% of target.
 * Mango when below target.
 * Dragonfruit when over target.
 *
 * Includes lock/unlock toggle to the right.
 */

import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CellTotals } from "@/lib/hooks/use-column-picks";

export interface RowMacroBarProps {
  totals:       CellTotals;
  target:       { carb_g: number; protein_g: number; fat_g: number };
  isLocked:     boolean;
  onLockToggle?: () => void;
  className?:   string;
}

function macroStatus(actual: number, target: number): "none" | "good" | "over" | "under" {
  if (actual === 0) return "none";
  const ratio = actual / target;
  if (ratio >= 0.90 && ratio <= 1.15) return "good";
  if (ratio > 1.15) return "over";
  return "under";
}

export function RowMacroBar({
  totals,
  target,
  isLocked,
  onLockToggle,
  className,
}: RowMacroBarProps) {
  const hasAny = totals.carb_g > 0 || totals.protein_g > 0 || totals.fat_g > 0;
  const carbStatus = macroStatus(totals.carb_g, target.carb_g);
  const totalTarget = target.carb_g + target.protein_g + target.fat_g;

  // Bar fill colors per column status
  const carbColor =
    carbStatus === "good"  ? "bg-gradient-to-r from-[var(--color-electrolyte-dark)] to-[var(--color-electrolyte)]" :
    carbStatus === "over"  ? "bg-[var(--color-dragonfruit)]" :
    carbStatus === "under" ? "bg-[var(--color-orange)]" :
    "bg-muted-foreground/20";

  const protColor = (() => {
    const s = macroStatus(totals.protein_g, target.protein_g);
    if (s === "good") return "bg-[var(--color-cream-dark)]";
    if (s === "over") return "bg-[var(--color-dragonfruit-light)]";
    if (s === "under") return "bg-[var(--color-orange-light)]";
    return "bg-muted-foreground/15";
  })();

  const fatColor = (() => {
    const s = macroStatus(totals.fat_g, target.fat_g);
    if (s === "good") return "bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-orange-light)]";
    if (s === "over") return "bg-[var(--color-dragonfruit)]";
    if (s === "under") return "bg-[var(--color-orange-dark)]";
    return "bg-muted-foreground/10";
  })();

  // Segment widths as % of total target
  const carbPct = totalTarget > 0 ? Math.min((totals.carb_g / totalTarget) * 100, (target.carb_g / totalTarget) * 100) : 0;
  const protPct = totalTarget > 0 ? Math.min((totals.protein_g / totalTarget) * 100, (target.protein_g / totalTarget) * 100) : 0;
  const fatPct  = totalTarget > 0 ? Math.min((totals.fat_g / totalTarget) * 100, (target.fat_g / totalTarget) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-2 justify-end", className)}>
      {/* Stacked bar */}
      <div className="w-[120px] shrink-0">
        <div
          className="h-[7px] w-full rounded-full bg-muted overflow-hidden flex"
          aria-label={hasAny ? `${totals.carb_g}g carbs, ${totals.protein_g}g protein, ${totals.fat_g}g fat` : "no picks yet"}
        >
          {hasAny ? (
            <>
              {carbPct > 0 && (
                <div
                  className={cn("h-full transition-all duration-500", carbColor, carbPct > 0 && protPct === 0 && fatPct === 0 ? "rounded-full" : "rounded-l-full")}
                  style={{ width: `${carbPct}%` }}
                />
              )}
              {protPct > 0 && (
                <div
                  className={cn("h-full transition-all duration-500", protColor)}
                  style={{ width: `${protPct}%` }}
                />
              )}
              {fatPct > 0 && (
                <div
                  className={cn("h-full rounded-r-full transition-all duration-500", fatColor)}
                  style={{ width: `${fatPct}%` }}
                />
              )}
            </>
          ) : (
            <div className="h-full w-full rounded-full bg-muted-foreground/15" />
          )}
        </div>
        {/* Micro label */}
        <p className="font-[var(--font-apercu-mono)] text-[8px] text-muted-foreground/40 uppercase tracking-wide mt-0.5 text-right">
          {hasAny ? `${totals.carb_g}C · ${totals.protein_g}P` : `tgt ${target.carb_g}C`}
        </p>
      </div>

      {/* Lock toggle */}
      {onLockToggle && (
        <button
          type="button"
          onClick={onLockToggle}
          aria-label={isLocked ? "Unlock this meal" : "Lock this meal"}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
            isLocked
              ? "text-[var(--color-electrolyte)] hover:text-[var(--color-electrolyte)]/70"
              : "text-muted-foreground/30 hover:text-muted-foreground/70",
          )}
        >
          {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
      )}
    </div>
  );
}
