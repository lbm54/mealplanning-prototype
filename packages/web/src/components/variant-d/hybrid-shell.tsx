/**
 * HybridShell — the 60/40 split-panel wrapper for Variant D.
 *
 * Desktop (≥1024px):
 *   - 60% left (plan grid) + 40% right (Jade chat)
 *   - A 1px gradient divider (top-fade-in / bottom-fade-out)
 *   - Right panel collapses to a 48px icon strip — animated via CSS transition
 *     with ease-out-expo timing. State persists in localStorage.
 *   - A small chevron button sits on the divider for collapse/expand.
 *
 * Mobile (<lg): tabbed layout — "PLAN" / "JADE" pills at top.
 *   Chat on JADE tab; grid as a bottom sheet on PLAN tab.
 *   On <sm the chat can also be a bottom sheet.
 */
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";

export interface HybridShellProps {
  /** Left (plan) content */
  planContent: React.ReactNode;
  /** Right (chat) content — full panel */
  chatContent: React.ReactNode;
  /** Collapsed icon strip content (48px wide) */
  chatStrip: React.ReactNode;
  /** Whether the chat panel is collapsed to a strip */
  isChatCollapsed: boolean;
  /** Toggle collapse */
  onToggleCollapse: () => void;
  className?: string;
}

export function HybridShell({
  planContent,
  chatContent,
  chatStrip,
  isChatCollapsed,
  onToggleCollapse,
  className,
}: HybridShellProps) {
  return (
    <div className={cn("flex h-full w-full overflow-hidden relative", className)}>
      {/* Left plan panel */}
      <div
        className="flex-1 overflow-auto transition-all duration-[250ms]"
        style={{ minWidth: 0, transitionTimingFunction: "var(--ease-out-expo)" }}
      >
        {planContent}
      </div>

      {/* Divider — 1px gradient line with collapse button pinned to its center */}
      <div className="relative hidden lg:flex flex-col items-center w-0 shrink-0 z-20">
        {/* Gradient line */}
        <div
          className="absolute top-0 left-0 w-px h-full pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, hsl(var(--border)) 15%, hsl(var(--border)) 85%, transparent 100%)",
            opacity: 0.5,
          }}
          aria-hidden
        />

        {/* Collapse / expand chevron button — centered on the divider */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
            "flex h-6 w-6 items-center justify-center",
            "rounded-full border border-border/60 bg-background/95 backdrop-blur-sm",
            "text-muted-foreground/60 hover:text-muted-foreground",
            "shadow-[var(--shadow-kyle-card)]",
            "transition-all duration-150 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-ring",
          )}
          aria-label={isChatCollapsed ? "Expand chat panel" : "Collapse chat panel"}
          title={isChatCollapsed ? "Expand Jade" : "Collapse Jade"}
          type="button"
        >
          {isChatCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* Right chat panel */}
      <div
        className={cn(
          "hidden lg:flex flex-col bg-card overflow-hidden",
          "transition-all duration-[250ms]",
        )}
        style={{
          width: isChatCollapsed ? "3rem" : "40%",
          minWidth: isChatCollapsed ? "3rem" : "320px",
          maxWidth: isChatCollapsed ? "3rem" : "520px",
          transitionTimingFunction: "var(--ease-out-expo)",
        }}
      >
        {isChatCollapsed ? chatStrip : chatContent}
      </div>
    </div>
  );
}
