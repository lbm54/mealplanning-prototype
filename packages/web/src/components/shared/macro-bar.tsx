import { cn } from "@/lib/utils";

/**
 * MacroBar — compact macro display.
 *
 * Two display modes:
 * 1. "text" (default, isTarget): renders "123g C · 45g P · 8g F" in Apercu Mono.
 *    Used in meal cells and day headers when stacked bar would be too heavy.
 * 2. "bar" (when target prop provided): horizontal stacked bar with carb/protein/fat
 *    segments, each filled with a subtle gradient. Shows "X% of target" coloring.
 *
 * Segment colors:
 *   Carbs   → Electrolyte cyan gradient
 *   Protein → Cream/off-cream (neutral warm)
 *   Fat     → Mango orange gradient
 */
export interface MacroBarProps {
  carbG: number;
  protG: number;
  fatG: number;
  className?: string;
  /** Show as targets (adds "target" label) — text mode only */
  isTarget?: boolean;
  /**
   * When provided, renders as a stacked progress bar showing actual vs target.
   * target = { carbG, protG, fatG }
   */
  target?: { carbG: number; protG: number; fatG: number };
  /** Force text-only mode even when target is provided */
  textOnly?: boolean;
}

export function MacroBar({
  carbG,
  protG,
  fatG,
  className,
  isTarget,
  target,
  textOnly,
}: MacroBarProps) {
  // Stacked bar mode — requires target prop and not textOnly
  if (target && !textOnly) {
    const totalTarget = target.carbG + target.protG + target.fatG;
    if (totalTarget > 0) {
      // Calculate each segment as % of total target
      const carbPct = Math.min((carbG / totalTarget) * 100, (target.carbG / totalTarget) * 100);
      const protPct = Math.min((protG / totalTarget) * 100, (target.protG / totalTarget) * 100);
      const fatPct = Math.min((fatG / totalTarget) * 100, (target.fatG / totalTarget) * 100);

      const overCarb = carbG > target.carbG;
      const overProt = protG > target.protG;
      const overFat = fatG > target.fatG;

      return (
        <div className={cn("space-y-1", className)}>
          {/* Stacked bar */}
          <div
            className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex"
            aria-label={`${carbG}g carbs, ${protG}g protein, ${fatG}g fat`}
          >
            {carbPct > 0 && (
              <div
                className={cn(
                  "h-full rounded-l-full transition-all duration-500",
                  overCarb
                    ? "bg-[var(--color-dragonfruit)]"
                    : "bg-gradient-to-r from-[var(--color-electrolyte-dark)] to-[var(--color-electrolyte)]",
                )}
                style={{ width: `${carbPct}%` }}
              />
            )}
            {protPct > 0 && (
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  overProt
                    ? "bg-[var(--color-dragonfruit-light)]"
                    : "bg-[var(--color-cream-dark)]",
                )}
                style={{ width: `${protPct}%` }}
              />
            )}
            {fatPct > 0 && (
              <div
                className={cn(
                  "h-full rounded-r-full transition-all duration-500",
                  overFat
                    ? "bg-[var(--color-orange-dark)]"
                    : "bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-orange-light)]",
                )}
                style={{ width: `${fatPct}%` }}
              />
            )}
          </div>

          {/* Compact label row */}
          <p
            className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground"
          >
            {carbG}g C&nbsp;·&nbsp;{protG}g P&nbsp;·&nbsp;{fatG}g F
          </p>
        </div>
      );
    }
  }

  // Text-only fallback (original behavior)
  return (
    <p
      className={cn(
        "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground",
        className,
      )}
      aria-label={`${carbG}g carbs, ${protG}g protein, ${fatG}g fat${isTarget ? " target" : ""}`}
    >
      {carbG}g C&nbsp;·&nbsp;{protG}g P&nbsp;·&nbsp;{fatG}g F
      {isTarget && <span className="ml-1 opacity-60">target</span>}
    </p>
  );
}
