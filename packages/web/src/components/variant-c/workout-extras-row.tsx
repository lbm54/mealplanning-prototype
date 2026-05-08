/**
 * WorkoutExtrasRow — pre/post workout fuel row for workout days.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.5), 06_five_uiux_approaches.md §1.C
 *
 * Shows "TUE has an easy 6mi run. Include pre-run fuel? [Yes/Skip]"
 * On Yes, renders 3 pre-workout template options.
 */

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnTile } from "./column-tile";
import { cn } from "@/lib/utils";
import type { FoodOption } from "@/lib/queries/columns-data.c";

export interface WorkoutExtrasRowProps {
  date:          string;
  dayLabel:      string;
  workoutNote:   string;
  preOptions:    FoodOption[];
  selectedPreId: string | null;
  onSelectPre:   (foodId: string) => void;
  className?:    string;
}

export function WorkoutExtrasRow({
  date: _date,
  dayLabel,
  workoutNote,
  preOptions,
  selectedPreId,
  onSelectPre,
  className,
}: WorkoutExtrasRowProps) {
  const [dismissed, setDismissed] = useState(false);
  const [accepted, setAccepted]   = useState(false);

  if (dismissed) return null;

  return (
    <div className={cn(
      "rounded-[var(--radius-card)] border border-[var(--color-electrolyte)]/30 bg-accent/10 p-3",
      className,
    )}>
      {!accepted ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Zap size={16} className="shrink-0 text-[var(--color-electrolyte)]" />
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground/80">
              <span className="font-medium">{dayLabel}</span> has{" "}
              <span className="italic">{workoutNote}</span>.{" "}
              Include pre-workout fuel?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[var(--font-size-caption)]"
              onClick={() => setAccepted(true)}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[var(--font-size-caption)] text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              Skip
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap size={14} className="shrink-0 text-[var(--color-electrolyte)]" />
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
              {dayLabel} — Pre-Workout Fuel
            </p>
            <button
              type="button"
              onClick={() => { setAccepted(false); setDismissed(true); }}
              className="ml-auto font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              skip
            </button>
          </div>

          {preOptions.length === 0 ? (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              No pre-workout templates available.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {preOptions.map((opt) => (
                <ColumnTile
                  key={opt.id}
                  option={opt}
                  isSelected={selectedPreId === opt.id}
                  onClick={() => onSelectPre(opt.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
