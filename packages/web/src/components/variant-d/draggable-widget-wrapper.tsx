/**
 * Draggable wrappers for generative-UI widgets inside the Variant D chat panel.
 *
 * Each wrapper uses dnd-kit's `useDraggable` and injects a GripVertical handle
 * so the user can drag the widget onto the plan grid.
 *
 * Three wrappers are exported:
 *
 *   DraggableMealPlanCardWidget
 *     - Wraps <MealPlanCard> from the widget library
 *     - Drag payload: { type: "week-plan", planOutput }
 *     - Dropping onto ANY grid cell triggers a "Apply this week?" confirmation
 *       in plan.d.tsx (handled via onWeekPlanDrop prop there)
 *
 *   DraggableMealAltCard
 *     - Wraps a single MealAlt row from <MealAlternatives>
 *     - Drag payload: { type: "meal-alt", alt }
 *     - Dropping onto a specific day cell applies just that meal to that slot
 *
 *   DraggableMealCarouselCard
 *     - Wraps the currently-selected <MealPlanCard> inside <MealCarousel>
 *     - Drag payload: { type: "week-plan", planOutput }
 *     - Same confirm-and-apply flow as DraggableMealPlanCardWidget
 */
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import MealPlanCard, { type MealPlanCardOutput } from "@/components/shared/widgets/meal-plan-card";
import { MacroBar } from "@/components/shared/macro-bar";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";
import type { MealAlt } from "@/components/shared/widgets/meal-alternatives";

// ─────────────────────────────────────────────────────────────────────────────
// Shared drag handle strip
// ─────────────────────────────────────────────────────────────────────────────

interface DragHandleProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners: any;
  label: string;
  isDragging: boolean;
}

function DragHandleStrip({ attributes, listeners, label, isDragging }: DragHandleProps) {
  return (
    <button
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center justify-center w-6 shrink-0 self-stretch",
        "rounded-l-[var(--radius-card)]",
        "text-muted-foreground/30",
        "hover:text-[var(--color-electrolyte-dark)] hover:bg-[var(--color-electrolyte)]/8",
        "cursor-grab active:cursor-grabbing touch-none",
        "border-r border-border/40 transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring",
        isDragging && "text-[var(--color-electrolyte-dark)]/60",
      )}
      aria-label={label}
      title="Drag onto a day cell"
      type="button"
    >
      <GripVertical size={12} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DraggableMealPlanCardWidget
// ─────────────────────────────────────────────────────────────────────────────

export interface DraggableMealPlanCardWidgetProps {
  plan: MealPlanCardOutput;
  onExpand?: () => void;
  isSelected?: boolean;
  className?: string;
}

export function DraggableMealPlanCardWidget({
  plan,
  onExpand,
  isSelected,
  className,
}: DraggableMealPlanCardWidgetProps) {
  const dragId = `widget-week-plan-${plan.id ?? plan.title}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: "week-plan", planOutput: plan },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 9999 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch overflow-hidden rounded-[var(--radius-card)]",
        "border border-border/60 bg-card",
        "transition-all duration-150",
        "hover:border-[var(--color-electrolyte-dark)]/20 hover:shadow-[var(--shadow-glow-electrolyte)]",
        isDragging && "opacity-40 shadow-none",
        className,
      )}
    >
      <DragHandleStrip
        attributes={attributes}
        listeners={listeners}
        label={`Drag "${plan.title}" week plan onto the grid`}
        isDragging={isDragging}
      />
      <div className="flex-1 min-w-0">
        <MealPlanCard
          output={plan}
          onExpand={onExpand}
          isSelected={isSelected}
          className="border-none rounded-none rounded-r-[var(--radius-card)]"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DraggableMealAltCard
// ─────────────────────────────────────────────────────────────────────────────

export interface DraggableMealAltCardProps {
  alt: MealAlt;
  isSelected?: boolean;
  isDisabled?: boolean;
  onUse?: (alt: MealAlt) => void;
  className?: string;
}

export function DraggableMealAltCard({
  alt,
  isSelected,
  isDisabled,
  onUse,
  className,
}: DraggableMealAltCardProps) {
  const dragId = `widget-meal-alt-${alt.id}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: "meal-alt", alt },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 9999 : undefined }
    : undefined;

  return (
    <KyleCard
      ref={setNodeRef}
      style={style}
      variant={isSelected ? "elevated" : "default"}
      className={cn(
        "flex items-stretch overflow-hidden transition-all duration-200",
        "hover:border-[var(--color-electrolyte-dark)]/20",
        isSelected && "ring-1 ring-[var(--color-orange)]/40",
        isDisabled && !isSelected && "opacity-50",
        isDragging && "opacity-40 shadow-none",
        className,
      )}
    >
      <DragHandleStrip
        attributes={attributes}
        listeners={listeners}
        label={`Drag "${alt.title}" onto a day cell`}
        isDragging={isDragging}
      />
      <KyleCardContent className="flex-1 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium leading-snug">
              {alt.title}
            </p>
            {alt.components.length > 0 && (
              <p className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground line-clamp-2">
                {alt.components.join(" · ")}
              </p>
            )}
            <MacroBar
              carbG={alt.carbG}
              protG={alt.proteinG}
              fatG={alt.fatG}
              className="mt-2"
            />
          </div>
          {!isDisabled && onUse && (
            <button
              onClick={() => onUse(alt)}
              className={cn(
                "shrink-0 rounded-[var(--radius-pill)] bg-primary px-3 py-1",
                "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
                "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
              )}
              type="button"
            >
              Use this
            </button>
          )}
          {isSelected && isDisabled && (
            <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/50 px-3 py-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
              Chosen
            </span>
          )}
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DraggableMealCarouselCard
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper — only the currently-active card is draggable. The carousel
// itself handles navigation; we just add a drag handle when the card is active.

export interface DraggableMealCarouselCardProps {
  plan: MealPlanCardOutput;
  isActive: boolean;
  onExpand?: () => void;
  className?: string;
}

export function DraggableMealCarouselCard({
  plan,
  isActive,
  onExpand,
  className,
}: DraggableMealCarouselCardProps) {
  const dragId = `widget-carousel-${plan.id ?? plan.title}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: "week-plan", planOutput: plan },
    // Only active card is draggable
    disabled: !isActive,
  });

  const style = transform && isActive
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 9999 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch overflow-hidden rounded-[var(--radius-card)]",
        "border border-border/60 bg-card",
        "transition-all duration-150",
        isActive && "hover:border-[var(--color-electrolyte-dark)]/20 hover:shadow-[var(--shadow-glow-electrolyte)]",
        isDragging && "opacity-40 shadow-none",
        !isActive && "opacity-60 scale-[0.97]",
        className,
      )}
    >
      {isActive && (
        <DragHandleStrip
          attributes={attributes}
          listeners={listeners}
          label={`Drag "${plan.title}" week plan onto the grid`}
          isDragging={isDragging}
        />
      )}
      <div className="flex-1 min-w-0">
        <MealPlanCard
          output={plan}
          onExpand={onExpand}
          isSelected={isActive}
          className="border-none rounded-none"
        />
      </div>
    </div>
  );
}
