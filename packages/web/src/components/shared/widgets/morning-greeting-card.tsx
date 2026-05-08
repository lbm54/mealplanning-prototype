import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";
import { JadeAvatar } from "@/components/shared/jade-avatar";

/**
 * MorningGreetingCard — proactive hero card on app open.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #28
 *
 * Large hero card: 96px Jade avatar (glow) + headline (Sansita) +
 * body text (Apercu) + dismiss button.
 * Avatar has pulse-glow on the outer ring.
 *
 * Sub-trigger: 5am–10am local + user has activity today.
 */

export interface MorningGreetingCardOutput {
  headline: string;
  body: string;
  ctaLabel?: string;
  activitySummary?: string;
}

export interface MorningGreetingCardProps {
  output: MorningGreetingCardOutput;
  onDismiss?: () => void;
  onCta?: () => void;
  className?: string;
}

export default function MorningGreetingCard({
  output,
  onDismiss,
  onCta,
  className,
}: MorningGreetingCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <KyleCard
      variant="elevated"
      className={cn(
        "relative overflow-hidden",
        // Subtle gradient background accent
        "before:absolute before:inset-0 before:bg-gradient-to-br",
        "before:from-[var(--color-electrolyte)]/5 before:to-transparent before:pointer-events-none",
        className,
      )}
    >
      <KyleCardContent className="p-5">
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss greeting"
            className={cn(
              "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-muted/60 transition-colors duration-150",
            )}
          >
            <X size={14} />
          </button>
        )}

        <div className="flex gap-4 items-start">
          {/* Pulsing Jade avatar */}
          <div className="shrink-0 relative">
            <JadeAvatar
              size={96}
              state="speaking"
              glow
              online
            />
            {/* Extra outer glow ring */}
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[var(--color-electrolyte)]"
              style={{ animationDuration: "2.5s" }}
              aria-hidden
            />
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <h2 className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider leading-tight">
              {output.headline}
            </h2>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-relaxed">
              {output.body}
            </p>
            {output.activitySummary && (
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1",
                  "bg-[var(--color-electrolyte)]/10 border border-[var(--color-electrolyte)]/30",
                  "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]",
                )}
              >
                {output.activitySummary}
              </p>
            )}
            {output.ctaLabel && onCta && (
              <button
                onClick={onCta}
                className={cn(
                  "mt-1 rounded-[var(--radius-pill)] bg-primary px-5 py-2",
                  "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-primary-foreground",
                  "transition-all duration-150 hover:bg-[var(--color-orange-light)] hover:-translate-y-0.5",
                  "shadow-[var(--shadow-glow-orange)]",
                )}
              >
                {output.ctaLabel}
              </button>
            )}
          </div>
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}
