import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CategoryPicker — 8 brand-colored category pills.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #1
 *
 * Layout: responsive flex-wrap in 2-3-2 grouping.
 * Colors map to Kyle brand: Mango / Electrolyte / Dragonfruit / muted-outline.
 * Selected = Blackberry-light fill + white text.
 * Disabled after first selection to prevent double-submit.
 */

export interface Category {
  id: string;
  label: string;
  tone: "primary" | "accent" | "warning" | "muted";
}

export interface CategoryPickerOutput {
  title?: string;
  categories: Category[];
}

export interface CategoryPickerProps {
  output: CategoryPickerOutput;
  onUserResponse?: (response: { id: string; label: string }) => void;
  className?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "athletic_performance", label: "Athletic Performance", tone: "primary" },
  { id: "race_prep", label: "Race Prep", tone: "warning" },
  { id: "recovery_week", label: "Recovery Week", tone: "accent" },
  { id: "budget", label: "Budget", tone: "muted" },
  { id: "dietary", label: "Dietary", tone: "accent" },
  { id: "weight", label: "Weight", tone: "warning" },
  { id: "family", label: "Family", tone: "muted" },
  { id: "pantry_only", label: "Pantry-Only", tone: "primary" },
];

const toneOutline: Record<Category["tone"], string> = {
  primary: "border-[var(--color-orange)] text-[var(--color-orange)] hover:bg-[var(--color-orange)]/10",
  accent: "border-[var(--color-electrolyte)] text-[var(--color-electrolyte)] hover:bg-[var(--color-electrolyte)]/10",
  warning: "border-[var(--color-dragonfruit)] text-[var(--color-dragonfruit)] hover:bg-[var(--color-dragonfruit)]/10",
  muted: "border-border text-foreground hover:bg-muted",
};

export default function CategoryPicker({
  output,
  onUserResponse,
  className,
}: CategoryPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const categories = output.categories?.length ? output.categories : DEFAULT_CATEGORIES;
  const title = output.title ?? "What's your goal?";

  function handlePick(cat: Category) {
    if (disabled) return;
    setSelected(cat.id);
    setDisabled(true);
    onUserResponse?.({ id: cat.id, label: cat.label });
  }

  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
          {title}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handlePick(cat)}
              disabled={disabled && !isSelected}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3 py-1.5",
                "font-[var(--font-apercu)] text-[var(--font-size-caption)] font-medium",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isSelected
                  ? "bg-[var(--color-blackberry-light)] text-white border-[var(--color-blackberry-light)]"
                  : toneOutline[cat.tone],
              )}
              aria-pressed={isSelected}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
