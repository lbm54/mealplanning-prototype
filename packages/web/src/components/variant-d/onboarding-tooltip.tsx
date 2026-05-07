/**
 * OnboardingTooltip — first-time drag-and-drop hint for Variant D.
 *
 * Design source: 07_parallel_build_plans.md §5.3 step 1.D.8
 *
 * Shows once per browser session (localStorage flag: "jade-d-dnd-hint-shown").
 * Dismisses on click or after 6 seconds.
 */
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const HINT_KEY = "jade-d-dnd-hint-shown";

export function OnboardingTooltip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(HINT_KEY);
    if (!alreadyShown) {
      // Show after a short delay so the page has loaded
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(HINT_KEY, "true");
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
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 rounded-[var(--radius-card)]",
        "bg-foreground text-background shadow-[var(--shadow-kyle-elevated-dark)]",
        "px-4 py-3 max-w-xs text-center",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] flex-1">
        {"Drag any of Jade's meal cards onto a day cell to place it on the grid."}
      </p>
      <button
        onClick={dismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss hint"
        type="button"
      >
        <X size={12} />
      </button>
    </div>
  );
}
