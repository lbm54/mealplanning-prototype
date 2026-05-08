/**
 * MobileStepper — single-day-and-slot view for mobile (<768px).
 *
 * 2026 redesign:
 * - Progress beads at top showing "5 / 21" with filled circles
 * - Day/slot navigation with arrows + day label
 * - Each column rendered as a vertical FoodPickerCell list
 * - RowMacroBar at bottom
 */

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FoodPickerCell } from "./food-picker-cell";
import { RowMacroBar } from "./row-macro-bar";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { cn } from "@/lib/utils";
import type { DayMacroRow, ColumnOptions, MAIN_SLOTS } from "@/lib/queries/columns-data.c";
import type { CellTotals, PickMap } from "@/lib/hooks/use-column-picks";

type SlotType = (typeof MAIN_SLOTS)[number];

const SLOT_DISPLAY: Record<string, { label: string; time: string }> = {
  breakfast: { label: "Breakfast", time: "~7am" },
  lunch:     { label: "Lunch",     time: "~12pm" },
  dinner:    { label: "Dinner",    time: "~6pm"  },
  snack:     { label: "Snack",     time: "~3pm"  },
};

export interface MobileStepperProps {
  days:        DayMacroRow[];
  slots:       SlotType[];
  columns:     Record<string, ColumnOptions>;
  picks:       PickMap;
  onPickCol:   (date: string, slot: string, col: "protein" | "carb" | "veg", foodId: string) => void;
  getTotals:   (key: string, cols: ColumnOptions) => CellTotals;
  onLockToggle:(key: string) => void;
  jadeFilled?: Set<string>;
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
  jadeFilled,
  className,
}: MobileStepperProps) {
  const [dayIdx,  setDayIdx]  = useState(0);
  const [slotIdx, setSlotIdx] = useState(0);

  const day    = days[dayIdx];
  const slot   = slots[slotIdx];
  const key    = `${day.date}:${slot}`;
  const cols   = columns[key];
  const pick   = picks[key] ?? { proteinId: null, carbId: null, vegId: null, locked: false };
  const totals = cols ? getTotals(key, cols) : { carb_g: 0, protein_g: 0, fat_g: 0 };

  const totalSlots = slots.length;
  const totalDays  = days.length;
  const totalCells = totalDays * totalSlots;

  // Count filled cells for progress beads
  const filledCount = useMemo(() => {
    let count = 0;
    for (const d of days) {
      for (const s of slots) {
        const k = `${d.date}:${s}`;
        const p = picks[k];
        if (p && (p.proteinId || p.carbId || p.vegId)) count++;
      }
    }
    return count;
  }, [days, slots, picks]);

  // Slot-level macro target (~1/3 of daily)
  const slotFraction = slot === "breakfast" ? 0.25 : 0.30;
  const slotTarget = {
    carb_g:    Math.round(day.carb_g    * slotFraction),
    protein_g: Math.round(day.protein_g * slotFraction),
    fat_g:     Math.round(day.fat_g     * slotFraction),
  };

  const slotDisplay = SLOT_DISPLAY[slot] ?? { label: slot, time: "" };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Progress beads */}
      <div className="flex items-center gap-1 justify-center flex-wrap px-2">
        {Array.from({ length: totalCells }, (_, i) => {
          const dIdx = Math.floor(i / totalSlots);
          const sIdx = i % totalSlots;
          const k    = `${days[dIdx]?.date}:${slots[sIdx]}`;
          const p    = picks[k];
          const filled = p && (p.proteinId || p.carbId || p.vegId);
          const isCurrent = dIdx === dayIdx && sIdx === slotIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => { setDayIdx(dIdx); setSlotIdx(sIdx); }}
              aria-label={`Go to day ${dIdx + 1} slot ${sIdx + 1}`}
              className={cn(
                "rounded-full transition-all duration-200 shrink-0",
                isCurrent
                  ? "w-5 h-2.5 bg-[var(--color-orange)]"
                  : filled
                    ? "w-2 h-2 bg-[var(--color-electrolyte)]/70"
                    : "w-2 h-2 bg-muted-foreground/20",
              )}
            />
          );
        })}
      </div>
      <p className="text-center font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-widest">
        {filledCount}&nbsp;/&nbsp;{totalCells} filled
      </p>

      {/* Day navigator */}
      <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-card border border-border px-4 py-3">
        <button
          type="button"
          disabled={dayIdx === 0}
          onClick={() => { setDayIdx((i) => Math.max(0, i - 1)); setSlotIdx(0); }}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="font-[var(--font-compadre)] text-[var(--font-size-section)] uppercase tracking-widest font-bold">
              {day.label}
            </span>
            {day.isWorkoutDay && <TrainingDayDot active size="md" />}
          </div>
          <CarbTierBadge carbG={day.carb_g} withLabel />
        </div>

        <button
          type="button"
          disabled={dayIdx === totalDays - 1}
          onClick={() => { setDayIdx((i) => Math.min(totalDays - 1, i + 1)); setSlotIdx(0); }}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slot tabs */}
      <div className="flex items-center gap-1.5 justify-center flex-wrap">
        {slots.map((s, i) => {
          const sd = SLOT_DISPLAY[s] ?? { label: s, time: "" };
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSlotIdx(i)}
              className={cn(
                "rounded-[var(--radius-pill)] px-3 py-1 transition-all duration-150",
                "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                i === slotIdx
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {sd.label}
            </button>
          );
        })}
      </div>

      {/* Slot header */}
      <div className="flex items-baseline gap-2 px-1">
        <span className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-widest text-foreground/80">
          {slotDisplay.label}
        </span>
        <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/60">
          {slotDisplay.time}
        </span>
      </div>

      {/* Column panels — stacked vertically */}
      {cols ? (
        <div className="space-y-3">
          {/* Protein */}
          <div className="space-y-1.5">
            <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60 px-1">
              Protein
            </span>
            <FoodPickerCell
              column="protein"
              options={cols.protein}
              selectedId={pick.proteinId}
              isJadePick={jadeFilled?.has(`${key}:protein`)}
              date={day.date}
              slot={slot}
              onSelect={(id) => onPickCol(day.date, slot, "protein", id)}
            />
          </div>

          {/* Carb */}
          <div className="space-y-1.5">
            <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60 px-1">
              Carb
            </span>
            <FoodPickerCell
              column="carb"
              options={cols.carb}
              selectedId={pick.carbId}
              isJadePick={jadeFilled?.has(`${key}:carb`)}
              date={day.date}
              slot={slot}
              onSelect={(id) => onPickCol(day.date, slot, "carb", id)}
            />
          </div>

          {/* Veg / Sauce */}
          <div className="space-y-1.5">
            <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60 px-1">
              Veg / Sauce
            </span>
            <FoodPickerCell
              column="veg"
              options={cols.veg}
              selectedId={pick.vegId}
              isJadePick={jadeFilled?.has(`${key}:veg`)}
              date={day.date}
              slot={slot}
              onSelect={(id) => onPickCol(day.date, slot, "veg", id)}
            />
          </div>
        </div>
      ) : (
        <p className="text-center font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground py-8">
          Loading options…
        </p>
      )}

      {/* Row macro bar */}
      {cols && (
        <div className="rounded-[var(--radius-card)] border border-border bg-card px-3 py-2.5">
          <RowMacroBar
            totals={totals}
            target={slotTarget}
            isLocked={pick.locked}
            onLockToggle={() => onLockToggle(key)}
          />
        </div>
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
          "w-full rounded-[var(--radius-pill)] bg-gradient-to-b from-[#F8A53A] to-[#F78B14] py-3",
          "font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider",
          "text-[var(--color-blackberry)]",
          "hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-orange)] transition-all duration-150",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
        )}
      >
        {slotIdx < totalSlots - 1 ? "Next Slot" : dayIdx < totalDays - 1 ? "Next Day" : "Done"}
      </button>
    </div>
  );
}
