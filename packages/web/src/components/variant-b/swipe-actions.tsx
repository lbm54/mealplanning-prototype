/**
 * Variant B — SwipeActions.
 *
 * Three 64px circular action buttons below the card deck:
 * - ✕ (swap / left) — destructive/muted
 * - ▲ (lock / up) — electrolyte cyan
 * - ✓ (keep / right) — primary orange
 *
 * Design ref: 06_five_uiux_approaches.md §1.B, 03_kyle_design_for_web.md §6
 * "circular_action_button" pattern: 64px, pill-shaped.
 */
import { Check, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwipeActionsProps {
  onKeep: () => void;
  onSwap: () => void;
  onLock: () => void;
  disabled?: boolean;
  className?: string;
}

interface CircularActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  sublabel: string;
  variant: "keep" | "swap" | "lock";
  children: React.ReactNode;
}

function CircularActionButton({
  onClick,
  disabled,
  label,
  sublabel,
  variant,
  children,
}: CircularActionButtonProps) {
  const variantStyles = {
    keep: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
    swap: "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95 border border-border",
    lock: "bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex flex-col items-center gap-1.5 group",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150",
          "shadow-md",
          variantStyles[variant],
          "disabled:opacity-40",
        )}
      >
        {children}
      </div>
      <span className="font-[var(--font-apercu)] text-[10px] uppercase tracking-widest text-muted-foreground">
        {sublabel}
      </span>
    </button>
  );
}

export function SwipeActions({
  onKeep,
  onSwap,
  onLock,
  disabled,
  className,
}: SwipeActionsProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-8", className)}
      role="group"
      aria-label="Swipe actions"
    >
      <CircularActionButton
        onClick={onSwap}
        disabled={disabled}
        label="Swap this meal"
        sublabel="swap"
        variant="swap"
      >
        <X className="w-6 h-6" />
      </CircularActionButton>

      <CircularActionButton
        onClick={onLock}
        disabled={disabled}
        label="Lock this meal"
        sublabel="lock"
        variant="lock"
      >
        <Lock className="w-6 h-6" />
      </CircularActionButton>

      <CircularActionButton
        onClick={onKeep}
        disabled={disabled}
        label="Keep this meal"
        sublabel="keep"
        variant="keep"
      >
        <Check className="w-6 h-6" />
      </CircularActionButton>
    </div>
  );
}
