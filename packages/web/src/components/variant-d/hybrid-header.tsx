/**
 * HybridHeader — the cross-panel title strip for Variant D.
 *
 * Renders in two halves:
 *   Left: page title "WEEK PLAN" + week range label
 *   Right: Jade avatar + name + live status line + settings trigger
 *
 * The two halves are sized to mirror the 60/40 split so they align
 * exactly over the panel divider. On <lg the header collapses to a single
 * row showing just the week label + a small Jade avatar pill.
 */
import type React from "react";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";

export interface HybridHeaderProps {
  weekLabel: string;
  isJadeThinking?: boolean;
  /** Whether the chat panel is currently collapsed */
  isChatCollapsed?: boolean;
  className?: string;
}

export function HybridHeader({
  weekLabel,
  isJadeThinking,
  isChatCollapsed,
  className,
}: HybridHeaderProps) {
  return (
    <div
      className={cn(
        "hidden lg:flex items-stretch border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0",
        className,
      )}
    >
      {/* Left section — plan title */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-3 flex-1",
          "transition-all duration-[250ms]",
        )}
        style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
      >
        <div>
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-[0.12em] text-muted-foreground leading-none">
            Week Plan
          </p>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider leading-snug mt-0.5">
            {weekLabel}
          </p>
        </div>
      </div>

      {/* 1px gradient divider — top fades in, bottom fades out */}
      <div
        className={cn(
          "w-px shrink-0 self-stretch",
          "bg-gradient-to-b from-transparent via-border/80 to-transparent",
          isChatCollapsed && "opacity-0",
        )}
        aria-hidden
      />

      {/* Right section — Jade identity */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 shrink-0",
          "transition-all duration-[250ms]",
          isChatCollapsed ? "w-12 justify-center" : "w-[40%] min-w-[320px] max-w-[520px]",
        )}
        style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
      >
        {isChatCollapsed ? (
          <JadeAvatar size={24} state={isJadeThinking ? "thinking" : "idle"} online={!isJadeThinking} glow={isJadeThinking} />
        ) : (
          <>
            <JadeAvatar
              size={36}
              state={isJadeThinking ? "thinking" : "idle"}
              online={!isJadeThinking}
              glow={isJadeThinking}
            />
            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider leading-none">
                JADE
              </p>
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/70 mt-0.5 leading-none">
                {isJadeThinking ? "Thinking…" : "Online · ready to plan"}
              </p>
            </div>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
              aria-label="Jade settings"
              type="button"
            >
              <Settings2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
