/**
 * DraggableMealCard — a Jade-suggested meal card inside the chat thread.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 *
 * This card is rendered inside Jade's chat replies when she proposes meal
 * alternatives. It wraps the shared <MealCell> chrome and adds:
 *
 * - A drag handle (left edge, GripVertical icon)
 * - dnd-kit useDraggable hook for cross-panel DnD
 * - A [Use] button (click-to-drop fallback for non-DnD users / accessibility)
 * - Visual feedback while dragging
 *
 * The draggable id is scoped as `chat-card-${meal.id ?? title}` and carries
 * the full MealAssembly as the drag data payload.
 */
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MacroBar } from "@/components/shared/macro-bar";
import { Utensils } from "lucide-react";

export interface DraggableMealCardMeal {
  id?: string;
  title: string;
  methodTag?: string;
  components: { name: string; portion: string }[];
  carbG: number;
  protG: number;
  fatG: number;
}

export interface DraggableMealCardProps {
  meal: DraggableMealCardMeal;
  /** Called when the user clicks [Use] without dragging */
  onUse?: (meal: DraggableMealCardMeal) => void;
  className?: string;
}

export function DraggableMealCard({
  meal,
  onUse,
  className,
}: DraggableMealCardProps) {
  const dragId = `chat-card-${meal.id ?? meal.title}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId,
      data: { type: "meal-card", meal },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 9999 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch rounded-[var(--radius-card)] border border-border bg-card",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "transition-shadow",
        isDragging &&
          "opacity-80 shadow-[var(--shadow-kyle-elevated-dark)] ring-2 ring-[var(--color-electrolyte-dark)]",
        className,
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center justify-center w-8 rounded-l-[var(--radius-card)]",
          "text-muted-foreground/50 hover:text-muted-foreground",
          "cursor-grab active:cursor-grabbing",
          "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring",
          "border-r border-border/50",
          "transition-colors touch-none",
        )}
        aria-label={`Drag "${meal.title}" onto a day cell`}
        title="Drag onto a day cell"
        type="button"
      >
        <GripVertical size={14} />
      </button>

      {/* Card body */}
      <div className="flex-1 p-3">
        <div className="flex items-start gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
            aria-hidden
          >
            <Utensils size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-[var(--font-apercu)] font-medium text-[var(--font-size-body)] leading-snug">
              {meal.title}
            </p>
            {meal.components.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-[var(--font-size-caption)] text-muted-foreground font-[var(--font-apercu)]">
                {meal.components.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex gap-1 items-baseline">
                    <span className="shrink-0">·</span>
                    <span>
                      {c.portion} {c.name}
                    </span>
                  </li>
                ))}
                {meal.components.length > 3 && (
                  <li className="text-muted-foreground/60">
                    +{meal.components.length - 3} more
                  </li>
                )}
              </ul>
            )}
            <MacroBar
              carbG={meal.carbG}
              protG={meal.protG}
              fatG={meal.fatG}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* [Use] button + drag hint */}
        <div className="mt-2 flex items-center justify-between">
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70 italic">
            drag onto a day ↑
          </p>
          {onUse && (
            <button
              onClick={() => onUse(meal)}
              className={cn(
                "flex items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1",
                "bg-primary text-primary-foreground",
                "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
                "hover:bg-[var(--color-orange-light)] transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring",
              )}
              type="button"
            >
              <Check size={12} />
              Use
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
