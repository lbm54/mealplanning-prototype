import { cn } from "@/lib/utils";

/**
 * MacroBar — compact macro display.
 *
 * Renders "123g C · 45g P · 8g F" in Apercu Mono caption style.
 * Used in meal cells and day headers.
 */
export interface MacroBarProps {
  carbG: number;
  protG: number;
  fatG: number;
  className?: string;
  /** Show as targets (adds "target" label) */
  isTarget?: boolean;
}

export function MacroBar({ carbG, protG, fatG, className, isTarget }: MacroBarProps) {
  return (
    <p
      className={cn(
        "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground",
        className,
      )}
      aria-label={`${carbG}g carbs, ${protG}g protein, ${fatG}g fat${isTarget ? " target" : ""}`}
    >
      {carbG}g C&nbsp;·&nbsp;{protG}g P&nbsp;·&nbsp;{fatG}g F
      {isTarget && <span className="ml-1 opacity-60">target</span>}
    </p>
  );
}
