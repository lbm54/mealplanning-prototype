/**
 * Variant B — Stack
 * Tagline: Swipe through your week, one meal at a time.
 *
 * AI level: ★★★☆☆
 *
 * Design ref: 06_five_uiux_approaches.md §1.B
 * Build order: 07_parallel_build_plans.md §3
 *
 * Sub-phases implemented in this file:
 *   1.B.1  Layout shell — card, gestures wired
 *   1.B.2  Read-only week — server loader pulls activities + macro targets
 *   1.B.3  Swipe interactions — right=keep, left=swap, up=lock with motion
 *   1.B.4  Jade narrator — bottom-of-card line updates per swipe
 *   1.B.5  Swap call — left swipe calls /api/jade/swap; pre-fetch 2 alternatives
 *   1.B.6  Progress bar + animation
 *   1.B.7  Success screen + "View as plan" Sheet + persist to Supabase
 *   1.B.8  Polish + empty/error states
 *
 * TODO (shared change needed): If JadeNarrator chat proves useful for E,
 * propose moving it to components/shared/jade-narrator.tsx via a PR to main.
 * For now it lives in components/variant-b/jade-narrator.tsx.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link as RouterLink } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealStack } from "@/components/variant-b/meal-stack";
import { SwipeActions } from "@/components/variant-b/swipe-actions";
import { JadeNarrator } from "@/components/variant-b/jade-narrator";
import { StackProgress } from "@/components/variant-b/stack-progress";
import { DoneSummary } from "@/components/variant-b/done-summary";
import { useStack } from "@/components/variant-b/use-stack";

export const Route = createFileRoute("/plan/b")({
  component: VariantBStack,
});

function VariantBStack() {
  const [stackPaused, setStackPaused] = useState(false);
  const swipeRef = useRef<"keep" | "swap" | "lock" | null>(null);

  const { state, swipeKeep, swipeSwap, swipeLock, startBuild, rebuild, decisions } = useStack();

  const totalCards = state.deck.length;
  const decidedCount = state.currentIndex;
  const undecidedCount = totalCards - decidedCount;

  const handleSwipe = (direction: "keep" | "swap" | "lock") => {
    if (stackPaused) return;
    swipeRef.current = direction;
    if (direction === "keep") swipeKeep();
    else if (direction === "swap") swipeSwap();
    else swipeLock();
  };

  // ── Idle state (not started) ──────────────────────────────────────────────
  if (state.status === "idle") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Card className="w-full">
            <CardContent className="pt-8 pb-6 text-center space-y-6">
              {/* Error state */}
              {state.error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-[var(--radius-card)] p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-left">
                    {state.error}
                  </p>
                </div>
              )}

              {/* Jade avatar illustration */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-lg">
                  <span className="font-[var(--font-sansita)] text-5xl font-bold text-accent-foreground leading-none">
                    J
                  </span>
                </div>
              </div>

              <div>
                <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
                  Build Your Week
                </h1>
                <p className="mt-2 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                  Swipe through your week, one meal at a time. Keep what works, swap
                  what doesn&apos;t, lock what you love.
                </p>
              </div>

              {/* Gesture hints */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "✕", label: "Swap", color: "text-muted-foreground" },
                  { icon: "▲", label: "Lock", color: "text-accent" },
                  { icon: "✓", label: "Keep", color: "text-primary" },
                ].map((hint) => (
                  <div key={hint.label} className="space-y-1">
                    <p className={`font-[var(--font-sansita)] text-2xl font-bold ${hint.color}`}>
                      {hint.icon}
                    </p>
                    <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                      {hint.label}
                    </p>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={startBuild}>
                Plan my week
              </Button>

              <Link to="/">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to hub
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center animate-pulse">
            <span className="font-[var(--font-sansita)] text-3xl font-bold text-accent-foreground leading-none">
              J
            </span>
          </div>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            Building your week…
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  if (state.status === "done" && state.weekPlan) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-6">
        <DoneSummary
          weekPlan={state.weekPlan}
          decisions={decisions}
          onRebuild={() => {
            rebuild();
          }}
        />
      </div>
    );
  }

  // ── Ready state — active stack ─────────────────────────────────────────────
  const currentCard = state.deck[state.currentIndex];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Top: progress bar + week label */}
      <div className="shrink-0 px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <RouterLink to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider">
                Stack
              </span>
            </Button>
          </RouterLink>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -mr-2"
            onClick={() => {
              rebuild();
            }}
            title="Rebuild stack"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <StackProgress
          current={decidedCount}
          total={totalCards}
        />
      </div>

      {/* Center: card stack — flex-1 so it fills available height */}
      <div className="flex-1 px-4 min-h-0 flex flex-col justify-center py-3">
        <AnimatePresence mode="wait">
          {currentCard ? (
            <motion.div
              key="stack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full"
              style={{ height: "min(calc(100vw * 1.3), 520px)" }}
            >
              <MealStack
                deck={state.deck}
                currentIndex={state.currentIndex}
                onSwipe={handleSwipe}
                isPaused={stackPaused}
                className="h-full"
              />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                {undecidedCount === 0 ? "All done!" : "Loading cards…"}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: action buttons + Jade narrator */}
      <div className="shrink-0 px-4 pb-6 space-y-4">
        <SwipeActions
          onKeep={() => handleSwipe("keep")}
          onSwap={() => handleSwipe("swap")}
          onLock={() => handleSwipe("lock")}
          disabled={stackPaused || !currentCard}
        />

        <JadeNarrator
          line={state.narratorLine}
          avatarState={state.narratorState}
          onChatOpen={() => setStackPaused(true)}
          onChatClose={() => setStackPaused(false)}
        />
      </div>
    </div>
  );
}
