/**
 * ColumnGrid — 5-column desktop table: Day | Slot | Protein | Carb | Veg/Sauce.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.1), 06_five_uiux_approaches.md §1.C
 *
 * Desktop layout (≥768px):
 *   Row = one meal slot for one day (21+ rows for 7 days × 3 main slots).
 *   Each row's Protein/Carb/Veg cells contain a Column component.
 *   Workout days show a "●" dot marker and a WorkoutExtrasRow.
 *   A RunningTotalsBar sits below each row's columns.
 *
 * Mobile: delegates to MobileStepper.
 */

import { useMemo } from "react";
import { Column } from "./column";
import { RunningTotalsBar } from "./running-totals-bar";
import { WorkoutExtrasRow } from "./workout-extras-row";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { cn } from "@/lib/utils";
import type { DayMacroRow, ColumnOptions, MealSlot, FoodOption } from "@/lib/queries/columns-data.c";
import type { CellPick, CellTotals } from "@/lib/hooks/use-column-picks";

const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch:     "Lunch",
  dinner:    "Dinner",
  snack:     "Snack",
};

const MAIN_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export interface ColumnGridProps {
  days:        DayMacroRow[];
  columns:     Record<string, ColumnOptions>;
  picks:       Record<string, CellPick>;
  preOptions:  Record<string, FoodOption[]>; // keyed by date for pre-workout tiles
  onPickCol:   (date: string, slot: string, col: "protein" | "carb" | "veg", foodId: string) => void;
  onPickPre:   (date: string, foodId: string) => void;
  getTotals:   (key: string, cols: ColumnOptions) => CellTotals;
  onLockToggle:(key: string) => void;
  className?:  string;
}

export function ColumnGrid({
  days,
  columns,
  picks,
  preOptions,
  onPickCol,
  onPickPre,
  getTotals,
  onLockToggle,
  className,
}: ColumnGridProps) {
  // Compute slot target macros (approx 1/3 of daily for main slots)
  const slotTargets = useMemo(() => {
    const map: Record<string, { carb_g: number; protein_g: number; fat_g: number }> = {};
    for (const day of days) {
      for (const slot of MAIN_SLOTS) {
        const key = `${day.date}:${slot}`;
        const fraction = slot === "breakfast" ? 0.25 : 0.30;
        map[key] = {
          carb_g:    Math.round(day.carb_g    * fraction),
          protein_g: Math.round(day.protein_g * fraction),
          fat_g:     Math.round(day.fat_g     * fraction),
        };
      }
    }
    return map;
  }, [days]);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      {/* Column header row */}
      <div className="grid grid-cols-[80px_90px_1fr_1fr_1fr] gap-0 border-b border-border pb-2 mb-2">
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-2">
          Day
        </span>
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-2">
          Slot
        </span>
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-2">
          Protein
        </span>
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-2">
          Carb
        </span>
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground px-2">
          Veg / Sauce
        </span>
      </div>

      {/* Data rows — one slot per day */}
      <div className="space-y-4">
        {days.map((day) => (
          <div key={day.date} className="space-y-3">
            {MAIN_SLOTS.map((slot, slotIdx) => {
              const key  = `${day.date}:${slot}`;
              const cols = columns[key];
              const pick = picks[key] ?? { proteinId: null, carbId: null, vegId: null, locked: false };
              const totals = cols ? getTotals(key, cols) : { carb_g: 0, protein_g: 0, fat_g: 0 };
              const target = slotTargets[key] ?? { carb_g: 80, protein_g: 40, fat_g: 20 };
              const rowLabel = `${day.label} ${SLOT_LABELS[slot] ?? slot}`;

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-[var(--radius-card)] border border-border bg-card overflow-hidden",
                    pick.locked && "ring-1 ring-primary/40",
                  )}
                >
                  <div className="grid grid-cols-[80px_90px_1fr_1fr_1fr] gap-3 p-3 items-start">
                    {/* Day cell — only shown on first slot per day */}
                    <div className="flex flex-col items-start pt-1">
                      {slotIdx === 0 && (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="font-[var(--font-sansita)] text-[var(--font-size-activity)] font-bold uppercase tracking-wider">
                              {day.label}
                            </span>
                            {day.isWorkoutDay && <TrainingDayDot />}
                          </div>
                          <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/60 uppercase">
                            {day.carb_g}g C
                          </span>
                        </>
                      )}
                    </div>

                    {/* Slot label */}
                    <div className="flex items-start pt-1">
                      <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground capitalize">
                        {SLOT_LABELS[slot] ?? slot}
                      </span>
                    </div>

                    {/* Protein column */}
                    {cols ? (
                      <Column
                        column="protein"
                        options={cols.protein}
                        selectedId={pick.proteinId}
                        rationale={cols.rationale.protein}
                        onSelect={(id) => onPickCol(day.date, slot, "protein", id)}
                        date={day.date}
                        slot={slot}
                        rowLabel={rowLabel}
                      />
                    ) : (
                      <div className="h-16 animate-pulse rounded-[var(--radius-card)] bg-muted" />
                    )}

                    {/* Carb column */}
                    {cols ? (
                      <Column
                        column="carb"
                        options={cols.carb}
                        selectedId={pick.carbId}
                        rationale={cols.rationale.carb}
                        onSelect={(id) => onPickCol(day.date, slot, "carb", id)}
                        date={day.date}
                        slot={slot}
                        rowLabel={rowLabel}
                      />
                    ) : (
                      <div className="h-16 animate-pulse rounded-[var(--radius-card)] bg-muted" />
                    )}

                    {/* Veg/Sauce column */}
                    {cols ? (
                      <Column
                        column="veg"
                        options={cols.veg}
                        selectedId={pick.vegId}
                        rationale={cols.rationale.veg}
                        onSelect={(id) => onPickCol(day.date, slot, "veg", id)}
                        date={day.date}
                        slot={slot}
                        rowLabel={rowLabel}
                      />
                    ) : (
                      <div className="h-16 animate-pulse rounded-[var(--radius-card)] bg-muted" />
                    )}
                  </div>

                  {/* Running totals bar at bottom of each row */}
                  <RunningTotalsBar
                    totals={totals}
                    target={target}
                    isLocked={pick.locked}
                    onLockToggle={() => onLockToggle(key)}
                  />
                </div>
              );
            })}

            {/* Workout extras row — shown once per workout day, after all slots */}
            {day.isWorkoutDay && day.workoutNote && (
              <WorkoutExtrasRow
                date={day.date}
                dayLabel={day.label}
                workoutNote={day.workoutNote}
                preOptions={preOptions[day.date] ?? []}
                selectedPreId={picks[`${day.date}:pre_workout`]?.proteinId ?? null}
                onSelectPre={(id) => onPickPre(day.date, id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
