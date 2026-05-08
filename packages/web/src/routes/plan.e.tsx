/**
 * Variant E — Coach
 * Tagline: "Just talk to Jade. She'll handle the rest."
 * AI level: ★★★★★ (5/5)
 *
 * Design source: 06_five_uiux_approaches.md §1.E
 * Build spec:    07_parallel_build_plans.md §6
 *
 * This file owns:
 * - The TanStack route definition for /plan/e
 * - The top-level composition of all variant-e components
 * - Route loader that fetches week data server-side
 *
 * ── STUB MODE ──
 * When AI_GATEWAY_API_KEY / OPENAI_API_KEY is not set, the chat runs in stub
 * mode with canned responses (see use-coach-chat.ts). The full UI is still
 * exercisable so the layout/UX is reviewable without env vars.
 *
 * ── TODOs for shared files ──
 * None at this time. All required shared primitives (JadeAvatar, CarbTierBadge,
 * TrainingDayDot, etc.) exist in components/shared/.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { JadeShell } from "@/components/variant-e/jade-shell";
import { MessageList } from "@/components/variant-e/message-list";
import { JadeComposer } from "@/components/variant-e/jade-composer";
import { ViewAsPlanSheet } from "@/components/variant-e/view-as-plan-sheet";
import { ErrorState } from "@/components/shared/error-state";
import { useCoachChat } from "@/lib/hooks/use-coach-chat";
import type { WeekDataE } from "@/lib/queries/week-data.e";
import type { WeekPlan, MealAssembly } from "@/server/jade/schema";

// ─────────────────────────────────────────────────────────────
// Route loader
// ─────────────────────────────────────────────────────────────

async function loadWeekData(): Promise<WeekDataE | null> {
  try {
    const { loadWeekDataE } = await import("@/lib/queries/week-data.e");
    return await loadWeekDataE();
  } catch (err) {
    // When Supabase is not configured or user is not authenticated,
    // the UI still works in stub mode.
    console.warn("[plan.e] week data load failed — running in stub mode:", err);
    return null;
  }
}

export const Route = createFileRoute("/plan/e")({
  loader: loadWeekData,
  component: VariantECoach,
});

// ─────────────────────────────────────────────────────────────
// AI configuration check (client-side)
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if the server is likely configured for AI.
 * Checked at runtime by pinging /api/jade/hello or relying on
 * a meta tag injected at build time.
 *
 * For simplicity: always attempt real AI, fall back in hook if unconfigured.
 */
function useIsAiConfigured(): boolean {
  // The hook uses useChat which will fail gracefully if unconfigured.
  // We detect misconfiguration from the hook's error path.
  return true;
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

function VariantECoach() {
  const weekData = Route.useLoaderData() as WeekDataE | null;
  const isAiConfigured = useIsAiConfigured();
  const [isPlanSheetOpen, setIsPlanSheetOpen] = useState(false);
  const [errorKind, setErrorKind] = useState<"jade-failed" | null>(null);

  const {
    messages,
    isThinking,
    latestPlan,
    send,
    savePlan,
  } = useCoachChat({ weekData, isAiConfigured });

  // ── Handlers ──────────────────────────────────────────────

  const handleSend = useCallback((text: string) => {
    setErrorKind(null);
    send(text);
  }, [send]);

  const handleChipClick = useCallback((label: string) => {
    send(label);
  }, [send]);

  const handleSavePlan = useCallback(async (plan: WeekPlan) => {
    try {
      await savePlan(plan);
      toast.success("Week saved.", {
        description: "Your meal plan is saved for this week.",
      });
    } catch {
      toast.error("Save failed", {
        description: "Try again in a moment.",
      });
      setErrorKind("jade-failed");
    }
  }, [savePlan]);

  const handleViewPlan = useCallback((_plan: WeekPlan) => {
    setIsPlanSheetOpen(true);
  }, []);

  const handleKeepMeal = useCallback((_meal: MealAssembly) => {
    toast.success("Meal kept.", {
      description: "The swap has been applied to your week.",
    });
  }, []);

  const handleUndoSwap = useCallback(() => {
    send("Undo that swap and restore the previous meal.");
  }, [send]);

  const handleSwapAgain = useCallback(() => {
    send("Swap it again — show me a different option.");
  }, [send]);

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <JadeShell
        isThinking={isThinking}
        onViewAsPlan={() => setIsPlanSheetOpen(true)}
        hasPlan={latestPlan !== null}
      >
        {/* Error state — shown inline above the input when Jade fails */}
        {errorKind && (
          <div className="shrink-0 px-4 pb-2">
            <ErrorState
              kind={errorKind}
              onRetry={() => setErrorKind(null)}
              className="py-0"
            />
          </div>
        )}

        <MessageList
          messages={messages}
          isThinking={isThinking}
          onChipClick={handleChipClick}
          onSavePlan={handleSavePlan}
          onViewPlan={handleViewPlan}
          onKeepMeal={handleKeepMeal}
          onUndoSwap={handleUndoSwap}
          onSwapAgain={handleSwapAgain}
        />

        <JadeComposer
          onSend={handleSend}
          disabled={isThinking}
          placeholder="Message Jade…"
        />
      </JadeShell>

      <ViewAsPlanSheet
        plan={latestPlan}
        isOpen={isPlanSheetOpen}
        onClose={() => setIsPlanSheetOpen(false)}
      />
    </>
  );
}
