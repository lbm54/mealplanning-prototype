/**
 * JadeChatSheet — full-screen chat overlay.
 *
 * Opens from the floating Jade FAB (see MobileShell). Streams messages from
 * /api/jade/chat (Vercel AI Gateway → Claude). Renders text parts plus a
 * curated subset of generative-UI widgets inline so Jade can present
 * meal alternatives, follow-up chips, etc.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import type React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import MealAlternatives from "@/components/shared/widgets/meal-alternatives";
import FollowUpQuestion from "@/components/shared/widgets/follow-up-question";

const STARTER_CHIPS = [
  "Swap Friday's dinner for something lighter",
  "I'm bonking on long runs — what should I eat?",
  "Make my week higher protein",
  "Plan around a Saturday race",
];

interface JadeChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seed?: string;
}

export function JadeChatSheet({ isOpen, onClose, seed }: JadeChatSheetProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/jade/chat?surface=mobile" }),
    [],
  );

  const { messages, sendMessage, status, error, addToolResult } = useChat({
    transport,
  });

  const isStreaming = status === "submitted" || status === "streaming";

  // Auto-scroll to newest message
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  // Seed message on first open with a non-null seed
  const seedSent = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      seedSent.current = false;
      return;
    }
    if (seed && !seedSent.current) {
      seedSent.current = true;
      sendMessage({ text: seed });
    }
  }, [isOpen, seed, sendMessage]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage({ text });
  };

  const handleChip = (text: string) => {
    if (isStreaming) return;
    sendMessage({ text });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[440px] flex-col bg-[var(--color-cream)]",
          "min-h-[100dvh] sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[36px] sm:border sm:border-black/10 sm:shadow-[0_24px_64px_-16px_rgba(56,22,51,0.45)] sm:overflow-hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-3 pb-3 bg-[var(--color-cream)]/95 backdrop-blur border-b border-black/5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-blackberry)]">
            <JadeAvatar size={36} state="idle" online glow={false} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-[var(--font-sansita)] text-[16px] font-bold leading-none">
              Jade
            </p>
            <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/60 mt-0.5">
              Your endurance coach
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-blackberry)]/70 hover:bg-black/5 active:scale-95 transition"
          >
            <X size={18} />
          </button>
        </header>

        {/* Message list */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {messages.length === 0 && !isStreaming && (
            <Welcome onChip={handleChip} />
          )}

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              addToolResult={addToolResult}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <TypingIndicator />
          )}

          {error && (
            <div className="rounded-2xl border border-[var(--color-dragonfruit)]/30 bg-[var(--color-dragonfruit)]/5 px-3 py-2 text-[12px] text-[var(--color-dragonfruit-dark)]">
              {error.message ?? "Jade is offline — check AI gateway config."}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 z-10 bg-[var(--color-cream)]/95 backdrop-blur border-t border-black/5 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Jade to adjust your week…"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className={cn(
              "flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-2xl resize-none",
              "bg-white border border-black/10",
              "font-[var(--font-apercu)] text-[14px] text-[var(--color-blackberry)]",
              "placeholder:text-[var(--color-blackberry)]/40",
              "focus:outline-none focus:border-[var(--color-blackberry)]/30",
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              "bg-[var(--color-blackberry)] text-[var(--color-cream)]",
              "active:scale-95 transition",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            <Send size={16} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome screen — shown when chat is empty
// ─────────────────────────────────────────────────────────────────────────────

function Welcome({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="relative">
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(28,249,207,0.25) 0%, transparent 70%)",
          }}
        />
        <JadeAvatar size={96} state="idle" online glow />
      </div>
      <div className="space-y-1">
        <h2 className="font-[var(--font-sansita)] text-[22px] font-bold leading-tight">
          Hey, I'm Jade.
        </h2>
        <p className="font-[var(--font-apercu)] text-[13px] text-[var(--color-blackberry)]/65 max-w-[32ch] mx-auto leading-relaxed">
          Tell me what's on your plate, or ask me to swap, fuel, or
          fix anything in your week.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full mt-2">
        {STARTER_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChip(chip)}
            className="rounded-2xl bg-white border border-black/5 px-4 py-3 text-left font-[var(--font-apercu)] text-[13px] text-[var(--color-blackberry)] hover:border-[var(--color-blackberry)]/20 active:scale-[0.99] transition shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <span className="flex items-center gap-2">
              <Sparkles
                size={12}
                className="text-[var(--color-electrolyte-dark)] shrink-0"
                strokeWidth={2.4}
              />
              {chip}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble — renders one message (text parts + supported widget parts)
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  addToolResult,
}: {
  message: UIMessage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addToolResult: (args: any) => void;
}) {
  const isUser = message.role === "user";
  const parts = Array.isArray(message.parts) ? message.parts : [];

  if (isUser) {
    const text = parts
      .filter((p) => p.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.text)
      .join("");
    if (!text) return null;
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--color-blackberry)] text-[var(--color-cream)] px-3.5 py-2.5">
          <p className="font-[var(--font-apercu)] text-[14px] leading-snug whitespace-pre-wrap break-words">
            {text}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message — render text + widget parts in order
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 mt-1">
        <JadeAvatar size={24} state="idle" online glow={false} />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {parts.map((part, i) => {
          // Text part
          if (part.type === "text") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const text = (part as any).text as string;
            if (!text) return null;
            return (
              <div
                key={i}
                className="rounded-2xl rounded-bl-md bg-white border border-black/5 px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <p className="font-[var(--font-apercu)] text-[14px] text-[var(--color-blackberry)] leading-snug whitespace-pre-wrap break-words">
                  {text}
                </p>
              </div>
            );
          }

          // Tool call → widget
          // AI SDK v6: type is "tool-<toolName>"
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            const toolName = part.type.slice(5);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = part as any;
            const output = p.output ?? p.input;
            if (!output) return null;

            const handleResult = (response: unknown) => {
              addToolResult({
                tool: toolName,
                toolCallId: p.toolCallId,
                output: response,
              });
            };

            return (
              <div key={i} className="rounded-2xl">
                <ToolWidget
                  toolName={toolName}
                  output={output}
                  onUserResponse={handleResult}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

function ToolWidget({
  toolName,
  output,
  onUserResponse,
}: {
  toolName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any;
  onUserResponse: (response: unknown) => void;
}) {
  if (toolName === "showMealAlternatives") {
    return <MealAlternatives output={output} onUserResponse={onUserResponse} />;
  }
  if (toolName === "showFollowUpQuestion") {
    return <FollowUpQuestion output={output} onUserResponse={onUserResponse} />;
  }
  // Unknown widget → render a compact pill so we don't break the conversation
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-electrolyte)]/15 px-3 py-1 text-[10px] uppercase tracking-wider font-[var(--font-apercu)] text-[var(--color-blackberry)]/70">
      <Sparkles size={10} />
      {toolName.replace(/^show/, "")}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 mt-1">
        <JadeAvatar size={24} state="idle" online glow={false} />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-white border border-black/5 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-blackberry)]/40"
              style={{
                animation: `status-pulse 1.2s ease-in-out infinite ${delay}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
