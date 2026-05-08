/**
 * JadePill — floating "Ask Jade" button (bottom-right, fixed).
 *
 * 2026 facelift: 56px Electrolyte circle with "ASK JADE" label that expands
 * on hover. Electrolyte glow on hover. Pulses gently when AI is ready.
 */
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";

export interface JadePillProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export function JadePill({ onClick, isOpen, className }: JadePillProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close Ask Jade" : "Ask Jade — your nutrition coach"}
      aria-expanded={isOpen}
      className={cn(
        // Fixed position
        "fixed bottom-6 right-6 z-40",
        // Pill shape that expands on hover
        "group flex items-center gap-2 overflow-hidden",
        "rounded-[var(--radius-pill)]",
        "bg-accent text-accent-foreground",
        // Base: 56px circle (label hidden)
        "h-14 w-14 hover:w-auto hover:px-4",
        "transition-[width,box-shadow,transform] duration-300",
        "shadow-[var(--shadow-kyle-elevated)]",
        "hover:shadow-[var(--shadow-glow-electrolyte)] hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isOpen && "opacity-80 shadow-[var(--shadow-glow-electrolyte)]",
        className,
      )}
    >
      {/* Avatar centered in the circle */}
      <span className="flex shrink-0 items-center justify-center w-full group-hover:w-auto">
        <JadeAvatar size={24} state="idle" online={!isOpen} />
      </span>

      {/* Label — hidden until hover expands the pill */}
      <span
        className={cn(
          "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest font-bold",
          "whitespace-nowrap",
          // Hidden at rest, visible on hover via opacity + width transition
          "max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100",
          "transition-[max-width,opacity] duration-300",
          // Shrink the left spacing so text appears right after avatar
          "pr-1",
        )}
      >
        Ask Jade
      </span>
    </button>
  );
}
