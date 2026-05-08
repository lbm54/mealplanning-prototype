/**
 * PlanSide — the left 60% of Variant D: a denser read of the week grid.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 *
 * Uses shared <DayColumn> + <MealCell>. Renders a horizontal scrollable grid.
 * Cells are also droppable (wired via DroppableDayCell from the DnD layer).
 * No per-cell click-to-swap drawer is shown here — instead a click opens the
 * shared SwapDrawer.
 */
import { cn } from "@/lib/utils";
import { RotateCcw, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MacroTotalsRail } from "@/components/shared/macro-totals-rail";
import type { DayPlanData } from "@/components/shared/day-column";
import type React from "react";

export interface PlanSideProps {
  weekLabel: string;
  days: DayPlanData[];
  weekTotals: { carbG: number; protG: number; fatG: number };
  daysPlanned: number;
  daysLocked: number;
  isGenerating: boolean;
  onRegenerate: () => void;
  onMealClick: (date: string, slot: string) => void;
  /** DnD-aware cell renderer — wraps each day column with droppable targets */
  renderDay?: (day: DayPlanData) => React.ReactNode;
  className?: string;
}

export function PlanSide({
  weekLabel,
  days,
  weekTotals,
  daysPlanned,
  daysLocked,
  isGenerating,
  onRegenerate,
  onMealClick,
  renderDay,
  className,
}: PlanSideProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-muted-foreground" />
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
            {weekLabel}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="gap-1.5"
        >
          <RotateCcw size={14} className={cn(isGenerating && "animate-spin")} />
          {isGenerating ? "Building…" : "Regen Week"}
        </Button>
      </div>

      {/* Grid + rail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable day columns */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="flex gap-0 min-w-[700px] p-2">
            {days.map((day) =>
              renderDay ? (
                renderDay(day)
              ) : (
                <DefaultDaySlot
                  key={day.date}
                  day={day}
                  onMealClick={onMealClick}
                />
              ),
            )}
          </div>
        </div>

        {/* Macro totals rail */}
        <div className="hidden xl:block p-3 border-l border-border">
          <MacroTotalsRail
            weekTotals={weekTotals}
            daysPlanned={daysPlanned}
            daysLocked={daysLocked}
            className="w-44"
          />
        </div>
      </div>

      {/* Empty state overlay */}
      {daysPlanned === 0 && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-3 pointer-events-auto">
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Ask Jade to build your week, or click Regen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fallback plain DayColumn slot when DnD is not active */
function DefaultDaySlot({
  day,
  onMealClick,
}: {
  day: DayPlanData;
  onMealClick: (date: string, slot: string) => void;
}) {
  // Lazy import to avoid circular refs
  const { DayColumn } = require("@/components/shared/day-column") as {
    DayColumn: React.ComponentType<{
      day: DayPlanData;
      onMealClick?: (date: string, slot: string) => void;
      className?: string;
    }>;
  };
  return (
    <DayColumn
      key={day.date}
      day={day}
      onMealClick={onMealClick}
      className="flex-1 min-w-[130px] border-r border-border last:border-r-0"
    />
  );
}
