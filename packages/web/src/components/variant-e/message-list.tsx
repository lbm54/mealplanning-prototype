/**
 * MessageList — scrollable chat thread for Variant E.
 *
 * Design source: 06_five_uiux_approaches.md §1.E
 *
 * Renders a list of ChatMessage items. Auto-scrolls to bottom on new messages.
 * Jade messages: left-aligned with avatar.
 * User messages: right-aligned, no avatar.
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
  className?: string;
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
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4 space-y-6",
        className,
      )}
      aria-label="Chat history"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          {msg.role === "assistant" ? (
            <div className="flex gap-3 max-w-2xl w-full">
              <JadeAvatar size={36} state="idle" className="shrink-0 mt-1" />
              <div className="flex-1 space-y-3">
                {/* Text portions */}
                {msg.textContent && (
                  <MessagePartText content={msg.textContent} />
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
          ) : (
            /* User bubble */
            <div
              className={cn(
                "max-w-sm rounded-[var(--radius-card)] px-4 py-2.5",
                "bg-primary text-primary-foreground",
                "font-[var(--font-apercu)] text-[var(--font-size-body)]",
              )}
            >
              {msg.textContent}
            </div>
          )}
        </div>
      ))}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex gap-3 max-w-2xl w-full">
          <JadeAvatar size={36} state="thinking" className="shrink-0 mt-1" />
          <div className="flex items-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
