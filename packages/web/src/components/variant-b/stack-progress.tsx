/**
 * Variant B — StackProgress (2026 facelift).
 *
 * Top progress strip:
 * - Thin Mango-filled progress bar (styled Progress)
 * - Mini-stat row: locked / swapped / kept badges above or inline
 * - "X of 21 meals decided" label in Apercu Mono
 *
 * Animates count changes with a fade-up micro-animation.
 */
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SlotDecision } from "./types";

export interface StackProgressProps {
  current: number;
  total: number;
  decisions?: SlotDecision[];
  className?: string;
}

export function StackProgress({ current, total, decisions = [], className }: StackProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  const lockedCount = decisions.filter((d) => d.decision === "lock").length;
  const swappedCount = decisions.filter((d) => d.decision === "swap").length;
  const keptCount = decisions.filter((d) => d.decision === "keep").length;

  const hasDecisions = lockedCount + swappedCount + keptCount > 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Mini stat row */}
      {hasDecisions && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          {lockedCount > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`lock-${lockedCount}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
              >
                <Badge
                  variant="training-day"
                  className="gap-1 text-[9px] tracking-[0.15em] px-2 py-0.5"
                >
                  {lockedCount} locked
                </Badge>
              </motion.div>
            </AnimatePresence>
          )}
          {swappedCount > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`swap-${swappedCount}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
              >
                <Badge
                  variant="race"
                  className="gap-1 text-[9px] tracking-[0.15em] px-2 py-0.5"
                >
                  {swappedCount} swapped
                </Badge>
              </motion.div>
            </AnimatePresence>
          )}
          {keptCount > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`kept-${keptCount}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
              >
                <Badge
                  variant="carb-loading"
                  className="gap-1 text-[9px] tracking-[0.15em] px-2 py-0.5"
                >
                  {keptCount} kept
                </Badge>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* Progress bar — Mango fill via inline style override */}
      <div className="relative">
        <Progress
          value={percent}
          className="h-1.5 bg-muted/60"
          aria-label={`${current} of ${total} meals decided`}
          style={
            {
              "--progress-fill": "linear-gradient(to right, var(--color-orange-light), var(--color-orange))",
            } as React.CSSProperties
          }
        />
        {/* Glow pip at current position */}
        {percent > 0 && percent < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--color-orange)] shadow-[var(--shadow-glow-orange)] animate-status-pulse"
            style={{ left: `calc(${percent}% - 6px)` }}
          />
        )}
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={current}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2 }}
          className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider text-center"
        >
          {current === 0
            ? `${total} meals to decide`
            : current === total
              ? "All meals decided"
              : `${current} of ${total} meals decided`}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
