/**
 * EmptyStateD — the empty state for Variant D.
 *
 * Shown when no meal plan exists for the current week.
 * The chat panel should be open — Jade greets the user automatically.
 * This component occupies the left grid area.
 */
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";

export interface EmptyStateDProps {
  weekLabel: string;
  trainingDays?: number;
  longRunDay?: string;
  className?: string;
}

export function EmptyStateD({
  weekLabel,
  trainingDays = 0,
  longRunDay,
  className,
}: EmptyStateDProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full p-8 text-center space-y-6",
        className,
      )}
    >
      {/* Faded week grid illustration */}
      <div className="grid grid-cols-7 gap-1 w-full max-w-md opacity-20">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-[var(--radius-card)] border-2 border-dashed border-border"
          />
        ))}
      </div>

      {/* Jade avatar + message */}
      <div className="flex flex-col items-center gap-3">
        <JadeAvatar size={36} state="idle" />
        <div className="space-y-1">
          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            {weekLabel}
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground max-w-xs">
            {trainingDays > 0
              ? `${trainingDays} training days this week${longRunDay ? ` · long run ${longRunDay}` : ""}. Ask Jade to build it.`
              : "No training scheduled this week. Ask Jade to build a rest-week plan."}
          </p>
        </div>
      </div>

      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70 italic">
        {'Type in the chat panel, or click "Build me a week" above.'}
      </p>
    </div>
  );
}
