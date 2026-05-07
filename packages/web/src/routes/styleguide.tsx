/**
 * Styleguide — Kyle brand smoke test.
 *
 * Source: 07_parallel_build_plans.md §1.15, 03_kyle_design_for_web.md §9.6
 *
 * Rendered at /styleguide (dev only).
 * Hidden in production via loader redirect.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { MacroBar } from "@/components/shared/macro-bar";
import { TrainingDayDot } from "@/components/shared/training-day-dot";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import { MealCell } from "@/components/shared/meal-cell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/styleguide")({
  loader: () => {
    if (import.meta.env.PROD) {
      throw redirect({ to: "/" });
    }
  },
  component: StyleguidePage,
});

const mockMeal = {
  title: "chicken + jasmine rice + broccoli",
  methodTag: "grilled · 10-min assembly",
  components: [
    { name: "chicken breast", portion: "6 oz" },
    { name: "jasmine rice", portion: "1 cup cooked" },
    { name: "broccoli florets", portion: "2 cups" },
    { name: "lemon-tahini drizzle", portion: "2 tbsp" },
  ],
  carbG: 78,
  protG: 52,
  fatG: 14,
};

function StyleguidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold">
          Kyle Brand Styleguide
        </h1>
        <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground mt-2">
          Visual smoke test for the Mealvana design system. Dev only.
        </p>
      </div>

      {/* Color tokens */}
      <Section title="Color Tokens">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Swatch color="#381633" label="Blackberry" />
          <Swatch color="#4A2854" label="Blackberry Light" />
          <Swatch color="#2D1535" label="Blackberry Dark" />
          <Swatch color="#F8F6EB" label="Cream" dark />
          <Swatch color="#E8E6E0" label="Cream Dark" dark />
          <Swatch color="#C6C3B2" label="Off Cream" dark />
          <Swatch color="#F78B14" label="Orange (Primary CTA)" />
          <Swatch color="#F9A042" label="Orange Light" />
          <Swatch color="#1CF9CF" label="Electrolyte (Accent)" />
          <Swatch color="#4FFBD9" label="Electrolyte Light" />
          <Swatch color="#DC2597" label="Dragonfruit (Destructive)" />
          <Swatch color="#E952AE" label="Dragonfruit Light" />
        </div>
      </Section>

      {/* Semantic slots */}
      <Section title="Semantic Slots">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SemanticSwatch cssVar="--color-background" label="background" />
          <SemanticSwatch cssVar="--color-foreground" label="foreground" />
          <SemanticSwatch cssVar="--color-card" label="card" />
          <SemanticSwatch cssVar="--color-primary" label="primary" />
          <SemanticSwatch cssVar="--color-accent" label="accent" />
          <SemanticSwatch cssVar="--color-destructive" label="destructive" />
          <SemanticSwatch cssVar="--color-muted" label="muted" />
          <SemanticSwatch cssVar="--color-border" label="border" />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-3">
          <p className="font-[var(--font-sansita)] text-[var(--font-size-data-xl)]">
            Sansita 48px — dataNumberLarge
          </p>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] uppercase tracking-wider">
            Sansita 28px — Page Title
          </p>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            Sansita 20px — Section Title
          </p>
          <p className="font-[var(--font-compadre)] text-[var(--font-size-subtitle)] uppercase tracking-wider">
            Compadre 16px — Activity Name (Uppercase Tracked)
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body-lg)]">
            Apercu 16px — Body Large
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)]">
            Apercu 14px — Body Standard
          </p>
          <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-data)] font-semibold">
            823 kcal (Apercu Mono — data number)
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
            Apercu 10px Caption — CARBS / PROTEIN / FAT
          </p>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3 items-center">
          <Button>Primary (default)</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Icon button">★</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* Jade Avatar */}
      <Section title="Jade Avatar">
        <div className="flex gap-6 items-end">
          <div className="text-center space-y-2">
            <JadeAvatar size={24} />
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">24px</p>
          </div>
          <div className="text-center space-y-2">
            <JadeAvatar size={36} />
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">36px</p>
          </div>
          <div className="text-center space-y-2">
            <JadeAvatar size={36} state="thinking" />
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">thinking</p>
          </div>
          <div className="text-center space-y-2">
            <JadeAvatar size={96} />
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">96px</p>
          </div>
        </div>
      </Section>

      {/* Carb Tier Badges */}
      <Section title="Carb Tier Badges">
        <div className="flex flex-wrap gap-4">
          <CarbTierBadge carbG={120} showLabel />
          <CarbTierBadge carbG={175} showLabel />
          <CarbTierBadge carbG={235} showLabel />
          <CarbTierBadge carbG={310} showLabel />
        </div>
      </Section>

      {/* Training Day Dot */}
      <Section title="Training Day Dot">
        <div className="flex gap-4 items-center">
          <span className="font-[var(--font-compadre)] text-[var(--font-size-subtitle)] uppercase tracking-wider">
            SAT<TrainingDayDot />
          </span>
          <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            — marks a key workout day
          </span>
        </div>
      </Section>

      {/* MacroBar */}
      <Section title="MacroBar">
        <div className="space-y-2">
          <MacroBar carbG={210} protG={145} fatG={68} />
          <MacroBar carbG={320} protG={180} fatG={55} isTarget />
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="muted">Muted</Badge>
        </div>
      </Section>

      {/* MealCell */}
      <Section title="MealCell">
        <div className="max-w-xs space-y-3">
          <MealCell meal={mockMeal} slot="lunch" />
          <MealCell meal={mockMeal} slot="lunch" density="compact" />
          <MealCell meal={null} slot="dinner" isPlaceholder />
        </div>
      </Section>

      {/* Cards */}
      <Section title="Kyle Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&rsquo;s Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                Long endurance run · 18 miles · 8:00 am
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-[var(--font-compadre)] uppercase tracking-wider text-[var(--font-size-subtitle)]">
                10 Mile Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-data)] font-semibold">823</p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
                kcal burned
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ color, label, dark: _dark }: { color: string; label: string; dark?: boolean }) {
  return (
    <div className="space-y-1">
      <div
        className="h-16 w-full rounded-[var(--radius-card)] border border-border"
        style={{ backgroundColor: color }}
      />
      <p className={cn("font-[var(--font-apercu)] text-[var(--font-size-caption)] truncate")}>{label}</p>
      <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground">{color}</p>
    </div>
  );
}

function SemanticSwatch({ cssVar, label }: { cssVar: string; label: string }) {
  return (
    <div className="space-y-1">
      <div
        className="h-12 w-full rounded-[var(--radius-card)] border border-border"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)]">{label}</p>
      <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground">{cssVar}</p>
    </div>
  );
}

import type React from "react";
