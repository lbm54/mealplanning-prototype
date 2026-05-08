import { cn } from "@/lib/utils";
import { JadeAvatar } from "./jade-avatar";
import { JadeMessageCard } from "./jade-message-card";

/**
 * JadeChatPanel — shared chat UI wrapper.
 *
 * Design source: 06_five_uiux_approaches.md §1.D, §1.E
 *
 * Wraps useChat from @ai-sdk/react.
 * Props:
 *   mode: 'drawer' | 'panel' | 'fullbleed'
 *
 * Drawer  = A's "Ask Jade" right-sheet
 * Panel   = D's right column (40% width)
 * Fullbleed = E's entire screen
 *
 * This is a stub: renders "AI not configured" if env var is missing.
 * Variants will wire real useChat + endpoint calls.
 *
 * Refined: glass header, Electrolyte-accented input send button,
 * online avatar indicator.
 */

export interface JadeChatPanelProps {
  mode?: "drawer" | "panel" | "fullbleed";
  surface?: "a" | "b" | "c" | "d" | "e";
  className?: string;
}

export function JadeChatPanel({
  mode = "panel",
  surface: _surface,
  className,
}: JadeChatPanelProps) {
  const isConfigured = Boolean(
    typeof window !== "undefined"
      ? (window as Window & { __AI_CONFIGURED__?: boolean }).__AI_CONFIGURED__
      : true,
  );

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-l border-border",
        mode === "fullbleed" && "h-screen",
        mode === "panel" && "h-full",
        mode === "drawer" && "h-full",
        className,
      )}
    >
      {/* Header — glass-tinted */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-border/70 p-4",
          "bg-card/80 backdrop-blur-sm",
        )}
      >
        <JadeAvatar size={36} online={isConfigured} glow={isConfigured} />
        <div>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider">
            Jade
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            your nutrition coach
          </p>
        </div>
        {isConfigured && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/30 bg-[var(--color-electrolyte)]/10 px-2 py-0.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-electrolyte)] animate-status-pulse" />
            <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-[var(--color-electrolyte)]">
              Online
            </span>
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isConfigured ? (
          <JadeMessageCard
            text="AI isn't configured yet — add AI_GATEWAY_API_KEY to .env.local to enable Jade."
          />
        ) : (
          <JadeMessageCard
            text="Hey — I'm ready to help build your week. This panel is a stub; the variant agent will wire the full chat here."
            chips={[
              { label: "build my week", onClick: () => {} },
              { label: "more protein", onClick: () => {} },
            ]}
          />
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/70 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask Jade anything…"
            disabled={!isConfigured}
            className={cn(
              "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
              "font-[var(--font-apercu)] text-[var(--font-size-input)]",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-50",
              "h-[var(--spacing-input-h)]",
              "transition-shadow duration-150",
            )}
          />
          <button
            disabled={!isConfigured}
            className={cn(
              "flex items-center justify-center rounded-[var(--radius-pill)]",
              "bg-gradient-to-b from-[#F8A53A] to-[#F78B14] text-primary-foreground",
              "h-[var(--spacing-input-h)] px-4",
              "font-[var(--font-sansita)] text-[var(--font-size-btn)] uppercase tracking-wider",
              "disabled:opacity-50",
              "transition-all duration-150",
              "hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-orange)]",
              "active:translate-y-0 active:shadow-none",
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
