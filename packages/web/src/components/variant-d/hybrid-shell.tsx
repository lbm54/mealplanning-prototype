/**
 * HybridShell — the 60/40 split-panel wrapper for Variant D.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 *
 * Desktop (≥1024px): resizable left panel (default 60%) + right chat panel (default 40%).
 * Right panel collapses to a 48px icon strip. State persists in localStorage.
 * Mobile (<768px): chat is full-width; grid is a Sheet triggered from a button.
 */
import { cn } from "@/lib/utils";

export interface HybridShellProps {
  /** Left (plan) content */
  planContent: React.ReactNode;
  /** Right (chat) content — full panel */
  chatContent: React.ReactNode;
  /** Collapsed icon strip content (48px wide) */
  chatStrip: React.ReactNode;
  /** Whether the chat panel is collapsed to a strip */
  isChatCollapsed: boolean;
  className?: string;
}

import type React from "react";

export function HybridShell({
  planContent,
  chatContent,
  chatStrip,
  isChatCollapsed,
  className,
}: HybridShellProps) {
  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)}>
      {/* Left plan panel */}
      <div
        className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          // On mobile always full width; on desktop share with chat
        )}
        style={{ minWidth: 0 }}
      >
        {planContent}
      </div>

      {/* Right chat panel — hidden on mobile (chat is handled as sheet) */}
      <div
        className={cn(
          "hidden lg:flex flex-col border-l border-border bg-card transition-all duration-300 overflow-hidden",
          isChatCollapsed ? "w-12 min-w-[3rem]" : "w-[40%] min-w-[320px] max-w-[520px]",
        )}
      >
        {isChatCollapsed ? chatStrip : chatContent}
      </div>
    </div>
  );
}
