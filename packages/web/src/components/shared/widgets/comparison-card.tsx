import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";

/**
 * ComparisonCard — 2-column side-by-side meal/option comparison.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #26
 *
 * Title row, bullet component lists, macro chips.
 * Vertical divider in the middle. Mango highlight on better option if
 * highlightSide is provided.
 */

export interface ComparisonSide {
  title: string;
  components?: string[];
  carbG: number;
  proteinG: number;
  fatG: number;
  kcal?: number;
  tag?: string;
}

export interface ComparisonCardOutput {
  label?: string;
  optionA: ComparisonSide;
  optionB: ComparisonSide;
  /** Which side is highlighted as recommended */
  highlightSide?: "a" | "b";
}

export interface ComparisonCardProps {
  output: ComparisonCardOutput;
  className?: string;
}

function SideColumn({
  side,
  isHighlighted,
}: {
  side: ComparisonSide;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-w-0 space-y-2 rounded-[var(--radius-card)] p-2 transition-all",
        isHighlighted && "bg-[var(--color-orange)]/8 ring-1 ring-[var(--color-orange)]/30",
      )}
    >
      {/* Tag */}
      {side.tag && (
        <span
          className={cn(
            "inline-block rounded-[var(--radius-pill)] px-2 py-0.5",
            "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
            isHighlighted
              ? "bg-[var(--color-orange)] text-[var(--color-blackberry)]"
              : "bg-muted text-muted-foreground",
          )}
        >
          {side.tag}
        </span>
      )}

      {/* Title */}
      <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium leading-snug">
        {side.title}
      </p>

      {/* Components */}
      {side.components && side.components.length > 0 && (
        <ul className="space-y-0.5">
          {side.components.map((c, i) => (
            <li
              key={i}
              className="flex gap-1 items-baseline font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground"
            >
              <span className="shrink-0 text-muted-foreground/50">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Macro chips */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {[
          { label: "C", value: `${side.carbG}g`, color: "var(--color-orange)" },
          { label: "P", value: `${side.proteinG}g`, color: "var(--color-electrolyte)" },
          { label: "F", value: `${side.fatG}g`, color: "var(--color-dragonfruit)" },
        ].map((m) => (
          <span
            key={m.label}
            className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border border-border px-1.5 py-0.5"
          >
            <span
              className="font-[var(--font-compadre)] text-[8px] uppercase tracking-widest"
              style={{ color: m.color }}
            >
              {m.label}
            </span>
            <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums">
              {m.value}
            </span>
          </span>
        ))}
        {side.kcal && (
          <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-border px-1.5 py-0.5 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums text-muted-foreground">
            {side.kcal}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ComparisonCard({ output, className }: ComparisonCardProps) {
  return (
    <KyleCard className={cn("overflow-hidden", className)}>
      <KyleCardContent className="p-3">
        {output.label && (
          <p className="mb-2 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
            {output.label}
          </p>
        )}
        <div className="flex gap-0">
          <SideColumn side={output.optionA} isHighlighted={output.highlightSide === "a"} />
          {/* Vertical divider */}
          <div className="mx-2 self-stretch w-px bg-border shrink-0" aria-hidden />
          <SideColumn side={output.optionB} isHighlighted={output.highlightSide === "b"} />
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}
