/**
 * DraggableMealCard — Jade-suggested meal card in the chat thread.
 *
 * 2026 facelift:
 * - Uses KyleCard variant="elevated" as the surface
 * - GripVertical drag handle on the left edge — the handle is the drag trigger
 * - "Use this" ghost Button for non-DnD users
 * - While dragging: source card fades to 40% opacity (stays visible in chat)
 * - Hover: lift + Electrolyte tint + drag handle brightens
 * - DragOverlay in plan.d.tsx shows a rotated ghost (handled there)
 *
 * Data payload: { type: "meal-card", meal }
 */
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { MacroBar } from "@/components/shared/macro-bar";
import { KyleCard } from "@/components/shared/kyle-card";
import { Button } from "@/components/ui/button";

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
  /** Day · slot label shown at top of card (e.g. "Wednesday · Lunch") */
  slotLabel?: string;
  className?: string;
}

export function DraggableMealCard({ meal, onUse, slotLabel, className }: DraggableMealCardProps) {
  const dragId = `chat-card-${meal.id ?? meal.title}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: "meal-card", meal },
  });

  // Translate while dragging (the actual movement)
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 9999 : undefined,
      }
    : undefined;

  return (
    <KyleCard
      ref={setNodeRef}
      variant="elevated"
      style={style}
      className={cn(
        "flex items-stretch overflow-hidden group",
        "transition-all duration-150",
        // Hover lift + electrolyte tint
        "hover:-translate-y-0.5",
        "hover:shadow-[var(--shadow-glow-electrolyte)]",
        "hover:border-[var(--color-electrolyte-dark)]/20",
        // Fade while dragging — stays visible in chat
        isDragging && "opacity-40 shadow-none",
        className,
      )}
    >
      {/* Drag handle — left edge strip */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center justify-center w-7 shrink-0 rounded-l-[var(--radius-card)]",
          "text-muted-foreground/30 group-hover:text-[var(--color-electrolyte-dark)]/60",
          "hover:text-[var(--color-electrolyte-dark)] hover:bg-[var(--color-electrolyte)]/8",
          "cursor-grab active:cursor-grabbing",
          "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring",
          "border-r border-border/40 transition-all duration-150",
          "touch-none",
        )}
        aria-label={`Drag "${meal.title}" onto a day cell`}
        title="Drag onto a day cell"
        type="button"
      >
        <GripVertical size={13} />
      </button>

      {/* Card body */}
      <div className="flex-1 p-2.5 min-w-0">
        {/* Day · slot label */}
        {slotLabel && (
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground/60 leading-none mb-1">
            {slotLabel}
          </p>
        )}

        {/* Meal name */}
        <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wide leading-snug truncate">
          {meal.title}
        </p>

        {/* Components list */}
        {meal.components.length > 0 && (
          <ul className="mt-1 space-y-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {meal.components.slice(0, 3).map((c, i) => (
              <li key={i} className="flex gap-1 items-baseline leading-snug">
                <span className="shrink-0 text-muted-foreground/50">·</span>
                <span className="truncate">
                  {c.portion} {c.name}
                </span>
              </li>
            ))}
            {meal.components.length > 3 && (
              <li className="text-muted-foreground/50 font-[var(--font-apercu-mono)]">
                +{meal.components.length - 3} more
              </li>
            )}
          </ul>
        )}

        {/* Macro chip — Apercu Mono */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <MacroBar
            carbG={meal.carbG}
            protG={meal.protG}
            fatG={meal.fatG}
            className="flex-1"
          />

          {onUse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUse(meal)}
              className={cn(
                "h-6 px-2.5 shrink-0",
                "font-[var(--font-apercu)] text-[var(--font-size-caption)] normal-case tracking-normal",
                "text-muted-foreground hover:text-[var(--color-electrolyte-dark)]",
                "hover:bg-[var(--color-electrolyte)]/8",
              )}
              type="button"
            >
              Use this
            </Button>
          )}
        </div>
      </div>
    </KyleCard>
  );
}
