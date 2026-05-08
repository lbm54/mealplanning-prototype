import { cn } from "@/lib/utils";

/**
 * CompactMealList — text-only summary of meals for inline chat replies.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #27
 *
 * Slot bullet list: "{slot}: {title} — {components_summary}"
 * Used when Jade summarizes a day's plan in a chat message.
 */

export interface CompactMealItem {
  slot: string;
  title: string;
  componentsSummary?: string;
  kcal?: number;
}

export interface CompactMealListOutput {
  title?: string;
  meals: CompactMealItem[];
  totalKcal?: number;
}

export interface CompactMealListProps {
  output: CompactMealListOutput;
  className?: string;
}

// Map slot id to display label
const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_workout: "Pre",
  during_workout: "During",
  post_workout: "Post",
};

function getSlotLabel(slot: string): string {
  return SLOT_LABELS[slot.toLowerCase()] ?? slot;
}

export default function CompactMealList({ output, className }: CompactMealListProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {output.title && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.title}
        </p>
      )}

      <ul className="space-y-1">
        {output.meals.map((meal, i) => (
          <li
            key={i}
            className="flex items-baseline gap-1.5 font-[var(--font-apercu)] text-[var(--font-size-body)]"
          >
            {/* Slot label */}
            <span className="shrink-0 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-[var(--color-orange)] min-w-[3rem]">
              {getSlotLabel(meal.slot)}
            </span>
            <span className="text-muted-foreground shrink-0">·</span>
            {/* Title */}
            <span className="font-medium text-foreground">{meal.title}</span>
            {/* Components summary */}
            {meal.componentsSummary && (
              <>
                <span className="text-muted-foreground shrink-0">—</span>
                <span className="text-muted-foreground text-[var(--font-size-caption)] truncate">
                  {meal.componentsSummary}
                </span>
              </>
            )}
            {/* Kcal */}
            {meal.kcal && (
              <span className="ml-auto shrink-0 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground tabular-nums">
                {meal.kcal}
              </span>
            )}
          </li>
        ))}
      </ul>

      {output.totalKcal && (
        <div className="flex items-center justify-between border-t border-border pt-1.5">
          <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
            Total
          </span>
          <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-body)] font-semibold tabular-nums">
            {output.totalKcal.toLocaleString()} kcal
          </span>
        </div>
      )}
    </div>
  );
}
