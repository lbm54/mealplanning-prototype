import { cn } from "@/lib/utils";

/**
 * JadeAvatar — Jade's visual identity.
 *
 * Design source: 06_five_uiux_approaches.md §0.3
 *
 * A circle filled with Electrolyte cyan (#1CF9CF = accent color) containing
 * a single uppercase "J" in Sansita Bold, blackberry (#381633 = accent-foreground).
 *
 * - Mode-invariant: identical in light and dark (cyan + blackberry are both
 *   constant across themes per 03_kyle_design_for_web.md §2.4).
 * - Hover shows tooltip: "Jade — your nutrition coach."
 * - "thinking" state: 1.5s pulse animation (never a spinner).
 * - "online" prop: tiny Electrolyte-cyan pulsing dot at bottom-right.
 * - "glow" prop: subtle outer glow ring when active.
 */
export interface JadeAvatarProps {
  size?: 24 | 36 | 96;
  state?: "idle" | "thinking" | "speaking";
  /** Show a small pulsing online-indicator dot at bottom-right */
  online?: boolean;
  /** Add a subtle Electrolyte outer glow ring */
  glow?: boolean;
  className?: string;
}

const sizeConfig = {
  24: { container: "w-6 h-6", text: "text-[10px]", dot: "w-2 h-2 -bottom-0.5 -right-0.5 border border-background" },
  36: { container: "w-9 h-9", text: "text-sm", dot: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 border border-background" },
  96: { container: "w-24 h-24", text: "text-[56px]", dot: "w-4 h-4 -bottom-1 -right-1 border-2 border-background" },
};

export function JadeAvatar({
  size = 36,
  state = "idle",
  online,
  glow,
  className,
}: JadeAvatarProps) {
  const { container, text, dot } = sizeConfig[size];

  return (
    <div
      title="Jade — your nutrition coach"
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-[var(--color-blackberry)] text-accent-foreground select-none",
        container,
        state === "thinking" && "animate-pulse",
        glow && "shadow-[var(--shadow-glow-electrolyte)] ring-2 ring-[var(--color-electrolyte)]/40",
        className,
      )}
      aria-label={`Jade — ${state === "thinking" ? "thinking" : state === "speaking" ? "speaking" : "your nutrition coach"}`}
    >
      {/* Cute Jade portrait — staff-bearing athlete, MK-Jade-inspired */}
      <img
        src="/jade/jade-avatar.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Letter fallback (only visible if image fails to load) */}
      <span
        className={cn(
          "font-[var(--font-sansita)] font-bold leading-none opacity-0",
          text,
        )}
      >
        J
      </span>

      {/* Online indicator — pulsing Electrolyte dot */}
      {online && (
        <span
          className={cn(
            "absolute rounded-full bg-[var(--color-electrolyte)] animate-status-pulse z-10",
            dot,
          )}
          aria-hidden
        />
      )}
    </div>
  );
}
