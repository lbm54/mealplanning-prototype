/**
 * PlanSide — the left 60% of Variant D: the refined week grid.
 *
 * 2026 facelift:
 * - Coach strip above grid with "PLAN MY WEEK" KyleButton pill
 * - 7-column compact grid with DnD-aware DndDayColumn
 * - Today column highlighted with soft Mango glow (not thick outline)
 * - Weekly macro totals row below grid using three MacroBar instances
 * - Drop zone affordances forwarded from DnD context
 */
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { KyleButton } from "@/components/shared/kyle-button";
import { MacroBar } from "@/components/shared/macro-bar";
import type { DayPlanData } from "@/components/shared/day-column";
import type React from "react";

export interface PlanSideProps {
  weekLabel: string;
  days: DayPlanData[];
  weekTotals: { carbG: number; protG: number; fatG: number };
  weekTargets?: { carbG: number; protG: number; fatG: number };
  daysPlanned: number;
  daysLocked: number;
  isGenerating: boolean;
  onRegenerate: () => void;
  onMealClick: (date: string, slot: string) => void;
  /** Whether a card is currently being dragged (forwarded to drop cells) */
  isDragging?: boolean;
  /** DnD-aware cell renderer — wraps each day column with droppable targets */
  renderDay?: (day: DayPlanData, isDragging: boolean) => React.ReactNode;
  className?: string;
}

export function PlanSide({
  weekLabel: _weekLabel,
  days,
  weekTotals,
  weekTargets,
  daysPlanned,
  daysLocked: _daysLocked,
  isGenerating,
  onRegenerate,
  onMealClick,
  isDragging = false,
  renderDay,
  className,
}: PlanSideProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Coach strip — context + primary CTA */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2.5",
          "border-b border-border/50 bg-background/95 backdrop-blur-sm",
          "shrink-0",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <p
            className={cn(
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground truncate",
            )}
          >
            {daysPlanned > 0
              ? `${daysPlanned} days planned`
              : "No meals planned yet — ask Jade or click below"}
          </p>
        </div>

        <KyleButton
          size="sm"
          onClick={onRegenerate}
          loading={isGenerating}
          disabled={isGenerating}
          className="shrink-0 gap-1.5 h-8 px-4 text-[var(--font-size-caption)]"
        >
          {!isGenerating && <Sparkles size={12} />}
          Plan my week
        </KyleButton>
      </div>

      {/* Scrollable day grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div
          className={cn(
            "flex gap-px min-w-[700px] p-3 h-full",
            // During drag: subtle grid background pulse
            isDragging && "bg-[var(--color-electrolyte)]/[0.015]",
          )}
          style={{
            transition: isDragging ? "background-color 200ms ease" : undefined,
          }}
        >
          {days.map((day) =>
            renderDay ? (
              renderDay(day, isDragging)
            ) : (
              <DefaultDaySlot key={day.date} day={day} onMealClick={onMealClick} isDragging={isDragging} />
            ),
          )}
        </div>
      </div>

      {/* Weekly macro totals footer */}
      {daysPlanned > 0 && (
        <div
          className={cn(
            "shrink-0 px-4 py-3 border-t border-border/50",
            "bg-background/95 backdrop-blur-sm",
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground/70">
              Weekly totals
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Carb bar */}
            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-[var(--color-electrolyte-dark)] uppercase mb-1 leading-none">
                C
              </p>
              <MacroBar
                carbG={weekTotals.carbG}
                protG={0}
                fatG={0}
                target={weekTargets ?? { carbG: weekTotals.carbG, protG: 1, fatG: 1 }}
                className="[&>div]:rounded-full"
              />
            </div>
            {/* Protein bar */}
            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-[var(--color-cream-dark)] dark:text-foreground/60 uppercase mb-1 leading-none">
                P
              </p>
              <MacroBar
                carbG={0}
                protG={weekTotals.protG}
                fatG={0}
                target={weekTargets ?? { carbG: 1, protG: weekTotals.protG, fatG: 1 }}
                className="[&>div]:rounded-full"
              />
            </div>
            {/* Fat bar */}
            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-[var(--color-orange)] uppercase mb-1 leading-none">
                F
              </p>
              <MacroBar
                carbG={0}
                protG={0}
                fatG={weekTotals.fatG}
                target={weekTargets ?? { carbG: 1, protG: 1, fatG: weekTotals.fatG }}
                className="[&>div]:rounded-full"
              />
            </div>
            {/* Aggregate text label */}
            <div className="shrink-0 hidden xl:block">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground whitespace-nowrap">
                {weekTotals.carbG}g C · {weekTotals.protG}g P · {weekTotals.fatG}g F
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fallback day slot when DnD renderDay is not provided */
function DefaultDaySlot({
  day,
  onMealClick,
  isDragging,
}: {
  day: DayPlanData;
  onMealClick: (date: string, slot: string) => void;
  isDragging?: boolean;
}) {
  const { DndDayColumn } = require("./dnd-day-column") as {
    DndDayColumn: React.ComponentType<{
      day: DayPlanData;
      onMealClick: (date: string, slot: string) => void;
      isDragging?: boolean;
      className?: string;
    }>;
  };
  return (
    <DndDayColumn
      key={day.date}
      day={day}
      onMealClick={onMealClick}
      isDragging={isDragging}
      className="flex-1 min-w-[120px]"
    />
  );
}
