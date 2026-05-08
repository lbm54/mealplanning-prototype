/**
 * CoachStrip — glass card with Jade avatar, italic coach text, and shimmer
 * loading state.
 *
 * Variant A 2026 facelift: KyleCard variant="glass" + backdrop-blur,
 * Electrolyte left-border, shimmer skeleton while generating.
 *
 * 2026 generative-UI upgrade:
 * - Accepts an optional `insightTile` prop.
 * - When an InsightTile is provided (emitted by Jade via showInsightTile tool),
 *   it renders the InsightTile widget above the plain text strip.
 * - When no tile is present, falls back to the original italic Apercu strip.
 */
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import InsightTile from "@/components/shared/widgets/insight-tile";
import type { InsightTileOutput } from "@/components/shared/widgets/insight-tile";

export interface CoachStripProps {
  text: string | null;
  isLoading?: boolean;
  /** Optional InsightTile payload from Jade's `showInsightTile` tool call. */
  insightTile?: InsightTileOutput | null;
  className?: string;
}

export function CoachStrip({
  text,
  isLoading,
  insightTile,
  className,
}: CoachStripProps) {
  // When we have an InsightTile, render it in place of plain text
  if (insightTile && !isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <InsightTile output={insightTile} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden",
        "rounded-[var(--radius-card)] border border-white/10",
        "bg-card/70 backdrop-blur-[12px]",
        "shadow-[var(--shadow-card-elevated-light)] dark:shadow-[var(--shadow-card-elevated-dark)]",
        "px-4 py-3",
        // Electrolyte left accent border
        "before:absolute before:inset-y-0 before:left-0 before:w-0.5",
        "before:rounded-full before:bg-[var(--color-electrolyte)]",
        className,
      )}
      aria-live="polite"
      aria-label="Jade's weekly coaching note"
    >
      <JadeAvatar
        size={24}
        state={isLoading ? "thinking" : "idle"}
        online={!isLoading}
        glow={isLoading}
      />

      {isLoading ? (
        /* Shimmer skeleton */
        <div className="flex-1 flex flex-col gap-1.5 py-0.5">
          <div
            className="h-3 w-3/4 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
          <div
            className="h-3 w-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite 0.2s",
            }}
          />
        </div>
      ) : (
        <p
          className={cn(
            "font-[var(--font-apercu)] text-[var(--font-size-body)] italic",
            text ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {text ??
            "Click 'Plan my week' to generate your training-aware meal plan."}
        </p>
      )}
    </div>
  );
}
