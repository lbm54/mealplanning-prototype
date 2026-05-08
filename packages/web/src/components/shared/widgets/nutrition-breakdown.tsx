import { cn } from "@/lib/utils";

/**
 * NutritionBreakdown — full macro split with fiber, sugar, sodium.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #25
 *
 * Vertical stacked rows. Total kcal at top in big Sansita.
 * Apercu Mono numerics. Macro rows colored per brand.
 */

export interface NutritionBreakdownOutput {
  label?: string;
  kcal: number;
  carbG: number;
  proteinG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  servingLabel?: string;
}

export interface NutritionBreakdownProps {
  output: NutritionBreakdownOutput;
  className?: string;
}

interface NutritionRow {
  label: string;
  value: string;
  color?: string;
  indent?: boolean;
  pct?: number;
}

function BreakdownRow({ label, value, color, indent, pct }: NutritionRow) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        indent ? "border-b border-border/30 pl-4" : "border-b border-border/60",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {color && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        )}
        <span
          className={cn(
            "font-[var(--font-compadre)] uppercase tracking-widest",
            indent
              ? "text-[var(--font-size-caption)] text-muted-foreground"
              : "text-[var(--font-size-label)] text-foreground",
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {pct !== undefined && (
          <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground tabular-nums">
            {pct}%
          </span>
        )}
        <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

export default function NutritionBreakdown({ output, className }: NutritionBreakdownProps) {
  const totalG = output.carbG + output.proteinG + output.fatG;

  const rows: NutritionRow[] = [
    {
      label: "Carbs",
      value: `${output.carbG}g`,
      color: "var(--color-orange)",
      pct: totalG > 0 ? Math.round((output.carbG * 4 / output.kcal) * 100) : undefined,
    },
    ...(output.fiberG !== undefined
      ? [{ label: "Fiber", value: `${output.fiberG}g`, indent: true }]
      : []),
    ...(output.sugarG !== undefined
      ? [{ label: "Sugar", value: `${output.sugarG}g`, indent: true }]
      : []),
    {
      label: "Protein",
      value: `${output.proteinG}g`,
      color: "var(--color-electrolyte)",
      pct: totalG > 0 ? Math.round((output.proteinG * 4 / output.kcal) * 100) : undefined,
    },
    {
      label: "Fat",
      value: `${output.fatG}g`,
      color: "var(--color-dragonfruit)",
      pct: totalG > 0 ? Math.round((output.fatG * 9 / output.kcal) * 100) : undefined,
    },
    ...(output.sodiumMg !== undefined
      ? [{ label: "Sodium", value: `${output.sodiumMg}mg`, color: undefined }]
      : []),
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Total kcal hero */}
      <div>
        {output.label && (
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
            {output.label}
          </p>
        )}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-[var(--font-sansita)] text-[var(--font-size-data)] font-bold leading-none tabular-nums">
            {output.kcal.toLocaleString()}
          </span>
          <span className="font-[var(--font-compadre)] text-[var(--font-size-label)] uppercase tracking-widest text-muted-foreground">
            kcal
          </span>
          {output.servingLabel && (
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              · {output.servingLabel}
            </span>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y-0 border-t border-border pt-1">
        {rows.map((row, i) => (
          <BreakdownRow key={i} {...row} />
        ))}
      </div>
    </div>
  );
}
