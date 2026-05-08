/**
 * JadeSide — the right 40% chat panel for Variant D.
 *
 * 2026 facelift:
 * - Refined header: JadeAvatar (online + glow when thinking), "JADE" Sansita,
 *   Apercu Mono status line, settings gear
 * - Chip row: JadeChip with electrolyte hover tint, wrapped
 * - Chat thread:
 *   - User bubbles: right-aligned, Mango primary color, 8px radius
 *   - Jade bubbles: left-aligned with 24px avatar, subtle border + inner highlight
 *   - react-markdown rendering of Jade text
 *   - Inline code in Apercu Mono styling
 *   - Streaming dots indicator when AI is generating
 * - Meal cards: DraggableMealCard (KyleCard elevated) with slotLabel
 * - Composer: KyleCard variant="glass" + borderless textarea + Mango send button
 *   Electrolyte focus ring on textarea; shimmer status row when AI thinking
 * - Collapsed strip: Jade avatar + unread badge + expand chevron
 */
import { useRef, useEffect, useCallback, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { DraggableMealCard } from "./draggable-meal-card";
import { JadeChip } from "./jade-chip";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
import { Send, ChevronLeft, Settings2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export interface DraggableMeal {
  id?: string;
  title: string;
  methodTag?: string;
  components: { name: string; portion: string }[];
  carbG: number;
  protG: number;
  fatG: number;
}

export interface JadeSideProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMealUse: (meal: DraggableMeal, date?: string, slot?: string) => void;
  onWeekPlanReceived?: (planJson: string) => void;
  weekContext?: string;
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Build me a week",
  "Vegetarian week",
  "More protein",
  "Simpler dinners",
  "No fish",
];

function parseMealCards(text: string): { displayText: string; cards: DraggableMeal[] } {
  const cardRegex = /%%MEAL_CARDS%%([\s\S]*?)%%END_MEAL_CARDS%%/g;
  const cards: DraggableMeal[] = [];
  let displayText = text;

  let match;
  while ((match = cardRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          cards.push({
            id: item.id ?? item.title,
            title: item.title ?? "",
            methodTag: item.method_tag,
            components: Array.isArray(item.components) ? item.components : [],
            carbG: item.totals?.carb_g ?? item.carbG ?? 0,
            protG: item.totals?.protein_g ?? item.protG ?? 0,
            fatG: item.totals?.fat_g ?? item.fatG ?? 0,
          });
        }
      }
    } catch {
      // Malformed JSON — skip
    }
  }
  displayText = text.replace(cardRegex, "").trim();
  return { displayText, cards };
}

function parseWeekPlan(text: string): { displayText: string; weekPlanJson: string | null } {
  const weekPlanRegex = /%%WEEK_PLAN%%([\s\S]*?)%%END_WEEK_PLAN%%/;
  const match = weekPlanRegex.exec(text);
  if (!match) return { displayText: text, weekPlanJson: null };
  return { displayText: text.replace(weekPlanRegex, "").trim(), weekPlanJson: match[1] };
}

/** Three animated dots — streaming indicator */
function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1" aria-label="Jade is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-electrolyte-dark)]/70"
          style={{
            animation: "breathe 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}

/** Jade message bubble — left-aligned with avatar prefix */
function JadeBubble({
  text,
  isThinking,
  isStreaming,
}: {
  text: string;
  isThinking?: boolean;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <JadeAvatar
        size={24}
        state={isThinking || isStreaming ? "thinking" : "idle"}
        online={!isThinking && !isStreaming}
        glow={isStreaming}
        className="shrink-0 mt-0.5"
      />
      <div
        className={cn(
          "flex-1 min-w-0 rounded-[var(--radius-card)] rounded-tl-sm px-3 py-2",
          "border border-border/60 bg-card",
          "dark:ring-1 dark:ring-white/[0.04]",
          // Subtle inner highlight in dark mode (from KyleCard elevated)
          "dark:shadow-[var(--shadow-card-elevated-dark)]",
          "max-w-[88%]",
        )}
      >
        {isThinking ? (
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground italic">
            Jade is thinking
            <StreamingDots />
          </p>
        ) : (
          <div
            className={cn(
              "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
              // Markdown prose overrides
              "[&_p]:mb-1.5 [&_p:last-child]:mb-0",
              "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-1.5 [&_li]:mb-0.5",
              "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-1.5",
              "[&_strong]:font-semibold [&_strong]:text-foreground",
              "[&_em]:italic [&_em]:text-muted-foreground",
              "[&_code]:font-[var(--font-apercu-mono)] [&_code]:text-[var(--font-size-caption)]",
              "[&_code]:bg-muted/60 [&_code]:px-1 [&_code]:rounded",
              "[&_code]:text-[var(--color-electrolyte-dark)]",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-electrolyte-dark)]/40",
              "[&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
            )}
          >
            <ReactMarkdown>{text || " "}</ReactMarkdown>
            {isStreaming && <StreamingDots />}
          </div>
        )}
      </div>
    </div>
  );
}

/** User message bubble — right-aligned, Mango-tinted */
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "max-w-[80%] rounded-[var(--radius-card)] rounded-tr-sm px-3 py-2",
          "bg-gradient-to-b from-[#F8A53A] to-[#F78B14]",
          "text-[#381633]",
          "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
          "shadow-sm",
        )}
      >
        {text}
      </div>
    </div>
  );
}

export function JadeSide({
  isCollapsed,
  onToggleCollapse,
  onMealUse,
  onWeekPlanReceived,
  weekContext,
  className,
}: JadeSideProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: "/api/jade/chat?surface=d",
    initialMessages: [],
    onError: () => {
      toast.error("Jade's having trouble — try again in a moment.");
    },
    onFinish: (message) => {
      const { weekPlanJson } = parseWeekPlan(message.content);
      if (weekPlanJson && onWeekPlanReceived) {
        onWeekPlanReceived(weekPlanJson);
      }
    },
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestedPrompt = useCallback(
    (prompt: string) => {
      append({ role: "user", content: prompt });
    },
    [append],
  );

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      handleSubmit(e);
      // Clear and refocus after submit
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [handleSubmit, input],
  );

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [handleInputChange],
  );

  // Cmd/Ctrl+Enter submits
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleSubmit(e as unknown as FormEvent);
        }
      }
    },
    [handleSubmit, input, isLoading],
  );

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  // --- Collapsed strip ---
  if (isCollapsed) {
    const unreadCount = messages.filter((m) => m.role === "assistant").length;
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-between py-4 w-12 h-full",
          className,
        )}
      >
        {/* Jade avatar — click to expand */}
        <button
          onClick={onToggleCollapse}
          className="relative focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
          aria-label="Open Jade chat panel"
          title="Jade — your nutrition coach"
          type="button"
        >
          <JadeAvatar size={36} state={isLoading ? "thinking" : "idle"} online={!isLoading} />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center",
                "rounded-full bg-[var(--color-orange)] text-[#381633]",
                "font-[var(--font-apercu-mono)] text-[8px] font-bold",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Expand arrow */}
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Expand chat panel"
          type="button"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    );
  }

  // --- Full panel ---
  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* Panel header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <JadeAvatar
            size={36}
            state={isLoading ? "thinking" : "idle"}
            online={!isLoading}
            glow={isLoading}
          />
          <div className="min-w-0">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider leading-none">
              JADE
            </p>
            <p
              className={cn(
                "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] mt-0.5 leading-none",
                isLoading
                  ? "text-[var(--color-electrolyte-dark)]/80"
                  : "text-muted-foreground/60",
              )}
            >
              {isLoading ? "Thinking…" : "Online · ready to plan"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings */}
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Jade settings"
            type="button"
          >
            <Settings2 size={13} />
          </button>

          {/* Collapse */}
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Collapse chat panel"
            title="Collapse"
            type="button"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* Chip row — show before first user message */}
      {userMessageCount === 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2.5 shrink-0 border-b border-border/40">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <JadeChip
              key={prompt}
              label={prompt}
              onClick={() => handleSuggestedPrompt(prompt)}
            />
          ))}
        </div>
      )}

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Initial greeting — shown when no messages */}
        {messages.length === 0 && !isLoading && (
          <JadeBubble text="Hey — ask me to build your week, swap a meal, or tweak anything. You can also drag my meal suggestions onto the grid." />
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return <UserBubble key={i} text={msg.content} />;
          }

          // Jade reply
          const { displayText, cards } = parseMealCards(msg.content);
          const { displayText: finalText } = parseWeekPlan(displayText);
          const isLast = i === messages.length - 1;
          const isCurrentlyStreaming = isLast && isLoading;

          return (
            <div key={i} className="space-y-2.5">
              {/* Text bubble */}
              {(finalText || isCurrentlyStreaming) && (
                <JadeBubble
                  text={finalText}
                  isStreaming={isCurrentlyStreaming && Boolean(finalText)}
                  isThinking={isCurrentlyStreaming && !finalText}
                />
              )}

              {/* Meal cards — draggable, indented */}
              {cards.length > 0 && (
                <div className="space-y-1.5 pl-8">
                  {cards.map((card, ci) => (
                    <DraggableMealCard
                      key={ci}
                      meal={card}
                      onUse={(meal) => onMealUse(meal)}
                    />
                  ))}
                </div>
              )}

              {/* Refinement chips after meal cards */}
              {isLast && !isLoading && cards.length > 0 && userMessageCount <= 2 && (
                <div className="pl-8 flex flex-wrap gap-1.5">
                  {["More protein", "No fish", "Simpler dinners"].map((p) => (
                    <JadeChip key={p} label={p} onClick={() => handleSuggestedPrompt(p)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator — standalone thinking state when Jade hasn't replied yet */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <JadeBubble text="" isThinking />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Week context hint */}
      {weekContext && (
        <div className="px-4 py-1.5 border-t border-border/30 shrink-0">
          <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/50 truncate">
            {weekContext}
          </p>
        </div>
      )}

      {/* Composer — glass card */}
      <div className="shrink-0 p-3 border-t border-border/50">
        <KyleCard variant="glass" className="overflow-hidden">
          <form onSubmit={onSubmit}>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jade anything…"
              disabled={isLoading}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent px-3 pt-3 pb-2",
                "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none",
                "disabled:opacity-50",
                "min-h-[2.5rem] max-h-[7.5rem]",
                "transition-colors duration-150",
                // Electrolyte focus ring via parent card
              )}
              style={{ fieldSizing: "content" } as React.CSSProperties}
              aria-label="Message Jade"
            />

            {/* Footer: status row + send button */}
            <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
              {/* Status / hint */}
              <p
                className={cn(
                  "font-[var(--font-apercu)] text-[var(--font-size-caption)] italic transition-all duration-300",
                  isLoading
                    ? "text-[var(--color-electrolyte-dark)]/70 opacity-100"
                    : "text-muted-foreground/30 opacity-100",
                )}
                style={{
                  backgroundImage: isLoading
                    ? "linear-gradient(90deg, transparent 0%, rgba(28,249,207,0.6) 50%, transparent 100%)"
                    : undefined,
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: isLoading ? "text" : undefined,
                  WebkitTextFillColor: isLoading ? "transparent" : undefined,
                  animation: isLoading ? "shimmer 1.8s linear infinite" : undefined,
                }}
              >
                {isLoading
                  ? "Jade is reading your training schedule…"
                  : "⌘↵ to send"}
              </p>

              {/* Send button — Mango circle icon */}
              <KyleButton
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                loading={isLoading}
                className={cn(
                  "h-8 w-8 shrink-0 rounded-full",
                  "transition-all duration-150",
                  input.trim() && !isLoading
                    ? "shadow-[var(--shadow-glow-orange)] hover:shadow-[0_0_18px_-2px_rgba(247,139,20,0.5)]"
                    : "opacity-40",
                )}
                aria-label="Send message"
              >
                <Send size={13} />
              </KyleButton>
            </div>
          </form>
        </KyleCard>
      </div>
    </div>
  );
}
