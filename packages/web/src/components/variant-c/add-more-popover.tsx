/**
 * AddMorePopover — "+ show more" flow for any column.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.7)
 *
 * A small Popover with a text input. User types a free-text description
 * ("chickpea-based vegetarian") → Jade returns up to 3 new options that
 * prepend to the column.
 */

import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { useAddMore } from "@/lib/hooks/use-add-more";
import type { FoodOption } from "@/lib/queries/columns-data.c";
import { cn } from "@/lib/utils";

export interface AddMorePopoverProps {
  date:     string;
  slot:     string;
  column:   "protein" | "carb" | "veg";
  onAdd:    (options: FoodOption[]) => void;
  className?: string;
}

export function AddMorePopover({ date, slot, column, onAdd, className }: AddMorePopoverProps) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState("");
  const { isLoading, fetchMore } = useAddMore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const results = await fetchMore({ date, slot, column, tweakText: text.trim() });
    if (results.length > 0) {
      onAdd(results);
      setOpen(false);
      setText("");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 rounded-[var(--radius-card)] border border-dashed border-border",
            "px-2.5 py-1.5 text-left transition-colors",
            "font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground",
            "hover:border-primary hover:text-primary",
            className,
          )}
        >
          <Plus size={12} />
          show more
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" side="bottom" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2 items-start">
            <JadeAvatar size={24} state={isLoading ? "thinking" : "idle"} className="shrink-0 mt-0.5" />
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-snug">
              Describe what you want and Jade will find it.
            </p>
          </div>

          <input
            autoFocus
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. chickpea-based vegetarian"
            className={cn(
              "w-full rounded-[var(--radius-input)] border border-border bg-input px-3 py-2",
              "font-[var(--font-apercu)] text-[var(--font-size-body)] placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
            )}
            disabled={isLoading}
          />

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Asking Jade…
              </>
            ) : (
              "Find options"
            )}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
