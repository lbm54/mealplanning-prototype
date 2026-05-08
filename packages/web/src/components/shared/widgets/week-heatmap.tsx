import { cn } from "@/lib/utils";
import type { CarbTier } from "@/components/shared/carb-tier-badge";

/**
 * WeekHeatmap — 7 thin column-strips shaded by carb tier.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #18
 *
 * Tier shading: REST=muted, EASY=Electrolyte/20, MOD=Electrolyte/50,
 * HARD=Mango/70, RACE=Dragonfruit. Day labels below each column.
 * Reuses CarbTierBadge color logic.
 */

export interface HeatmapDay {
  label: string;
  /** ISO date */
  date: string;
  carbG: number;
  tier?: CarbTier;
  isToday?: boolean;
}

export interface WeekHeatmapOutput {
  days: HeatmapDay[];
  label?: string;
}

export interface WeekHeatmapProps {
  output: WeekHeatmapOutput;
  className?: string;
}

// Explicit tier overrides (for RACE tier not in CarbTierBadge)
type ExtendedTier = CarbTier | "race";

const tierColors: Record<ExtendedTier, { bg: string; height: string }> = {
  "low": { bg: "bg-muted", height: "h-8" },
  "moderate": { bg: "bg-[var(--color-electrolyte)]/20", height: "h-12" },
  "high": { bg: "bg-[var(--color-electrolyte)]/50", height: "h-16" },
  "very-high": { bg: "bg-[var(--color-orange)]/70", height: "h-20" },
  "race": { bg: "bg-[var(--color-dragonfruit)]", height: "h-24" },
};

function getCarbTierExtended(carbG: number): ExtendedTier {
  if (carbG < 150) return "low";
  if (carbG < 200) return "moderate";
  if (carbG < 280) return "high";
  if (carbG < 400) return "very-high";
  return "race";
}

export default function WeekHeatmap({ output, className }: WeekHeatmapProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {output.label && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className="flex items-end gap-1">
        {output.days.map((day) => {
          const tier = day.tier ? (day.tier as ExtendedTier) : getCarbTierExtended(day.carbG);
          const { bg, height } = tierColors[tier] ?? tierColors["low"];

          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-[var(--radius-card)] transition-all duration-500",
                  bg,
                  height,
                  day.isToday && "ring-1 ring-[var(--color-orange)]",
                )}
                title={`${day.label}: ${day.carbG}g carbs`}
                role="img"
                aria-label={`${day.label}: ${day.carbG}g carbs — ${tier}`}
              />
              {/* Day label */}
              <span
                className={cn(
                  "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                  day.isToday ? "text-[var(--color-orange)]" : "text-muted-foreground",
                )}
              >
                {day.label.slice(0, 1)}
              </span>
              {/* Carb count */}
              <span className="font-[var(--font-apercu-mono)] text-[8px] tabular-nums text-muted-foreground">
                {day.carbG}g
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-1">
        {[
          { label: "Rest", color: "bg-muted" },
          { label: "Easy", color: "bg-[var(--color-electrolyte)]/20" },
          { label: "Mod", color: "bg-[var(--color-electrolyte)]/50" },
          { label: "Hard", color: "bg-[var(--color-orange)]/70" },
          { label: "Race", color: "bg-[var(--color-dragonfruit)]" },
        ].map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1">
            <span className={cn("inline-block h-2 w-2 rounded-sm", l.color)} />
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              {l.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
