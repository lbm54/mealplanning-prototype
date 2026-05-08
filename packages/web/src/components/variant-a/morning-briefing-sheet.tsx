/**
 * MorningBriefingSheet — triggered from the top-right "Today's plan" pill.
 *
 * Design source: 09_figma_analysis_and_widgets.md §4 Variant A:
 *   "Top-right → MorningGreetingCard pinned for the first session of the day."
 *
 * Behaviour:
 * 1. Pill button ("🌅 Today's plan") sits in the header top-right area.
 * 2. On first click, sends a hidden prompt "Give me my morning briefing" to
 *    /api/jade/chat?surface=a-morning.
 * 3. Jade responds with showMorningGreeting + (optionally) showWorkoutTimeline
 *    and showWeatherCard.
 * 4. Result is cached in localStorage keyed by today's date so we don't
 *    re-spend on subsequent opens of the same session.
 * 5. Renders via JadeMessageRenderer inside a right-side Sheet.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeMessageRenderer } from "@/components/shared/jade-message-renderer";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

// ─── localStorage cache ───────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = "jade-morning-briefing-";

function getCacheKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${CACHE_KEY_PREFIX}${today}`;
}

function loadCachedMessages(): UIMessage[] | null {
  try {
    const raw = localStorage.getItem(getCacheKey());
    if (!raw) return null;
    return JSON.parse(raw) as UIMessage[];
  } catch {
    return null;
  }
}

function saveCachedMessages(messages: UIMessage[]): void {
  try {
    localStorage.setItem(getCacheKey(), JSON.stringify(messages));
  } catch {
    // localStorage full — ignore
  }
}

// ─── Inner chat hook ──────────────────────────────────────────────────────────

interface UseMorningBriefingOptions {
  weekContext?: { weekStart: string; coachStrip?: string | null };
  enabled: boolean;
}

function useMorningBriefing({
  weekContext,
  enabled,
}: UseMorningBriefingOptions) {
  const greetingSent = useRef(false);
  const cachedMessages = useRef<UIMessage[] | null>(null);
  const [cachedResult, setCachedResult] = useState<UIMessage[] | null>(null);

  // Load cache on mount
  useEffect(() => {
    const cached = loadCachedMessages();
    if (cached && cached.length > 0) {
      cachedMessages.current = cached;
      setCachedResult(cached);
    }
  }, []);

  const { messages, sendMessage, status } = useChat({
    id: "morning-briefing",
    transport: new DefaultChatTransport({
      api: "/api/jade/chat?surface=a-morning",
      body: {
        weekContext: weekContext
          ? {
              weekStart: weekContext.weekStart,
              coachStrip: weekContext.coachStrip,
            }
          : undefined,
      },
    }),
    onFinish: (msgs) => {
      // Cache all messages after the stream ends
      const allMsgs = msgs as unknown as UIMessage[];
      if (allMsgs.length > 0) {
        saveCachedMessages(allMsgs);
      }
    },
    onError: (err) => {
      console.error("[MorningBriefing] stream error:", err);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Send the briefing prompt on first enable when no cache exists
  useEffect(() => {
    if (
      enabled &&
      !greetingSent.current &&
      !cachedMessages.current &&
      !isLoading
    ) {
      greetingSent.current = true;
      sendMessage({ text: "Give me my morning briefing" });
    }
  }, [enabled, isLoading, sendMessage]);

  // If we have live messages (just fetched), update cache reference
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      cachedMessages.current = messages as unknown as UIMessage[];
    }
  }, [messages, isLoading]);

  // Prefer cached result to avoid re-render flicker on re-open
  const displayMessages =
    cachedResult ??
    (messages.length > 0 ? (messages as unknown as UIMessage[]) : []);

  return { displayMessages, isLoading };
}

// ─── Pill button ──────────────────────────────────────────────────────────────

export interface MorningBriefingPillProps {
  onClick: () => void;
  className?: string;
}

export function MorningBriefingPill({
  onClick,
  className,
}: MorningBriefingPillProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open today's morning briefing"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)]",
        "border border-[var(--color-electrolyte)]/40 bg-[var(--color-electrolyte)]/10",
        "px-3 h-8",
        "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]",
        "hover:bg-[var(--color-electrolyte)]/15 hover:border-[var(--color-electrolyte)]/60",
        "transition-all duration-150 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span aria-hidden>🌅</span>
      <span className="hidden sm:inline">Today&rsquo;s plan</span>
    </button>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export interface MorningBriefingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  weekContext?: {
    weekStart: string;
    coachStrip?: string | null;
  };
}

export function MorningBriefingSheet({
  isOpen,
  onClose,
  weekContext,
}: MorningBriefingSheetProps) {
  const isAiConfigured =
    typeof window !== "undefined"
      ? Boolean(
          (window as Window & { __AI_CONFIGURED__?: boolean })
            .__AI_CONFIGURED__,
        )
      : false;

  const { displayMessages, isLoading } = useMorningBriefing({
    weekContext,
    enabled: isOpen && isAiConfigured,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when content changes
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full max-w-md p-0 flex flex-col gap-0",
          "border-l border-border/60",
          "bg-background/95 backdrop-blur-[12px]",
        )}
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-5 py-4 space-y-1 shrink-0">
          <div className="flex items-center gap-3">
            <JadeAvatar
              size={36}
              state={isLoading ? "thinking" : "idle"}
              glow={isLoading}
              online={isAiConfigured}
            />
            <div>
              <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-left">
                Morning Briefing
              </SheetTitle>
              <SheetDescription className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-left">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          {/* Loading skeleton */}
          {isLoading && displayMessages.length === 0 && (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-[var(--radius-card)]"
                  style={{
                    animation: `shimmer 1.5s ease-in-out infinite ${i * 100}ms`,
                    background:
                      "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              ))}
            </div>
          )}

          {/* Jade messages rendered through widget registry */}
          {displayMessages.map((msg) => {
            if (msg.role !== "assistant") return null;
            return (
              <JadeMessageRenderer
                key={msg.id}
                message={msg}
                // Morning briefing widgets are output-only; no user responses
                onUserResponse={undefined}
              />
            );
          })}

          {/* Stub when AI not configured */}
          {!isAiConfigured && (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--color-electrolyte)]/30 bg-[var(--color-electrolyte)]/5 px-4 py-3">
                <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider leading-tight">
                  Good morning!
                </p>
                <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                  Your training-aware briefing will appear here once AI is
                  configured. Add{" "}
                  <code className="font-mono bg-muted px-1 rounded text-xs">
                    AI_GATEWAY_API_KEY
                  </code>{" "}
                  to{" "}
                  <code className="font-mono bg-muted px-1 rounded text-xs">
                    .env.local
                  </code>
                  .
                </p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-border/40 bg-muted/20 px-4 py-3">
                <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground mb-1">
                  Demo content
                </p>
                <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground italic">
                  &ldquo;Big aerobic day tomorrow &mdash; aim for 380g carbs today. Weather
                  looks mild at 68&deg;F with low humidity.&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Thinking dots */}
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
      </SheetContent>
    </Sheet>
  );
}

// ─── Hook: check if we should show the morning pill ──────────────────────────
// Sub-trigger from spec: between 5am–10am local AND user has activity today.
// Called from plan.a.tsx to decide pill visibility.

export function useMorningBriefingVisible(hasActivityToday: boolean): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setVisible(hour >= 5 && hour < 10 && hasActivityToday);
  }, [hasActivityToday]);

  return visible;
}

// Expose a callback-based open hook so plan.a.tsx can manage the open state
export function useMorningBriefingOpen() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}
