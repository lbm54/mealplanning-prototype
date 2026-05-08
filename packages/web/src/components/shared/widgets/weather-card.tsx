import { Droplets, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";

/**
 * WeatherCard — temperature + condition + hydration recommendation.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #20
 *
 * Big Sansita temp number. Condition + city below.
 * Advisory pill if hot (>85°F) or cold (<40°F).
 * Suggested hydration_oz pill.
 */

export interface WeatherCardOutput {
  tempF: number;
  condition: string;
  city?: string;
  humidity?: number;
  windMph?: number;
  hydrationOz?: number;
  advisoryString?: string;
  date?: string;
}

export interface WeatherCardProps {
  output: WeatherCardOutput;
  className?: string;
}

function getTempTone(tempF: number): "hot" | "cold" | "normal" {
  if (tempF > 85) return "hot";
  if (tempF < 40) return "cold";
  return "normal";
}

const TONE_CONFIG = {
  hot: {
    badge: "bg-[var(--color-orange)]/15 border-[var(--color-orange)]/40 text-[var(--color-orange)]",
    label: "Heat advisory",
  },
  cold: {
    badge: "bg-[var(--color-electrolyte)]/15 border-[var(--color-electrolyte)]/40 text-[var(--color-electrolyte)]",
    label: "Cold advisory",
  },
  normal: { badge: "", label: "" },
};

export default function WeatherCard({ output, className }: WeatherCardProps) {
  const tone = getTempTone(output.tempF);
  const toneConfig = TONE_CONFIG[tone];
  const hasAdvisory = tone !== "normal" || !!output.advisoryString;

  return (
    <KyleCard className={cn("overflow-hidden", className)}>
      <KyleCardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: temp + condition */}
          <div>
            {output.date && (
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground mb-1">
                {output.date}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <span className="font-[var(--font-sansita)] text-[var(--font-size-data-xl)] font-bold leading-none tabular-nums">
                {output.tempF}
              </span>
              <span className="font-[var(--font-apercu)] text-[var(--font-size-activity)] text-muted-foreground">
                °F
              </span>
            </div>
            <div className="mt-1 space-y-0.5">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground">
                {output.condition}
              </p>
              {output.city && (
                <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                  {output.city}
                </p>
              )}
              {output.humidity !== undefined && (
                <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground flex items-center gap-1">
                  <Droplets size={10} aria-hidden />
                  {output.humidity}% humidity
                </p>
              )}
            </div>
          </div>

          {/* Right: pills */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Advisory pill */}
            {hasAdvisory && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2.5 py-1",
                  "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                  toneConfig.badge || "bg-muted border-border text-muted-foreground",
                )}
              >
                <AlertTriangle size={10} aria-hidden />
                {output.advisoryString ?? toneConfig.label}
              </span>
            )}
            {/* Hydration pill */}
            {output.hydrationOz !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border",
                  "border-[var(--color-electrolyte)]/50 bg-[var(--color-electrolyte)]/10 text-[var(--color-electrolyte)]",
                  "px-2.5 py-1 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums",
                )}
              >
                <Droplets size={10} aria-hidden />
                {output.hydrationOz} oz
              </span>
            )}
          </div>
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}
