import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PortionStepper — circular +/- buttons around a numeric serving count.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #7
 *
 * Visual pulsing on change. Orange-bordered circles.
 * Submits when user taps a confirm button or stops interacting
 * (we expose explicit confirm button for clarity).
 */

export interface PortionStepperOutput {
  label?: string;
  unit?: string;
  initialValue?: number;
  min?: number;
  max?: number;
}

export interface PortionStepperProps {
  output: PortionStepperOutput;
  onUserResponse?: (response: { servings: number }) => void;
  className?: string;
}

export default function PortionStepper({ output, onUserResponse, className }: PortionStepperProps) {
  const min = output.min ?? 0.5;
  const max = output.max ?? 10;
  const step = 0.5;
  const [value, setValue] = useState<number>(output.initialValue ?? 1);
  const [pulse, setPulse] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function adjust(delta: number) {
    if (submitted) return;
    setValue((prev) => {
      const next = Math.max(min, Math.min(max, parseFloat((prev + delta).toFixed(1))));
      return next;
    });
    setPulse(true);
    setTimeout(() => setPulse(false), 350);
  }

  function handleConfirm() {
    if (submitted) return;
    setSubmitted(true);
    onUserResponse?.({ servings: value });
  }

  const label = output.label ?? "Servings";
  const unit = output.unit ?? "serving";

  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-4">
        {/* Minus */}
        <button
          onClick={() => adjust(-step)}
          disabled={value <= min || submitted}
          aria-label="Decrease serving"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary",
            "text-primary transition-all duration-150",
            "hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed",
          )}
        >
          <Minus size={16} />
        </button>

        {/* Value display */}
        <div className="flex min-w-[4rem] flex-col items-center">
          <span
            className={cn(
              "font-[var(--font-apercu-mono)] text-[var(--font-size-data)] font-bold tabular-nums transition-transform duration-150",
              pulse && "scale-110",
            )}
          >
            {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
          </span>
          <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {value === 1 ? unit : `${unit}s`}
          </span>
        </div>

        {/* Plus */}
        <button
          onClick={() => adjust(step)}
          disabled={value >= max || submitted}
          aria-label="Increase serving"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary",
            "text-primary transition-all duration-150",
            "hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed",
          )}
        >
          <Plus size={16} />
        </button>
      </div>

      {!submitted && (
        <button
          onClick={handleConfirm}
          className={cn(
            "rounded-[var(--radius-pill)] bg-primary px-5 py-1.5",
            "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
            "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
          )}
        >
          Set Portion
        </button>
      )}
      {submitted && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
          Portion set: {value} {value === 1 ? unit : `${unit}s`}
        </p>
      )}
    </div>
  );
}
