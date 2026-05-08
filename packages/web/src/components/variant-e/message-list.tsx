/**
 * MessageList — scrollable chat thread for Variant E (Coach).
 *
 * 2026 facelift:
 * - Jade messages: avatar-prefixed, NO bubble — flowing Apercu text
 * - User messages: right-aligned, subtle Mango-tint bubble (85% opacity)
 * - 24px gap between turns, generous vertical rhythm
 * - Hover to reveal timestamp
 * - Onboarding chips stagger-in on first load
 * - Thinking dots refined (smaller, muted, bounce in sync)
 * - Empty-state banner for demo mode
 */
import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import type { ChatMessage } from "./types";
import { MessagePartText } from "./message-part-text";
import { MessagePartWeekCard } from "./message-part-week-card";
import { MessagePartMealCard } from "./message-part-meal-card";
import { MessagePartChips } from "./message-part-chips";
import type { WeekPlan, MealAssembly } from "@/server/jade/schema";

export interface MessageListProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  onChipClick: (label: string) => void;
  onSavePlan?: (plan: WeekPlan) => Promise<void>;
  onViewPlan?: (plan: WeekPlan) => void;
  onKeepMeal?: (meal: MealAssembly) => void;
  onUndoSwap?: () => void;
  onSwapAgain?: () => void;
  /** When true, shows the demo-mode banner */
  isDemoMode?: boolean;
  className?: string;
}

/** Format a timestamp as "h:mm a" */
function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Single Jade message row — avatar + flowing text, no bubble */
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
      {/* 36px avatar — always shown for first assistant message in a block */}
      <JadeAvatar
        size={36}
        state="idle"
        className="shrink-0 mt-0.5"
      />

      <div className="flex-1 space-y-3 min-w-0">
        {/* Text — no bubble, flows naturally */}
        {msg.textContent && (
          <div className="relative">
            <MessagePartText content={msg.textContent} />
            {/* Timestamp — hidden, visible on group hover */}
            <span
              className={cn(
                "absolute -bottom-4 left-0",
                "font-[var(--font-apercu-mono)] text-[0.6rem] tracking-wider uppercase",
                "text-muted-foreground/0 group-hover:text-muted-foreground/40",
                "transition-colors duration-200 select-none pointer-events-none",
              )}
            >
              {formatTime(msg.timestamp)}
            </span>
          </div>
        )}

        {/* Embedded week plan card */}
        {msg.weekPlan && (
          <MessagePartWeekCard
            plan={msg.weekPlan}
            isStreaming={msg.isStreaming}
            onSave={onSavePlan ? () => onSavePlan(msg.weekPlan!) : undefined}
            onView={onViewPlan ? () => onViewPlan(msg.weekPlan!) : undefined}
          />
        )}

        {/* Single meal card (swap result) */}
        {msg.mealCard && (
          <MessagePartMealCard
            meal={msg.mealCard}
            note={msg.swapNote}
            onKeep={onKeepMeal ? () => onKeepMeal(msg.mealCard!) : undefined}
            onUndo={onUndoSwap}
            onSwapAgain={onSwapAgain}
          />
        )}

        {/* Follow-up chips */}
        {msg.chips && msg.chips.length > 0 && (
          <MessagePartChips
            chips={msg.chips}
            onChipClick={onChipClick}
          />
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
            // Mango tint at 85% opacity — brand but not full saturation
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
        {/* Timestamp */}
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
      <span className="text-[var(--color-electrolyte)] text-sm leading-none mt-0.5">◆</span>
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
        <span className="text-[var(--color-electrolyte)] font-medium">Demo mode</span>
        {" "}— add an API key to enable real Jade conversations.{" "}
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

export function MessageList({
  messages,
  isThinking,
  onChipClick,
  onSavePlan,
  onViewPlan,
  onKeepMeal,
  onUndoSwap,
  onSwapAgain,
  isDemoMode,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Determine if the messages are the initial stub messages (first load)
  const isInitialLoad = messages.length <= 1;

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20",
        className,
      )}
      aria-label="Chat history"
      aria-live="polite"
    >
      {/* Demo mode banner */}
      {isDemoMode && <DemoModeBanner />}

      <div className="px-5 py-4 space-y-6 pb-6">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
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
          </div>
        ))}

        {/* Thinking indicator — refined bouncing dots */}
        {isThinking && (
          <div className="flex gap-3 max-w-2xl w-full">
            <JadeAvatar size={36} state="thinking" className="shrink-0 mt-0.5" />
            <div className="flex items-center gap-1.5 h-9 pl-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-electrolyte)]/60 animate-bounce"
                  style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
