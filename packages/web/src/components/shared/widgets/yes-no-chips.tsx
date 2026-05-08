import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * YesNoChips — 2-4 quick-answer chip row.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #9
 *
 * Default options: Yes / No. Extended: Yes / No / Maybe / Unsure.
 * Yes = Mango pill fill. No = outlined. Maybe/Unsure = muted outline.
 * Disabled after first tap.
 */

export interface YesNoOption {
  id: string;
  label: string;
  tone: "yes" | "no" | "maybe";
}

export interface YesNoChipsOutput {
  question?: string;
  options?: YesNoOption[];
}

export interface YesNoChipsProps {
  output: YesNoChipsOutput;
  onUserResponse?: (response: { value: string; label: string }) => void;
  className?: string;
}

const DEFAULT_OPTIONS: YesNoOption[] = [
  { id: "yes", label: "Yes", tone: "yes" },
  { id: "no", label: "No", tone: "no" },
];

const toneClass: Record<YesNoOption["tone"], string> = {
  yes: "bg-[var(--color-orange)] border-[var(--color-orange)] text-[var(--color-blackberry)] hover:bg-[var(--color-orange-light)]",
  no: "border-border text-foreground hover:bg-muted",
  maybe: "border-border text-muted-foreground hover:bg-muted",
};

export default function YesNoChips({ output, onUserResponse, className }: YesNoChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const options = output.options?.length ? output.options : DEFAULT_OPTIONS;

  function handlePick(opt: YesNoOption) {
    if (disabled) return;
    setSelected(opt.id);
    setDisabled(true);
    onUserResponse?.({ value: opt.id, label: opt.label });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {output.question && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] italic text-foreground">
          {output.question}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handlePick(opt)}
              disabled={disabled && !isSelected}
              aria-pressed={isSelected}
              className={cn(
                "rounded-[var(--radius-pill)] border px-4 py-1.5",
                "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isSelected ? toneClass[opt.tone] : toneClass[opt.tone],
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
