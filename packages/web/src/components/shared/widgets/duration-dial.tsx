import { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * DurationDial — circular-style duration picker 0–240 min.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #8
 *
 * Renders as an SVG arc ring (circular appearance) with a Radix Slider
 * below as fallback/actual interaction surface. The SVG is purely decorative
 * — it mirrors the slider value. This avoids complex drag-on-circle math
 * while still reading as a "dial" visually.
 *
 * Color: Mango (primary).
 */

export interface DurationDialOutput {
  label?: string;
  initialMinutes?: number;
}

export interface DurationDialProps {
  output: DurationDialOutput;
  onUserResponse?: (response: { durationMinutes: number }) => void;
  className?: string;
}

const SIZE = 120;
const RADIUS = 48;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX = 240;

export default function DurationDial({ output, onUserResponse, className }: DurationDialProps) {
  const [minutes, setMinutes] = useState<number>(output.initialMinutes ?? 60);
  const [submitted, setSubmitted] = useState(false);

  const pct = minutes / MAX;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const displayTime = hours > 0
    ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim()
    : `${mins}m`;

  function handleChange(val: number[]) {
    if (submitted) return;
    setMinutes(val[0]);
  }

  function handleConfirm() {
    if (submitted) return;
    setSubmitted(true);
    onUserResponse?.({ durationMinutes: minutes });
  }

  return (
    <div className={cn("space-y-4", className)}>
      {output.label && (
        <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
          {output.label}
        </p>
      )}

      {/* Visual arc ring */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(247,139,20,0.15)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-orange)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.15s ease" }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-date-time)] font-bold leading-none tabular-nums">
              {displayTime}
            </span>
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground leading-none mt-0.5">
              duration
            </span>
          </div>
        </div>
      </div>

      {/* Slider control */}
      <SliderPrimitive.Root
        value={[minutes]}
        onValueChange={handleChange}
        min={5}
        max={MAX}
        step={5}
        disabled={submitted}
        className="relative flex h-5 w-full touch-none select-none items-center"
        aria-label="Workout duration"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--color-orange)] transition-all duration-150" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-4 w-4 rounded-full border-2 border-[var(--color-orange)] bg-background",
            "ring-offset-background transition-transform",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50 hover:scale-110",
          )}
        />
      </SliderPrimitive.Root>

      <div className="flex items-center justify-between text-[var(--font-size-caption)] text-muted-foreground font-[var(--font-apercu)]">
        <span>5m</span>
        <span>4h</span>
      </div>

      {!submitted ? (
        <button
          onClick={handleConfirm}
          className={cn(
            "w-full rounded-[var(--radius-pill)] bg-primary py-2",
            "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
            "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
          )}
        >
          Set Duration
        </button>
      ) : (
        <p className="text-center font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
          Duration set: {displayTime}
        </p>
      )}
    </div>
  );
}
