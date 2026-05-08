/**
 * use-coach-chat.ts — wraps useChat with Variant E persistence and message parsing.
 *
 * Design source: 07_parallel_build_plans.md §6 (1.E.3, 1.E.4, 1.E.5, 1.E.7)
 *
 * Responsibilities:
 * 1. Wire @ai-sdk/react's useChat against /api/jade/chat?surface=e
 * 2. Parse streaming assistant messages to extract WeekPlan JSON blocks
 * 3. Persist WeekPlan to Supabase on explicit save action
 * 4. Expose the latest saved WeekPlan for the "View as plan" sheet
 * 5. Track isThinking state
 * 6. Expose addToolResult for user-input widgets (CategoryPicker, etc.)
 * 7. Expose rawAiMessages (UIMessage[]) for JadeMessageRenderer integration
 *
 * NOTE: When AI is not configured, returns stub messages so the UI is reviewable.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/components/variant-e/types";
import { REFINEMENT_CHIPS } from "@/components/variant-e/types";
import type { WeekPlan, MealAssembly } from "@/server/jade/schema";
import { WeekPlanSchema, MealAssemblySchema } from "@/server/jade/schema";
import type { WeekDataE } from "@/lib/queries/week-data.e";
import { parseSlashCommand } from "@/components/variant-e/slash-command-parser";

// ─────────────────────────────────────────────────────────────
// Stub mode: when AI is unconfigured, render canned responses
// ─────────────────────────────────────────────────────────────
const STUB_MESSAGES: ChatMessage[] = [
  {
    id: "stub-1",
    role: "assistant",
    textContent:
      "Hey, I'm Jade. I help endurance athletes plan their week of meals around their training. Want me to build this week for you?",
    chips: [
      { label: "Plan my week" },
      { label: "I'm racing Saturday" },
      { label: "I'm sick of chicken — give me variety" },
    ],
    timestamp: new Date(),
  },
];

const STUB_RESPONSE = `
Got it. Here's what I'd build for a typical training week — this is a demo since AI isn't configured yet.

Saturday is the key long-run day, so I've anchored the week around that with carbs ramping Wednesday through Friday.

**To enable Jade:** add \`AI_GATEWAY_API_KEY\` or \`OPENAI_API_KEY\` to \`packages/web/.env.local\` and restart the dev server.
`.trim();

// ─────────────────────────────────────────────────────────────
// WeekPlan extraction from assistant message text
// ─────────────────────────────────────────────────────────────

/**
 * Try to extract a WeekPlan from Jade's streaming output.
 * Jade is instructed to emit JSON blocks as fenced code:
 *   ```json
 *   { "week_start": ... }
 *   ```
 * This parser also handles when the model returns raw JSON after structured output.
 */
function extractWeekPlan(text: string): WeekPlan | null {
  // Try fenced JSON block
  const fenced = text.match(/```json\n?([\s\S]+?)\n?```/);
  const raw = fenced ? fenced[1] : text;

  try {
    const parsed = JSON.parse(raw.trim());
    const result = WeekPlanSchema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // Not valid JSON, skip
  }
  return null;
}

/**
 * Try to extract a MealAssembly from text (swap result).
 */
function extractMealAssembly(text: string): MealAssembly | null {
  const fenced = text.match(/```json\n?([\s\S]+?)\n?```/);
  const raw = fenced ? fenced[1] : text;
  try {
    const parsed = JSON.parse(raw.trim());
    // Could be single assembly or wrapped object
    const direct = MealAssemblySchema.safeParse(parsed);
    if (direct.success) return direct.data;
    if (parsed.alternatives && Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0) {
      const first = MealAssemblySchema.safeParse(parsed.alternatives[0]);
      if (first.success) return first.data;
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

/**
 * Determine if a message is likely a swap response (not a full week).
 * Heuristic: contains "swap" in context or has a short single-meal structure.
 */
function isSwapResponse(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("swap") ||
    lower.includes("instead") ||
    lower.includes("alternative") ||
    lower.includes("instead of")
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export interface UseCoachChatOptions {
  weekData: WeekDataE | null;
  isAiConfigured?: boolean;
}

export interface UseCoachChatReturn {
  /** Parsed ChatMessage[] — used by legacy MessageList (stub path + fallback) */
  messages: ChatMessage[];
  /** Raw UIMessage[] from AI SDK — used by JadeMessageRenderer in real AI mode */
  rawAiMessages: UIMessage[];
  isThinking: boolean;
  latestPlan: WeekPlan | null;
  send: (text: string) => void;
  savePlan: (plan: WeekPlan) => Promise<void>;
  /**
   * Send a tool result back to Jade after a user-input widget receives a selection.
   * In stub mode this is a no-op.
   * Uses the AI SDK ChatAddToolOutputFunction shape internally; callers cast as needed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addToolResult: (opts: any) => void;
  /** True when the thread is empty (no messages yet, first interaction) */
  isEmptyState: boolean;
}

export function useCoachChat({
  weekData,
  isAiConfigured = true,
}: UseCoachChatOptions): UseCoachChatReturn {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(() =>
    STUB_MESSAGES,
  );
  const [latestPlan, setLatestPlan] = useState<WeekPlan | null>(null);
  const [isStubThinking, setIsStubThinking] = useState(false);
  const previousPlanRef = useRef<WeekPlan | null>(null);

  // Real AI chat via useChat (AI SDK v6 — uses transport + sendMessage)
  const { messages: rawMessages, sendMessage, status, addToolResult: rawAddToolResult } = useChat({
    id: "variant-e",
    transport: new DefaultChatTransport({
      api: "/api/jade/chat?surface=e",
      body: {
        weekContext: weekData
          ? {
              weekStart: weekData.weekStart,
              activitiesCount: weekData.activities.length,
              hasMacroTargets: weekData.macroTargets.length > 0,
              existingPlan: weekData.existingPlan ? "yes" : "no",
            }
          : undefined,
      },
    }),
    onError: (err) => {
      console.error("[CoachChat] stream error:", err);
    },
  });
  const isLoading = status === "streaming" || status === "submitted";

  // Convert rawMessages from useChat into our ChatMessage shape
  // AI SDK v6: messages have `parts: [{type:'text', text:'...'}]` instead of `content: string`
  const parsedAiMessages: ChatMessage[] = rawMessages.map((msg): ChatMessage => {
    const parts = (msg as unknown as { parts?: Array<{ type: string; text?: string }> }).parts ?? [];
    const text = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("")
      || ((msg as unknown as { content?: string }).content ?? "");
    const isAssistant = msg.role === "assistant";

    if (!isAssistant) {
      return {
        id: msg.id,
        role: "user",
        textContent: text,
        timestamp: new Date(),
      };
    }

    // Try to extract a WeekPlan
    const weekPlan = extractWeekPlan(text);
    if (weekPlan) {
      // Update latest plan state
      if (weekPlan !== previousPlanRef.current) {
        previousPlanRef.current = weekPlan;
        // Use effect-free state update via callback
        setTimeout(() => setLatestPlan(weekPlan), 0);
      }
      return {
        id: msg.id,
        role: "assistant",
        textContent: text.replace(/```json[\s\S]+?```/g, "").trim() || undefined,
        weekPlan,
        isStreaming: false,
        chips: REFINEMENT_CHIPS,
        timestamp: new Date(),
      };
    }

    // Try to extract a single meal (swap)
    const mealCard = isSwapResponse(text) ? extractMealAssembly(text) : null;
    if (mealCard) {
      return {
        id: msg.id,
        role: "assistant",
        textContent: text.replace(/```json[\s\S]+?```/g, "").trim() || undefined,
        mealCard,
        chips: [{ label: "Swap again" }, { label: "Show more options" }],
        timestamp: new Date(),
      };
    }

    return {
      id: msg.id,
      role: "assistant",
      textContent: text,
      timestamp: new Date(),
    };
  });

  // ── Stub mode ─────────────────────────────────────────────
  const sendStub = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      textContent: text,
      timestamp: new Date(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsStubThinking(true);

    setTimeout(() => {
      setIsStubThinking(false);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        textContent: STUB_RESPONSE,
        chips: REFINEMENT_CHIPS,
        timestamp: new Date(),
      };
      setLocalMessages((prev) => [...prev, assistantMsg]);
    }, 1500);
  }, []);

  // ── Real send ─────────────────────────────────────────────
  const sendReal = useCallback(
    (text: string) => {
      // Handle slash commands
      const expanded = parseSlashCommand(text) ?? text;
      sendMessage({ text: expanded });
    },
    [sendMessage],
  );

  // ── Save plan to Supabase ─────────────────────────────────
  const savePlan = useCallback(
    async (plan: WeekPlan) => {
      if (!weekData) return;

      try {
        // POST to a server function for persistence
        const response = await fetch("/api/jade/save-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            weekStart: weekData.weekStart,
            isoWeek: weekData.isoWeek,
            isoYear: weekData.isoYear,
            approach: "e",
          }),
        });

        if (!response.ok) {
          console.error("[CoachChat] save plan failed:", await response.text());
        } else {
          setLatestPlan(plan);
        }
      } catch (err) {
        console.error("[CoachChat] save plan error:", err);
      }
    },
    [weekData],
  );

  // Stable no-op addToolResult for stub mode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stubAddToolResult = useCallback((_opts: any) => {
    // no-op in stub mode — widgets can call this safely
  }, []);

  if (!isAiConfigured) {
    return {
      messages: localMessages,
      rawAiMessages: [],
      isThinking: isStubThinking,
      latestPlan,
      send: sendStub,
      savePlan,
      addToolResult: stubAddToolResult,
      isEmptyState: localMessages.length <= 1,
    };
  }

  return {
    messages:
      parsedAiMessages.length === 0 ? STUB_MESSAGES : parsedAiMessages,
    rawAiMessages: rawMessages as UIMessage[],
    isThinking: isLoading,
    latestPlan,
    send: sendReal,
    savePlan,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addToolResult: rawAddToolResult as any,
    isEmptyState: rawMessages.length === 0,
  };
}
