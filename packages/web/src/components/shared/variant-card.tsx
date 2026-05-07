import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * VariantCard — one of the five A–E cards on the landing page hub.
 *
 * Design source: 07_parallel_build_plans.md §1.13
 */
export interface VariantCardProps {
  letter: "A" | "B" | "C" | "D" | "E";
  codename: string;
  tagline: string;
  aiRating: 1 | 2 | 3 | 4 | 5;
  href: string;
  isFocus?: boolean;
}

const letterColors: Record<string, string> = {
  A: "text-[var(--color-electrolyte)]",
  B: "text-[var(--color-orange)]",
  C: "text-[var(--color-dragonfruit)]",
  D: "text-[var(--color-electrolyte-dark)]",
  E: "text-[var(--color-orange-light)]",
};

export function VariantCard({
  letter,
  codename,
  tagline,
  aiRating,
  href,
  isFocus,
}: VariantCardProps) {
  const stars = "★".repeat(aiRating) + "☆".repeat(5 - aiRating);

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isFocus && "ring-2 ring-primary",
      )}
    >
      {isFocus && (
        <div className="absolute -top-3 left-4">
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

      <CardContent className="flex flex-col gap-3 p-5 flex-1">
        {/* Big letter */}
        <p
          className={cn(
            "font-[var(--font-sansita)] text-[var(--font-size-data-xl)] font-bold leading-none",
            letterColors[letter],
          )}
        >
          {letter}
        </p>

        {/* Codename */}
        <p className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
          {codename}
        </p>

        {/* Tagline */}
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground flex-1">
          {tagline}
        </p>

        {/* AI rating */}
        <p
          className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tracking-wider"
          aria-label={`AI involvement: ${aiRating} out of 5 stars`}
          title="AI involvement level"
        >
          {stars}
        </p>

        {/* CTA */}
        <Link to={href}>
          <Button className="w-full">Try it</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
