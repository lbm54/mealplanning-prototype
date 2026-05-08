/**
 * DroppableDayCell — MealCell wrapped in a dnd-kit drop target.
 *
 * Drop target id: `${date}-${slot}`
 *
 * Visual states:
 * - Idle: normal MealCell rendering
 * - isOver (drag hovering): Electrolyte cyan glow ring + dotted border overlay +
 *   "Drop here" label. Empty cells also scale up slightly as a welcoming gesture.
 *
 * On valid drop: parent triggers a brief pulse-glow flash (handled in plan.d.tsx).
 */
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { MealCell } from "@/components/shared/meal-cell";
import type { MealAssembly } from "@/components/shared/meal-cell";

export interface DroppableDayCellProps {
  date: string;
  slot: string;
  meal?: MealAssembly | null;
  onMealClick?: () => void;
  /** Whether any card is currently being dragged (for drop zone outline visibility) */
  isDragging?: boolean;
  className?: string;
}

export function DroppableDayCell({
  date,
  slot,
  meal,
  onMealClick,
  isDragging,
  className,
}: DroppableDayCellProps) {
  const droppableId = `${date}-${slot}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: "day-cell", date, slot },
  });

  const isEmpty = !meal;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-[var(--radius-card)] transition-all duration-150",
        // Show subtle drop zone outline while any drag is active
        isDragging && !isOver && isEmpty && [
          "ring-1 ring-dashed ring-border/50",
          "bg-muted/20",
        ],
        // Active hover state: electrolyte glow
        isOver && [
          "ring-2 ring-[var(--color-electrolyte-dark)]",
          "ring-offset-1 ring-offset-background",
          "shadow-[var(--shadow-glow-electrolyte)]",
          "scale-[1.02]",
        ],
        className,
      )}
    >
      {/* Drop indicator overlay — only when actively hovering */}
      {isOver && (
        <div
          aria-hidden
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-card)] pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(28,249,207,0.08) 0%, rgba(0,231,186,0.12) 100%)",
          }}
        >
          <span
            className={cn(
              "rounded-[var(--radius-pill)] px-2.5 py-1",
              "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider",
              "bg-[var(--color-electrolyte-dark)] text-[#381633]",
              "shadow-sm",
            )}
          >
            Drop here
          </span>
        </div>
      )}

      {/* Dotted border for empty cells under drag */}
      {isDragging && isEmpty && !isOver && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-[var(--radius-card)] pointer-events-none border border-dashed border-border/40"
        />
      )}

      <MealCell
        meal={meal}
        slot={slot}
        density="compact"
        onClick={onMealClick}
        className={cn(isOver && "opacity-30")}
      />
    </div>
  );
}
