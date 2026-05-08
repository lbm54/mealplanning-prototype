import { cn } from "@/lib/utils";

/**
 * MacroProgressRings — 3 SVG circular progress rings (carb / protein / fat).
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #17
 *
 * Reuses the ring pattern from MacroTotalsRail but as a standalone widget
 * with compact + large size variants. Color: carb=Mango, protein=Electrolyte, fat=Dragonfruit.
 */

export interface MacroProgressRingsOutput {
  carb: { currentG: number; targetG: number };
  protein: { currentG: number; targetG: number };
  fat: { currentG: number; targetG: number };
  label?: string;
}

export interface MacroProgressRingsProps {
  output: MacroProgressRingsOutput;
  size?: "compact" | "large";
  className?: string;
}

const CONFIGS = {
  compact: { svgSize: 64, radius: 26, stroke: 4, textSize: "text-[11px]", unitSize: "text-[8px]", gap: "gap-3" },
  large: { svgSize: 96, radius: 40, stroke: 6, textSize: "text-[16px]", unitSize: "text-[10px]", gap: "gap-6" },
};

interface RingProps {
  label: string;
  currentG: number;
  targetG: number;
  color: string;
  trackColor: string;
  config: typeof CONFIGS.compact;
}

function MacroRing({ label, currentG, targetG, color, trackColor, config }: RingProps) {
  const { svgSize, radius, stroke, textSize, unitSize } = config;
  const circumference = 2 * Math.PI * radius;
  const pct = targetG > 0 ? Math.min(currentG / targetG, 1) : 0;
  const dashOffset = circumference * (1 - pct);
  const isOver = currentG > targetG;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "var(--color-dragonfruit)" : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-[var(--font-apercu-mono)] font-semibold leading-none tabular-nums", textSize)}>
            {currentG}
          </span>
          <span className={cn("font-[var(--font-apercu)] text-muted-foreground leading-none mt-0.5", unitSize)}>
            / {targetG}g
          </span>
        </div>
      </div>
      <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function MacroProgressRings({
  output,
  size = "compact",
  className,
}: MacroProgressRingsProps) {
  const config = CONFIGS[size];

  return (
    <div className={cn("space-y-2", className)}>
      {output.label && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className={cn("flex items-start", config.gap)}>
        <MacroRing
          label="Carbs"
          currentG={output.carb.currentG}
          targetG={output.carb.targetG}
          color="var(--color-orange)"
          trackColor="rgba(247,139,20,0.15)"
          config={config}
        />
        <MacroRing
          label="Protein"
          currentG={output.protein.currentG}
          targetG={output.protein.targetG}
          color="var(--color-electrolyte)"
          trackColor="rgba(28,249,207,0.15)"
          config={config}
        />
        <MacroRing
          label="Fat"
          currentG={output.fat.currentG}
          targetG={output.fat.targetG}
          color="var(--color-dragonfruit)"
          trackColor="rgba(220,37,151,0.15)"
          config={config}
        />
      </div>
    </div>
  );
}
