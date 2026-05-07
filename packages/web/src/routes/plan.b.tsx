/**
 * Variant B — Stack stub route.
 *
 * Source: 07_parallel_build_plans.md §3 (Phase 1B)
 *
 * This file lives in the main worktree. Variant B agents will replace
 * this stub with the full Stack implementation in the variant/b branch.
 * See STATUS.md for the branch/worktree layout.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/plan/b")({
  component: VariantBStub,
});

function VariantBStub() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <p className="font-[var(--font-sansita)] text-[9rem] font-bold leading-none text-[var(--color-orange)]">
            B
          </p>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
            Variant B — Stack
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            Build me! This stub is ready for a variant agent to fill in.
            See <code>07_parallel_build_plans.md</code> §3 for the build spec.
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground bg-muted rounded-[var(--radius-card)] p-3">
            Worktree: <code>../mealplanning_prototype-b</code>
            <br />
            Branch: <code>variant/b</code>
          </p>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back to hub
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
