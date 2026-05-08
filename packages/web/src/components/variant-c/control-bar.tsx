/**
 * ControlBar — sticky top control bar for Variant C.
 *
 * Glass KyleCard containing:
 * - Left: "PLAN BY COLUMNS" title + week subtitle
 * - Center: Jade-filled pill badge
 * - Right: Fill-my-week button with avatar + sparkle
 */

import { Sparkles } from "lucide-react";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ControlBarProps {
  weekLabel: string;       // "MAY 4 — MAY 10"
  totalMeals: number;
  filledMeals: number;
  isLoading: boolean;
  onFillWeek: () => void;
  className?: string;
}

export function ControlBar({
  weekLabel,
  totalMeals,
  filledMeals,
  isLoading,
  onFillWeek,
  className,
}: ControlBarProps) {
  const allFilled = filledMeals >= totalMeals;

  return (
    <KyleCard
      variant="glass"
      className={cn(
        "sticky top-0 z-30 px-5 py-3.5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 min-w-0">
        {/* Left — title + week range */}
        <div className="flex flex-col min-w-0">
          <span
            className="font-[var(--font-sansita)] text-[var(--font-size-activity)] font-bold uppercase tracking-widest leading-none text-foreground"
          >
            Plan by Columns
          </span>
          <span
            className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-widest mt-0.5"
          >
            {weekLabel}&nbsp;&nbsp;·&nbsp;&nbsp;{totalMeals} meals
          </span>
        </div>

        {/* Center — Jade-filled status pill (hide on very small screens) */}
        <div className="hidden sm:flex items-center">
          {filledMeals > 0 ? (
            <Badge
              variant="training-day"
              className="gap-1.5 whitespace-nowrap"
            >
              <JadeAvatar size={24} online glow className="shrink-0" />
              <span>
                Jade filled{" "}
                <span className="tabular-nums">{filledMeals}</span>
                &nbsp;/&nbsp;
                <span className="tabular-nums">{totalMeals}</span>
              </span>
            </Badge>
          ) : (
            <Badge variant="muted" className="whitespace-nowrap">
              0 / {totalMeals} filled
            </Badge>
          )}
        </div>

        {/* Right — Jade fill CTA */}
        <KyleButton
          size="sm"
          onClick={onFillWeek}
          loading={isLoading}
          disabled={isLoading || allFilled}
          className={cn(
            "gap-2 shrink-0",
            isLoading && "animate-pulse-glow",
          )}
        >
          <JadeAvatar size={24} online={!isLoading} state={isLoading ? "thinking" : "idle"} className="shrink-0" />
          <span className="hidden xs:inline">
            {isLoading ? "Filling…" : "Fill my week with Jade"}
          </span>
          <span className="inline xs:hidden">
            {isLoading ? "…" : "Fill"}
          </span>
          {!isLoading && <Sparkles size={13} className="shrink-0" />}
        </KyleButton>
      </div>
    </KyleCard>
  );
}
