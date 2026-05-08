/**
 * JadeSide — the right 40% chat panel for Variant D.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 * Build spec: 07_parallel_build_plans.md §5.3 steps 1.D.3 + 1.D.5 + 1.D.7
 *
 * Wires @ai-sdk/react useChat against /api/jade/chat?surface=d.
 * Parses Jade's replies for meal-card data parts (JSON tool payloads).
 * Renders DraggableMealCard for each proposed meal.
 * Supports collapse to a 48px icon strip.
 *
 * Custom data parts protocol:
 *   Jade's text stream may include JSON blocks wrapped in:
 *   %%MEAL_CARDS%%[{...},{...}]%%END_MEAL_CARDS%%
 *   The client strips these from display text and renders as DraggableMealCard.
 */
import { useRef, useEffect, useCallback, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeMessageCard } from "@/components/shared/jade-message-card";
import { DraggableMealCard } from "./draggable-meal-card";
import { JadeChip } from "./jade-chip";
import { Send, ChevronRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";

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
  /** Whether the panel is collapsed to a 48px strip */
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** Called when user clicks [Use] on a meal card — places it on the grid */
  onMealUse: (meal: DraggableMeal, date?: string, slot?: string) => void;
  /** Called when Jade produces a full week plan (JSON in message) */
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

/** Parse %%MEAL_CARDS%% blocks from Jade's text */
function parseMealCards(
  text: string,
): { displayText: string; cards: DraggableMeal[] } {
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

/** Parse %%WEEK_PLAN%% blocks from Jade's text */
function parseWeekPlan(text: string): { displayText: string; weekPlanJson: string | null } {
  const weekPlanRegex = /%%WEEK_PLAN%%([\s\S]*?)%%END_WEEK_PLAN%%/;
  const match = weekPlanRegex.exec(text);
  if (!match) return { displayText: text, weekPlanJson: null };
  return {
    displayText: text.replace(weekPlanRegex, "").trim(),
    weekPlanJson: match[1],
  };
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
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/jade/chat?surface=d",
      initialMessages: [],
      onError: () => {
        toast.error("Jade's having trouble — try again in a moment.");
      },
      onFinish: (message) => {
        // Check if the reply contains a WeekPlan payload
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
    },
    [handleSubmit, input],
  );

  // --- Collapsed strip ---
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-between py-4 w-12 h-full",
          className,
        )}
      >
        {/* Jade avatar */}
        <button
          onClick={onToggleCollapse}
          className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
          aria-label="Open Jade chat panel"
          title="Jade — your nutrition coach"
          type="button"
        >
          <JadeAvatar size={36} state={isLoading ? "thinking" : "idle"} />
        </button>

        {/* Chat bubble icon */}
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Open Jade chat"
          type="button"
        >
          <MessageSquare size={16} />
        </button>

        {/* Expand arrow */}
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Expand chat panel"
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // --- Full panel ---
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card",
        className,
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <JadeAvatar
            size={36}
            state={isLoading ? "thinking" : "idle"}
          />
          <div>
            <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider">
              Jade
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              your nutrition coach
            </p>
          </div>
        </div>
        {/* Collapse button */}
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Collapse chat panel"
          title="Collapse"
          type="button"
        >
          <ChevronRight size={16} className="rotate-180" />
        </button>
      </div>

      {/* Suggested prompt chips — show only before first user message */}
      {messages.filter((m) => m.role === "user").length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-2 shrink-0 border-b border-border/50">
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && !isLoading && (
          <JadeMessageCard
            text="Hey — ask me to build your week, swap a meal, or tweak anything. You can also drag my meal suggestions onto the grid."
          />
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div
                  className={cn(
                    "max-w-[80%] rounded-[var(--radius-card)] rounded-tr-sm",
                    "bg-foreground text-background px-3 py-2",
                    "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          // Jade reply
          const { displayText, cards } = parseMealCards(msg.content);
          const { displayText: finalText } = parseWeekPlan(displayText);
          const isLast = i === messages.length - 1;

          return (
            <div key={i} className="space-y-3">
              <JadeMessageCard
                text={finalText}
                isThinking={isLast && isLoading && !finalText}
              />

              {/* Meal cards — draggable */}
              {cards.length > 0 && (
                <div className="space-y-2 pl-12">
                  {cards.map((card, ci) => (
                    <DraggableMealCard
                      key={ci}
                      meal={card}
                      onUse={(meal) => onMealUse(meal)}
                    />
                  ))}
                </div>
              )}

              {/* Post-generation chips for refinement */}
              {isLast &&
                !isLoading &&
                cards.length > 0 &&
                messages.filter((m) => m.role === "user").length <= 2 && (
                  <div className="pl-12 flex flex-wrap gap-2">
                    {["More protein", "No fish", "Simpler dinners"].map((p) => (
                      <JadeChip
                        key={p}
                        label={p}
                        onClick={() => handleSuggestedPrompt(p)}
                      />
                    ))}
                  </div>
                )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <JadeMessageCard text="" isThinking />
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Week context hint */}
      {weekContext && (
        <div className="px-4 py-1.5 border-t border-border/50 shrink-0">
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70 truncate">
            {weekContext}
          </p>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={onSubmit}
        className="flex gap-2 p-4 border-t border-border shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Jade anything…"
          disabled={isLoading}
          className={cn(
            "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
            "font-[var(--font-apercu)] text-[var(--font-size-input)]",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:opacity-50",
            "h-[var(--spacing-input-h)]",
          )}
          aria-label="Message Jade"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={cn(
            "flex items-center justify-center rounded-[var(--radius-pill)]",
            "bg-primary text-primary-foreground",
            "h-[var(--spacing-input-h)] w-10",
            "disabled:opacity-50 hover:bg-[var(--color-orange-light)]",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
          )}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
