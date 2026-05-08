import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";

/**
 * RaceCountdown — days-until-race + race name + training tier indicator.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #21
 *
 * Big Sansita "DAYS LEFT" number. Race name below. Tier indicator using
 * CarbTierBadge to show training phase (base/build/taper/load/race).
 */

export type TrainingTier = "base" | "build" | "taper" | "load" | "race";

export interface RaceCountdownOutput {
  raceName: string;
  daysLeft: number;
  tier: TrainingTier;
  raceDate?: string;
  /** Carb grams per day for the current training phase (drives CarbTierBadge) */
  dailyCarbG?: number;
}

export interface RaceCountdownProps {
  output: RaceCountdownOutput;
  className?: string;
}

// Map training tier to appropriate daily carb g for CarbTierBadge visual
const TIER_CARB_MAP: Record<TrainingTier, number> = {
  base: 140,
  build: 170,
  taper: 120,
  load: 220,
  race: 320,
};

const TIER_LABELS: Record<TrainingTier, string> = {
  base: "Base Phase",
  build: "Build Phase",
  taper: "Taper",
  load: "Carb Load",
  race: "Race Day",
};

const TIER_DESCRIPTIONS: Record<TrainingTier, string> = {
  base: "Foundation aerobic work. Moderate carbs.",
  build: "Intensity increasing. Higher carb demands.",
  taper: "Back off volume. Conserve glycogen.",
  load: "Max carb intake. Saturate muscle glycogen.",
  race: "Race day fueling protocol active.",
};

export default function RaceCountdown({ output, className }: RaceCountdownProps) {
  const carbG = output.dailyCarbG ?? TIER_CARB_MAP[output.tier];
  const tierLabel = TIER_LABELS[output.tier];
  const tierDesc = TIER_DESCRIPTIONS[output.tier];

  return (
    <KyleCard className={cn("overflow-hidden", className)}>
      <KyleCardContent className="p-4">
        {/* Top: days left */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-[var(--font-sansita)] text-[var(--font-size-data-xl)] font-bold leading-none tabular-nums">
                {output.daysLeft}
              </span>
              <span className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-widest text-muted-foreground">
                days left
              </span>
            </div>
            <p className="mt-1 font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider leading-tight">
              {output.raceName}
            </p>
            {output.raceDate && (
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground mt-0.5">
                {output.raceDate}
              </p>
            )}
          </div>

          {/* Tier badge */}
          <CarbTierBadge carbG={carbG} withLabel className="shrink-0 mt-1" />
        </div>

        {/* Training phase info */}
        <div className="mt-3 rounded-[var(--radius-card)] bg-muted/50 px-3 py-2">
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-foreground">
            {tierLabel}
          </p>
          <p className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {tierDesc}
          </p>
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}
