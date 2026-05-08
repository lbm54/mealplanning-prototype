/**
 * Variant B — Stack
 * Tagline: Swipe through your week, one meal at a time.
 *
 * AI level: ★★★☆☆
 *
 * Design ref: 06_five_uiux_approaches.md §1.B
 * Build order: 07_parallel_build_plans.md §3
 *
 * 2026 facelift — polished swipe deck:
 * - Apple Watch depth-stacked card physics (3 cards visible)
 * - Tinder-style drag overlays (proportional opacity, ±5° rotation)
 * - Granola card surfaces (elevated variant, carb-tier border accents)
 * - Whoop-style macro chips + stacked bar
 * - Dot-pattern idle screen with gesture legend
 * - Skeleton loading card
 * - Mini-stat badges on progress bar (locked/swapped/kept)
 * - Confetti dots on done screen
 * - Day accordion on done summary
 *
 * TODO (shared change needed): If JadeNarrator chat proves useful for E,
 * propose moving it to components/shared/jade-narrator.tsx via a PR to main.
 * For now it lives in components/variant-b/jade-narrator.tsx.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link as RouterLink } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MealStack } from "@/components/variant-b/meal-stack";
import { SwipeActions } from "@/components/variant-b/swipe-actions";
import { JadeNarrator } from "@/components/variant-b/jade-narrator";
import { StackProgress } from "@/components/variant-b/stack-progress";
import { DoneSummary } from "@/components/variant-b/done-summary";
import { IdleScreen } from "@/components/variant-b/idle-screen";
import { useStack } from "@/components/variant-b/use-stack";
import FollowUpQuestion from "@/components/shared/widgets/follow-up-question";
import type { SelectedCategory } from "@/components/variant-b/types";

export const Route = createFileRoute("/plan/b")({
  component: VariantBStack,
});

/** Skeleton shimmer card shown while loading */
function SkeletonCard() {
  return (
    <div
      className="w-full rounded-[var(--radius-card)] border border-border/40 bg-card overflow-hidden"
      style={{ height: "min(calc(100vw * 1.3), 520px)" }}
    >
      <div className="p-5 space-y-4 h-full flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div
              className="h-3 w-20 rounded-full"
              style={{
                background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.6s ease-in-out infinite",
              }}
            />
            <div
              className="h-2 w-14 rounded-full"
              style={{
                background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.6s ease-in-out 0.1s infinite",
              }}
            />
          </div>
          <div
            className="h-5 w-20 rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s ease-in-out 0.05s infinite",
            }}
          />
        </div>

        {/* Title skeleton */}
        <div
          className="h-6 w-3/4 rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s ease-in-out 0.15s infinite",
          }}
        />
        <div
          className="h-3 w-1/2 rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s ease-in-out 0.2s infinite",
          }}
        />

        {/* Ingredient list skeleton */}
        <div className="flex-1 space-y-2">
          {[0.9, 0.75, 0.85, 0.7].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full"
              style={{
                width: `${w * 100}%`,
                background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.6s ease-in-out ${0.1 * i}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Macro bar skeleton */}
        <div className="pt-2 border-t border-border/30 space-y-2">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--color-muted,#e8e6e0) 25%, rgba(255,255,255,0.3) 50%, var(--color-muted,#e8e6e0) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s ease-in-out 0.3s infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function VariantBStack() {
  const [stackPaused, setStackPaused] = useState(false);
  const swipeRef = useRef<"keep" | "swap" | "lock" | null>(null);

  const { state, swipeKeep, swipeSwap, swipeLock, startBuild, rebuild, dismissFollowUp, decisions } = useStack();

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

  // Pause swipe actions while the follow-up overlay is open
  useEffect(() => {
    if (state.followUpOverlay !== null) {
      setStackPaused(true);
    }
  }, [state.followUpOverlay]);

  function handleCategoryPicked(cat: SelectedCategory) {
    startBuild(cat);
  }

  function handleFollowUpAnswer(_response: { id: string; label: string }) {
    // v1: canned path — just dismiss. Responses are recorded but not acted on.
    // Future: send to useChat addToolResult to let Jade adjust the remaining deck.
    dismissFollowUp();
    setStackPaused(false);
  }

  // ── Idle state (not started) ──────────────────────────────────────────────
  if (state.status === "idle") {
    return <IdleScreen onStart={handleCategoryPicked} error={state.error} />;
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Loading progress mock */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--color-electrolyte)",
                    boxShadow: "var(--shadow-glow-electrolyte)",
                  }}
                >
                  <span className="font-[var(--font-sansita)] text-3xl font-bold text-[#381633] leading-none">
                    J
                  </span>
                </div>
              </motion.div>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                Building your week…
              </p>
            </motion.div>
          </div>
          <SkeletonCard />
        </div>
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
          onRebuild={() => rebuild()}
        />
      </div>
    );
  }

  // ── Ready state — active stack ─────────────────────────────────────────────
  const currentCard = state.deck[state.currentIndex];

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-4rem)] bg-background"
      style={{
        background: `
          radial-gradient(ellipse at 0% 100%, rgba(28,249,207,0.025) 0%, transparent 55%),
          radial-gradient(ellipse at 100% 0%, rgba(247,139,20,0.025) 0%, transparent 55%)
        `,
      }}
    >
      {/* Top: progress strip + nav */}
      <div className="shrink-0 px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <RouterLink to="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground -ml-2 normal-case font-[var(--font-apercu)]"
            >
              <span className="text-lg mr-1 leading-none">←</span>
              Stack
            </Button>
          </RouterLink>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground -mr-2 w-9 h-9 rounded-full"
              onClick={() => rebuild()}
              title="Rebuild stack"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <StackProgress
          current={decidedCount}
          total={totalCards}
          decisions={decisions}
        />
      </div>

      {/* Center: card deck — flex-1 fills available height */}
      <div className="flex-1 px-4 min-h-0 flex flex-col justify-center py-2">
        <AnimatePresence mode="wait">
          {currentCard ? (
            <motion.div
              key="stack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full"
              style={{ height: "min(calc(90vw * 1.25), 500px)" }}
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
      <div className="shrink-0 px-4 pb-6 space-y-4 pt-2">
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

      {/* Mid-deck follow-up overlay — bottom Sheet with FollowUpQuestion */}
      <Sheet
        open={state.followUpOverlay !== null}
        onOpenChange={(open) => {
          if (!open) {
            dismissFollowUp();
            setStackPaused(false);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-[var(--radius-card)] px-5 pt-5 pb-8 space-y-4"
          style={{
            background: "var(--color-card, var(--card))",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          }}
        >
          {state.followUpOverlay && (
            <AnimatePresence mode="wait">
              <motion.div
                key={state.followUpOverlay.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Jade avatar header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--color-electrolyte)",
                      boxShadow: "var(--shadow-glow-electrolyte)",
                    }}
                  >
                    <span className="font-[var(--font-sansita)] text-sm font-bold text-[#381633] leading-none">
                      J
                    </span>
                  </div>
                  <span className="font-[var(--font-compadre)] text-[10px] uppercase tracking-widest text-muted-foreground">
                    Jade
                  </span>
                </div>

                <FollowUpQuestion
                  output={{
                    question: state.followUpOverlay.question,
                    chips: state.followUpOverlay.chips,
                  }}
                  onUserResponse={handleFollowUpAnswer}
                />

                <button
                  type="button"
                  onClick={() => {
                    dismissFollowUp();
                    setStackPaused(false);
                  }}
                  className="mt-3 w-full font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
