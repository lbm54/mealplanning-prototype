/**
 * SwapSheet — per-cell swap drawer for Variant A.
 *
 * Design source: 06_five_uiux_approaches.md §1.A wireframes (Swap drawer).
 *
 * Opens as a right-side Sheet when the user clicks any meal cell.
 * Shows the current meal + 3 alternatives from /api/jade/swap (or mocks).
 * "USE THIS" replaces the cell and closes the sheet.
 *
 * TODO: Wire real /api/jade/object?kind=swap endpoint once AI is configured.
 * The endpoint is implemented in routes/api/jade/object.tsx.
 */
import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { MealCell } from "@/components/shared/meal-cell";
import type { MealAssembly } from "@/components/shared/meal-cell";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMockSwapAlternatives } from "./mock-week-plan";

export interface SwapSheetMeal {
  id?: string;
  title: string;
  methodTag?: string;
  components: { name: string; portion: string }[];
  carbG: number;
  protG: number;
  fatG: number;
}

export interface SwapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;       // YYYY-MM-DD
  slot: string;       // 'breakfast' | 'lunch' | etc.
  currentMeal?: SwapSheetMeal | null;
  targetCarb?: number;
  targetProt?: number;
  targetFat?: number;
  onAccept: (meal: SwapSheetMeal) => void;
  className?: string;
}

function formatSlot(slot: string): string {
  return slot.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function SwapSheet({
  isOpen,
  onClose,
  date,
  slot,
  currentMeal,
  targetCarb,
  targetProt,
  targetFat,
  onAccept,
  className,
}: SwapSheetProps) {
  const [alternatives, setAlternatives] = useState<SwapSheetMeal[]>([]);
  const [isLoadingAlts, setIsLoadingAlts] = useState(false);
  const [tweakText, setTweakText] = useState("");

  const loadAlternatives = useCallback(async () => {
    setIsLoadingAlts(true);
    try {
      // Try real endpoint first
      const res = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "swap",
          surface: "a",
          input: { date, slot, current_meal_title: currentMeal?.title, tweak: tweakText || undefined },
        }),
      });

      if (res.ok) {
        const data = await res.json() as {
          alternatives?: Array<{
            title: string;
            method_tag?: string;
            components: Array<{ name: string; portion: string }>;
            totals: { carb_g: number; protein_g: number; fat_g: number };
          }>;
        };
        if (data.alternatives && data.alternatives.length > 0) {
          setAlternatives(
            data.alternatives.map((alt) => ({
              title: alt.title,
              methodTag: alt.method_tag,
              components: alt.components,
              carbG: alt.totals.carb_g,
              protG: alt.totals.protein_g,
              fatG: alt.totals.fat_g,
            })),
          );
          return;
        }
      }
    } catch {
      // Fall through to mock
    }

    // Mock fallback
    const mocks = getMockSwapAlternatives(slot, date);
    setAlternatives(
      mocks.map((m) => ({
        title: m.title,
        methodTag: m.method_tag,
        components: m.components,
        carbG: m.totals.carb_g,
        protG: m.totals.protein_g,
        fatG: m.totals.fat_g,
      })),
    );
  }, [date, slot, currentMeal?.title, tweakText]);

  // Load alternatives when opened
  useEffect(() => {
    if (isOpen) {
      loadAlternatives().finally(() => setIsLoadingAlts(false));
    } else {
      setAlternatives([]);
      setTweakText("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  const toMealAssembly = (m: SwapSheetMeal): MealAssembly => ({
    id: m.id,
    title: m.title,
    methodTag: m.methodTag,
    components: m.components,
    carbG: m.carbG,
    protG: m.protG,
    fatG: m.fatG,
  });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal
        aria-label={`Swap meal: ${formatSlot(slot)} on ${formatDate(date)}`}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col",
          "border-l border-border bg-background shadow-[var(--shadow-kyle-elevated-dark)]",
          "animate-in slide-in-from-right duration-300",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Swap Meal
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
              {formatDate(date)} · {formatSlot(slot)}
            </p>
            {(targetCarb !== undefined || targetProt !== undefined) && (
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground mt-0.5">
                target{targetCarb !== undefined ? ` ${targetCarb}g C` : ""}
                {targetProt !== undefined ? ` · ${targetProt}g P` : ""}
                {targetFat !== undefined ? ` · ${targetFat}g F` : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close swap drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Current meal */}
          {currentMeal && (
            <div>
              <p className="mb-2 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
                Currently
              </p>
              <MealCell meal={toMealAssembly(currentMeal)} slot={slot} density="normal" />
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground shrink-0">
              3 Alternatives
            </p>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Alternatives */}
          {isLoadingAlts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-[var(--radius-card)] bg-muted"
                />
              ))}
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3">
              {alternatives.map((alt, i) => (
                <div key={i} className="relative group">
                  <MealCell meal={toMealAssembly(alt)} slot={slot} density="normal" />
                  <Button
                    size="sm"
                    className={cn(
                      "absolute right-2 top-2",
                      "opacity-0 group-hover:opacity-100 focus:opacity-100",
                      "transition-opacity",
                      "bg-[var(--color-orange)] text-white",
                      "hover:bg-[var(--color-orange-dark)]",
                      "font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider",
                    )}
                    onClick={() => {
                      onAccept(alt);
                      onClose();
                    }}
                  >
                    Use this
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground text-center py-4">
              No alternatives loaded yet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={tweakText}
              onChange={(e) => setTweakText(e.target.value)}
              placeholder="Custom: 'I have leftover salmon' or 'make it vegetarian'"
              className={cn(
                "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
                "font-[var(--font-apercu)] text-[var(--font-size-input)]",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "h-[var(--spacing-input-h)] text-[var(--font-size-body)]",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsLoadingAlts(true);
                  loadAlternatives().finally(() => setIsLoadingAlts(false));
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 font-[var(--font-sansita)] text-[var(--font-size-caption)] uppercase tracking-wider"
            onClick={() => {
              setIsLoadingAlts(true);
              loadAlternatives().finally(() => setIsLoadingAlts(false));
            }}
            disabled={isLoadingAlts}
          >
            <RefreshCw size={14} className={isLoadingAlts ? "animate-spin" : ""} />
            Regenerate alternatives
          </Button>
        </div>
      </div>
    </>
  );
}
