import { cn } from "@/lib/utils";

/**
 * TrainingDayDot — the small Electrolyte cyan dot that appears after key
 * workout day labels (e.g., "SAT●").
 *
 * Design source: 05_design_proposal.md §5.4
 *
 * Added: active prop (CSS pulse), size prop (sm/md/lg).
 */
export interface TrainingDayDotProps {
  /** When true, adds a 2s pulsing glow animation */
  active?: boolean;
  /** Size variant — default is "sm" (original behavior) */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export function TrainingDayDot({ active, size = "sm", className }: TrainingDayDotProps) {
  return (
    <span
      aria-label="Key workout day"
      className={cn(
        "inline-block rounded-full bg-accent align-middle ml-0.5",
        sizeClasses[size],
        active && "animate-pulse-glow",
        className,
      )}
    />
  );
}
