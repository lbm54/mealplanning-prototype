/**
 * Variant B — StackProgress.
 *
 * Persistent progress bar at the top of the stack:
 * "8 of 21 meals decided"
 *
 * Uses shadcn Progress primitive with Kyle brand styling.
 * Animates smoothly between steps.
 */
import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StackProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function StackProgress({ current, total, className }: StackProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Progress bar */}
      <Progress
        value={percent}
        className="h-2 bg-muted"
        aria-label={`${current} of ${total} meals decided`}
      />

      {/* Label */}
      <motion.p
        key={current}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider text-center"
      >
        {current} of {total} meals decided
      </motion.p>
    </div>
  );
}
