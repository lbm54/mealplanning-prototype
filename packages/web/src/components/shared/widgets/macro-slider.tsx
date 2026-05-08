import { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * MacroSlider — 3-track sliders (carb / protein / fat %) summing to 100.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #6
 *
 * Constraint: moving one track rebalances the other two proportionally.
 * Colors: carb = Mango, protein = Electrolyte, fat = Dragonfruit.
 * Submits final split on confirm. Disabled after submit.
 */

export interface MacroSliderOutput {
  label?: string;
  initialCarb?: number;
  initialProtein?: number;
  initialFat?: number;
}

export interface MacroSliderProps {
  output: MacroSliderOutput;
  onUserResponse?: (response: { carbPct: number; proteinPct: number; fatPct: number }) => void;
  className?: string;
}

interface MacroState {
  carb: number;
  protein: number;
  fat: number;
}

function rebalance(state: MacroState, key: keyof MacroState, newVal: number): MacroState {
  const clamped = Math.max(5, Math.min(85, newVal));
  const remaining = 100 - clamped;
  const others = (["carb", "protein", "fat"] as const).filter((k) => k !== key);
  const currentSum = state[others[0]] + state[others[1]];
  if (currentSum === 0) {
    return { ...state, [key]: clamped, [others[0]]: remaining / 2, [others[1]]: remaining / 2 };
  }
  const ratio0 = state[others[0]] / currentSum;
  const ratio1 = state[others[1]] / currentSum;
  return {
    ...state,
    [key]: clamped,
    [others[0]]: Math.round(remaining * ratio0),
    [others[1]]: Math.round(remaining * ratio1 + (remaining - Math.round(remaining * ratio0) - Math.round(remaining * ratio1))),
  };
}

const TRACK_COLORS = {
  carb: { track: "var(--color-orange)", label: "Carbs" },
  protein: { track: "var(--color-electrolyte)", label: "Protein" },
  fat: { track: "var(--color-dragonfruit)", label: "Fat" },
} as const;

export default function MacroSlider({ output, onUserResponse, className }: MacroSliderProps) {
  const [macros, setMacros] = useState<MacroState>({
    carb: output.initialCarb ?? 50,
    protein: output.initialProtein ?? 25,
    fat: output.initialFat ?? 25,
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(key: keyof MacroState, val: number[]) {
    if (submitted) return;
    setMacros((prev) => rebalance(prev, key, val[0]));
  }

  function handleConfirm() {
    if (submitted) return;
    setSubmitted(true);
    onUserResponse?.({ carbPct: macros.carb, proteinPct: macros.protein, fatPct: macros.fat });
  }

  return (
    <div className={cn("space-y-4", className)}>
      {output.label && (
        <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
          {output.label}
        </p>
      )}
      <div className="space-y-3">
        {(["carb", "protein", "fat"] as const).map((key) => {
          const { track, label } = TRACK_COLORS[key];
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span
                  className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest"
                  style={{ color: track }}
                >
                  {label}
                </span>
                <span
                  className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold tabular-nums"
                  style={{ color: track }}
                >
                  {macros[key]}%
                </span>
              </div>
              <SliderPrimitive.Root
                value={[macros[key]]}
                onValueChange={(val) => handleChange(key, val)}
                min={5}
                max={85}
                step={1}
                disabled={submitted}
                className="relative flex h-5 w-full touch-none select-none items-center"
                aria-label={`${label} percentage`}
              >
                <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
                  <SliderPrimitive.Range
                    className="absolute h-full rounded-full transition-all duration-150"
                    style={{ backgroundColor: track }}
                  />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                  className={cn(
                    "block h-4 w-4 rounded-full border-2 bg-background",
                    "ring-offset-background transition-transform",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "hover:scale-110",
                  )}
                  style={{ borderColor: track }}
                />
              </SliderPrimitive.Root>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          Total: {macros.carb + macros.protein + macros.fat}%
        </span>
        {!submitted && (
          <button
            onClick={handleConfirm}
            className={cn(
              "rounded-[var(--radius-pill)] bg-primary px-5 py-1.5",
              "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
              "transition-all duration-150 hover:bg-[var(--color-orange-light)]",
            )}
          >
            Apply
          </button>
        )}
        {submitted && (
          <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
