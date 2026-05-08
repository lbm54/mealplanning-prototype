import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * VariantCard — one of the five A–E cards on the landing page hub.
 *
 * Design source: 07_parallel_build_plans.md §1.13
 *
 * Rebuilt for 2026 polish:
 * - Large variant letter in a colored disk (top-left)
 * - Codename in Compadre Wide uppercase
 * - Tagline in Apercu
 * - AI-level: 5 horizontal dots (filled = Electrolyte cyan, unfilled = dim)
 * - Primary interaction tag in muted Apercu Mono
 * - Mango "Try it" pill with hover-lift + glow
 * - Card hover: lift 4px, Electrolyte border-tint, faint outer glow
 * - CSS animation via style attribute (avoids needing motion on card itself)
 */
export interface VariantCardProps {
  letter: "A" | "B" | "C" | "D" | "E";
  codename: string;
  tagline: string;
  aiRating: 1 | 2 | 3 | 4 | 5;
  href: string;
  isFocus?: boolean;
  /** Delay for stagger-in animation (ms) */
  animationDelay?: number;
}

// Each variant gets a background + text color for the letter disk
const letterDiskConfig: Record<string, { bg: string; text: string }> = {
  A: {
    bg: "bg-[var(--color-electrolyte)]/15 border border-[var(--color-electrolyte)]/30",
    text: "text-[var(--color-electrolyte)]",
  },
  B: {
    bg: "bg-[var(--color-orange)]/15 border border-[var(--color-orange)]/30",
    text: "text-[var(--color-orange)]",
  },
  C: {
    bg: "bg-[var(--color-dragonfruit)]/15 border border-[var(--color-dragonfruit)]/30",
    text: "text-[var(--color-dragonfruit)]",
  },
  D: {
    bg: "bg-[var(--color-electrolyte-dark)]/15 border border-[var(--color-electrolyte-dark)]/30",
    text: "text-[var(--color-electrolyte-dark)]",
  },
  E: {
    bg: "bg-[var(--color-orange-light)]/15 border border-[var(--color-orange-light)]/30",
    text: "text-[var(--color-orange-light)]",
  },
};

// Primary interaction tags per variant
const interactionTag: Record<string, string> = {
  A: "GRID · WEEK",
  B: "SWIPE · DECK",
  C: "PICKER · 5-COL",
  D: "GRID + CHAT",
  E: "CHAT-FIRST",
};

export function VariantCard({
  letter,
  codename,
  tagline,
  aiRating,
  href,
  isFocus,
  animationDelay = 0,
}: VariantCardProps) {
  const disk = letterDiskConfig[letter];
  const tag = interactionTag[letter];

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[var(--radius-card)] border bg-card",
        "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
        "dark:border-white/[0.07]",
        // Hover: lift + Electrolyte border tint + glow
        "transition-all duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-glow-electrolyte)]",
        "hover:border-[var(--color-electrolyte)]/30",
        // Focus variant: orange ring
        isFocus && "ring-2 ring-primary shadow-[var(--shadow-glow-orange)]",
        // Stagger-in entry animation
        "animate-fade-up opacity-0",
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "both",
      }}
    >
      {/* "Currently testing" badge */}
      {isFocus && (
        <div className="absolute -top-3 left-4 z-10">
          <span
            className={cn(
              "rounded-[var(--radius-pill)] bg-primary px-2 py-0.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-primary-foreground uppercase tracking-wider",
            )}
          >
            Currently testing
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 p-5 flex-1">
        {/* Letter disk + codename row */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              disk.bg,
            )}
          >
            <span
              className={cn(
                "font-[var(--font-sansita)] text-xl font-bold leading-none",
                disk.text,
              )}
            >
              {letter}
            </span>
          </span>

          <p className={cn(
            "font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-widest text-foreground",
          )}>
            {codename}
          </p>
        </div>

        {/* Tagline */}
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-snug flex-1">
          {tagline}
        </p>

        {/* AI level dots */}
        <div className="space-y-1.5">
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60">
            AI Level
          </p>
          <div
            className="flex gap-1.5"
            aria-label={`AI involvement: ${aiRating} out of 5`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  i < aiRating
                    ? "bg-[var(--color-electrolyte)] shadow-[0_0_6px_rgba(28,249,207,0.6)]"
                    : "bg-muted border border-border",
                )}
              />
            ))}
          </div>
        </div>

        {/* Interaction tag */}
        <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/60 uppercase tracking-wider">
          {tag}
        </p>

        {/* CTA pill */}
        <Link to={href}>
          <Button className="w-full" size="default">
            Try it
          </Button>
        </Link>
      </div>
    </div>
  );
}
