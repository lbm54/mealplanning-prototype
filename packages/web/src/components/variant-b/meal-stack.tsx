/**
 * Variant B — MealStack (2026 facelift).
 *
 * The central card deck container. Renders 3 visually stacked cards:
 * - Current card  → scale 1.0, no blur, full opacity (top of stack)
 * - Next card     → scale 0.94, blur 1.5px, opacity 0.85, y -10px
 * - After-next    → scale 0.88, blur 3px, opacity 0.55, y -20px
 *
 * Stack shift: when the top card exits, the next card springs up via a
 * motion spring transition (stiffness 320, damping 30).
 *
 * Exit animations:
 * - right (keep)  → flies off-right with clockwise rotation
 * - left (swap)   → flies off-left with counter-clockwise rotation
 * - up (lock)     → scales down and rises off the top
 *
 * Keyboard support: ← → ↑
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

const exitVariants = {
  keep: {
    x: 380,
    opacity: 0,
    rotate: 18,
    transition: { duration: 0.30, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  swap: {
    x: -380,
    opacity: 0,
    rotate: -18,
    transition: { duration: 0.30, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  lock: {
    y: -240,
    opacity: 0,
    scale: 0.84,
    transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function MealStack({
  deck,
  currentIndex,
  onSwipe,
  isPaused = false,
  className,
}: MealStackProps) {
  const lastSwipeRef = useRef<"keep" | "swap" | "lock">("keep");

  const handleSwipe = useCallback(
    (direction: "keep" | "swap" | "lock") => {
      lastSwipeRef.current = direction;
      onSwipe(direction);
    },
    [onSwipe],
  );

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

  // Show current + next 2 in the visual stack
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
                  ? { x: 50, opacity: 0, scale: 0.96 }
                  : {
                      scale: 1 - (stackOffset + 1) * 0.06,
                      y: -((stackOffset + 1) * 12),
                      opacity: stackOffset === 0 ? 0.85 : 0.55,
                    }
              }
              animate={
                isActive
                  ? { x: 0, opacity: 1, scale: 1, y: 0 }
                  : {
                      scale: 1 - stackOffset * 0.06,
                      y: -(stackOffset * 12),
                      opacity: stackOffset === 1 ? 0.85 : 0.55,
                    }
              }
              exit={exitTarget}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
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
