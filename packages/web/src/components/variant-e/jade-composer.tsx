/**
 * JadeComposer — the chat input bar pinned at the bottom.
 *
 * Design source: 06_five_uiux_approaches.md §1.E
 *
 * Features:
 * - Text input with placeholder "Message Jade…"
 * - Send button (arrow icon)
 * - Slash command hints in the footer
 * - Per-user debounce: send button disabled for 1s after send (rate-limiter UX)
 * - Enter to send (Shift+Enter = newline)
 * - Voice stub: hidden for now (TODO)
 */
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";

export interface JadeComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Per-user 30s debounce budget tracking (last send timestamp)
const DEBOUNCE_MS = 1500; // 1.5s UI cooldown between sends

export function JadeComposer({
  onSend,
  disabled,
  placeholder = "Message Jade…",
  className,
}: JadeComposerProps) {
  const [value, setValue] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = value.trim().length > 0 && !disabled && !cooldown;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    const msg = value.trim();
    setValue("");
    setCooldown(true);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSend(msg);
    cooldownTimer.current = setTimeout(() => setCooldown(false), DEBOUNCE_MS);
  }, [canSend, value, onSend]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border bg-background px-4 py-3",
        className,
      )}
    >
      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none overflow-hidden",
            "rounded-[var(--radius-card)] border border-input bg-background px-3 py-2.5",
            "font-[var(--font-apercu)] text-[var(--font-size-body)]",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:opacity-50",
            "min-h-[var(--spacing-input-h)] max-h-[120px]",
            "leading-relaxed",
          )}
          aria-label="Message Jade"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "flex items-center justify-center rounded-full",
            "w-10 h-10 shrink-0",
            "bg-primary text-primary-foreground",
            "transition-all",
            canSend
              ? "hover:bg-[var(--color-orange-light)] scale-100"
              : "opacity-40 cursor-not-allowed scale-95",
          )}
        >
          <ArrowUp size={18} />
        </button>
      </div>

      {/* Slash command hints */}
      <p className="mt-1.5 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/60">
        shortcuts: /swap [day] [slot] · /lock [day] [slot] · /why [day]
      </p>
    </div>
  );
}
