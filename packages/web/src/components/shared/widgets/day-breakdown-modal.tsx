import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MealCell, type MealAssembly } from "@/components/shared/meal-cell";

/**
 * DayBreakdownModal — Sheet-content-compatible layout.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #15, §1 move #11
 *
 * Renders standalone (not inside Sheet) — the variant integrates it into
 * a Sheet. Contains: plan title + macro summary + day accordion.
 * Each day expands to a 2×2 meal grid (B/L/D/Snack).
 */

export interface DayMealSlot {
  slot: string;
  meal: MealAssembly | null;
}

export interface PlanDay {
  date: string;
  label: string;
  slots: DayMealSlot[];
  carbG: number;
  proteinG: number;
  fatG: number;
  kcal: number;
}

export interface DayBreakdownModalOutput {
  title: string;
  description?: string;
  days: PlanDay[];
  weekKcal?: number;
}

export interface DayBreakdownModalProps {
  output: DayBreakdownModalOutput;
  className?: string;
}

function MacroSummaryRow({
  carbG,
  proteinG,
  fatG,
  kcal,
}: {
  carbG: number;
  proteinG: number;
  fatG: number;
  kcal: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Carbs", value: `${carbG}g`, color: "var(--color-orange)" },
        { label: "Prot", value: `${proteinG}g`, color: "var(--color-electrolyte)" },
        { label: "Fat", value: `${fatG}g`, color: "var(--color-dragonfruit)" },
        { label: "Kcal", value: kcal.toLocaleString(), color: "inherit" },
      ].map((m) => (
        <span
          key={m.label}
          className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-border px-2 py-0.5"
        >
          <span
            className="font-[var(--font-compadre)] text-[9px] uppercase tracking-widest"
            style={{ color: m.color }}
          >
            {m.label}
          </span>
          <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums">
            {m.value}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function DayBreakdownModal({ output, className }: DayBreakdownModalProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleDay(date: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h2 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] uppercase tracking-wider leading-tight">
          {output.title}
        </h2>
        {output.description && (
          <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            {output.description}
          </p>
        )}
        {output.weekKcal && (
          <div className="mt-2 inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-orange)] px-3 py-1">
            <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] font-semibold text-[var(--color-blackberry)] tabular-nums">
              {output.weekKcal.toLocaleString()} kcal/wk
            </span>
          </div>
        )}
      </div>

      {/* Day accordion */}
      <div className="space-y-1">
        {output.days.map((day) => {
          const isOpen = expanded.has(day.date);
          return (
            <div
              key={day.date}
              className="rounded-[var(--radius-card)] border border-border overflow-hidden"
            >
              {/* Day header — tap to expand */}
              <button
                onClick={() => toggleDay(day.date)}
                className={cn(
                  "flex w-full items-center justify-between p-3",
                  "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                  "hover:bg-muted/50 transition-colors duration-150",
                  isOpen && "border-b border-border",
                )}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-[var(--font-compadre)] text-[var(--font-size-label)] uppercase tracking-widest text-muted-foreground shrink-0">
                    {day.label}
                  </span>
                  <MacroSummaryRow
                    carbG={day.carbG}
                    proteinG={day.proteinG}
                    fatG={day.fatG}
                    kcal={day.kcal}
                  />
                </div>
                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Day content — 2×2 meal grid */}
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 p-3">
                  {day.slots.map((s) => (
                    <MealCell
                      key={s.slot}
                      meal={s.meal}
                      slot={s.slot}
                      density="compact"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
