/**
 * ColumnGrid — 2026-redesigned 5-column desktop table.
 *
 * Layout: Day-rail | Slot | Protein | Carb | Veg/Sauce | MacroBar
 *
 * Design moves:
 * - Left color rail per day encoding carb tier
 * - Day header only on first slot of each day group
 * - WorkoutBanner above breakfast on workout days
 * - FoodPickerCell with popover grid (replaces stacked column tiles)
 * - RowMacroBar far right (120px stacked bar + lock toggle)
 * - TableHeaderRow with "Why?" tooltips + filter icon per food column
 * - Stagger-in animation on mount (50ms per row)
 */

import { useMemo } from "react";
import { TableHeaderRow } from "./table-header-row";
import { DayRail } from "./day-rail";
import { SlotCell } from "./slot-cell";
import { FoodPickerCell } from "./food-picker-cell";
import { RowMacroBar } from "./row-macro-bar";
import { WorkoutBanner } from "./workout-banner";
import { cn } from "@/lib/utils";
import type { DayMacroRow, ColumnOptions, MealSlot, FoodOption } from "@/lib/queries/columns-data.c";
import type { CellPick, CellTotals } from "@/lib/hooks/use-column-picks";

const MAIN_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export interface ColumnGridProps {
  days:        DayMacroRow[];
  columns:     Record<string, ColumnOptions>;
  picks:       Record<string, CellPick>;
  preOptions:  Record<string, FoodOption[]>;
  onPickCol:   (date: string, slot: string, col: "protein" | "carb" | "veg", foodId: string) => void;
  onPickPre:   (date: string, foodId: string) => void;
  getTotals:   (key: string, cols: ColumnOptions) => CellTotals;
  onLockToggle:(key: string) => void;
  /** Set of keys that were filled by Jade (for JADE badge display) */
  jadeFilled?: Set<string>;
  className?:  string;
}

// Grid layout column definition
const GRID_COLS = "grid-cols-[88px_80px_1fr_1fr_1fr_148px]";

export function ColumnGrid({
  days,
  columns,
  picks,
  onPickCol,
  getTotals,
  onLockToggle,
  jadeFilled,
  className,
}: ColumnGridProps) {
  // Slot macro targets: approx fraction of daily per slot
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

  // Global row index for stagger animation
  let globalRowIdx = 0;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      {/* Sticky column header row */}
      <TableHeaderRow className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/60 mb-0" />

      {/* Day groups */}
      <div className="mt-1 space-y-2">
        {days.map((day) => {
          return (
            <div key={day.date} className="space-y-[2px]">
              {/* Workout banner — above breakfast on workout days */}
              {day.isWorkoutDay && day.workoutNote && (
                <WorkoutBanner
                  workoutNote={day.workoutNote}
                  className="mb-1"
                />
              )}

              {/* Slot rows */}
              {MAIN_SLOTS.map((slot, slotIdx) => {
                const key    = `${day.date}:${slot}`;
                const cols   = columns[key];
                const pick   = picks[key] ?? { proteinId: null, carbId: null, vegId: null, locked: false };
                const totals = cols ? getTotals(key, cols) : { carb_g: 0, protein_g: 0, fat_g: 0 };
                const target = slotTargets[key] ?? { carb_g: 80, protein_g: 40, fat_g: 20 };
                const isFirst = slotIdx === 0;

                // Compute stagger index for fade-up
                const animIdx = globalRowIdx++;

                return (
                  <div
                    key={key}
                    className={cn(
                      "group relative grid items-center gap-0 overflow-hidden",
                      GRID_COLS,
                      // Row base — subtle hover state
                      "rounded-[var(--radius-card)]",
                      "border border-border/70 bg-card",
                      "hover:border-[var(--color-electrolyte)]/25 hover:shadow-[0_0_0_1px_rgba(28,249,207,0.08)]",
                      "transition-all duration-150",
                      // Lock highlight
                      pick.locked && "ring-1 ring-[var(--color-electrolyte)]/30 border-[var(--color-electrolyte)]/30",
                      // Day group visual: top row slightly lifted
                      isFirst && "mt-1",
                      // Stagger fade-up on load
                      "animate-fade-up",
                    )}
                    style={{
                      animationDelay: `${animIdx * 35}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    {/* Day rail — spans full height via grid */}
                    <DayRail
                      date={day.date}
                      label={day.label}
                      carbG={day.carb_g}
                      isWorkoutDay={day.isWorkoutDay}
                      isFirstSlot={isFirst}
                      className="self-stretch"
                    />

                    {/* Slot label + time */}
                    <SlotCell slot={slot} className="self-center" />

                    {/* Protein */}
                    <div className="px-1.5 py-2 self-center">
                      {cols ? (
                        <FoodPickerCell
                          column="protein"
                          options={cols.protein}
                          selectedId={pick.proteinId}
                          isJadePick={jadeFilled?.has(`${key}:protein`)}
                          date={day.date}
                          slot={slot}
                          onSelect={(id) => onPickCol(day.date, slot, "protein", id)}
                        />
                      ) : (
                        <div className="h-[52px] rounded-[var(--radius-card)] bg-muted animate-pulse" />
                      )}
                    </div>

                    {/* Carb */}
                    <div className="px-1.5 py-2 self-center">
                      {cols ? (
                        <FoodPickerCell
                          column="carb"
                          options={cols.carb}
                          selectedId={pick.carbId}
                          isJadePick={jadeFilled?.has(`${key}:carb`)}
                          date={day.date}
                          slot={slot}
                          onSelect={(id) => onPickCol(day.date, slot, "carb", id)}
                        />
                      ) : (
                        <div className="h-[52px] rounded-[var(--radius-card)] bg-muted animate-pulse" />
                      )}
                    </div>

                    {/* Veg / Sauce */}
                    <div className="px-1.5 py-2 self-center">
                      {cols ? (
                        <FoodPickerCell
                          column="veg"
                          options={cols.veg}
                          selectedId={pick.vegId}
                          isJadePick={jadeFilled?.has(`${key}:veg`)}
                          date={day.date}
                          slot={slot}
                          onSelect={(id) => onPickCol(day.date, slot, "veg", id)}
                        />
                      ) : (
                        <div className="h-[52px] rounded-[var(--radius-card)] bg-muted animate-pulse" />
                      )}
                    </div>

                    {/* Row macro bar + lock */}
                    <div className="pr-3 py-2 self-center">
                      <RowMacroBar
                        totals={totals}
                        target={target}
                        isLocked={pick.locked}
                        onLockToggle={() => onLockToggle(key)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
