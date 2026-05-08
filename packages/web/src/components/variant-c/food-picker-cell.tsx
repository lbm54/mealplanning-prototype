/**
 * FoodPickerCell — the main column picker cell (Protein / Carb / Veg).
 *
 * Empty state: dashed border, "Pick" in muted Compadre Wide.
 * Filled state: food name, portion, optional Jade badge, hover "Swap" link.
 *
 * Click opens a Popover with a grid of 4-6 option tiles.
 * Each tile: food name, portion, C/P/F triplet, "RECOMMENDED" pill on top pick.
 * Optional free-text request to Jade at top of popover.
 */

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { useAddMore } from "@/lib/hooks/use-add-more";
import { cn } from "@/lib/utils";
import type { FoodOption } from "@/lib/queries/columns-data.c";

export interface FoodPickerCellProps {
  column:      "protein" | "carb" | "veg";
  options:     FoodOption[];
  selectedId:  string | null;
  /** Whether this pick was made by Jade (true if it came from bulkSetPicks) */
  isJadePick?: boolean;
  date:        string;
  slot:        string;
  onSelect:    (foodId: string) => void;
  className?:  string;
}

const COLUMN_ACCENT: Record<string, string> = {
  protein: "var(--color-cream-dark)",
  carb:    "var(--color-electrolyte)",
  veg:     "var(--color-electrolyte-dark)",
};

export function FoodPickerCell({
  column,
  options,
  selectedId,
  isJadePick,
  date,
  slot,
  onSelect,
  className,
}: FoodPickerCellProps) {
  const [open, setOpen] = useState(false);
  const [tweakText, setTweakText] = useState("");
  const [localOptions, setLocalOptions] = useState<FoodOption[]>(options);
  const { isLoading: isAddingMore, fetchMore } = useAddMore();

  const selected = localOptions.find((o) => o.id === selectedId) ?? null;

  async function handleTweakSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tweakText.trim()) return;
    const results = await fetchMore({
      date,
      slot,
      column,
      tweakText: tweakText.trim(),
    });
    if (results.length > 0) {
      setLocalOptions((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        return [...results.filter((o) => !existingIds.has(o.id)), ...prev];
      });
      setTweakText("");
    }
  }

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative w-full rounded-[var(--radius-card)] text-left transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // Empty state
            !selected && [
              "border-2 border-dashed border-border",
              "px-3 py-3 min-h-[52px]",
              "hover:border-[var(--color-electrolyte)]/50 hover:bg-accent/5",
            ],
            // Filled state
            selected && [
              "border border-border bg-card",
              "px-3 py-2.5 min-h-[52px]",
              "hover:border-[var(--color-electrolyte)]/40",
              "hover:shadow-[0_0_0_1px_rgba(28,249,207,0.15)]",
            ],
            className,
          )}
          aria-label={selected ? `Change ${column}: ${selected.name}` : `Pick ${column}`}
        >
          {!selected ? (
            /* Empty state */
            <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/50">
              Pick
            </span>
          ) : (
            /* Filled state */
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground font-medium leading-snug truncate">
                  {selected.name}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selected.serving_size && (
                    <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wide">
                      {selected.serving_size}
                    </span>
                  )}
                  {isJadePick && (
                    <Badge variant="ai-active" className="text-[8px] px-1.5 py-0 h-4">
                      JADE
                    </Badge>
                  )}
                </div>
                <span className="font-[var(--font-apercu-mono)] text-[9px] text-muted-foreground/60 uppercase tracking-wide">
                  {selected.carb_g}C · {selected.protein_g}P · {selected.fat_g}F
                </span>
              </div>
              {/* Swap hint on hover */}
              <span className="shrink-0 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/40 group-hover:text-[var(--color-electrolyte)] transition-colors duration-150 mt-0.5">
                Swap
              </span>
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0 overflow-hidden"
        side="bottom"
        align="start"
        sideOffset={6}
      >
        {/* Popover header */}
        <div className="px-3 pt-3 pb-2 border-b border-border">
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground mb-2">
            {column === "protein" ? "Choose Protein" : column === "carb" ? "Choose Carb" : "Choose Veg / Sauce"}
          </p>
          {/* Free-text Jade tweak input */}
          <form onSubmit={handleTweakSubmit} className="flex gap-2">
            <input
              type="text"
              value={tweakText}
              onChange={(e) => setTweakText(e.target.value)}
              placeholder='Ask Jade: "more rice", "no fish"…'
              className={cn(
                "flex-1 min-w-0 rounded-[var(--radius-input)] border border-border bg-input px-2.5 py-1.5",
                "font-[var(--font-apercu)] text-[var(--font-size-caption)] placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-1 focus:ring-ring",
              )}
              disabled={isAddingMore}
            />
            <button
              type="submit"
              disabled={isAddingMore || !tweakText.trim()}
              aria-label="Ask Jade to find options"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-accent text-accent-foreground hover:bg-accent/80 disabled:opacity-40 transition-colors"
            >
              {isAddingMore ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
            </button>
          </form>
        </div>

        {/* Option tiles grid */}
        <div className="p-2 flex flex-col gap-1 max-h-[320px] overflow-y-auto">
          {localOptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
              <JadeAvatar size={36} state="idle" />
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                No options found. Try asking Jade above.
              </p>
            </div>
          ) : (
            localOptions.map((opt) => (
              <OptionTile
                key={opt.id}
                option={opt}
                isSelected={opt.id === selectedId}
                accentColor={COLUMN_ACCENT[column]}
                onClick={() => handleSelect(opt.id)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Option Tile ──────────────────────────────────────────────────────────────

interface OptionTileProps {
  option:       FoodOption;
  isSelected:   boolean;
  accentColor:  string;
  onClick:      () => void;
}

function OptionTile({ option, isSelected, onClick }: OptionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "relative w-full flex items-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left",
        "transition-all duration-150",
        // Default
        "bg-transparent hover:bg-accent/10",
        "hover:shadow-[0_0_0_1px_rgba(28,249,207,0.2)]",
        // Selected
        isSelected && [
          "bg-accent/15",
          "shadow-[0_0_0_1.5px_rgba(28,249,207,0.45)]",
        ],
        // Disliked
        option.isDisliked && !isSelected && "opacity-55",
      )}
    >
      {/* Recommended indicator — left accent bar */}
      {option.isRecommended && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-3/4 rounded-r-full bg-[var(--color-electrolyte)]"
          aria-hidden
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-snug",
            isSelected ? "text-foreground font-medium" : "text-foreground/85",
          )}>
            {option.name}
          </span>
          {option.isRecommended && (
            <span className="inline-flex items-center rounded-[4px] bg-[var(--color-electrolyte)]/15 px-1.5 py-0 font-[var(--font-compadre)] text-[8px] uppercase tracking-widest text-[var(--color-electrolyte)]">
              Rec
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {option.serving_size && (
            <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wide">
              {option.serving_size}
            </span>
          )}
          <span className="font-[var(--font-apercu-mono)] text-[9px] text-muted-foreground/55 uppercase tracking-wide">
            {option.carb_g}C&nbsp;·&nbsp;{option.protein_g}P&nbsp;·&nbsp;{option.fat_g}F
          </span>
        </div>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <span
          className="shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-[var(--color-electrolyte)] text-[var(--color-blackberry)] mt-0.5"
          aria-hidden
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
