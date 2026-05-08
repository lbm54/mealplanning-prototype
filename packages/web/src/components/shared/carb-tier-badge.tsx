import { cn } from "@/lib/utils";

/**
 * CarbTierBadge — colored dot + gram count for the carbohydrate tier.
 *
 * Design source: 05_design_proposal.md §5.3
 *
 * Tiers (mapped to Kyle brand colors — no generic traffic-light):
 *   Low     < 150g  → electrolyte (cyan-green)
 *   Moderate 150–199g → orange-light
 *   High    200–279g → orange
 *   Very high ≥ 280g → dragonfruit (magenta)
 *
 * Added: withLabel mode — dot paired with Compadre Wide uppercase label +
 * subtle background tint matching the tier color.
 */
export type CarbTier = "low" | "moderate" | "high" | "very-high";

function getCarbTier(carbG: number): CarbTier {
  if (carbG < 150) return "low";
  if (carbG < 200) return "moderate";
  if (carbG < 280) return "high";
  return "very-high";
}

const tierDotClass: Record<CarbTier, string> = {
  "low": "bg-[var(--color-electrolyte)]",
  "moderate": "bg-[var(--color-orange-light)]",
  "high": "bg-[var(--color-orange)]",
  "very-high": "bg-[var(--color-dragonfruit)]",
};

// Short uppercase labels for withLabel mode
const tierShortLabel: Record<CarbTier, string> = {
  "low": "REST",
  "moderate": "EASY",
  "high": "MOD",
  "very-high": "HARD",
};

const tierLabel: Record<CarbTier, string> = {
  "low": "Low carb",
  "moderate": "Moderate carb",
  "high": "High carb",
  "very-high": "Very high carb",
};

// Background tint colors for the pill mode
const tierBgClass: Record<CarbTier, string> = {
  "low": "bg-[var(--color-electrolyte)]/10 border border-[var(--color-electrolyte)]/25 text-[var(--color-electrolyte)]",
  "moderate": "bg-[var(--color-orange-light)]/10 border border-[var(--color-orange-light)]/25 text-[var(--color-orange-light)]",
  "high": "bg-[var(--color-orange)]/10 border border-[var(--color-orange)]/25 text-[var(--color-orange)]",
  "very-high": "bg-[var(--color-dragonfruit)]/10 border border-[var(--color-dragonfruit)]/25 text-[var(--color-dragonfruit)]",
};

export interface CarbTierBadgeProps {
  carbG: number;
  className?: string;
  /** Show text label instead of just dot + number */
  showLabel?: boolean;
  /**
   * withLabel mode: renders as a pill with background tint, dot, and
   * Compadre Wide uppercase short label (REST / EASY / MOD / HARD).
   */
  withLabel?: boolean;
}

export function CarbTierBadge({ carbG, className, showLabel, withLabel }: CarbTierBadgeProps) {
  const tier = getCarbTier(carbG);

  if (withLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2 py-0.5",
          "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
          tierBgClass[tier],
          className,
        )}
        aria-label={`${tierLabel[tier]}: ${carbG}g`}
      >
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full shrink-0",
            tierDotClass[tier],
          )}
        />
        {tierShortLabel[tier]}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`${tierLabel[tier]}: ${carbG}g`}
    >
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full shrink-0",
          tierDotClass[tier],
        )}
      />
      <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] uppercase tracking-wider">
        {showLabel ? `${tierLabel[tier]} · ` : ""}{carbG}g
      </span>
    </span>
  );
}

export { getCarbTier, tierDotClass };
