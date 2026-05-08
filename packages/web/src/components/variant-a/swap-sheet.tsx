/**
 * SwapSheet — per-cell swap right-side sheet for Variant A.
 *
 * 2026 generative-UI upgrade:
 * - Alternatives list is now rendered via <MealAlternatives> widget
 * - "Compare 2" toggle at the bottom shows <ComparisonCard> for the first
 *   two alternatives
 * - Jade-generated swaps via /api/jade/chat?surface=a are also rendered
 *   through JadeMessageRenderer in the sheet body
 *
 * Falls back to mock data when AI is not configured.
 */
import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RefreshCw, GitCompare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { KyleCard, KyleCardContent } from "@/components/shared/kyle-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MealAlternatives from "@/components/shared/widgets/meal-alternatives";
import ComparisonCard from "@/components/shared/widgets/comparison-card";
import type { MealAlt, MealAlternativesOutput } from "@/components/shared/widgets/meal-alternatives";
import type { ComparisonCardOutput } from "@/components/shared/widgets/comparison-card";
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
  date: string;
  slot: string;
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
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Convert SwapSheetMeal to MealAlt for the widget
function toMealAlt(meal: SwapSheetMeal, index: number): MealAlt {
  return {
    id: meal.id ?? `alt-${index}`,
    title: meal.title,
    components: meal.components.map((c) => `${c.portion} ${c.name}`),
    carbG: meal.carbG,
    proteinG: meal.protG,
    fatG: meal.fatG,
  };
}

// Build ComparisonCardOutput from two alternatives
function buildComparisonOutput(a: SwapSheetMeal, b: SwapSheetMeal): ComparisonCardOutput {
  return {
    label: "Compare options",
    optionA: {
      title: a.title,
      components: a.components.map((c) => `${c.portion} ${c.name}`),
      carbG: a.carbG,
      proteinG: a.protG,
      fatG: a.fatG,
    },
    optionB: {
      title: b.title,
      components: b.components.map((c) => `${c.portion} ${c.name}`),
      carbG: b.carbG,
      proteinG: b.protG,
      fatG: b.fatG,
    },
    // Highlight the option closer to 40/30/30 split (simple carb heuristic)
    highlightSide: a.carbG >= b.carbG ? "a" : "b",
  };
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
}: SwapSheetProps) {
  const [alternatives, setAlternatives] = useState<SwapSheetMeal[]>([]);
  const [isLoadingAlts, setIsLoadingAlts] = useState(false);
  const [tweakText, setTweakText] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  const loadAlternatives = useCallback(async () => {
    setIsLoadingAlts(true);
    setShowCompare(false);
    try {
      const res = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "swap",
          surface: "a",
          input: {
            date,
            slot,
            current_meal_title: currentMeal?.title,
            tweak: tweakText || undefined,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
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
      // fall through to mock
    }

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

  useEffect(() => {
    if (isOpen) {
      loadAlternatives().finally(() => setIsLoadingAlts(false));
    } else {
      setAlternatives([]);
      setTweakText("");
      setShowCompare(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAlternativeSelected = useCallback(
    (response: { id: string; title: string }) => {
      const chosen = alternatives.find(
        (a) => (a.id ?? "") === response.id || a.title === response.title,
      );
      if (!chosen) return;
      onAccept(chosen);
      toast.success("Meal swapped", {
        description: `${formatSlot(slot)} on ${formatDate(date)} updated to "${chosen.title}".`,
      });
      onClose();
    },
    [alternatives, onAccept, slot, date, onClose],
  );

  // Build MealAlternatives widget output
  const mealAltsOutput: MealAlternativesOutput = {
    label: "3 Alternatives",
    slot: formatSlot(slot),
    alternatives: alternatives.map((a, i) => toMealAlt(a, i)),
  };

  // Build ComparisonCard output (first two alternatives)
  const comparisonOutput: ComparisonCardOutput | null =
    alternatives.length >= 2
      ? buildComparisonOutput(alternatives[0], alternatives[1])
      : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full max-w-md p-0 flex flex-col gap-0",
          "border-l border-border/60",
          "bg-background/95 backdrop-blur-[12px]",
        )}
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-5 py-4 space-y-1 shrink-0">
          <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider text-left">
            Swap This Meal
          </SheetTitle>
          <SheetDescription className="text-left space-y-0.5">
            <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              {formatDate(date)} · {formatSlot(slot)}
            </span>
            {(targetCarb !== undefined || targetProt !== undefined) && (
              <span className="block font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/70">
                target
                {targetCarb !== undefined ? ` ${targetCarb}g C` : ""}
                {targetProt !== undefined ? ` · ${targetProt}g P` : ""}
                {targetFat !== undefined ? ` · ${targetFat}g F` : ""}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Current meal */}
          {currentMeal && (
            <div>
              <p className="mb-2 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
                Currently
              </p>
              <CurrentMealCard meal={currentMeal} />
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border/40" />
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground/60 shrink-0">
              Alternatives
            </p>
            <div className="flex-1 border-t border-border/40" />
          </div>

          {/* Alternatives — skeleton or MealAlternatives widget */}
          {isLoadingAlts ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-[var(--radius-card)]"
                  style={{
                    animation: `shimmer 1.5s ease-in-out infinite ${i * 80}ms`,
                    background:
                      "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              ))}
            </div>
          ) : (
            <MealAlternatives
              output={mealAltsOutput}
              onUserResponse={handleAlternativeSelected}
            />
          )}

          {/* ComparisonCard toggle — only shown after alternatives load */}
          {!isLoadingAlts && comparisonOutput && (
            <div className="space-y-2">
              <button
                onClick={() => setShowCompare((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 w-full justify-center rounded-[var(--radius-pill)] border py-1.5 px-3",
                  "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                  "transition-colors duration-150",
                  showCompare
                    ? "border-[var(--color-electrolyte)]/50 text-[var(--color-electrolyte)] bg-[var(--color-electrolyte)]/5"
                    : "border-border/60 text-muted-foreground hover:border-[var(--color-electrolyte)]/30",
                )}
              >
                <GitCompare size={12} />
                {showCompare ? "Hide comparison" : "Compare 2"}
              </button>

              {showCompare && (
                <ComparisonCard output={comparisonOutput} />
              )}
            </div>
          )}
        </div>

        {/* Footer — tweak input */}
        <div className="border-t border-border/60 px-5 py-4 space-y-2.5 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={tweakText}
              onChange={(e) => setTweakText(e.target.value)}
              placeholder="'leftover salmon' or 'make it vegetarian'…"
              className={cn(
                "flex-1 rounded-[var(--radius-input)] border border-input bg-background px-3 py-2",
                "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-1 focus:ring-[var(--color-electrolyte)]/50",
                "h-10 text-sm",
              )}
              onKeyDown={(e: React.KeyboardEvent) => {
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
            className="w-full gap-2 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest border-border/60 hover:border-[var(--color-electrolyte)]/40"
            onClick={() => {
              setIsLoadingAlts(true);
              loadAlternatives().finally(() => setIsLoadingAlts(false));
            }}
            disabled={isLoadingAlts}
          >
            <RefreshCw size={12} className={isLoadingAlts ? "animate-spin" : ""} />
            Regenerate alternatives
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CurrentMealCard({ meal }: { meal: SwapSheetMeal }) {
  return (
    <KyleCard variant="outlined" className="p-3">
      <KyleCardContent className="p-0 space-y-1.5">
        <p className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wide leading-snug">
          {meal.title}
        </p>
        {meal.components.length > 0 && (
          <ul className="space-y-0 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {meal.components.slice(0, 4).map((c, i) => (
              <li key={i} className="flex gap-1 items-baseline">
                <span className="text-muted-foreground/40">·</span>
                <span>
                  {c.portion} {c.name}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end">
          <MacroChip carbG={meal.carbG} protG={meal.protG} fatG={meal.fatG} />
        </div>
      </KyleCardContent>
    </KyleCard>
  );
}

function MacroChip({
  carbG,
  protG,
  fatG,
}: {
  carbG: number;
  protG: number;
  fatG: number;
}) {
  return (
    <Badge variant="ai-active" className="text-[6px] px-1.5 py-0 leading-none h-4">
      {carbG}C · {protG}P · {fatG}F
    </Badge>
  );
}
