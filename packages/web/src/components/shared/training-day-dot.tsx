import { cn } from "@/lib/utils";

/**
 * TrainingDayDot — the small Electrolyte cyan dot that appears after key
 * workout day labels (e.g., "SAT●").
 *
 * Design source: 05_design_proposal.md §5.4
 */
export interface TrainingDayDotProps {
  className?: string;
}

export function TrainingDayDot({ className }: TrainingDayDotProps) {
  return (
    <span
      aria-label="Key workout day"
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle ml-0.5",
        className,
      )}
    />
  );
}
