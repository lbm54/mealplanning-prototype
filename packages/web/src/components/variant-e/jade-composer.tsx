/**
 * JadeComposer — the chat input bar pinned at the bottom.
 *
 * 2026 facelift:
 * - KyleCard variant="glass" wrapping the entire composer
 * - Auto-grow textarea up to 5 lines, Electrolyte focus ring
 * - Circular Mango send button (40px) with lift + glow on hover
 * - Mic stub button to the left of send
 * - "+" action menu button on the far left — opens quick-action popover
 * - Slash-command popover above the composer (keyboard-palette feel)
 * - Shortcut hint line in muted Apercu Mono
 *
 * Quick-action menu items:
 *   📅 Plan a different week → opens WeekRangePicker
 *   📷 Snap fridge           → opens PhotoUploadPrompt
 *   🍴 Compare 2 meals       → seeds "compare two meals"
 *   🥘 Generate grocery list → seeds "give me my grocery list"
 */
import { cn } from "@/lib/utils";
import { ArrowUp, Mic, Plus, X } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { KyleCard } from "@/components/shared/kyle-card";
import { SlashCommandPopover } from "./slash-command-popover";

export interface JadeComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const DEBOUNCE_MS = 1500;

// Slash commands registry — expanded
const SLASH_COMMANDS = [
  { command: "/swap", args: "[day] [slot]", hint: "Swap a meal slot" },
  { command: "/lock", args: "[day] [slot]", hint: "Lock a meal" },
  { command: "/why", args: "[day]", hint: "Explain the nutrition choice" },
  { command: "/category", args: "", hint: "Pick a goal category" },
  { command: "/weather", args: "", hint: "Weather advisory for workouts" },
  { command: "/grocery", args: "", hint: "Generate grocery list" },
  { command: "/compare", args: "", hint: "Compare two meals" },
] as const;

interface QuickAction {
  emoji: string;
  label: string;
  seed: string | null; // null = handled via special UI (week picker / photo)
  uiAction?: "week-picker" | "photo-upload";
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    emoji: "📅",
    label: "Plan a different week",
    seed: null,
    uiAction: "week-picker",
  },
  {
    emoji: "📷",
    label: "Snap fridge",
    seed: null,
    uiAction: "photo-upload",
  },
  {
    emoji: "🍴",
    label: "Compare 2 meals",
    seed: "I want to compare two meal options — show me a comparison.",
  },
  {
    emoji: "🥘",
    label: "Generate grocery list",
    seed: "Give me a grocery list for this week's meals.",
  },
];

// ─────────────────────────────────────────────────────────────
// Quick-action popover
// ─────────────────────────────────────────────────────────────

interface QuickActionMenuProps {
  onAction: (action: QuickAction) => void;
  onClose: () => void;
}

function QuickActionMenu({ onAction, onClose }: QuickActionMenuProps) {
  return (
    <div
      className={cn(
        "absolute bottom-full left-4 mb-2 z-50 w-64",
        "animate-fade-up",
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      <KyleCard
        variant="glass"
        className="border border-white/12 overflow-hidden shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <span className="font-[var(--font-apercu-mono)] text-[0.6rem] tracking-widest uppercase text-[var(--color-electrolyte)]/60">
            Quick actions
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick actions"
            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
        {/* Actions list */}
        <div className="py-1">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onAction(action)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5",
                "transition-colors duration-100",
                "hover:bg-[var(--color-electrolyte)]/8",
                "group",
              )}
            >
              <span className="text-base shrink-0 leading-none" aria-hidden>
                {action.emoji}
              </span>
              <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground/80 group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </KyleCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main composer
// ─────────────────────────────────────────────────────────────

export function JadeComposer({
  onSend,
  disabled,
  placeholder = "Message Jade…",
  className,
}: JadeComposerProps) {
  const [value, setValue] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [showSlashPopover, setShowSlashPopover] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = value.trim().length > 0 && !disabled && !cooldown;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    const msg = value.trim();
    setValue("");
    setShowSlashPopover(false);
    setShowQuickMenu(false);
    setCooldown(true);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSend(msg);
    cooldownTimer.current = setTimeout(() => setCooldown(false), DEBOUNCE_MS);
  }, [canSend, value, onSend]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.key === "Escape") {
      if (showSlashPopover) setShowSlashPopover(false);
      if (showQuickMenu) setShowQuickMenu(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Show slash popover when first char is "/"
    if ((newValue === "/" || (newValue.startsWith("/") && !newValue.includes(" ")))) {
      setShowSlashPopover(true);
      setShowQuickMenu(false);
    } else {
      setShowSlashPopover(false);
    }

    // Auto-resize up to ~5 lines (each ~20px)
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  };

  const handleSlashSelect = (command: string) => {
    setValue(command + " ");
    setShowSlashPopover(false);
    textareaRef.current?.focus();
  };

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      setShowQuickMenu(false);
      if (action.seed) {
        onSend(action.seed);
        setCooldown(true);
        cooldownTimer.current = setTimeout(() => setCooldown(false), DEBOUNCE_MS);
      } else if (action.uiAction === "week-picker") {
        onSend("Show me the week range picker so I can plan a different week.");
        setCooldown(true);
        cooldownTimer.current = setTimeout(() => setCooldown(false), DEBOUNCE_MS);
      } else if (action.uiAction === "photo-upload") {
        onSend("I want to snap my fridge — show me the photo upload.");
        setCooldown(true);
        cooldownTimer.current = setTimeout(() => setCooldown(false), DEBOUNCE_MS);
      }
      textareaRef.current?.focus();
    },
    [onSend],
  );

  // Filter slash commands based on current input
  const slashFilter = value.startsWith("/") ? value.toLowerCase() : "";
  const filteredCommands = (SLASH_COMMANDS as ReadonlyArray<{ command: string; args: string; hint: string }>).filter(
    (c) => !slashFilter || c.command.startsWith(slashFilter),
  );

  return (
    <div className={cn("shrink-0 px-4 pb-4 pt-2 relative", className)}>
      {/* Slash command popover */}
      {showSlashPopover && filteredCommands.length > 0 && (
        <SlashCommandPopover
          commands={filteredCommands}
          onSelect={handleSlashSelect}
          onClose={() => setShowSlashPopover(false)}
        />
      )}

      {/* Quick-action popover */}
      {showQuickMenu && (
        <QuickActionMenu
          onAction={handleQuickAction}
          onClose={() => setShowQuickMenu(false)}
        />
      )}

      {/* Glass composer card */}
      <KyleCard
        variant="glass"
        className={cn(
          "px-3 py-2.5",
          "border border-white/10 dark:border-white/8",
          "focus-within:border-[var(--color-electrolyte)]/40",
          "focus-within:shadow-[0_0_0_1px_rgba(28,249,207,0.15),var(--shadow-card-elevated-dark)]",
          "transition-all duration-200",
        )}
      >
        <div className="flex items-end gap-2">
          {/* "+" quick-action button */}
          <button
            type="button"
            aria-label="Quick actions"
            title="Quick actions"
            onClick={() => {
              setShowQuickMenu((v) => !v);
              setShowSlashPopover(false);
            }}
            className={cn(
              "flex items-center justify-center rounded-full shrink-0",
              "w-8 h-8 mb-0.5",
              "transition-all duration-150",
              showQuickMenu
                ? "text-[var(--color-electrolyte)] bg-[var(--color-electrolyte)]/10 rotate-45"
                : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-white/5",
            )}
          >
            <Plus size={16} strokeWidth={2} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none overflow-hidden bg-transparent",
              "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
              "text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none",
              "disabled:opacity-40",
              "min-h-[1.5rem] max-h-[100px]",
              "py-0.5",
            )}
            aria-label="Message Jade"
          />

          <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
            {/* Mic stub */}
            <button
              type="button"
              aria-label="Voice input (coming soon)"
              title="Voice input — coming soon"
              className={cn(
                "flex items-center justify-center rounded-full",
                "w-8 h-8",
                "text-muted-foreground/40 hover:text-muted-foreground/70",
                "transition-colors duration-150",
              )}
              disabled
            >
              <Mic size={15} />
            </button>

            {/* Send button — 40px Mango circle */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex items-center justify-center rounded-full",
                "w-9 h-9 shrink-0",
                "transition-all duration-150",
                canSend
                  ? [
                      "bg-gradient-to-b from-[#F8A53A] to-[#F78B14]",
                      "text-[var(--color-blackberry)]",
                      "hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-orange)]",
                      "active:translate-y-0 active:shadow-none",
                    ]
                  : [
                      "bg-muted/40 text-muted-foreground/30",
                      "cursor-not-allowed",
                    ],
              )}
            >
              {disabled ? (
                // Loading spinner while Jade is thinking
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden
                />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </KyleCard>

      {/* Shortcut hints */}
      <p className="mt-2 font-[var(--font-apercu-mono)] text-[0.6rem] tracking-widest uppercase text-muted-foreground/35 text-center select-none">
        / commands · + actions · shift+enter for newline
      </p>
    </div>
  );
}
