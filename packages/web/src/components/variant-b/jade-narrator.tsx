/**
 * Variant B — JadeNarrator.
 *
 * Persistent bottom-of-card strip: 24px Jade avatar + a single-line
 * comment that updates after each swipe decision.
 *
 * Tapping the avatar pauses the stack and opens a chat Sheet.
 *
 * Design ref: 06_five_uiux_approaches.md §1.B
 * "Jade is the narrator at the bottom of the stack."
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
  /** Called when the user opens chat (pauses the stack) */
  onChatOpen?: () => void;
  /** Called when the chat closes (resumes the stack) */
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

        // Extract text from SSE chunks
        const lines = fullText.split("\n").filter((l) => l.startsWith("0:"));
        const extracted = lines
          .map((l) => {
            try { return JSON.parse(l.slice(2)); } catch { return ""; }
          })
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

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          "rounded-[var(--radius-card)] border border-border/50",
          "bg-card/80 backdrop-blur-sm",
          className,
        )}
      >
        {/* Avatar — tappable to open chat */}
        <button
          type="button"
          onClick={handleAvatarClick}
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Talk to Jade"
        >
          <JadeAvatar size={24} state={avatarState} />
        </button>

        {/* Narrator line — animated on change */}
        <AnimatePresence mode="wait">
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex-1 font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground leading-snug line-clamp-2"
          >
            {line}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Jade chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleChatClose(); }}>
        <SheetContent side="bottom" className="h-[60vh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-2 font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase">
              <JadeAvatar size={36} state="idle" />
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
                "flex-1 rounded-pill border border-border px-4 py-2",
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

          {/* Resume button */}
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
