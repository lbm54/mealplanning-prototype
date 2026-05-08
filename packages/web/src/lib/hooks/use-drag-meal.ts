/**
 * useDragMeal — dnd-kit DnD setup for Variant D.
 *
 * Design source: 07_parallel_build_plans.md §5.3 step 1.D.6
 *
 * Configures:
 * - MouseSensor (desktop)
 * - TouchSensor (mobile) with a 200ms activation delay to avoid scroll conflicts
 * - KeyboardSensor with sortable keyboard coordinates (Tab + Space + Arrows + Enter)
 *
 * Returns the sensors array and an onDragEnd handler for use with <DndContext>.
 *
 * The drag data shape from DraggableMealCard:
 *   { type: 'meal-card', meal: DraggableMeal }
 *
 * The drop target data shape from DroppableDayCell:
 *   { type: 'day-cell', date: string, slot: string }
 */
import {
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback } from "react";
import type { DraggableMeal } from "@/components/variant-d/jade-side";

export interface DroppedMealEvent {
  date: string;
  slot: string;
  meal: DraggableMeal;
}

export function useDragMeal(onDrop: (event: DroppedMealEvent) => void) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 8px movement before activating drag (prevents accidental drags on click)
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      // 200ms press + 5px movement on touch (avoids blocking scroll)
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const dragData = active.data.current as
        | { type: string; meal: DraggableMeal }
        | undefined;
      const dropData = over.data.current as
        | { type: string; date: string; slot: string }
        | undefined;

      if (
        dragData?.type === "meal-card" &&
        dropData?.type === "day-cell" &&
        dragData.meal &&
        dropData.date &&
        dropData.slot
      ) {
        onDrop({
          date: dropData.date,
          slot: dropData.slot,
          meal: dragData.meal,
        });
      }
    },
    [onDrop],
  );

  return { sensors, handleDragEnd };
}
