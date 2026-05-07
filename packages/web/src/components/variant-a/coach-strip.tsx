/**
 * CoachStrip — the single italic line above the calendar grid.
 *
 * Design source: 06_five_uiux_approaches.md §1.A — "Single-line Coach strip
 * above the grid (passive italic text from Jade)".
 *
 * Passive, non-interactive. Shows Jade's one-liner explanation for the week.
 * Animated when Jade is generating (pulse on JadeAvatar).
 */
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";

export interface CoachStripProps {
  text: string | null;
  isLoading?: boolean;
  className?: string;
}

export function CoachStrip({ text, isLoading, className }: CoachStripProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card px-4 py-3",
        className,
      )}
      aria-live="polite"
      aria-label="Jade's weekly coaching note"
    >
      <JadeAvatar size={24} state={isLoading ? "thinking" : "idle"} />
      <p
        className={cn(
          "font-[var(--font-apercu)] text-[var(--font-size-body)] italic",
          isLoading
            ? "text-muted-foreground animate-pulse"
            : "text-foreground",
        )}
      >
        {isLoading
          ? "Jade is building your week…"
          : (text ?? "Click 'Plan my week' to generate your training-aware meal plan.")}
      </p>
    </div>
  );
}
