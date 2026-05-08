import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HydrationTracker — water progress vs goal.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #24
 *
 * Horizontal progress bar with Electrolyte fill.
 * target_oz label, current_oz numeric, heat-adjusted badge if applicable.
 */

export interface HydrationTrackerOutput {
  currentOz: number;
  targetOz: number;
  heatAdjusted?: boolean;
  heatAdjustmentOz?: number;
  label?: string;
}

export interface HydrationTrackerProps {
  output: HydrationTrackerOutput;
  className?: string;
}

export default function HydrationTracker({ output, className }: HydrationTrackerProps) {
  const { currentOz, targetOz } = output;
  const pct = targetOz > 0 ? Math.min(currentOz / targetOz, 1) * 100 : 0;
  const remaining = Math.max(0, targetOz - currentOz);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Droplets size={14} className="text-[var(--color-electrolyte)]" aria-hidden />
          <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-foreground">
            {output.label ?? "Hydration"}
          </span>
        </div>
        {output.heatAdjusted && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5",
              "border-[var(--color-orange)]/50 bg-[var(--color-orange)]/10 text-[var(--color-orange)]",
              "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
            )}
          >
            Heat +{output.heatAdjustmentOz ?? 8}oz
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-electrolyte)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        {/* Subtle wave shimmer overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r from-transparent via-white/20 to-transparent",
            pct > 0 && "animate-pulse",
          )}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>

      {/* Stats row */}
      <div className="flex items-end justify-between">
        <div>
          <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-date-time)] font-bold tabular-nums leading-none">
            {currentOz}
          </span>
          <span className="ml-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            / {targetOz} oz
          </span>
        </div>
        {remaining > 0 ? (
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {remaining} oz to go
          </p>
        ) : (
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
            Goal reached!
          </p>
        )}
      </div>
    </div>
  );
}
