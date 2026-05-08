import { cn } from "@/lib/utils";

/**
 * WorkoutTimeline — vertical PRE / DURING / POST fuel windows.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #19
 *
 * 3 rows with left-border color coding:
 * PRE = Electrolyte, DURING = Mango, POST = Dragonfruit.
 * Each row: window time, carbs g, optional notes.
 */

export interface FuelWindow {
  phase: "pre" | "during" | "post";
  windowLabel: string;
  carbG: number;
  proteinG?: number;
  sodiumMg?: number;
  notes?: string;
}

export interface WorkoutTimelineOutput {
  workoutTitle?: string;
  workoutDate?: string;
  duration?: number;
  windows: FuelWindow[];
}

export interface WorkoutTimelineProps {
  output: WorkoutTimelineOutput;
  className?: string;
}

const PHASE_CONFIG = {
  pre: {
    label: "Pre",
    borderColor: "border-l-[var(--color-electrolyte)]",
    bgColor: "bg-[var(--color-electrolyte)]/5",
    labelColor: "text-[var(--color-electrolyte)]",
    icon: "⚡",
  },
  during: {
    label: "During",
    borderColor: "border-l-[var(--color-orange)]",
    bgColor: "bg-[var(--color-orange)]/5",
    labelColor: "text-[var(--color-orange)]",
    icon: "🔄",
  },
  post: {
    label: "Post",
    borderColor: "border-l-[var(--color-dragonfruit)]",
    bgColor: "bg-[var(--color-dragonfruit)]/5",
    labelColor: "text-[var(--color-dragonfruit)]",
    icon: "🌿",
  },
} as const;

export default function WorkoutTimeline({ output, className }: WorkoutTimelineProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      {(output.workoutTitle || output.workoutDate) && (
        <div>
          {output.workoutTitle && (
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider leading-tight">
              {output.workoutTitle}
            </p>
          )}
          {output.workoutDate && (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              {output.workoutDate}
              {output.duration && ` · ${output.duration} min`}
            </p>
          )}
        </div>
      )}

      {/* Phase rows */}
      <div className="space-y-2">
        {output.windows.map((win) => {
          const config = PHASE_CONFIG[win.phase];
          return (
            <div
              key={win.phase}
              className={cn(
                "rounded-r-[var(--radius-card)] border-l-4 p-3",
                config.borderColor,
                config.bgColor,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {/* Phase label + window */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest font-bold",
                        config.labelColor,
                      )}
                    >
                      {config.label}
                    </span>
                    <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                      {win.windowLabel}
                    </span>
                  </div>

                  {/* Macros */}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold tabular-nums">
                      {win.carbG}g
                      <span className="ml-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground font-normal">
                        carbs
                      </span>
                    </span>
                    {win.proteinG !== undefined && win.proteinG > 0 && (
                      <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold tabular-nums">
                        {win.proteinG}g
                        <span className="ml-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground font-normal">
                          prot
                        </span>
                      </span>
                    )}
                    {win.sodiumMg !== undefined && win.sodiumMg > 0 && (
                      <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums text-muted-foreground">
                        {win.sodiumMg}mg Na
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {win.notes && (
                    <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground italic">
                      {win.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
