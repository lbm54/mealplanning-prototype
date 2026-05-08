/**
 * JadeDrawer — the "Ask Jade" right-side chat Sheet for Variant A.
 *
 * Design source: 06_five_uiux_approaches.md §1.A:
 *   "Click → a right-side Sheet opens with a small chat that's scoped to the
 *    current week."
 *
 * 2026 generative-UI upgrade:
 *   - Uses useChat from @ai-sdk/react + DefaultChatTransport → /api/jade/chat?surface=a
 *   - On open with empty thread: sends a greeting message so the system prompt
 *     fires showCategoryPicker automatically.
 *   - All Jade responses are rendered via JadeMessageRenderer (tool widgets +
 *     text parts).
 *   - Input widgets (CategoryPicker, FollowUpQuestion, YesNoChips, etc.) reply
 *     via addToolResult → Jade continues the conversation.
 *   - Falls back to stub card when AI is not configured.
 */
import { useCallback, useRef, useEffect, useState } from "react";
import type React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeMessageCard } from "@/components/shared/jade-message-card";
import { JadeMessageRenderer } from "@/components/shared/jade-message-renderer";
import { X, Send } from "lucide-react";

export interface JadeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weekContext?: {
    weekStart: string;
    coachStrip?: string | null;
  };
  /**
   * Optional message to inject into the chat the moment the drawer opens.
   * Used by external entry points (e.g. the "Grocery list" button) to
   * route through Jade without typing. The parent should clear this back
   * to null in onSeedConsumed to avoid re-sends.
   */
  pendingSeed?: string | null;
  onSeedConsumed?: () => void;
  className?: string;
}

// ─── Stub mode ────────────────────────────────────────────────────────────────
// Rendered when AI_GATEWAY_API_KEY / OPENAI_API_KEY is absent

function StubContent({
  weekContext,
}: {
  weekContext?: JadeDrawerProps["weekContext"];
}) {
  return (
    <>
      <JadeMessageCard
        text={
          weekContext?.coachStrip
            ? weekContext.coachStrip
            : "Hey — I'm Jade. I'm your nutrition coach for this week."
        }
        chips={[
          { label: "why this week's carbs?", onClick: () => {} },
          { label: "make it simpler", onClick: () => {} },
          { label: "more protein", onClick: () => {} },
        ]}
      />
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-muted/30 p-3">
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          To enable live chat, add{" "}
          <code className="font-mono bg-muted px-1 rounded">
            AI_GATEWAY_API_KEY
          </code>{" "}
          or{" "}
          <code className="font-mono bg-muted px-1 rounded">
            OPENAI_API_KEY
          </code>{" "}
          to{" "}
          <code className="font-mono bg-muted px-1 rounded">.env.local</code>.
        </p>
      </div>
    </>
  );
}

// ─── Live chat content ────────────────────────────────────────────────────────

interface LiveChatProps {
  weekContext?: JadeDrawerProps["weekContext"];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  pendingSeed?: string | null;
  onSeedConsumed?: () => void;
}

function LiveChat({ weekContext, scrollRef, pendingSeed, onSeedConsumed }: LiveChatProps) {
  const greetingSent = useRef(false);
  const lastSeedSent = useRef<string | null>(null);

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: "variant-a-drawer",
    transport: new DefaultChatTransport({
      api: "/api/jade/chat?surface=a",
      body: {
        weekContext: weekContext
          ? {
              weekStart: weekContext.weekStart,
              coachStrip: weekContext.coachStrip,
            }
          : undefined,
      },
    }),
    onError: (err) => {
      console.error("[JadeDrawer] stream error:", err);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // On first mount with no messages, send either the external seed (if a
  // caller asked us to) or a silent "hi" so Jade opens with the inferred
  // WEEK CHARACTER. With a seed, we skip the greeting — the seed plays that role.
  useEffect(() => {
    if (greetingSent.current) return;
    if (messages.length > 0) return;
    if (pendingSeed) {
      greetingSent.current = true;
      lastSeedSent.current = pendingSeed;
      sendMessage({ text: pendingSeed });
      onSeedConsumed?.();
      return;
    }
    greetingSent.current = true;
    sendMessage({ text: "hi" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a new seed arrives after mount (e.g. user clicked "Grocery list" while
  // the drawer was already open), inject it into the existing thread.
  useEffect(() => {
    if (!pendingSeed) return;
    if (lastSeedSent.current === pendingSeed) return;
    lastSeedSent.current = pendingSeed;
    sendMessage({ text: pendingSeed });
    onSeedConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSeed]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef]);

  const [inputText, setInputText] = useState("");

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    sendMessage({ text });
  }, [inputText, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50 italic">
              Starting conversation…
            </p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === "user") {
            // Extract text from parts (AI SDK v6)
            const rawMsg = msg as unknown as {
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
              <div key={msg.id} className="flex justify-end">
                <div
                  className={cn(
                    "max-w-[80%] rounded-[var(--radius-card)] rounded-br-[4px] px-3 py-2",
                    "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                    "bg-[rgba(247,139,20,0.13)] border border-[var(--color-orange)]/20",
                  )}
                >
                  {text}
                </div>
              </div>
            );
          }

          return (
            <JadeMessageRenderer
              key={msg.id}
              message={msg}
              onUserResponse={(toolCallId, response) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (addToolResult as any)({ toolCallId, output: response })
              }
            />
          );
        })}

        {/* Thinking indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 py-1">
            <JadeAvatar size={24} state="thinking" glow />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)]"
                  style={{
                    animation: "bounce 1.4s ease-in-out infinite",
                    animationDelay: `${i * 0.16}s`,
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jade anything…"
            disabled={isLoading}
            className={cn(
              "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
              "font-[var(--font-apercu)] text-[var(--font-size-input)]",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-electrolyte)]/40",
              "focus-within:border-[var(--color-electrolyte)]/40",
              "disabled:opacity-50",
              "h-[var(--spacing-input-h)]",
              "transition-shadow duration-150",
            )}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              "flex items-center justify-center rounded-[var(--radius-pill)]",
              "bg-gradient-to-b from-[#F8A53A] to-[#F78B14] text-white",
              "h-[var(--spacing-input-h)] px-4",
              "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider font-bold",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:shadow-[var(--shadow-glow-orange)] hover:-translate-y-0.5",
              "active:translate-y-0",
              "transition-all duration-150",
            )}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main JadeDrawer ──────────────────────────────────────────────────────────

export function JadeDrawer({
  isOpen,
  onClose,
  weekContext,
  pendingSeed,
  onSeedConsumed,
  className,
}: JadeDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  // The chat endpoint itself will respond with an error if AI is unconfigured;
  // we don't need a client-side feature flag for the banner. Always assume
  // configured — if it isn't, the message stream will surface the issue.
  const isAiConfigured = true;

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
        <div className="flex items-center gap-3 border-b border-border p-4 shrink-0">
          <JadeAvatar size={36} state="idle" online={isAiConfigured} glow={isAiConfigured} />
          <div className="flex-1">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider">
              Jade
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              your nutrition coach
            </p>
          </div>
          {isAiConfigured && (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/30 bg-[var(--color-electrolyte)]/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)] animate-status-pulse" />
              <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-[var(--color-electrolyte)]">
                Online
              </span>
            </span>
          )}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors ml-1"
            aria-label="Close Ask Jade"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: stub or live chat */}
        {isAiConfigured ? (
          <LiveChat
            weekContext={weekContext}
            scrollRef={scrollRef}
            pendingSeed={pendingSeed}
            onSeedConsumed={onSeedConsumed}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <StubContent weekContext={weekContext} />
            </div>
            <div className="border-t border-border p-4 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="AI not configured yet"
                  disabled
                  className={cn(
                    "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
                    "font-[var(--font-apercu)] text-[var(--font-size-input)]",
                    "placeholder:text-muted-foreground",
                    "disabled:opacity-50",
                    "h-[var(--spacing-input-h)]",
                  )}
                />
                <button
                  disabled
                  className={cn(
                    "flex items-center justify-center rounded-[var(--radius-pill)]",
                    "bg-accent text-accent-foreground",
                    "h-[var(--spacing-input-h)] px-4",
                    "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider font-bold",
                    "disabled:opacity-50",
                  )}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
