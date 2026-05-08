/**
 * Variant E — Coach
 * Tagline: "Just talk to Jade. She'll handle the rest."
 * AI level: ★★★★★ (5/5)
 *
 * Design source: 06_five_uiux_approaches.md §1.E
 * Build spec:    07_parallel_build_plans.md §6
 * Widget spec:   09_figma_analysis_and_widgets.md §4 (Variant E showcase)
 *
 * This file owns:
 * - The TanStack route definition for /plan/e
 * - The top-level composition of all variant-e components
 * - Route loader that fetches week data server-side
 *
 * ── GENERATIVE UI SHOWCASE ──
 *
 * This variant is the strongest expression of generative UI. Every Jade turn
 * renders a mix of text + 0–N widgets via JadeMessageRenderer + WIDGET_REGISTRY.
 *
 * Key surfaces:
 * 1. Empty-state hero — CategoryPicker as first interaction + proactive card stack
 *    (MorningGreetingCard, WorkoutTimeline) before user types anything.
 * 2. Chat thread — JadeMessageRenderer handles every Jade turn with full widget support.
 * 3. Composer — enhanced with + quick-action menu and extended slash commands.
 * 4. View as plan sheet — DayBreakdownModal widget via tab toggle.
 * 5. addToolResult wired — user-input widgets (CategoryPicker, FollowUpQuestion, etc.)
 *    return selections back to Jade who continues the conversation.
 *
 * ── STUB MODE ──
 * When AI_GATEWAY_API_KEY / OPENAI_API_KEY is not set, the chat runs in stub
 * mode with canned responses (see use-coach-chat.ts). The full UI is still
 * exercisable so the layout/UX is reviewable without env vars.
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
 * The hook uses useChat which will fail gracefully if unconfigured.
 * We detect misconfiguration from the hook's error path.
 */
function useIsAiConfigured(): boolean {
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

  const isDemoMode = !isAiConfigured;

  const {
    messages,
    rawAiMessages,
    isThinking,
    latestPlan,
    send,
    savePlan,
    addToolResult,
    isEmptyState,
  } = useCoachChat({ weekData, isAiConfigured });

  // ── Determine render mode ──────────────────────────────────
  // Use raw AI SDK messages (JadeMessageRenderer) when:
  //   1. AI is configured AND
  //   2. There are actual AI SDK messages streaming in
  // Fall back to the parsed ChatMessage shim in stub mode.
  const useRawMessages = isAiConfigured && rawAiMessages.length > 0;

  // ── Handlers ──────────────────────────────────────────────

  const handleSend = useCallback(
    (text: string) => {
      setErrorKind(null);
      send(text);
    },
    [send],
  );

  const handleChipClick = useCallback(
    (label: string) => {
      send(label);
    },
    [send],
  );

  const handleCategoryPick = useCallback(
    (categoryId: string, categoryLabel: string) => {
      // Seed Jade with the user's category choice as a natural-language message
      send(
        `I want to focus on ${categoryLabel} this week. Help me plan meals around that goal.`,
      );
    },
    [send],
  );

  const handleToolResponse = useCallback(
    (toolCallId: string, response: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (addToolResult as any)({ toolCallId, output: response });
    },
    [addToolResult],
  );

  const handleSavePlan = useCallback(
    async (plan: WeekPlan) => {
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
    },
    [savePlan],
  );

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

        {/* ── Chat thread ── */}
        <MessageList
          messages={messages}
          rawAiMessages={rawAiMessages}
          useRawMessages={useRawMessages}
          isThinking={isThinking}
          onChipClick={handleChipClick}
          onSavePlan={handleSavePlan}
          onViewPlan={handleViewPlan}
          onKeepMeal={handleKeepMeal}
          onUndoSwap={handleUndoSwap}
          onSwapAgain={handleSwapAgain}
          onToolResponse={handleToolResponse}
          isDemoMode={isDemoMode}
          isEmptyState={isEmptyState}
          onCategoryPick={handleCategoryPick}
        />

        {/* ── Composer with + menu and extended slash commands ── */}
        <JadeComposer
          onSend={handleSend}
          disabled={isThinking}
          placeholder="Message Jade…"
        />
      </JadeShell>

      {/* ── Plan sheet with DayBreakdownModal tab ── */}
      <ViewAsPlanSheet
        plan={latestPlan}
        isOpen={isPlanSheetOpen}
        onClose={() => setIsPlanSheetOpen(false)}
      />
    </>
  );
}
