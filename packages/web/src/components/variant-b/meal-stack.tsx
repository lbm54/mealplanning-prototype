/**
 * Variant B — MealStack.
 *
 * The central card deck container. Renders the top 3 visible cards in a
 * z-layered stack with the active card on top.
 *
 * Handles:
 * - Card exit animations (fly off left/right/up) after swipe decision
 * - Card entrance (next card rises to top)
 * - Keyboard shortcut support (← → ↑)
 * - Touch/pointer event forwarding
 */
import { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { StackCard } from "./stack-card";
import type { DeckCard } from "./types";

export interface MealStackProps {
  deck: DeckCard[];
  currentIndex: number;
  onSwipe: (direction: "keep" | "swap" | "lock") => void;
  isPaused?: boolean;
  className?: string;
}

/** Exit variants keyed by swipe direction */
const exitVariants = {
  keep:  { x: 320, opacity: 0, rotate: 14, transition: { duration: 0.32, ease: "easeIn" as const } },
  swap:  { x: -320, opacity: 0, rotate: -14, transition: { duration: 0.32, ease: "easeIn" as const } },
  lock:  { y: -200, opacity: 0, scale: 0.88, transition: { duration: 0.28, ease: "easeIn" as const } },
};

export function MealStack({
  deck,
  currentIndex,
  onSwipe,
  isPaused = false,
  className,
}: MealStackProps) {
  // Track last swipe direction so AnimatePresence exit animation matches
  const lastSwipeRef = useRef<"keep" | "swap" | "lock">("keep");

  const handleSwipe = useCallback(
    (direction: "keep" | "swap" | "lock") => {
      lastSwipeRef.current = direction;
      onSwipe(direction);
    },
    [onSwipe],
  );

  // Keyboard shortcuts
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === "ArrowRight") handleSwipe("keep");
      if (e.key === "ArrowLeft") handleSwipe("swap");
      if (e.key === "ArrowUp") handleSwipe("lock");
    },
    [isPaused, handleSwipe],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Render visible window: current + 2 behind
  const visibleCards = deck.slice(currentIndex, currentIndex + 3);

  if (visibleCards.length === 0) return null;

  return (
    <div className={cn("relative w-full", className)} aria-live="polite">
      <AnimatePresence initial={false}>
        {visibleCards.map((card, stackOffset) => {
          const isActive = stackOffset === 0;
          const exitTarget = exitVariants[lastSwipeRef.current];

          return (
            <motion.div
              key={card.key}
              className="absolute inset-0"
              initial={
                isActive
                  ? { x: 60, opacity: 0, scale: 0.95 }
                  : { scale: 1 - (stackOffset + 1) * 0.04, y: (stackOffset + 1) * 10 }
              }
              animate={
                isActive
                  ? { x: 0, opacity: 1, scale: 1 }
                  : { scale: 1 - stackOffset * 0.04, y: stackOffset * 10, opacity: 1 }
              }
              exit={exitTarget}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ zIndex: 10 - stackOffset }}
            >
              <StackCard
                card={card}
                isActive={isActive}
                stackOffset={stackOffset}
                onSwipe={handleSwipe}
                dragEnabled={isActive && !isPaused}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
