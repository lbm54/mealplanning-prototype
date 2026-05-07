/**
 * JadeFillButton — "Fill my week with Jade" header pill CTA.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.4 + 1.C.6)
 * Design: Mango (orange) 100px pill, Sansita Bold uppercase.
 * State: pulse animation while loading.
 */

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { cn } from "@/lib/utils";

export interface JadeFillButtonProps {
  onConfirm:     () => Promise<void>;
  unfilledCount: number;
  isLoading:     boolean;
  className?:    string;
}

export function JadeFillButton({
  onConfirm,
  unfilledCount,
  isLoading,
  className,
}: JadeFillButtonProps) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    setOpen(false);
    await onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={isLoading}
          className={cn(
            // Pill shape — 100px min width, rounded-pill
            "inline-flex min-w-[100px] items-center gap-2 rounded-[var(--radius-pill)]",
            "bg-[var(--color-orange)] px-5 py-2.5",
            "font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wider",
            "text-[var(--color-blackberry)]",
            "transition-all hover:bg-[var(--color-orange-dark)] hover:shadow-md active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            // Pulse when loading
            isLoading && "animate-pulse",
            className,
          )}
        >
          {isLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {isLoading ? "Filling…" : "Fill my week with Jade"}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <JadeAvatar size={36} state="idle" />
            <DialogTitle>Fill my week?</DialogTitle>
          </div>
          <DialogDescription>
            {unfilledCount > 0
              ? `Replace ${unfilledCount} unfilled selection${unfilledCount !== 1 ? "s" : ""} with Jade's picks? Locked meals will be kept.`
              : "Jade will re-select all unlocked columns with the best picks for your week."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-1.5">
            <Sparkles size={14} />
            Fill with Jade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
