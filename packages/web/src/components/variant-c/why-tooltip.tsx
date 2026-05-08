/**
 * WhyTooltip — "?" icon that opens a Jade rationale popover.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.8), 06_five_uiux_approaches.md §1.C
 *
 * Clicking the "?" opens a Popover with Jade's one-line rationale.
 * Rationale is pre-computed server-side — no AI call on tooltip open.
 */

import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { cn } from "@/lib/utils";

export interface WhyTooltipProps {
  rationale: string;
  column:    "protein" | "carb" | "veg";
  /** Optional: slot + day context for display */
  label?:    string;
  className?: string;
}

const COLUMN_LABEL: Record<"protein" | "carb" | "veg", string> = {
  protein: "Protein",
  carb:    "Carb",
  veg:     "Veg / Sauce",
};

export function WhyTooltip({ rationale, column, label, className }: WhyTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Why these ${COLUMN_LABEL[column]} options?`}
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full",
            "text-muted-foreground transition-colors hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <HelpCircle size={14} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" side="top" align="start">
        <div className="flex gap-2.5 items-start">
          <JadeAvatar size={24} state="idle" className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            {label && (
              <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
                {label} · {COLUMN_LABEL[column]}
              </p>
            )}
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] leading-snug">
              {rationale}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
