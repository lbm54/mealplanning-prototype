import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * JadeAvatar — Jade's visual identity as an endurance athlete.
 *
 * Inline SVG of a female runner mid-stride, electrolyte cyan on a
 * blackberry gradient. No external asset, no character ambiguity.
 *
 * - "thinking" state: 1.5s pulse animation (never a spinner).
 * - "online" prop: tiny Electrolyte-cyan pulsing dot at bottom-right.
 * - "glow" prop: subtle outer glow ring when active.
 */
export interface JadeAvatarProps {
  size?: 24 | 36 | 96;
  state?: "idle" | "thinking" | "speaking";
  online?: boolean;
  glow?: boolean;
  className?: string;
}

const sizeConfig = {
  24: {
    container: "w-6 h-6",
    dot: "w-2 h-2 -bottom-0.5 -right-0.5 border border-background",
  },
  36: {
    container: "w-9 h-9",
    dot: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 border border-background",
  },
  96: {
    container: "w-24 h-24",
    dot: "w-4 h-4 -bottom-1 -right-1 border-2 border-background",
  },
};

export function JadeAvatar({
  size = 36,
  state = "idle",
  online,
  glow,
  className,
}: JadeAvatarProps) {
  const { container, dot } = sizeConfig[size];

  return (
    <div
      title="Jade — your endurance coach"
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden select-none",
        container,
        state === "thinking" && "animate-pulse",
        glow &&
          "shadow-[var(--shadow-glow-electrolyte)] ring-2 ring-[var(--color-electrolyte)]/40",
        className,
      )}
      aria-label={`Jade — ${
        state === "thinking"
          ? "thinking"
          : state === "speaking"
            ? "speaking"
            : "your endurance coach"
      }`}
    >
      <JadeRunner />

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

/**
 * Inline SVG portrait — cartoon female runner, shoulders-up.
 * Athletic headband, dark hair pulled back, electrolyte tank top.
 */
function JadeRunner() {
  const rawId = useId();
  const safe = rawId.replace(/[^a-z0-9_-]/gi, "");
  const bg = `jade-bg${safe}`;
  const skin = `jade-skin${safe}`;
  const tank = `jade-tank${safe}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#5a3366" />
          <stop offset="100%" stopColor="#2d1535" />
        </radialGradient>
        <linearGradient id={skin} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8c197" />
          <stop offset="100%" stopColor="#c89870" />
        </linearGradient>
        <linearGradient id={tank} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1cf9cf" />
          <stop offset="100%" stopColor="#00c9a3" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={`url(#${bg})`} />

      {/* Ponytail tail trailing back */}
      <path
        d="M30 48 Q22 58 25 78 Q29 80 31 72 Q34 60 38 52 Z"
        fill="#2a1810"
      />

      {/* Athletic tank top */}
      <path
        d="M20 95 Q20 78 32 70 Q40 67 50 67 Q60 67 68 70 Q80 78 80 95 L80 100 L20 100 Z"
        fill={`url(#${tank})`}
      />
      {/* Tank strap shadow */}
      <path
        d="M40 70 Q42 76 44 78"
        stroke="#00a888"
        strokeWidth="1.2"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M60 70 Q58 76 56 78"
        stroke="#00a888"
        strokeWidth="1.2"
        fill="none"
        opacity="0.55"
      />

      {/* Neck */}
      <path d="M44 60 Q44 68 47 70 L53 70 Q56 68 56 60 Z" fill={`url(#${skin})`} />

      {/* Hair — back layer (sides + crown) */}
      <path
        d="M33 38 Q32 22 50 20 Q68 22 67 38 L67 44 Q66 50 63 53 L60 50 Q62 42 62 36 Q60 30 50 30 Q40 30 38 36 Q38 42 40 50 L37 53 Q34 50 33 44 Z"
        fill="#2a1810"
      />

      {/* Face */}
      <ellipse cx="50" cy="46" rx="14" ry="16.5" fill={`url(#${skin})`} />

      {/* Hair — front fringe (slight side sweep) */}
      <path
        d="M37 36 Q42 30 50 30 Q58 30 63 36 Q62 42 56 41 Q53 39 50 40 Q47 39 44 41 Q38 42 37 36 Z"
        fill="#2a1810"
      />

      {/* Headband — electrolyte */}
      <rect x="35" y="36" width="30" height="3.5" rx="1.5" fill="#1cf9cf" />
      <rect
        x="35"
        y="36"
        width="30"
        height="1"
        rx="0.5"
        fill="#7dffe6"
        opacity="0.9"
      />

      {/* Eyebrows */}
      <path
        d="M40 44 Q43 42.5 47 44"
        stroke="#1c0e06"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M53 44 Q57 42.5 60 44"
        stroke="#1c0e06"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes */}
      <g fill="#1c0e06">
        <ellipse cx="43" cy="48" rx="1.7" ry="2.3" />
        <ellipse cx="57" cy="48" rx="1.7" ry="2.3" />
      </g>
      {/* Eye highlights */}
      <circle cx="43.5" cy="47.4" r="0.55" fill="#ffffff" />
      <circle cx="57.5" cy="47.4" r="0.55" fill="#ffffff" />

      {/* Nose (subtle) */}
      <path
        d="M50 50 Q49.5 53 50.5 54"
        stroke="#a07050"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Cheek blush */}
      <ellipse cx="40" cy="54" rx="2.8" ry="1.8" fill="#e89090" opacity="0.45" />
      <ellipse cx="60" cy="54" rx="2.8" ry="1.8" fill="#e89090" opacity="0.45" />

      {/* Smile */}
      <path
        d="M45 57 Q50 60 55 57"
        stroke="#8b3a4a"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lip subtle highlight */}
      <path
        d="M47 57.4 Q50 59 53 57.4"
        stroke="#c75d70"
        strokeWidth="0.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
