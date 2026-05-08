import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";

/**
 * MealPlanCard — THE Figma move: inline rich plan summary card.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #13, §1 move #8/#9
 *
 * Structure:
 * - Top row: Mango kcal pill + day count chip + Mango expand circle (top-right)
 * - Title (Sansita Bold uppercase) + description (Apercu)
 * - "Daily average:" label
 * - 2 rows × 3 macro chips: Protein (Electrolyte), Carbs (Mango), Fat (Dragonfruit),
 *   Fiber (muted), Sugar (Cream-dark), Kcal (muted)
 * - Click expand → emit onExpand
 */

export interface MacroChip {
  label: string;
  value: string;
  tone: "electrolyte" | "mango" | "dragonfruit" | "muted" | "cream";
}

export interface MealPlanCardOutput {
  id?: string;
  title: string;
  description?: string;
  weekKcal: number;
  dayCount: number;
  dailyAvg: {
    proteinG: number;
    carbG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    kcal?: number;
  };
}

export interface MealPlanCardProps {
  output: MealPlanCardOutput;
  onExpand?: () => void;
  isSelected?: boolean;
  className?: string;
}

const toneStyles: Record<MacroChip["tone"], string> = {
  electrolyte: "border-[var(--color-electrolyte)]/50 text-[var(--color-electrolyte)]",
  mango: "border-[var(--color-orange)]/50 text-[var(--color-orange)]",
  dragonfruit: "border-[var(--color-dragonfruit)]/50 text-[var(--color-dragonfruit)]",
  muted: "border-border text-muted-foreground",
  cream: "border-[var(--color-cream-dark)] text-foreground",
};

function MacroChipBadge({ label, value, tone }: MacroChip) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5",
        "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums",
        toneStyles[tone],
      )}
    >
      <span className="font-[var(--font-compadre)] text-[9px] uppercase tracking-widest opacity-70">
        {label}
      </span>
      {value}
    </span>
  );
}

export default function MealPlanCard({
  output,
  onExpand,
  isSelected,
  className,
}: MealPlanCardProps) {
  const { title, description, weekKcal, dayCount, dailyAvg } = output;

  const macroChips: MacroChip[] = [
    { label: "Protein", value: `${dailyAvg.proteinG}g`, tone: "electrolyte" },
    { label: "Carbs", value: `${dailyAvg.carbG}g`, tone: "mango" },
    { label: "Fat", value: `${dailyAvg.fatG}g`, tone: "dragonfruit" },
    { label: "Fiber", value: `${dailyAvg.fiberG ?? Math.round(dailyAvg.carbG * 0.12)}g`, tone: "muted" },
    { label: "Sugar", value: `${dailyAvg.sugarG ?? Math.round(dailyAvg.carbG * 0.2)}g`, tone: "cream" },
    { label: "Kcal", value: `${dailyAvg.kcal ?? Math.round((dailyAvg.carbG * 4 + dailyAvg.proteinG * 4 + dailyAvg.fatG * 9))}`, tone: "muted" },
  ];

  return (
    <KyleCard
      variant={isSelected ? "elevated" : "default"}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        isSelected && "ring-1 ring-[var(--color-orange)]/40",
        className,
      )}
    >
      <KyleCardContent className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Kcal pill */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5",
                "bg-[var(--color-orange)] text-[var(--color-blackberry)]",
                "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] font-semibold tabular-nums",
              )}
            >
              {weekKcal.toLocaleString()} kcal/wk
            </span>
            {/* Day count chip */}
            <span
              className={cn(
                "inline-flex items-center rounded-[var(--radius-pill)] border border-border px-2 py-0.5",
                "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground",
              )}
            >
              {dayCount}d
            </span>
          </div>

          {/* Expand circle */}
          {onExpand && (
            <button
              onClick={onExpand}
              aria-label="Expand plan details"
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                "bg-[var(--color-orange)] text-[var(--color-blackberry)]",
                "hover:bg-[var(--color-orange-light)] transition-colors duration-150",
                "hover:scale-110 transition-transform",
              )}
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>

        {/* Title + description */}
        <div>
          <h3 className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider leading-tight">
            {title}
          </h3>
          {description && (
            <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-snug">
              {description}
            </p>
          )}
        </div>

        {/* Daily average section */}
        <div>
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground mb-2">
            Daily average:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {macroChips.map((chip) => (
              <MacroChipBadge key={chip.label} {...chip} />
            ))}
          </div>
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}
