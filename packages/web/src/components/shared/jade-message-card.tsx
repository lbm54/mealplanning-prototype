import { cn } from "@/lib/utils";
import { JadeAvatar } from "./jade-avatar";

/**
 * JadeMessageCard — a single Jade chat bubble.
 *
 * Design source: 06_five_uiux_approaches.md §0.3, §1.D, §1.E
 *
 * Renders:
 * - Jade's avatar (36px) on the left
 * - Text message in Apercu body
 * - Optional embedded card slot (for inline meal cards)
 * - Optional action chips
 */
export interface JadeChip {
  label: string;
  onClick: () => void;
}

export interface JadeMessageCardProps {
  text: string;
  isThinking?: boolean;
  chips?: JadeChip[];
  children?: React.ReactNode;
  className?: string;
}

import type React from "react";

export function JadeMessageCard({
  text,
  isThinking,
  chips,
  children,
  className,
}: JadeMessageCardProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <JadeAvatar size={36} state={isThinking ? "thinking" : "idle"} />

      <div className="flex-1 min-w-0">
        {/* Message text */}
        <p
          className={cn(
            "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
            isThinking && "text-muted-foreground italic",
          )}
        >
          {isThinking ? "Jade is thinking…" : text}
        </p>

        {/* Embedded card slot (e.g., meal alternatives) */}
        {children && <div className="mt-3">{children}</div>}

        {/* Action chips */}
        {chips && chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.onClick}
                className={cn(
                  "rounded-[var(--radius-pill)] border border-border px-3 py-1",
                  "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
                  "text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  "hover:border-accent",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
