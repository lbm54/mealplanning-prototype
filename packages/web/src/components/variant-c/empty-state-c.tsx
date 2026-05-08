/**
 * EmptyStateC — centered hero shown when there are no food options.
 *
 * 2026 design: Jade avatar, italic Apercu copy, big Mango fill CTA.
 */

import { JadeAvatar } from "@/components/shared/jade-avatar";
import { KyleButton } from "@/components/shared/kyle-button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateCProps {
  message?: string;
  /** When provided, renders a "Fill my week with Jade" CTA */
  onFillWeek?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function EmptyStateC({ message, onFillWeek, isLoading, className }: EmptyStateCProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-20 text-center",
        className,
      )}
    >
      <JadeAvatar size={96} state={isLoading ? "thinking" : "idle"} glow />

      <div className="space-y-2 max-w-sm">
        <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] font-bold uppercase tracking-wider text-foreground">
          {message ? "No options found" : "Start with Jade"}
        </p>
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground italic leading-relaxed">
          {message ??
            "Click ‘Fill my week with Jade’ to populate every column based on your training, allergies, and preferences. You can edit any cell after."}
        </p>
      </div>

      {onFillWeek && (
        <KyleButton
          size="lg"
          onClick={onFillWeek}
          loading={isLoading}
          className="gap-2"
        >
          <Sparkles size={16} />
          Fill my week with Jade
        </KyleButton>
      )}
    </div>
  );
}
