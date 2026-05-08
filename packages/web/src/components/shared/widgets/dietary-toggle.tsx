import { useState } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

/**
 * DietaryToggle — segmented control with 8 dietary options.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #5
 *
 * Uses Radix ToggleGroup (single). Selected = Blackberry-light fill.
 * Wraps on smaller widths. Disabled after selection.
 */

export interface DietaryToggleOutput {
  label?: string;
  preSelected?: string;
}

export interface DietaryToggleProps {
  output: DietaryToggleOutput;
  onUserResponse?: (response: { diet: string }) => void;
  className?: string;
}

const OPTIONS = [
  { id: "omnivore", label: "Omnivore" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "vegan", label: "Vegan" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "low_carb", label: "Low-carb" },
];

export default function DietaryToggle({ output, onUserResponse, className }: DietaryToggleProps) {
  const [value, setValue] = useState<string>(output.preSelected ?? "");
  const [submitted, setSubmitted] = useState(false);

  function handleChange(val: string) {
    if (!val || submitted) return;
    setValue(val);
    setSubmitted(true);
    onUserResponse?.({ diet: val });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {output.label && (
        <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
          {output.label}
        </p>
      )}
      <ToggleGroupPrimitive.Root
        type="single"
        value={value}
        onValueChange={handleChange}
        className="flex flex-wrap gap-1.5"
        aria-label="Dietary preference"
      >
        {OPTIONS.map((opt) => (
          <ToggleGroupPrimitive.Item
            key={opt.id}
            value={opt.id}
            disabled={submitted && value !== opt.id}
            className={cn(
              "rounded-[var(--radius-card)] border px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
              "transition-all duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "data-[state=on]:bg-[var(--color-blackberry-light)] data-[state=on]:border-[var(--color-blackberry-light)] data-[state=on]:text-white",
              "data-[state=off]:border-border data-[state=off]:text-foreground",
              "hover:bg-muted",
            )}
          >
            {opt.label}
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>
    </div>
  );
}
