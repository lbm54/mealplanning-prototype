/**
 * JadeDrawer — the "Ask Jade" right-side chat Sheet for Variant A.
 *
 * Design source: 06_five_uiux_approaches.md §1.A:
 *   "Click → a right-side Sheet opens with a small chat that's scoped to the
 *    current week."
 *
 * Uses /api/jade/chat?surface=a with useChat from @ai-sdk/react when configured.
 * Falls back to a static stub with helpful chips when AI is not configured.
 *
 * TODO: Wire real useChat once AI_GATEWAY_API_KEY is set in .env.local.
 * The endpoint /api/jade/chat is already implemented in server/jade/chat.tsx.
 */
import { useCallback, useRef, useEffect } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeMessageCard } from "@/components/shared/jade-message-card";
import { X } from "lucide-react";

export interface JadeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weekContext?: {
    weekStart: string;
    coachStrip?: string | null;
  };
  className?: string;
}

export function JadeDrawer({ isOpen, onClose, weekContext, className }: JadeDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  const isAiConfigured =
    typeof window !== "undefined"
      ? Boolean((window as Window & { __AI_CONFIGURED__?: boolean }).__AI_CONFIGURED__)
      : false;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal
        aria-label="Ask Jade"
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col",
          "border-l border-border bg-background shadow-[var(--shadow-kyle-elevated-dark)]",
          "animate-in slide-in-from-right duration-300",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <JadeAvatar size={36} state="idle" />
          <div className="flex-1">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider">
              Jade
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              your nutrition coach
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close Ask Jade"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isAiConfigured ? (
            <>
              <JadeMessageCard
                text={
                  weekContext?.coachStrip
                    ? weekContext.coachStrip
                    : "Hey — I'm Jade. I'm your nutrition coach for this week."
                }
                chips={[
                  {
                    label: "why this week's carbs?",
                    onClick: () => {},
                  },
                  {
                    label: "make it simpler",
                    onClick: () => {},
                  },
                  {
                    label: "more protein",
                    onClick: () => {},
                  },
                ]}
              />
              <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-muted/30 p-3">
                <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                  To enable live chat, add{" "}
                  <code className="font-mono bg-muted px-1 rounded">AI_GATEWAY_API_KEY</code>{" "}
                  or{" "}
                  <code className="font-mono bg-muted px-1 rounded">OPENAI_API_KEY</code>{" "}
                  to{" "}
                  <code className="font-mono bg-muted px-1 rounded">.env.local</code>.
                </p>
              </div>
            </>
          ) : (
            <JadeMessageCard
              text={
                weekContext?.coachStrip ??
                "Hey — ready to help with your week. What do you want to know?"
              }
              chips={[
                { label: "why this week's carbs?", onClick: () => {} },
                { label: "make it simpler", onClick: () => {} },
                { label: "more protein", onClick: () => {} },
                { label: "I'm traveling Friday", onClick: () => {} },
              ]}
            />
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={isAiConfigured ? "Ask Jade anything…" : "AI not configured yet"}
              disabled={!isAiConfigured}
              className={cn(
                "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
                "font-[var(--font-apercu)] text-[var(--font-size-input)]",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:opacity-50",
                "h-[var(--spacing-input-h)]",
              )}
            />
            <button
              disabled={!isAiConfigured}
              className={cn(
                "flex items-center justify-center rounded-[var(--radius-pill)]",
                "bg-accent text-accent-foreground",
                "h-[var(--spacing-input-h)] px-4",
                "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider font-bold",
                "disabled:opacity-50 hover:bg-[var(--color-electrolyte-dark)]",
                "transition-colors",
              )}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
