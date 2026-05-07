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
 */
export interface JadeAvatarProps {
  size?: 24 | 36 | 96;
  state?: "idle" | "thinking" | "speaking";
  className?: string;
}

const sizeConfig = {
  24: { container: "w-6 h-6", text: "text-[10px]" },
  36: { container: "w-9 h-9", text: "text-sm" },
  96: { container: "w-24 h-24", text: "text-[56px]" },
};

export function JadeAvatar({ size = 36, state = "idle", className }: JadeAvatarProps) {
  const { container, text } = sizeConfig[size];

  return (
    <div
      title="Jade — your nutrition coach"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground select-none",
        container,
        state === "thinking" && "animate-pulse",
        className,
      )}
      aria-label={`Jade — ${state === "thinking" ? "thinking" : state === "speaking" ? "speaking" : "your nutrition coach"}`}
    >
      <span
        className={cn(
          "font-[var(--font-sansita)] font-bold leading-none",
          text,
        )}
      >
        J
      </span>
    </div>
  );
}
