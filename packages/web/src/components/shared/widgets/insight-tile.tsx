import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Sparkles } from "lucide-react";

/**
 * InsightTile — small KyleCard with tone-colored left border.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #22
 *
 * Tones:
 * - info       → Electrolyte left border + icon
 * - warning    → Mango left border + icon
 * - celebration→ Dragonfruit left border + icon
 *
 * Optional action button.
 */

export type InsightTone = "info" | "warning" | "celebration";

export interface InsightTileOutput {
  tone: InsightTone;
  title: string;
  body: string;
  actionLabel?: string;
}

export interface InsightTileProps {
  output: InsightTileOutput;
  onAction?: () => void;
  className?: string;
}

const TONE_CONFIG: Record<InsightTone, {
  border: string;
  bg: string;
  iconColor: string;
  Icon: React.FC<{ size: number; "aria-hidden": boolean }>;
}> = {
  info: {
    border: "border-l-[var(--color-electrolyte)]",
    bg: "bg-[var(--color-electrolyte)]/5",
    iconColor: "text-[var(--color-electrolyte)]",
    Icon: (props) => <Info {...props} />,
  },
  warning: {
    border: "border-l-[var(--color-orange)]",
    bg: "bg-[var(--color-orange)]/5",
    iconColor: "text-[var(--color-orange)]",
    Icon: (props) => <AlertTriangle {...props} />,
  },
  celebration: {
    border: "border-l-[var(--color-dragonfruit)]",
    bg: "bg-[var(--color-dragonfruit)]/5",
    iconColor: "text-[var(--color-dragonfruit)]",
    Icon: (props) => <Sparkles {...props} />,
  },
};

import type React from "react";

export default function InsightTile({ output, onAction, className }: InsightTileProps) {
  const config = TONE_CONFIG[output.tone];
  const { Icon } = config;

  return (
    <div
      className={cn(
        "rounded-r-[var(--radius-card)] border-l-4 p-3",
        config.border,
        config.bg,
        "border border-l-4 border-border",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 shrink-0", config.iconColor)}>
          <Icon size={14} aria-hidden={true} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium leading-snug">
            {output.title}
          </p>
          <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground leading-relaxed">
            {output.body}
          </p>
          {output.actionLabel && onAction && (
            <button
              onClick={onAction}
              className={cn(
                "mt-2 font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
                "underline underline-offset-2",
                config.iconColor,
                "hover:opacity-80 transition-opacity",
              )}
            >
              {output.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
