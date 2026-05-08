import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

/**
 * ErrorState — four shared error states all variants must use.
 *
 * Design source: 07_parallel_build_plans.md §1.23
 *
 * Kinds:
 *   jade-failed        — Jade endpoint returned 500 or timeout
 *   rls-denied         — Supabase 401/403 (stale token)
 *   no-macro-targets   — daily_macro_targets empty for requested week
 *   no-activities      — activities empty for requested week
 *
 * Refined: Dragonfruit icon accent, card variant="elevated", consistent typography.
 */
export type ErrorKind =
  | "jade-failed"
  | "rls-denied"
  | "no-macro-targets"
  | "no-activities";

const errorConfig: Record<
  ErrorKind,
  {
    heading: string;
    body: string;
    cta?: string;
    ctaHref?: string;
  }
> = {
  "jade-failed": {
    heading: "Jade's having trouble",
    body: "Something went wrong on Jade's end. Try again in a moment.",
    cta: "Try again",
  },
  "rls-denied": {
    heading: "Session expired",
    body: "Your session timed out. Sign in again to continue.",
    cta: "Sign in",
    ctaHref: "/sign-in",
  },
  "no-macro-targets": {
    heading: "Macros not computed yet",
    body: "Macro targets aren't computed for this week. Open the Mealvana mobile app to generate them, then come back.",
    cta: "Learn more",
  },
  "no-activities": {
    heading: "No training this week",
    body: "No activities are scheduled for this week. We can still build a rest-week plan.",
    cta: "Build a rest-week plan",
  },
};

export interface ErrorStateProps {
  kind: ErrorKind;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ kind, onRetry, className }: ErrorStateProps) {
  const config = errorConfig[kind];

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Card variant="elevated" className="max-w-sm w-full">
        <CardContent className="pt-6 text-center space-y-4">
          {/* Dragonfruit icon disk */}
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle size={22} />
            </span>
          </div>

          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            {config.heading}
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            {config.body}
          </p>
          {config.cta && (
            config.ctaHref ? (
              <a href={config.ctaHref}>
                <Button className="w-full">{config.cta}</Button>
              </a>
            ) : (
              <Button className="w-full" onClick={onRetry}>
                {config.cta}
              </Button>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
