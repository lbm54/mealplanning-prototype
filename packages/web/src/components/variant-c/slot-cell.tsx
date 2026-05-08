/**
 * SlotCell — displays the meal slot label + time hint.
 *
 * Compadre Wide uppercase for the slot name ("BREAKFAST"),
 * Apercu Mono muted below for the approximate time ("~7am").
 */

import { cn } from "@/lib/utils";

const SLOT_DISPLAY: Record<string, { label: string; time: string }> = {
  breakfast:       { label: "Breakfast", time: "~7am"  },
  lunch:           { label: "Lunch",     time: "~12pm" },
  dinner:          { label: "Dinner",    time: "~6pm"  },
  snack:           { label: "Snack",     time: "~3pm"  },
  pre_workout:     { label: "Pre",       time: "−90min"},
  during_workout:  { label: "During",    time: "active"},
  post_workout:    { label: "Post",      time: "+30min"},
};

export interface SlotCellProps {
  slot: string;
  className?: string;
}

export function SlotCell({ slot, className }: SlotCellProps) {
  const { label, time } = SLOT_DISPLAY[slot] ?? { label: slot, time: "" };

  return (
    <div className={cn("flex flex-col justify-center px-2 py-2", className)}>
      <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-foreground/80 leading-none">
        {label}
      </span>
      {time && (
        <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground/60 mt-0.5 leading-none">
          {time}
        </span>
      )}
    </div>
  );
}
