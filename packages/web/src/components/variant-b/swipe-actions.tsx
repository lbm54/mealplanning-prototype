/**
 * Variant B — SwipeActions (2026 facelift).
 *
 * Three 64px circular icon buttons below the deck.
 * Each uses the KyleButton icon size with per-gesture tinting:
 *   ✕  → Dragonfruit (swap / left)
 *   ▲  → Electrolyte (lock / up)
 *   ✓  → Mango / primary (keep / right)
 *
 * Hover: lift + per-color glow (matching the swipe overlays on the card).
 * Tap on mobile = larger touch target (min-w 64px).
 */
import { Check, X, Lock } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SwipeActionsProps {
  onKeep: () => void;
  onSwap: () => void;
  onLock: () => void;
  disabled?: boolean;
  className?: string;
}

interface GestureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  sublabel: string;
  variant: "keep" | "swap" | "lock";
  children: React.ReactNode;
}

const variantConfig = {
  keep: {
    bg: "bg-gradient-to-b from-[#F8A53A] to-[#F78B14]",
    text: "text-[#381633]",
    glow: "0 0 20px -4px rgba(247,139,20,0.55)",
    label: "text-[var(--color-orange)]",
  },
  swap: {
    bg: "bg-[var(--color-dragonfruit)]/15 border border-[var(--color-dragonfruit)]/35",
    text: "text-[var(--color-dragonfruit)]",
    glow: "0 0 20px -4px rgba(220,37,151,0.45)",
    label: "text-[var(--color-dragonfruit)]",
  },
  lock: {
    bg: "bg-[var(--color-electrolyte)]/15 border border-[var(--color-electrolyte)]/35",
    text: "text-[var(--color-electrolyte)]",
    glow: "0 0 20px -4px rgba(28,249,207,0.45)",
    label: "text-[var(--color-electrolyte)]",
  },
};

function GestureButton({ onClick, disabled, label, sublabel, variant, children }: GestureButtonProps) {
  const config = variantConfig[variant];

  return (
    <div className={cn("flex flex-col items-center gap-2", disabled && "opacity-40")}>
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none cursor-pointer",
          "transition-shadow duration-150",
          config.bg,
        )}
        whileHover={
          !disabled
            ? { scale: 1.08, y: -2, boxShadow: config.glow }
            : undefined
        }
        whileTap={!disabled ? { scale: 0.94 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <span className={config.text}>
          {children}
        </span>
      </motion.button>
      <span
        className={cn(
          "font-[var(--font-compadre)] text-[9px] uppercase tracking-[0.2em]",
          disabled ? "text-muted-foreground" : config.label,
        )}
      >
        {sublabel}
      </span>
    </div>
  );
}

export function SwipeActions({ onKeep, onSwap, onLock, disabled, className }: SwipeActionsProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-8 sm:gap-10", className)}
      role="group"
      aria-label="Swipe actions"
    >
      <GestureButton
        onClick={onSwap}
        disabled={disabled}
        label="Swap this meal"
        sublabel="SWAP"
        variant="swap"
      >
        <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
      </GestureButton>

      <GestureButton
        onClick={onLock}
        disabled={disabled}
        label="Lock this meal"
        sublabel="LOCK"
        variant="lock"
      >
        <Lock className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
      </GestureButton>

      <GestureButton
        onClick={onKeep}
        disabled={disabled}
        label="Keep this meal"
        sublabel="KEEP"
        variant="keep"
      >
        <Check className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
      </GestureButton>
    </div>
  );
}
