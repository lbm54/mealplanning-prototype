/**
 * JadeSide — the right 40% chat panel for Variant D.
 *
 * 2026 generative-UI upgrade:
 * - JadeMessageRendererD renders ALL Jade messages (text + every widget type)
 *   via the shared WIDGET_REGISTRY; MealPlanCard, MealAlternatives, and
 *   MealCarousel widgets gain dnd-kit drag handles automatically.
 * - CategoryPicker shown persistently above the first user message (replaces
 *   the ad-hoc SUGGESTED_PROMPTS chip row).  After the user picks a category
 *   the picker collapses and normal chips take over for refinement.
 * - Composer `+` button opens a quick-actions popover:
 *     📅 Pick week range  → injects WeekRangePicker into the thread
 *     📷 Snap fridge       → injects PhotoUploadPrompt into the thread
 * - onFinish scans tool-result parts for proposeWeekPlan/showMealPlanCard so
 *   plan.d.tsx can show "Apply this week?" pill.
 * - addToolResult wires input-widget responses back to useChat.
 *
 * Original bubble styling, streaming dots, glass composer, and collapse strip
 * are preserved unchanged.
 */
import { useRef, useEffect, useCallback, useState, type FormEvent } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeChip } from "./jade-chip";
import { KyleCard } from "@/components/shared/kyle-card";
import { KyleButton } from "@/components/shared/kyle-button";
import { Send, ChevronLeft, Settings2, Plus, CalendarDays, Camera } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { JadeMessageRendererD } from "./jade-message-renderer-d";
import CategoryPicker from "@/components/shared/widgets/category-picker";
import WeekRangePicker from "@/components/shared/widgets/week-range-picker";
import PhotoUploadPrompt from "@/components/shared/widgets/photo-upload-prompt";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  /** Called when a proposeWeekPlan / showMealPlanCard tool-result arrives in
   *  onFinish so plan.d.tsx can show the "Apply this week?" pill. */
  onWeekPlanToolResult?: (toolCallId: string, planOutput: unknown) => void;
  weekContext?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Refinement chips shown after first Jade reply that has meal cards
// ─────────────────────────────────────────────────────────────────────────────

const REFINEMENT_PROMPTS = ["More protein", "No fish", "Simpler dinners", "Vegetarian", "Build grocery list"];

/**
 * Map a refinement-chip label to the actual message text Jade sees.
 * Most prompts go through verbatim; "Build grocery list" expands so the
 * persona reliably triggers buildGroceryList instead of free-talking.
 */
function expandPrompt(label: string): string {
  if (label === "Build grocery list") {
    return "Build my grocery list for this week's meal plan.";
  }
  return label;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default CategoryPicker output rendered at top of empty chat
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORY_PICKER_OUTPUT = {
  title: "What kind of week are we planning?",
  categories: [
    { id: "athletic", label: "Athletic Performance", tone: "accent" as const },
    { id: "race", label: "Race Prep", tone: "primary" as const },
    { id: "recovery", label: "Recovery Week", tone: "accent" as const },
    { id: "budget", label: "Budget Constraints", tone: "warning" as const },
    { id: "dietary", label: "Specific Dietary", tone: "muted" as const },
    { id: "weight", label: "Weight Loss", tone: "muted" as const },
    { id: "family", label: "Family-Friendly", tone: "muted" as const },
    { id: "pantry", label: "Ingredients on Hand", tone: "warning" as const },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (unchanged from original facelift)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// + Button quick-action popover
// ─────────────────────────────────────────────────────────────────────────────

interface QuickAction {
  id: "week-range" | "fridge-photo";
  icon: React.ReactNode;
  label: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "week-range", icon: <CalendarDays size={13} />, label: "Pick week range" },
  { id: "fridge-photo", icon: <Camera size={13} />, label: "Snap fridge" },
];

interface QuickActionPopoverProps {
  onAction: (id: QuickAction["id"]) => void;
  onClose: () => void;
}

function QuickActionPopover({ onAction, onClose }: QuickActionPopoverProps) {
  return (
    <div
      className={cn(
        "absolute bottom-full left-0 mb-2 z-50",
        "rounded-[var(--radius-card)] border border-border/60 bg-card shadow-md",
        "min-w-[180px] overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150",
      )}
    >
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => {
            onAction(action.id);
            onClose();
          }}
          className={cn(
            "flex w-full items-center gap-2.5 px-3.5 py-2.5",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-left",
            "hover:bg-[var(--color-electrolyte)]/8 hover:text-[var(--color-electrolyte-dark)]",
            "transition-colors duration-100",
          )}
          type="button"
        >
          <span className="text-muted-foreground">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Apply this week?" inline pill — shown inside the chat thread
// ─────────────────────────────────────────────────────────────────────────────

interface ApplyWeekPillProps {
  onApply: () => void;
  onDismiss: () => void;
}

function ApplyWeekPill({ onApply, onDismiss }: ApplyWeekPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-2",
        "border-[var(--color-orange)]/40 bg-[var(--color-orange)]/8",
        "animate-in fade-in-0 slide-in-from-bottom-1 duration-200",
      )}
    >
      <span className="flex-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-orange)]">
        Apply this week to the plan?
      </span>
      <button
        onClick={onApply}
        className={cn(
          "rounded-[var(--radius-pill)] bg-[var(--color-orange)] px-3 py-1",
          "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider text-[var(--color-blackberry)]",
          "hover:bg-[var(--color-orange-light)] transition-colors duration-150",
        )}
        type="button"
      >
        Apply
      </button>
      <button
        onClick={onDismiss}
        className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        aria-label="Dismiss"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline widget injections (WeekRangePicker / PhotoUploadPrompt)
// ─────────────────────────────────────────────────────────────────────────────

interface InjectedWidget {
  id: string;
  type: "week-range" | "fridge-photo";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract pure text from a v6 UIMessage (ignores tool parts)
// ─────────────────────────────────────────────────────────────────────────────

function extractTextFromMessage(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Returns true when the message has at least one completed tool-result part. */
function messageHasToolResults(msg: UIMessage): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (msg.parts ?? []).some((p: any) => p.type === "dynamic-tool" && p.state === "result");
}

/** True when the message has tool results that look like meal plans. */
function messageHasMealPlanResult(msg: UIMessage): boolean {
  const PLAN_TOOLS = new Set(["showMealPlanCard", "proposeWeekPlan", "showMealCarousel", "showMealOptions"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (msg.parts ?? []).some((p: any) => {
    if (p.type !== "dynamic-tool" || p.state !== "result") return false;
    return PLAN_TOOLS.has(p.toolName ?? "");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function JadeSide({
  isCollapsed,
  onToggleCollapse,
  onMealUse: _onMealUse,
  onWeekPlanReceived,
  onWeekPlanToolResult,
  weekContext,
  className,
}: JadeSideProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [categoryChosen, setCategoryChosen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [injectedWidgets, setInjectedWidgets] = useState<InjectedWidget[]>([]);
  const [pendingWeekPlan, setPendingWeekPlan] = useState<{
    toolCallId: string;
    planOutput: unknown;
  } | null>(null);

  const { messages, sendMessage, addToolResult, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/jade/chat?surface=d" }),
    onError: () => {
      toast.error("Jade's having trouble — try again in a moment.");
    },
    onFinish: ({ message }) => {
      // ── Legacy %%WEEK_PLAN%% protocol (kept for backward compat) ──
      const text = extractTextFromMessage(message);
      const weekPlanMatch = /%%WEEK_PLAN%%([\s\S]*?)%%END_WEEK_PLAN%%/.exec(text);
      if (weekPlanMatch && onWeekPlanReceived) {
        onWeekPlanReceived(weekPlanMatch[1]);
      }

      // ── Generative-UI proposeWeekPlan / showMealPlanCard tool result ──
      if (messageHasMealPlanResult(message)) {
        // Find first plan tool result in parts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const planPart = (message.parts ?? []).find((p: any) => {
          const PLAN_TOOLS = new Set(["showMealPlanCard", "proposeWeekPlan"]);
          return p.type === "dynamic-tool" && p.state === "result" && PLAN_TOOLS.has(p.toolName ?? "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        if (planPart) {
          const toolCallId = planPart.toolCallId as string;
          const planOutput = planPart.output as unknown;
          // Notify plan.d.tsx
          onWeekPlanToolResult?.(toolCallId, planOutput);
          // Show inline "Apply this week?" pill
          setPendingWeekPlan({ toolCallId, planOutput });
        }
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const hasJadeReplied = messages.some((m) => m.role === "assistant");

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, injectedWidgets]);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      sendMessage({ text });
    },
    [sendMessage, isLoading],
  );

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      handleSubmit(input);
      setInput("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [handleSubmit, input],
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleSubmit(input);
          setInput("");
        }
      }
    },
    [handleSubmit, input, isLoading],
  );

  const handleCategoryPick = useCallback(
    (response: { id: string; label: string }) => {
      setCategoryChosen(true);
      handleSubmit(`${response.label} — build my week`);
    },
    [handleSubmit],
  );

  const handleSuggestedPrompt = useCallback(
    (prompt: string) => {
      handleSubmit(expandPrompt(prompt));
    },
    [handleSubmit],
  );

  const handleQuickAction = useCallback((id: QuickAction["id"]) => {
    const widgetId = `injected-${id}-${Date.now()}`;
    setInjectedWidgets((prev) => [...prev, { id: widgetId, type: id }]);
  }, []);

  const handleUserResponse = useCallback(
    (toolCallId: string, response: unknown) => {
      // AI SDK v6 requires `tool` + `toolCallId` + `output`; cast via any for now
      // (same pattern as variant-a/jade-drawer.tsx)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (addToolResult as any)({ toolCallId, output: response });
    },
    [addToolResult],
  );

  const handleApplyWeekPlan = useCallback(async () => {
    if (!pendingWeekPlan) return;
    const planOutput = pendingWeekPlan.planOutput;
    setPendingWeekPlan(null);
    // Attempt JSON stringify for legacy onWeekPlanReceived path
    try {
      const planJson = JSON.stringify(planOutput);
      if (onWeekPlanReceived) {
        await onWeekPlanReceived(planJson);
        toast.success("Week plan applied from Jade.", { duration: 2500 });
      }
    } catch {
      toast.error("Could not apply week plan.");
    }
  }, [pendingWeekPlan, onWeekPlanReceived]);

  // ── Collapsed strip ──────────────────────────────────────────────────────
  if (isCollapsed) {
    const unreadCount = messages.filter((m) => m.role === "assistant").length;
    return (
      <div className={cn("flex flex-col items-center justify-between py-4 w-12 h-full", className)}>
        <button
          onClick={onToggleCollapse}
          className="relative focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
          aria-label="Open Jade chat panel"
          title="Jade — your nutrition coach"
          type="button"
        >
          <JadeAvatar size={36} state={isLoading ? "thinking" : "idle"} online={!isLoading} />
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

  // ── Full panel ───────────────────────────────────────────────────────────
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
                isLoading ? "text-[var(--color-electrolyte-dark)]/80" : "text-muted-foreground/60",
              )}
            >
              {isLoading ? "Thinking…" : "Online · ready to plan"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Jade settings"
            type="button"
          >
            <Settings2 size={13} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Collapse chat panel"
            type="button"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* CategoryPicker now collapsed behind a "Or pick a different angle" link.
          Jade's first turn uses the derived week character from the system prompt,
          so the user shouldn't need to pick — this is a fallback for when they
          want to override the inferred direction. */}
      {!categoryChosen && userMessageCount === 0 && (
        <details className="group border-b border-border/40 px-4 py-2 shrink-0">
          <summary className="list-none cursor-pointer select-none text-[var(--font-size-caption)] font-[var(--font-apercu)] text-muted-foreground/60 hover:text-foreground/80 transition-colors">
            <span className="border-b border-dashed border-muted-foreground/30 group-hover:border-foreground/40">
              Or pick a different angle →
            </span>
          </summary>
          <div className="mt-3 pb-2">
            <CategoryPicker
              output={DEFAULT_CATEGORY_PICKER_OUTPUT}
              onUserResponse={handleCategoryPick}
            />
          </div>
        </details>
      )}

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Initial greeting */}
        {messages.length === 0 && !isLoading && (
          <JadeBubble text="Hey — pick a category above or type what you need. You can drag my meal cards straight onto the grid." />
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            const text = extractTextFromMessage(msg);
            return <UserBubble key={i} text={text} />;
          }

          // Jade assistant message — use JadeMessageRendererD for generative UI
          const isLast = i === messages.length - 1;
          const isCurrentlyStreaming = isLast && isLoading;
          const text = extractTextFromMessage(msg);

          return (
            <div key={i} className="space-y-2.5">
              {/* Streaming / thinking indicator before text arrives */}
              {isCurrentlyStreaming && !text && !messageHasToolResults(msg) && (
                <JadeBubble text="" isThinking />
              )}

              {/* Render via generative-UI renderer (handles text + all widgets) */}
              {(text || messageHasToolResults(msg)) && (
                <div className="flex items-start gap-2.5">
                  <JadeAvatar
                    size={24}
                    state={isCurrentlyStreaming ? "thinking" : "idle"}
                    online={!isCurrentlyStreaming}
                    glow={isCurrentlyStreaming}
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0 max-w-[88%]">
                    <JadeMessageRendererD
                      message={msg}
                      onUserResponse={handleUserResponse}
                    />
                    {isCurrentlyStreaming && text && <StreamingDots />}
                  </div>
                </div>
              )}

              {/* "Apply this week?" pill after last Jade message with a plan */}
              {isLast && !isLoading && pendingWeekPlan && (
                <div className="pl-8">
                  <ApplyWeekPill
                    onApply={handleApplyWeekPlan}
                    onDismiss={() => setPendingWeekPlan(null)}
                  />
                </div>
              )}

              {/* Refinement chips after the first Jade plan reply */}
              {isLast && !isLoading && messageHasMealPlanResult(msg) && userMessageCount <= 2 && (
                <div className="pl-8 flex flex-wrap gap-1.5">
                  {REFINEMENT_PROMPTS.map((p) => (
                    <JadeChip key={p} label={p} onClick={() => handleSuggestedPrompt(p)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Injected widgets (WeekRangePicker / PhotoUploadPrompt from + button) */}
        {injectedWidgets.map((w) => (
          <div key={w.id} className="space-y-2">
            <div className="flex items-start gap-2.5">
              <JadeAvatar size={24} state="idle" online className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 max-w-[88%] rounded-[var(--radius-card)] rounded-tl-sm border border-border/60 bg-card px-3 py-3">
                {w.type === "week-range" && (
                  <WeekRangePicker
                    output={{ label: "Pick a week to plan" }}
                    onUserResponse={(resp) => {
                      handleSubmit(
                        `Plan the week of ${resp.weekStart} (${resp.weekStart} – ${resp.weekEnd})`,
                      );
                      setInjectedWidgets((prev) => prev.filter((x) => x.id !== w.id));
                    }}
                  />
                )}
                {w.type === "fridge-photo" && (
                  <PhotoUploadPrompt
                    output={{ label: "Snap your fridge", subLabel: "I'll plan around what you have." }}
                    onUserResponse={(resp) => {
                      handleSubmit(
                        typeof resp === "string"
                          ? `Here's what I have: ${resp}`
                          : "I uploaded a fridge photo — plan around what you can see.",
                      );
                      setInjectedWidgets((prev) => prev.filter((x) => x.id !== w.id));
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Standalone thinking state when Jade hasn't started streaming yet */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <JadeBubble text="" isThinking />
        )}

        {/* Refinement chips — shown if category was chosen but no messages yet */}
        {categoryChosen && !hasJadeReplied && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {REFINEMENT_PROMPTS.map((p) => (
              <JadeChip key={p} label={p} onClick={() => handleSuggestedPrompt(p)} />
            ))}
          </div>
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

      {/* Composer */}
      <div className="shrink-0 p-3 border-t border-border/50">
        <KyleCard variant="glass" className="overflow-hidden">
          <form onSubmit={onSubmit}>
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
              )}
              style={{ fieldSizing: "content" } as React.CSSProperties}
              aria-label="Message Jade"
            />

            {/* Footer: + button + status + send */}
            <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
              {/* + quick actions */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQuickActions((v) => !v)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    "text-muted-foreground/50 hover:text-[var(--color-electrolyte-dark)]",
                    "hover:bg-[var(--color-electrolyte)]/8 transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    showQuickActions && "text-[var(--color-electrolyte-dark)] bg-[var(--color-electrolyte)]/8",
                  )}
                  aria-label="Quick actions"
                  aria-expanded={showQuickActions}
                >
                  <Plus size={14} />
                </button>

                {showQuickActions && (
                  <QuickActionPopover
                    onAction={handleQuickAction}
                    onClose={() => setShowQuickActions(false)}
                  />
                )}
              </div>

              {/* Status hint */}
              <p
                className={cn(
                  "flex-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] italic transition-all duration-300",
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
                {isLoading ? "Jade is reading your training schedule…" : "⌘↵ to send"}
              </p>

              {/* Send */}
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
