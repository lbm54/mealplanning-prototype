/**
 * Variant B — StackCard component.
 *
 * Renders a single meal card in the deck with:
 * - Day label (font-compadre uppercase)
 * - Slot label (B/L/D/Pre/During/Post)
 * - Meal components as a bulleted list
 * - Macro totals at the bottom
 * - Training-day dot if relevant
 *
 * Motion/Framer: drag gestures, exit animations, threshold detection.
 * The card is draggable; parent (MealStack) receives swipe direction via onSwipe.
 */
import { useRef, useState } from "react";
import { motion, type PanInfo } from "motion/react";
import { Lock, Check, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { MacroBar } from "@/components/shared/macro-bar";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import type { DeckCard } from "./types";
import { SLOT_LABELS, SWIPE_THRESHOLDS } from "./types";

export interface StackCardProps {
  card: DeckCard;
  /** Whether this is the top (active) card */
  isActive: boolean;
  /** Stack position offset (0=top, 1=next, 2=after) */
  stackOffset: number;
  onSwipe: (direction: "keep" | "swap" | "lock") => void;
  /** Pointer to prevent drag when not active */
  dragEnabled: boolean;
}

export function StackCard({ card, isActive, stackOffset, onSwipe, dragEnabled }: StackCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Determine gesture hint color
  const swipeIntentX = dragOffset.x;
  const swipeIntentY = dragOffset.y;
  const isKeepHint = swipeIntentX > 40 && Math.abs(swipeIntentY) < 40;
  const isSwapHint = swipeIntentX < -40 && Math.abs(swipeIntentY) < 40;
  const isLockHint = swipeIntentY < -40;

  const handleDragStart = () => {
    setIsDragging(true);
    dragStartRef.current = { x: 0, y: 0 };
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    setDragOffset({ x: info.offset.x, y: info.offset.y });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });

    const { x, y } = info.offset;

    if (y < SWIPE_THRESHOLDS.vertical && Math.abs(x) < 80) {
      onSwipe("lock");
    } else if (x > SWIPE_THRESHOLDS.horizontal) {
      onSwipe("keep");
    } else if (x < -SWIPE_THRESHOLDS.horizontal) {
      onSwipe("swap");
    }
    // else snap back — motion handles the spring return
  };

  // Background tint based on swipe direction during drag
  const tintClass = isKeepHint
    ? "bg-emerald-500/8"
    : isSwapHint
      ? "bg-destructive/8"
      : isLockHint
        ? "bg-accent/10"
        : "bg-card";

  // Stack visual offset: cards behind the active one are scaled down and shifted
  const scaleForOffset = isActive ? 1 : 1 - stackOffset * 0.04;
  const yForOffset = isActive ? 0 : stackOffset * 10;

  return (
    <motion.div
      className="absolute inset-0 w-full"
      style={{ zIndex: isActive ? 10 : 10 - stackOffset }}
      initial={false}
      animate={{
        scale: scaleForOffset,
        y: yForOffset,
        opacity: stackOffset > 2 ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        drag={dragEnabled && isActive ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02 }}
        animate={
          isDragging
            ? {}
            : { rotate: dragOffset.x * 0.02, x: 0, y: 0 }
        }
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className={cn(
          "relative w-full h-full rounded-[var(--radius-card)] border shadow-kyle-card",
          "cursor-grab active:cursor-grabbing select-none overflow-hidden",
          tintClass,
          "transition-colors duration-100",
        )}
      >
        {/* Swipe direction hint overlays */}
        {isKeepHint && (
          <div className="absolute inset-0 flex items-center justify-start pl-6 z-20 pointer-events-none">
            <div className="rounded-full bg-emerald-500 p-3">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        {isSwapHint && (
          <div className="absolute inset-0 flex items-center justify-end pr-6 z-20 pointer-events-none">
            <div className="rounded-full bg-destructive p-3">
              <X className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        {isLockHint && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="rounded-full bg-accent p-3">
              <Lock className="w-8 h-8 text-accent-foreground" />
            </div>
          </div>
        )}

        {/* Lock badge — shown if previously locked */}
        {card.decision === "lock" && (
          <div className="absolute top-3 right-3 z-20">
            <Lock className="w-4 h-4 text-accent" />
          </div>
        )}

        {/* Card body */}
        <div className="flex flex-col h-full p-5 gap-3 overflow-hidden">
          {/* Header: day + slot */}
          <div className="flex items-start justify-between gap-2 shrink-0">
            <div>
              <div className="flex items-center gap-1">
                <span
                  className="font-[var(--font-compadre)] text-[var(--font-size-caption)] font-medium uppercase tracking-wider text-muted-foreground"
                  aria-label={`${card.dayLabel}, ${card.dateLabel}`}
                >
                  {card.dayLabel.slice(0, 3).toUpperCase()}
                  {card.isTrainingDay && <TrainingDayDot className="ml-1" />}
                </span>
              </div>
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                {card.dateLabel}
              </p>
            </div>
            <span className="font-[var(--font-compadre)] text-[var(--font-size-label)] font-medium uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {SLOT_LABELS[card.slot]}
            </span>
          </div>

          {/* Meal title */}
          <div className="shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Electrolyte cyan icon circle */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-foreground" />
              </div>
              <h2 className="font-[var(--font-sansita)] text-[var(--font-size-section)] font-bold uppercase leading-tight">
                {card.meal.title}
              </h2>
            </div>
            {card.meal.method_tag && (
              <p className="mt-1 text-xs text-muted-foreground font-[var(--font-apercu)] ml-11">
                {card.meal.method_tag}
              </p>
            )}
          </div>

          {/* Components list */}
          <ul className="flex-1 space-y-1.5 overflow-y-auto min-h-0">
            {card.meal.components.map((c, i) => (
              <li
                key={`${c.food_id}-${i}`}
                className="flex items-start gap-2 font-[var(--font-apercu)] text-[var(--font-size-body)]"
              >
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                <span>
                  <span className="text-foreground">{c.portion}</span>
                  <span className="text-muted-foreground"> {c.name}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Footer: macros + day target */}
          <div className="shrink-0 space-y-1.5 pt-2 border-t border-border/40">
            <MacroBar
              carbG={card.meal.totals.carb_g}
              protG={card.meal.totals.protein_g}
              fatG={card.meal.totals.fat_g}
            />
            {card.dayTarget && (
              <MacroBar
                carbG={card.dayTarget.carbG}
                protG={card.dayTarget.protG}
                fatG={card.dayTarget.fatG}
                isTarget
                className="text-[10px] opacity-70"
              />
            )}
            {card.activityNote && (
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground truncate">
                {card.activityNote}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
