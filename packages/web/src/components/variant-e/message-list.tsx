/**
 * MessageList — scrollable chat thread for Variant E (Coach).
 *
 * 2026 generative-UI showcase:
 * - Real AI path: renders raw UIMessage[] via JadeMessageRenderer
 *   so every Jade turn produces text + 0–N widgets.
 * - Stub path: ChatMessage[] (legacy) — still used when AI is unconfigured.
 * - Proactive card stack: rendered above the thread (MorningGreetingCard,
 *   WorkoutTimeline, WeatherAdvisoryCard) as stagger-fade-in cards.
 * - Empty-state hero: CategoryPicker rendered prominently before first message.
 * - Thinking dots refined (smaller, muted, bounce in sync).
 * - Demo mode banner.
 */
import type React from "react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeMessageRenderer } from "@/components/shared/jade-message-renderer";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import CategoryPicker from "@/components/shared/widgets/category-picker";
import MorningGreetingCard from "@/components/shared/widgets/morning-greeting-card";
import WorkoutTimeline from "@/components/shared/widgets/workout-timeline";
import type { ChatMessage } from "./types";
import { MessagePartText } from "./message-part-text";
import { MessagePartWeekCard } from "./message-part-week-card";
import { MessagePartMealCard } from "./message-part-meal-card";
import { MessagePartChips } from "./message-part-chips";
import type { WeekPlan, MealAssembly } from "@/server/jade/schema";
import type {
  WorkoutTimelineOutput,
  MorningGreetingCardOutput,
  CategoryPickerOutput,
} from "@/components/shared/widgets";

// ─────────────────────────────────────────────────────────────
// Proactive card stub data — rendered before first user message
// ─────────────────────────────────────────────────────────────

const STUB_GREETING: MorningGreetingCardOutput = {
  headline: "Good morning",
  body: "You've got a 90-minute tempo run today. Let's make sure you're fuelled for it.",
  ctaLabel: "Build my plan",
  activitySummary: "Tempo run · 90 min · today",
};

const STUB_WORKOUT: WorkoutTimelineOutput = {
  workoutTitle: "Tempo Run",
  workoutDate: "Today",
  duration: 90,
  windows: [
    {
      phase: "pre",
      windowLabel: "60–90 min before",
      carbG: 45,
      proteinG: 10,
      notes: "Oats, banana, or toast. Keep fat low.",
    },
    {
      phase: "during",
      windowLabel: "Every 30–45 min",
      carbG: 30,
      sodiumMg: 200,
      notes: "Gel or chews + sports drink.",
    },
    {
      phase: "post",
      windowLabel: "Within 30 min",
      carbG: 60,
      proteinG: 20,
      notes: "Recovery window — rice + chicken or shake.",
    },
  ],
};

const STUB_CATEGORY_PICKER: CategoryPickerOutput = {
  title: "What's your goal this week?",
  categories: [
    { id: "athletic_performance", label: "Athletic Performance", tone: "primary" },
    { id: "race_prep", label: "Race Prep", tone: "warning" },
    { id: "recovery_week", label: "Recovery Week", tone: "accent" },
    { id: "budget", label: "Budget", tone: "muted" },
    { id: "dietary", label: "Dietary", tone: "accent" },
    { id: "weight", label: "Weight", tone: "warning" },
    { id: "family", label: "Family", tone: "muted" },
    { id: "pantry_only", label: "Pantry-Only", tone: "primary" },
  ],
};

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface MessageListProps {
  /** Parsed messages — used in stub/fallback mode */
  messages: ChatMessage[];
  /** Raw AI SDK UIMessages — used in real AI mode for JadeMessageRenderer */
  rawAiMessages?: UIMessage[];
  /** True if we should use rawAiMessages rather than the parsed shim */
  useRawMessages?: boolean;
  isThinking?: boolean;
  onChipClick: (label: string) => void;
  onSavePlan?: (plan: WeekPlan) => Promise<void>;
  onViewPlan?: (plan: WeekPlan) => void;
  onKeepMeal?: (meal: MealAssembly) => void;
  onUndoSwap?: () => void;
  onSwapAgain?: () => void;
  /** Called when an input widget returns a user selection */
  onToolResponse?: (toolCallId: string, response: unknown) => void;
  /** When true, shows the demo-mode banner */
  isDemoMode?: boolean;
  /** When true, shows the empty-state hero (CategoryPicker + proactive cards) */
  isEmptyState?: boolean;
  /** Called when user picks a category in the empty-state hero */
  onCategoryPick?: (categoryId: string, categoryLabel: string) => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Format a timestamp as "h:mm a" */
function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Single Jade message row — avatar-prefixed, legacy path (stub mode) */
function JadeRow({
  msg,
  isFirst,
  onChipClick,
  onSavePlan,
  onViewPlan,
  onKeepMeal,
  onUndoSwap,
  onSwapAgain,
  animIndex,
}: {
  msg: ChatMessage;
  isFirst: boolean;
  onChipClick: (label: string) => void;
  onSavePlan?: (plan: WeekPlan) => Promise<void>;
  onViewPlan?: (plan: WeekPlan) => void;
  onKeepMeal?: (meal: MealAssembly) => void;
  onUndoSwap?: () => void;
  onSwapAgain?: () => void;
  animIndex: number;
}) {
  return (
    <div
      className="group flex gap-3 max-w-2xl w-full animate-fade-up"
      style={{ animationDelay: isFirst ? `${animIndex * 80}ms` : "0ms" }}
    >
      <JadeAvatar size={36} state="idle" className="shrink-0 mt-0.5" />
      <div className="flex-1 space-y-3 min-w-0">
        {msg.textContent && (
          <div className="relative">
            <MessagePartText content={msg.textContent} />
            <span
              className={cn(
                "absolute -bottom-4 left-0",
                "font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider uppercase",
                "text-muted-foreground/0 group-hover:text-muted-foreground/40",
                "transition-colors duration-200 select-none pointer-events-none",
              )}
            >
              <span suppressHydrationWarning>{formatTime(msg.timestamp)}</span>
            </span>
          </div>
        )}
        {msg.weekPlan && (
          <MessagePartWeekCard
            plan={msg.weekPlan}
            isStreaming={msg.isStreaming}
            onSave={onSavePlan ? () => onSavePlan(msg.weekPlan!) : undefined}
            onView={onViewPlan ? () => onViewPlan(msg.weekPlan!) : undefined}
          />
        )}
        {msg.mealCard && (
          <MessagePartMealCard
            meal={msg.mealCard}
            note={msg.swapNote}
            onKeep={onKeepMeal ? () => onKeepMeal(msg.mealCard!) : undefined}
            onUndo={onUndoSwap}
            onSwapAgain={onSwapAgain}
          />
        )}
        {msg.chips && msg.chips.length > 0 && (
          <MessagePartChips chips={msg.chips} onChipClick={onChipClick} />
        )}
      </div>
    </div>
  );
}

/** Single user message row — right-aligned, tinted Mango bubble */
function UserRow({ msg }: { msg: ChatMessage }) {
  return (
    <div className="group flex justify-end animate-fade-up">
      <div className="relative max-w-[70%]">
        <div
          className={cn(
            "rounded-[18px] rounded-br-[4px] px-4 py-2.5",
            "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
            "border border-[var(--color-orange)]/20",
          )}
          style={{
            background: "rgba(247, 139, 20, 0.13)",
            color: "hsl(var(--foreground))",
          }}
        >
          {msg.textContent}
        </div>
        <span
          className={cn(
            "absolute -bottom-4 right-0",
            "font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider uppercase",
            "text-muted-foreground/0 group-hover:text-muted-foreground/40",
            "transition-colors duration-200 select-none pointer-events-none",
          )}
        >
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

/** Raw AI SDK user message — right-aligned Mango bubble */
function RawUserRow({ message }: { message: UIMessage }) {
  const rawMsg = message as unknown as {
    parts?: Array<{ type: string; text?: string }>;
    content?: string;
  };
  const parts = rawMsg.parts ?? [];
  const text =
    parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("") ||
    rawMsg.content ||
    "";

  if (!text || text === "hi") return null;

  return (
    <div className="flex justify-end animate-fade-up">
      <div
        className={cn(
          "max-w-[70%] rounded-[18px] rounded-br-[4px] px-4 py-2.5",
          "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
          "border border-[var(--color-orange)]/20",
        )}
        style={{
          background: "rgba(247, 139, 20, 0.13)",
          color: "hsl(var(--foreground))",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** Raw AI SDK assistant message — Jade row with JadeMessageRenderer */
function RawJadeRow({
  message,
  onToolResponse,
  onChipClick,
}: {
  message: UIMessage;
  onToolResponse?: (toolCallId: string, response: unknown) => void;
  onChipClick: (label: string) => void;
}) {
  return (
    <div className="flex gap-3 max-w-2xl w-full animate-fade-up">
      <JadeAvatar size={36} state="idle" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-3">
        <JadeMessageRenderer
          message={message}
          onUserResponse={onToolResponse}
        />
        {/* Inline refinement chips after each Jade response */}
        <RawJadeChips message={message} onChipClick={onChipClick} />
      </div>
    </div>
  );
}

/**
 * Refinement chips for AI SDK messages. We show chips after any assistant
 * message that contains a tool result (plan or swap) or at least 30 words of text.
 */
function RawJadeChips({
  message,
  onChipClick,
}: {
  message: UIMessage;
  onChipClick: (label: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts = (message as any).parts ?? [];
  const hasToolResult = parts.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) =>
      (p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-"))) &&
      p.state === "result",
  );
  const textLen = parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.type === "text")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((n: number, p: any) => n + (p.text ?? "").split(/\s+/).length, 0);

  if (!hasToolResult && textLen < 30) return null;

  const chips = [
    { label: "Swap something" },
    { label: "More protein" },
    { label: "Add grocery list" },
    { label: "Show me Tuesday's fuel windows" },
  ];

  return (
    <MessagePartChips chips={chips} onChipClick={onChipClick} />
  );
}

/** Demo mode banner */
function DemoModeBanner() {
  return (
    <div
      className={cn(
        "mx-4 mb-4 rounded-[var(--radius-card)] px-4 py-3",
        "border border-[var(--color-electrolyte)]/25 bg-[var(--color-electrolyte)]/8",
        "flex items-start gap-3",
      )}
    >
      <span className="text-[var(--color-electrolyte)] text-sm leading-none mt-0.5">
        ◆
      </span>
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
        <span className="text-[var(--color-electrolyte)] font-medium">
          Demo mode
        </span>{" "}
        — add an API key to enable real Jade conversations.{" "}
        <a
          href="/MANUAL_STEPS.md"
          className="text-[var(--color-electrolyte)]/80 underline underline-offset-2 hover:text-[var(--color-electrolyte)] transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Setup guide
        </a>
      </p>
    </div>
  );
}

/**
 * Proactive card stack — MorningGreetingCard + WorkoutTimeline + WeatherAdvisoryCard.
 * Stagger-fade-in, elevated KyleCard feel.
 * Shown only on first load (isEmptyState) before user types anything.
 */
function ProactiveCardStack({
  onCta,
}: {
  onCta?: () => void;
}) {
  // Only show workout timeline if it's a "workout day" — stub always shows it
  const hour = new Date().getHours();
  // MorningGreetingCard shows between 5am–10am; outside those hours show a
  // more neutral greeting
  const isGoodMorning = hour >= 5 && hour < 10;
  const greeting: MorningGreetingCardOutput = {
    ...STUB_GREETING,
    headline: isGoodMorning ? "Good morning" : "Hey there",
    body: isGoodMorning
      ? STUB_GREETING.body
      : "You've got a training day. Let me help you fuel it right.",
  };

  return (
    <div className="space-y-3 px-5 pb-4">
      {/* MorningGreetingCard */}
      <div
        className="animate-fade-up"
        style={{ animationDelay: "0ms" }}
      >
        <MorningGreetingCard
          output={greeting}
          onCta={onCta}
        />
      </div>

      {/* WorkoutTimeline */}
      <div
        className="animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <KyleCard variant="elevated">
          <KyleCardContent className="p-4">
            <WorkoutTimeline output={STUB_WORKOUT} />
          </KyleCardContent>
        </KyleCard>
      </div>
    </div>
  );
}

/**
 * Empty-state hero — CategoryPicker as the first interaction surface.
 * Replaces the old onboarding chips.
 */
function EmptyStateHero({
  onCategoryPick,
  onCta,
}: {
  onCategoryPick?: (id: string, label: string) => void;
  onCta?: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Proactive cards */}
      <ProactiveCardStack onCta={onCta} />

      {/* CategoryPicker hero */}
      <div className="px-5 pb-2 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <KyleCard variant="elevated">
          <KyleCardContent className="p-5">
            <CategoryPicker
              output={STUB_CATEGORY_PICKER}
              onUserResponse={
                onCategoryPick
                  ? ({ id, label }) => onCategoryPick(id, label)
                  : undefined
              }
            />
          </KyleCardContent>
        </KyleCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function MessageList({
  messages,
  rawAiMessages,
  useRawMessages = false,
  isThinking,
  onChipClick,
  onSavePlan,
  onViewPlan,
  onKeepMeal,
  onUndoSwap,
  onSwapAgain,
  onToolResponse,
  isDemoMode,
  isEmptyState,
  onCategoryPick,
  className,
}: MessageListProps) {
  const isInitialLoad = messages.length <= 1;

  return (
    <Conversation
      className={cn("flex-1", className)}
      aria-label="Chat history"
      aria-live="polite"
    >
      {/* Demo mode banner — sits above the auto-scroll content */}
      {isDemoMode && <DemoModeBanner />}

      <ConversationContent className="px-5 py-4 gap-6">
        {/* ── Empty-state hero: CategoryPicker + proactive cards ── */}
        {isEmptyState && (
          <EmptyStateHero
            onCategoryPick={onCategoryPick}
            onCta={() => onCategoryPick?.("athletic_performance", "Athletic Performance")}
          />
        )}

        {/* ── Real AI SDK message rendering ── */}
        {useRawMessages && rawAiMessages && rawAiMessages.length > 0 &&
          rawAiMessages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent
                className={cn(
                  msg.role === "user"
                    ? "bg-gradient-to-b from-[#F8A53A] to-[#F78B14] text-[#381633]"
                    : "bg-transparent",
                )}
              >
                {msg.role === "user" ? (
                  <RawUserRow message={msg} />
                ) : (
                  <RawJadeRow
                    message={msg}
                    onToolResponse={onToolResponse}
                    onChipClick={onChipClick}
                  />
                )}
              </MessageContent>
            </Message>
          ))
        }

        {/* ── Legacy ChatMessage rendering (stub / fallback) ── */}
        {!useRawMessages &&
          messages.map((msg, idx) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent
                className={cn(
                  msg.role === "user"
                    ? "bg-gradient-to-b from-[#F8A53A] to-[#F78B14] text-[#381633]"
                    : "bg-transparent",
                )}
              >
                {msg.role === "assistant" ? (
                  <JadeRow
                    msg={msg}
                    isFirst={isInitialLoad}
                    animIndex={idx}
                    onChipClick={onChipClick}
                    onSavePlan={onSavePlan}
                    onViewPlan={onViewPlan}
                    onKeepMeal={onKeepMeal}
                    onUndoSwap={onUndoSwap}
                    onSwapAgain={onSwapAgain}
                  />
                ) : (
                  <UserRow msg={msg} />
                )}
              </MessageContent>
            </Message>
          ))
        }

        {/* Thinking indicator */}
        {isThinking && (
          <Message from="assistant">
            <MessageContent className="bg-transparent">
              <div className="flex gap-3 items-center">
                <JadeAvatar size={36} state="thinking" className="shrink-0" />
                <div className="flex items-center gap-1.5 h-9">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-electrolyte)]/60 animate-bounce"
                      style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
                    />
                  ))}
                </div>
              </div>
            </MessageContent>
          </Message>
        )}
      </ConversationContent>

      {/* Floating scroll-to-bottom button — appears when scrolled away */}
      <ConversationScrollButton />
    </Conversation>
  );
}
