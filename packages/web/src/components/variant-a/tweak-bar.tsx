/**
 * TweakBar — bottom-pinned chip bar for quick week-level tweaks.
 *
 * Design source: 06_five_uiux_approaches.md §1.A:
 *   "Bottom-pinned tweak bar with chips: more protein / no fish /
 *    simpler dinners / + custom…"
 *
 * Click a chip → chip becomes active (filled); click "Apply" → calls
 * onApplyTweak with the selected chip label (or custom text).
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const PRESET_CHIPS = [
  "more protein",
  "no fish",
  "simpler dinners",
  "lower carb Sunday",
  "more vegetables",
];

export interface TweakBarProps {
  onApplyTweak: (tweak: string) => void;
  isApplying?: boolean;
  className?: string;
}

export function TweakBar({ onApplyTweak, isApplying, className }: TweakBarProps) {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const effectiveTweak = showCustom ? customText.trim() : (activeChip ?? "");

  const handleApply = () => {
    if (!effectiveTweak) return;
    onApplyTweak(effectiveTweak);
    setActiveChip(null);
    setCustomText("");
    setShowCustom(false);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-3",
        className,
      )}
      aria-label="Quick week tweaks"
    >
      {/* Preset chips */}
      {PRESET_CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => {
            setActiveChip(activeChip === chip ? null : chip);
            setShowCustom(false);
          }}
          className={cn(
            "rounded-[var(--radius-pill)] border px-3 py-1",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
            "transition-all",
            activeChip === chip
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
          )}
          aria-pressed={activeChip === chip}
        >
          {chip}
        </button>
      ))}

      {/* Custom chip */}
      {showCustom ? (
        <input
          autoFocus
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="describe your tweak…"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
            if (e.key === "Escape") setShowCustom(false);
          }}
          className={cn(
            "w-48 rounded-[var(--radius-pill)] border border-foreground bg-background px-3 py-1",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
            "focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        />
      ) : (
        <button
          onClick={() => {
            setActiveChip(null);
            setShowCustom(true);
          }}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-pill)] border border-dashed border-border px-3 py-1",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground",
            "hover:border-foreground hover:text-foreground transition-all",
          )}
        >
          <Plus size={12} />
          custom…
        </button>
      )}

      {/* Apply button — only visible when something is selected */}
      {(effectiveTweak) && (
        <Button
          size="sm"
          onClick={handleApply}
          disabled={isApplying || !effectiveTweak}
          className={cn(
            "ml-auto rounded-[var(--radius-pill)]",
            "bg-[var(--color-orange)] text-white hover:bg-[var(--color-orange-dark)]",
            "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
          )}
        >
          {isApplying ? "Applying…" : "Apply"}
        </Button>
      )}
    </div>
  );
}
