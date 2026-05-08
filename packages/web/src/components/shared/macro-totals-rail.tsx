import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * MacroTotalsRail — sticky right-rail card showing week macro totals.
 *
 * Design source: 05_design_proposal.md §5.5
 * Used by Approach A (Calendar) and Approach D (Hybrid).
 *
 * Upgraded: circular SVG progress rings (carb/protein/fat) with the macro
 * number centered. Each ring uses a distinct Kyle brand color.
 * Falls back to compact row layout on small sizes.
 */
export interface MacroTotalsRailProps {
  weekTotals: {
    carbG: number;
    protG: number;
    fatG: number;
  };
  /** Optional targets to show fill percentages */
  targets?: {
    carbG: number;
    protG: number;
    fatG: number;
  };
  daysPlanned: number;
  daysLocked: number;
  /** When true, renders compact row layout instead of rings */
  compact?: boolean;
  className?: string;
}

// SVG ring config — 28px radius, 60px viewBox square
const RADIUS = 28;
const STROKE = 4;
const SIZE = 64;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface MacroRingProps {
  value: number;
  target?: number;
  label: string;
  unit: string;
  color: string;
  trackColor: string;
}

function MacroRing({ value, target, label, unit, color, trackColor }: MacroRingProps) {
  const pct = target && target > 0 ? Math.min(value / target, 1) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={trackColor}
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          {target && target > 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          )}
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[var(--font-apercu-mono)] text-[11px] font-semibold leading-none tabular-nums">
            {value.toLocaleString()}
          </span>
          <span className="font-[var(--font-apercu)] text-[8px] text-muted-foreground leading-none mt-0.5">
            {unit}
          </span>
        </div>
      </div>
      <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function MacroTotalsRail({
  weekTotals,
  targets,
  daysPlanned,
  daysLocked,
  compact,
  className,
}: MacroTotalsRailProps) {
  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-3">
          <dl className="flex gap-4 justify-around">
            <CompactRow label="C" value={weekTotals.carbG} />
            <CompactRow label="P" value={weekTotals.protG} />
            <CompactRow label="F" value={weekTotals.fatG} />
          </dl>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className={cn("sticky top-4 w-60 shrink-0", className)}>
      <CardHeader>
        <CardTitle className="font-[var(--font-compadre)] uppercase tracking-widest text-[var(--font-size-body)]">
          Week Totals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Macro rings */}
        <div className="flex justify-around items-start py-2">
          <MacroRing
            value={weekTotals.carbG}
            target={targets?.carbG}
            label="Carbs"
            unit="g"
            color="var(--color-electrolyte)"
            trackColor="rgba(28,249,207,0.15)"
          />
          <MacroRing
            value={weekTotals.protG}
            target={targets?.protG}
            label="Protein"
            unit="g"
            color="var(--color-cream-dark)"
            trackColor="rgba(200,198,193,0.2)"
          />
          <MacroRing
            value={weekTotals.fatG}
            target={targets?.fatG}
            label="Fat"
            unit="g"
            color="var(--color-orange)"
            trackColor="rgba(247,139,20,0.15)"
          />
        </div>

        <div className="mt-3 border-t border-border pt-3 space-y-1">
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            → {daysPlanned} days planned
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            → {daysLocked} days locked
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactRowProps {
  label: string;
  value: number;
}

function CompactRow({ label, value }: CompactRowProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
