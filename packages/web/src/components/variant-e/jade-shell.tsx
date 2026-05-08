/**
 * JadeShell — full-bleed chat shell for Variant E (Coach).
 *
 * Design source: 06_five_uiux_approaches.md §1.E
 *
 * Hosts:
 * - 96px Jade avatar + name + status header
 * - Scrollable message list (fills remaining height)
 * - Pinned composer bar at the bottom
 * - "View as plan" toggle button in the header
 */
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";

export interface JadeShellProps {
  children: React.ReactNode;
  /** Jade thinking = avatar pulses */
  isThinking?: boolean;
  onViewAsPlan?: () => void;
  hasPlan?: boolean;
  className?: string;
}

import type React from "react";

export function JadeShell({
  children,
  isThinking,
  onViewAsPlan,
  hasPlan,
  className,
}: JadeShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background overflow-hidden",
        className,
      )}
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <header className="shrink-0 flex flex-col items-center pt-6 pb-4 px-4 border-b border-border relative">
        {/* View as plan — top right */}
        {hasPlan && onViewAsPlan && (
          <button
            onClick={onViewAsPlan}
            className={cn(
              "absolute right-4 top-4",
              "rounded-[var(--radius-pill)] border border-border px-3 py-1.5",
              "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground",
              "transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent",
            )}
          >
            View as plan
          </button>
        )}

        {/* 96px avatar */}
        <JadeAvatar
          size={96}
          state={isThinking ? "thinking" : "idle"}
        />

        {/* Name */}
        <p
          className={cn(
            "mt-3 font-[var(--font-sansita)] font-bold uppercase tracking-wider",
            "text-[var(--font-size-section-title)] leading-none",
          )}
        >
          Jade
        </p>

        {/* Status line */}
        <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          {isThinking ? "thinking…" : "Online · ready to plan your week"}
        </p>
      </header>

      {/* ─── Content (message list + composer) ────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
