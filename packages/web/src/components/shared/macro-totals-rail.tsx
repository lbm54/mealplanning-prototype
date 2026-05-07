import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * MacroTotalsRail — sticky right-rail card showing week macro totals.
 *
 * Design source: 05_design_proposal.md §5.5
 * Used by Approach A (Calendar) and Approach D (Hybrid).
 */
export interface MacroTotalsRailProps {
  weekTotals: {
    carbG: number;
    protG: number;
    fatG: number;
  };
  daysPlanned: number;
  daysLocked: number;
  className?: string;
}

export function MacroTotalsRail({
  weekTotals,
  daysPlanned,
  daysLocked,
  className,
}: MacroTotalsRailProps) {
  return (
    <Card className={cn("sticky top-4 w-60 shrink-0", className)}>
      <CardHeader>
        <CardTitle className="font-[var(--font-compadre)] uppercase tracking-wider text-[var(--font-size-body)]">
          Week Totals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <MacroRow label="Carbs" value={weekTotals.carbG} unit="g" />
          <MacroRow label="Protein" value={weekTotals.protG} unit="g" />
          <MacroRow label="Fat" value={weekTotals.fatG} unit="g" />
        </dl>

        <div className="mt-4 border-t border-border pt-4 space-y-1">
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

interface MacroRowProps {
  label: string;
  value: number;
  unit: string;
}

function MacroRow({ label, value, unit }: MacroRowProps) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd>
        <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold">
          {value.toLocaleString()}
        </span>
        <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground ml-0.5">
          {unit}
        </span>
      </dd>
    </div>
  );
}
