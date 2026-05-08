import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";

/**
 * PreWorkoutReminderCard — countdown timer + fuel window reminders.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #29
 *
 * Sub-trigger: workout starts in 60–120 min.
 * Shows: countdown to workout + workout title + suggested pre-fuel windows.
 * Countdown ticks in real-time if minutesUntil is provided.
 */

export interface FuelWindowHint {
  label: string;
  carbG: number;
  notes?: string;
}

export interface PreWorkoutReminderCardOutput {
  workoutTitle: string;
  minutesUntil: number;
  workoutType?: string;
  durationMin?: number;
  fuelWindows?: FuelWindowHint[];
}

export interface PreWorkoutReminderCardProps {
  output: PreWorkoutReminderCardOutput;
  onDismiss?: () => void;
  className?: string;
}

export default function PreWorkoutReminderCard({
  output,
  onDismiss,
  className,
}: PreWorkoutReminderCardProps) {
  const [minutesLeft, setMinutesLeft] = useState(output.minutesUntil);
  const [dismissed, setDismissed] = useState(false);

  // Tick down every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesLeft((m) => Math.max(0, m - 1));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed) return null;

  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  const countdownDisplay = hours > 0
    ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim()
    : `${mins}m`;

  const urgency = minutesLeft <= 30 ? "urgent" : minutesLeft <= 60 ? "soon" : "normal";

  return (
    <KyleCard
      variant="elevated"
      className={cn(
        "overflow-hidden",
        urgency === "urgent" && "ring-1 ring-[var(--color-dragonfruit)]/40",
        urgency === "soon" && "ring-1 ring-[var(--color-orange)]/40",
        className,
      )}
    >
      <KyleCardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                urgency === "urgent"
                  ? "bg-[var(--color-dragonfruit)]/20 text-[var(--color-dragonfruit)]"
                  : "bg-[var(--color-orange)]/20 text-[var(--color-orange)]",
              )}
            >
              <Zap size={16} aria-hidden />
            </span>
            <div>
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
                Pre-workout
              </p>
              <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider leading-tight">
                {output.workoutTitle}
              </p>
            </div>
          </div>

          {/* Countdown badge */}
          <div className="shrink-0 text-right">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1",
                "font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-bold tabular-nums",
                urgency === "urgent"
                  ? "bg-[var(--color-dragonfruit)] text-white"
                  : urgency === "soon"
                    ? "bg-[var(--color-orange)] text-[var(--color-blackberry)]"
                    : "bg-muted text-foreground",
              )}
            >
              <Clock size={12} aria-hidden />
              {countdownDisplay}
            </span>
            <p className="mt-0.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              until start
            </p>
          </div>
        </div>

        {/* Workout meta */}
        {(output.workoutType || output.durationMin) && (
          <p className="mt-2 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {[output.workoutType, output.durationMin && `${output.durationMin} min`].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Fuel windows */}
        {output.fuelWindows && output.fuelWindows.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
              Suggested fuel
            </p>
            {output.fuelWindows.map((fw, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between rounded-[var(--radius-card)] bg-muted/50 px-2.5 py-1.5"
              >
                <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground">
                  {fw.label}
                  {fw.notes && (
                    <span className="ml-1 text-muted-foreground">— {fw.notes}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "ml-2 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] font-semibold tabular-nums shrink-0",
                    "text-[var(--color-orange)]",
                  )}
                >
                  {fw.carbG}g
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={() => { setDismissed(true); onDismiss(); }}
            className="mt-3 w-full rounded-[var(--radius-pill)] border border-border py-1.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground hover:bg-muted transition-colors duration-150"
          >
            Dismiss
          </button>
        )}
      </KyleCardContent>
    </KyleCard>
  );
}
