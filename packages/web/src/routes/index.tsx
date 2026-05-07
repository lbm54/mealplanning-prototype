/**
 * Landing page hub — the five A–E variant cards.
 *
 * Source: 07_parallel_build_plans.md §1.13
 */
import { createFileRoute } from "@tanstack/react-router";
import { VariantCard } from "@/components/shared/variant-card";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const focusVariant = import.meta.env.VITE_FOCUS_VARIANT as string | undefined;

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
      {/* Heading */}
      <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold">
        Five ways to plan your week
      </h1>
      <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground mt-2 max-w-prose">
        Pick the one that feels right. They all build the same plan in the background — your data is shared across all five approaches.
      </p>

      {/* Variant cards grid */}
      <div className="mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <VariantCard
          letter="A"
          codename="Calendar"
          tagline="The whole week, one screen, one tap to build it."
          aiRating={2}
          href="/plan/a"
          isFocus={focusVariant === "a"}
        />
        <VariantCard
          letter="B"
          codename="Stack"
          tagline="Swipe through your week, one meal at a time."
          aiRating={3}
          href="/plan/b"
          isFocus={focusVariant === "b"}
        />
        <VariantCard
          letter="C"
          codename="Columns"
          tagline="Pick a protein, pick a carb, pick a veg. Done."
          aiRating={3}
          href="/plan/c"
          isFocus={focusVariant === "c"}
        />
        <VariantCard
          letter="D"
          codename="Hybrid"
          tagline="Plan on the left. Talk to Jade on the right."
          aiRating={4}
          href="/plan/d"
          isFocus={focusVariant === "d"}
        />
        <VariantCard
          letter="E"
          codename="Coach"
          tagline="Just talk to Jade. She'll handle the rest."
          aiRating={5}
          href="/plan/e"
          isFocus={focusVariant === "e"}
        />
      </div>

      {/* Footer note */}
      <p className="mt-10 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground border-t border-border pt-4">
        Your data is shared across all five — switching approaches preserves your plan.
      </p>
    </div>
  );
}
