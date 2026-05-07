/**
 * DroppableDayCell — wraps a MealCell and makes it a DnD drop target.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 * Build spec: 07_parallel_build_plans.md §5.3 step 1.D.6
 *
 * Drop target id: `${date}-${slot}` (e.g., "2026-05-06-lunch").
 * When a draggable meal card is dropped over this cell:
 * - The cell flashes Electrolyte cyan (1-second transition)
 * - The parent's onDrop handler is called with (date, slot, meal)
 *
 * Also renders a keyboard-navigation affordance via DnD Kit's keyboard sensor.
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
  className?: string;
}

export function DroppableDayCell({
  date,
  slot,
  meal,
  onMealClick,
  className,
}: DroppableDayCellProps) {
  const droppableId = `${date}-${slot}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: "day-cell", date, slot },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-[var(--radius-card)] transition-all duration-150",
        isOver && [
          "ring-2 ring-[var(--color-electrolyte-dark)]",
          "ring-offset-1",
          "bg-[var(--color-electrolyte-dark)]/5",
        ],
        className,
      )}
    >
      {/* Drop indicator overlay when dragging over */}
      {isOver && (
        <div
          aria-hidden
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-card)] pointer-events-none"
        >
          <span className="rounded-full bg-[var(--color-electrolyte-dark)] px-2 py-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[#381633] shadow">
            drop here
          </span>
        </div>
      )}

      <MealCell
        meal={meal}
        slot={slot}
        density="compact"
        onClick={onMealClick}
        className={cn(isOver && "opacity-40")}
      />
    </div>
  );
}
