/**
 * JadeChatSheet — full-screen chat overlay.
 *
 * Single-shot conversational replies via `chatFn` (not streaming). Drops
 * `useChat`/`DefaultChatTransport` so it works in production where the
 * Vite-middleware streaming endpoint isn't deployed.
 */
import { useState, useEffect, useRef } from "react";
import type React from "react";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { chatFn } from "@/server/jade/server-fns";

const STARTER_CHIPS = [
  "Swap Friday's dinner for something lighter",
  "I'm bonking on long runs — what should I eat?",
  "Make my week higher protein",
  "Plan around a Saturday race",
];

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface JadeChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seed?: string;
}

export function JadeChatSheet({ isOpen, onClose, seed }: JadeChatSheetProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  // ESC closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSending(false);
      setInput("");
    }
  }, [isOpen]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const next: ChatTurn[] = [
      ...messages,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ];
    setMessages(next);
    setSending(true);
    setError(null);
    try {
      const result = (await chatFn({
        data: {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        },
      })) as { text?: string; error?: string };
      if (!result?.text) throw new Error(result?.error ?? "no response");
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.text!,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Jade is offline — try again in a moment.",
      );
    } finally {
      setSending(false);
    }
  };

  // Seed message on first open
  const seedSent = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      seedSent.current = false;
      return;
    }
    if (seed && !seedSent.current) {
      seedSent.current = true;
      void send(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, seed]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void send(text);
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
          {messages.length === 0 && !sending && <Welcome onChip={send} />}

          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}

          {sending && (
            messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )
          )}

          {error && (
            <div className="rounded-2xl border border-[var(--color-dragonfruit)]/30 bg-[var(--color-dragonfruit)]/5 px-3 py-2 text-[12px] text-[var(--color-dragonfruit-dark)]">
              {error}
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
            disabled={!input.trim() || sending}
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
          Tell me what's on your plate, or ask me to swap, fuel, or fix
          anything in your week.
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

function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--color-blackberry)] text-[var(--color-cream)] px-3.5 py-2.5">
          <p className="font-[var(--font-apercu)] text-[14px] leading-snug whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 mt-1">
        <JadeAvatar size={24} state="idle" online glow={false} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-bl-md bg-white border border-black/5 px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="font-[var(--font-apercu)] text-[14px] text-[var(--color-blackberry)] leading-snug whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 mt-1">
        <JadeAvatar size={24} state="thinking" online glow={false} />
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
