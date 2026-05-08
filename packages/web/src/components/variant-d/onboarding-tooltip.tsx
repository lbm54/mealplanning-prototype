/**
 * OnboardingTooltip — first-time drag-and-drop hint for Variant D.
 *
 * 2026 facelift:
 * - KyleCard variant="elevated" with backdrop-blur
 * - Auto-dismisses after 6s or on first drag (localStorage flag)
 * - fade-up entrance animation
 * - Small ✕ dismiss button
 * - Positioned near center-bottom of viewport
 */
import { useState, useEffect } from "react";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { KyleCard } from "@/components/shared/kyle-card";
import "./variant-d.css";

const HINT_KEY = "jade-d-dnd-hint-shown";

export function OnboardingTooltip() {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(HINT_KEY);
    if (!alreadyShown) {
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(HINT_KEY, "true");
    }, 200);
  };

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-[min(360px,90vw)]",
        "transition-all duration-200",
        isExiting
          ? "opacity-0 translate-y-2"
          : "opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-3 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      <KyleCard variant="elevated" className="px-4 py-3 backdrop-blur-md">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              "bg-[var(--color-electrolyte)]/15 text-[var(--color-electrolyte-dark)]",
            )}
            aria-hidden
          >
            <GripVertical size={14} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium leading-snug">
              Drag meals onto your plan
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground mt-0.5 leading-snug">
              Grab any of Jade&apos;s meal cards from the right panel and drop them onto a day cell to place them.
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
            )}
            aria-label="Dismiss hint"
            type="button"
          >
            <X size={11} />
          </button>
        </div>

        {/* Progress bar — auto-dismiss timer */}
        <div className="mt-3 h-0.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-electrolyte-dark)]/50"
            style={{
              width: "100%",
              animation: "shrink-width 6s linear forwards",
            }}
          />
        </div>
      </KyleCard>
    </div>
  );
}
