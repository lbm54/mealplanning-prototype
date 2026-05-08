/**
 * Landing page hub — the five A–E variant cards.
 *
 * Source: 07_parallel_build_plans.md §1.13
 *
 * 2026 facelift: hero block with radial-gradient, status pill, stagger-in
 * card grid, Linear-inspired polish.
 */
import { createFileRoute } from "@tanstack/react-router";
import { VariantCard } from "@/components/shared/variant-card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const variants = [
  {
    letter: "A" as const,
    codename: "Calendar",
    tagline: "The whole week, one screen, one tap to build it.",
    aiRating: 2 as const,
    href: "/plan/a",
  },
  {
    letter: "B" as const,
    codename: "Stack",
    tagline: "Swipe through your week, one meal at a time.",
    aiRating: 3 as const,
    href: "/plan/b",
  },
  {
    letter: "C" as const,
    codename: "Columns",
    tagline: "Pick a protein, pick a carb, pick a veg. Done.",
    aiRating: 3 as const,
    href: "/plan/c",
  },
  {
    letter: "D" as const,
    codename: "Hybrid",
    tagline: "Plan on the left. Talk to Jade on the right.",
    aiRating: 4 as const,
    href: "/plan/d",
  },
  {
    letter: "E" as const,
    codename: "Coach",
    tagline: "Just talk to Jade. She'll handle the rest.",
    aiRating: 5 as const,
    href: "/plan/e",
  },
] as const;

function LandingPage() {
  const focusVariant = import.meta.env.VITE_FOCUS_VARIANT as string | undefined;

  return (
    <div className="min-h-screen">
      {/* ── Hero section ── */}
      <section
        className="relative overflow-hidden px-6 pt-16 pb-14 md:pt-20 md:pb-16"
        style={{
          background: [
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(28,249,207,0.07) 0%, transparent 60%)",
            "radial-gradient(ellipse 60% 40% at 80% 50%, rgba(247,139,20,0.05) 0%, transparent 50%)",
          ].join(", "),
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Status pill */}
          <div className="flex items-center gap-2 mb-6 animate-fade-up" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/30 bg-[var(--color-electrolyte)]/10 px-3 py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)] animate-status-pulse" />
              <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-[var(--color-electrolyte)]">
                5 prototypes · choose your flow
              </span>
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-[var(--font-sansita)] font-bold uppercase tracking-tight text-foreground animate-fade-up"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
              animationDelay: "60ms",
              animationFillMode: "both",
            }}
          >
            Five ways to plan<br />
            your training week.
          </h1>

          {/* Subhead */}
          <p
            className="mt-4 font-[var(--font-apercu)] text-[var(--font-size-subtitle)] text-muted-foreground max-w-[48ch] leading-relaxed animate-fade-up"
            style={{ animationDelay: "120ms", animationFillMode: "both" }}
          >
            Pick the approach that fits how you think. They all build the same
            plan — your data, training load, and food preferences are shared
            across all five.
          </p>
        </div>
      </section>

      {/* ── Variant cards grid ── */}
      <section className="px-6 pb-16 max-w-7xl mx-auto">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {variants.map((v, i) => (
            <VariantCard
              key={v.letter}
              letter={v.letter}
              codename={v.codename}
              tagline={v.tagline}
              aiRating={v.aiRating}
              href={v.href}
              isFocus={focusVariant === v.letter.toLowerCase()}
              animationDelay={180 + i * 80}
            />
          ))}
        </div>

        {/* Separator + footnote */}
        <div
          className="mt-10 animate-fade-up"
          style={{ animationDelay: "600ms", animationFillMode: "both" }}
        >
          <Separator className="mb-4 opacity-40" />
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground/70">
            Your data is shared across all five — switching approaches preserves
            your plan.
          </p>
        </div>
      </section>
    </div>
  );
}
