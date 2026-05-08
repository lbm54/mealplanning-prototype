import { useState } from "react";
import { Droplets, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";

/**
 * WeatherAdvisoryCard — larger WeatherCard with prominent advisory text.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #30
 *
 * Sub-trigger: temp >85°F or <40°F on a workout day.
 * More prominent than WeatherCard: large advisory banner at top,
 * detailed hydration/gear recommendations below.
 * Dismissible.
 */

export interface WeatherAdvisoryCardOutput {
  tempF: number;
  condition: string;
  city?: string;
  humidity?: number;
  advisoryTitle: string;
  advisoryBody: string;
  hydrationOz?: number;
  recommendations?: string[];
  workoutDate?: string;
}

export interface WeatherAdvisoryCardProps {
  output: WeatherAdvisoryCardOutput;
  onDismiss?: () => void;
  className?: string;
}

function getAdvisoryTone(tempF: number): "hot" | "cold" {
  return tempF > 85 ? "hot" : "cold";
}

export default function WeatherAdvisoryCard({
  output,
  onDismiss,
  className,
}: WeatherAdvisoryCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tone = getAdvisoryTone(output.tempF);

  const TONE = {
    hot: {
      bannerBg: "bg-[var(--color-orange)]/15",
      borderColor: "border-l-[var(--color-orange)]",
      iconColor: "text-[var(--color-orange)]",
      badgeBg: "bg-[var(--color-orange)] text-[var(--color-blackberry)]",
      hydrationColor: "text-[var(--color-electrolyte)]",
    },
    cold: {
      bannerBg: "bg-[var(--color-electrolyte)]/10",
      borderColor: "border-l-[var(--color-electrolyte)]",
      iconColor: "text-[var(--color-electrolyte)]",
      badgeBg: "bg-[var(--color-electrolyte)] text-[var(--color-blackberry)]",
      hydrationColor: "text-[var(--color-electrolyte)]",
    },
  }[tone];

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <KyleCard
      variant="elevated"
      className={cn(
        "overflow-hidden border-l-4",
        TONE.borderColor,
        className,
      )}
    >
      <KyleCardContent className="p-0">
        {/* Advisory banner */}
        <div className={cn("relative flex items-start gap-3 p-4", TONE.bannerBg)}>
          <span className={cn("mt-0.5 shrink-0", TONE.iconColor)}>
            <AlertTriangle size={18} aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider leading-tight">
              {output.advisoryTitle}
            </p>
            <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-relaxed">
              {output.advisoryBody}
            </p>
          </div>
          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              aria-label="Dismiss weather advisory"
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Weather details */}
        <div className="p-4 space-y-3">
          {/* Temp + condition row */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-[var(--font-sansita)] text-[var(--font-size-data)] font-bold tabular-nums leading-none">
                {output.tempF}
              </span>
              <span className="font-[var(--font-apercu)] text-[var(--font-size-activity)] text-muted-foreground">
                °F
              </span>
            </div>
            <div className="text-right">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground">
                {output.condition}
              </p>
              {output.city && (
                <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                  {output.city}
                </p>
              )}
            </div>
          </div>

          {/* Date + humidity */}
          <div className="flex items-center gap-3">
            {output.workoutDate && (
              <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
                {output.workoutDate}
              </span>
            )}
            {output.humidity !== undefined && (
              <span className="inline-flex items-center gap-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                <Droplets size={10} aria-hidden />
                {output.humidity}%
              </span>
            )}
          </div>

          {/* Hydration goal */}
          {output.hydrationOz !== undefined && (
            <div
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-card)] px-3 py-2",
                "border border-[var(--color-electrolyte)]/30 bg-[var(--color-electrolyte)]/5",
              )}
            >
              <div className="flex items-center gap-1.5">
                <Droplets size={14} className="text-[var(--color-electrolyte)]" aria-hidden />
                <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-[var(--color-electrolyte)]">
                  Target hydration
                </span>
              </div>
              <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-bold text-[var(--color-electrolyte)] tabular-nums">
                {output.hydrationOz} oz
              </span>
            </div>
          )}

          {/* Recommendations list */}
          {output.recommendations && output.recommendations.length > 0 && (
            <ul className="space-y-1">
              {output.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground"
                >
                  <span className={cn("mt-1 h-1 w-1 rounded-full shrink-0", TONE.iconColor.replace("text-", "bg-"))} aria-hidden />
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}
