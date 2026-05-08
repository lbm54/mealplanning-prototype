/**
 * Variant B — JadeNarrator (2026 facelift).
 *
 * Persistent bottom-of-card strip:
 * - 24px JadeAvatar (online dot, glow when thinking)
 * - Single italic Apercu line, animated on change with fade-up
 * - Shimmer overlay on the text when avatarState === "thinking"
 * - Tapping avatar opens the chat sheet (pauses stack)
 *
 * Design ref: 06_five_uiux_approaches.md §1.B
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { cn } from "@/lib/utils";

export interface JadeNarratorProps {
  line: string;
  avatarState: "idle" | "thinking" | "speaking";
  onChatOpen?: () => void;
  onChatClose?: () => void;
  className?: string;
}

export function JadeNarrator({
  line,
  avatarState,
  onChatOpen,
  onChatClose,
  className,
}: JadeNarratorProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "jade" | "user"; text: string }[]>([
    { role: "jade", text: line },
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleAvatarClick = () => {
    setChatOpen(true);
    onChatOpen?.();
  };

  const handleChatClose = () => {
    setChatOpen(false);
    onChatClose?.();
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/jade/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...chatMessages.map((m) => ({
              role: m.role === "jade" ? "assistant" : "user",
              content: m.text,
            })),
            { role: "user", content: text },
          ],
          surface: "b",
        }),
      });

      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
          }
        }
        const lines = fullText.split("\n").filter((l) => l.startsWith("0:"));
        const extracted = lines
          .map((l) => { try { return JSON.parse(l.slice(2)); } catch { return ""; } })
          .join("");
        setChatMessages((prev) => [
          ...prev,
          { role: "jade", text: extracted || "I'm not sure how to answer that right now." },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "jade", text: "I can't respond right now — try again in a moment." },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "jade", text: "Something went wrong. Try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const isThinking = avatarState === "thinking";

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          "rounded-[var(--radius-card)]",
          "bg-card/90 backdrop-blur-sm",
          "border border-border/40",
          "shadow-[var(--shadow-card-elevated-light)] dark:shadow-[var(--shadow-card-elevated-dark)]",
          className,
        )}
      >
        {/* Avatar — tappable, glow when thinking */}
        <button
          type="button"
          onClick={handleAvatarClick}
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Talk to Jade"
        >
          <JadeAvatar
            size={24}
            state={avatarState}
            online={!isThinking}
            glow={isThinking}
          />
        </button>

        {/* Narrator line */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "font-[var(--font-apercu)] italic text-[var(--font-size-body)] text-foreground leading-snug line-clamp-2",
                isThinking && "text-muted-foreground",
              )}
            >
              {line}
            </motion.p>
          </AnimatePresence>

          {/* Shimmer overlay when thinking */}
          {isThinking && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(28,249,207,0.1) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.8s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* Tap-to-chat hint */}
        <button
          type="button"
          onClick={handleAvatarClick}
          className="shrink-0 opacity-40 hover:opacity-70 transition-opacity"
          aria-label="Chat with Jade"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1C3.7 1 1 3.4 1 6.4c0 1.5.6 2.9 1.7 3.9L2 12.7l2.7-.8C5.4 12.3 6.2 12.5 7 12.5c3.3 0 6-2.4 6-5.4S10.3 1 7 1z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
              className="text-muted-foreground"
            />
          </svg>
        </button>
      </div>

      {/* Jade chat Sheet */}
      <Sheet
        open={chatOpen}
        onOpenChange={(isOpen: boolean) => { if (!isOpen) handleChatClose(); }}
      >
        <SheetContent side="bottom" className="h-[60vh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-2 font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase">
              <JadeAvatar size={36} state="idle" online />
              Ask Jade
            </SheetTitle>
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-[var(--radius-card)] px-3 py-2",
                  "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                  msg.role === "jade"
                    ? "bg-muted text-foreground self-start"
                    : "bg-primary text-primary-foreground ml-auto",
                )}
              >
                {msg.text}
              </div>
            ))}
            {isSending && (
              <div className="bg-muted rounded-[var(--radius-card)] px-3 py-2 max-w-[85%]">
                <JadeAvatar size={24} state="thinking" />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 flex gap-2 pt-2 border-t border-border">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSendMessage(); }}
              placeholder="Ask about your week…"
              className={cn(
                "flex-1 rounded-[var(--radius-pill)] border border-border px-4 py-2",
                "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                "bg-background focus:outline-none focus:ring-2 focus:ring-accent",
              )}
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !chatInput.trim()}
              size="icon"
              className="rounded-full w-10 h-10 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleChatClose}
            className="shrink-0 mt-2"
          >
            <X className="w-4 h-4 mr-2" />
            Resume stack
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
