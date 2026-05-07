/**
 * MobileStepper — single-day-and-slot view for mobile (<768px).
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.8)
 *
 * Day chevron stepper at top: ◀ TUE ▶ slot 4/6
 * Shows one slot at a time; each slot shows 3 stacked radio-style column lists.
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Column } from "./column";
import { RunningTotalsBar } from "./running-totals-bar";
import { cn } from "@/lib/utils";
import type { DayMacroRow, ColumnOptions, MAIN_SLOTS } from "@/lib/queries/columns-data.c";
import type { CellPick, CellTotals } from "@/lib/hooks/use-column-picks";

type SlotType = (typeof MAIN_SLOTS)[number];

const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch:     "Lunch",
  dinner:    "Dinner",
  snack:     "Snack",
};

export interface MobileStepperProps {
  days:        DayMacroRow[];
  slots:       SlotType[];
  columns:     Record<string, ColumnOptions>;
  picks:       Record<string, CellPick>;
  onPickCol:   (date: string, slot: string, col: "protein" | "carb" | "veg", foodId: string) => void;
  getTotals:   (key: string, cols: ColumnOptions) => CellTotals;
  onLockToggle:(key: string) => void;
  className?:  string;
}

export function MobileStepper({
  days,
  slots,
  columns,
  picks,
  onPickCol,
  getTotals,
  onLockToggle,
  className,
}: MobileStepperProps) {
  const [dayIdx,  setDayIdx]  = useState(0);
  const [slotIdx, setSlotIdx] = useState(0);

  const day  = days[dayIdx];
  const slot = slots[slotIdx];
  const key  = `${day.date}:${slot}`;
  const cols = columns[key];
  const pick = picks[key] ?? { proteinId: null, carbId: null, vegId: null, locked: false };
  const totals = cols ? getTotals(key, cols) : { carb_g: 0, protein_g: 0, fat_g: 0 };

  const totalSlots = slots.length;
  const totalDays  = days.length;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Day stepper */}
      <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-card border border-border px-4 py-2.5">
        <button
          type="button"
          disabled={dayIdx === 0}
          onClick={() => setDayIdx((i) => Math.max(0, i - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] font-bold uppercase tracking-wider">
            {day.label}
            {day.isWorkoutDay && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-[var(--color-electrolyte)] align-middle" />
            )}
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            slot {slotIdx + 1}/{totalSlots} — {SLOT_LABELS[slot] ?? slot}
          </p>
        </div>

        <button
          type="button"
          disabled={dayIdx === totalDays - 1}
          onClick={() => setDayIdx((i) => Math.min(totalDays - 1, i + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slot stepper dots */}
      <div className="flex items-center justify-center gap-1.5">
        {slots.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlotIdx(i)}
            aria-label={SLOT_LABELS[s] ?? s}
            className={cn(
              "h-2 rounded-full transition-all",
              i === slotIdx
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
            )}
          />
        ))}
      </div>

      {/* Columns — stacked vertically on mobile */}
      {cols ? (
        <div className="space-y-4">
          <Column
            column="protein"
            options={cols.protein}
            selectedId={pick.proteinId}
            rationale={cols.rationale.protein}
            onSelect={(id) => onPickCol(day.date, slot, "protein", id)}
            date={day.date}
            slot={slot}
            rowLabel={`${day.label} ${SLOT_LABELS[slot] ?? slot}`}
          />
          <Column
            column="carb"
            options={cols.carb}
            selectedId={pick.carbId}
            rationale={cols.rationale.carb}
            onSelect={(id) => onPickCol(day.date, slot, "carb", id)}
            date={day.date}
            slot={slot}
            rowLabel={`${day.label} ${SLOT_LABELS[slot] ?? slot}`}
          />
          <Column
            column="veg"
            options={cols.veg}
            selectedId={pick.vegId}
            rationale={cols.rationale.veg}
            onSelect={(id) => onPickCol(day.date, slot, "veg", id)}
            date={day.date}
            slot={slot}
            rowLabel={`${day.label} ${SLOT_LABELS[slot] ?? slot}`}
          />
        </div>
      ) : (
        <p className="text-center font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground py-8">
          Loading options…
        </p>
      )}

      {/* Running totals */}
      {cols && (
        <RunningTotalsBar
          totals={totals}
          target={{ carb_g: day.carb_g, protein_g: day.protein_g, fat_g: day.fat_g }}
          isLocked={pick.locked}
          onLockToggle={() => onLockToggle(key)}
        />
      )}

      {/* Next slot CTA */}
      <button
        type="button"
        onClick={() => {
          if (slotIdx < totalSlots - 1) {
            setSlotIdx((i) => i + 1);
          } else if (dayIdx < totalDays - 1) {
            setDayIdx((d) => d + 1);
            setSlotIdx(0);
          }
        }}
        disabled={dayIdx === totalDays - 1 && slotIdx === totalSlots - 1}
        className={cn(
          "w-full rounded-[var(--radius-pill)] border-2 border-primary py-2.5",
          "font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider text-primary",
          "hover:bg-primary/10 transition-colors disabled:opacity-30",
        )}
      >
        {slotIdx < totalSlots - 1 ? "Next Slot" : dayIdx < totalDays - 1 ? "Next Day" : "Done"}
      </button>
    </div>
  );
}
