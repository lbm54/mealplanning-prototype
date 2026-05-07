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

const tierLabel: Record<CarbTier, string> = {
  "low": "Low carb",
  "moderate": "Moderate carb",
  "high": "High carb",
  "very-high": "Very high carb",
};

export interface CarbTierBadgeProps {
  carbG: number;
  className?: string;
  /** Show text label instead of just dot + number */
  showLabel?: boolean;
}

export function CarbTierBadge({ carbG, className, showLabel }: CarbTierBadgeProps) {
  const tier = getCarbTier(carbG);
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
