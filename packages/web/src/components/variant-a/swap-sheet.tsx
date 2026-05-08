/**
 * SwapSheet — per-cell swap right-side sheet for Variant A.
 *
 * 2026 facelift:
 * - Uses shadcn Sheet (right side) for proper Radix accessibility
 * - "SWAP THIS MEAL" Sansita Bold header + Day · Slot subtitle
 * - 3 KyleCard variant="elevated" alternative cards stagger in via fade-up
 * - Each card has meal name in Compadre Wide, bullet list, macro chip, "USE THIS" pill
 * - Swap accept: toast + shimmer flash on cell
 * - Skeleton cards while loading
 */
import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
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

  const loadAlternatives = useCallback(async () => {
    setIsLoadingAlts(true);
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAccept = (alt: SwapSheetMeal) => {
    onAccept(alt);
    toast.success("Meal swapped", {
      description: `${formatSlot(slot)} on ${formatDate(date)} updated to "${alt.title}".`,
    });
    onClose();
  };

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
        <SheetHeader className="border-b border-border/60 px-5 py-4 space-y-1">
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
          {/* Current meal — outlined card */}
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
              3 Alternatives
            </p>
            <div className="flex-1 border-t border-border/40" />
          </div>

          {/* Alternatives */}
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
            <div className="space-y-3">
              {alternatives.map((alt, i) => (
                <AlternativeCard
                  key={i}
                  meal={alt}
                  index={i}
                  onAccept={() => handleAccept(alt)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — tweak input */}
        <div className="border-t border-border/60 px-5 py-4 space-y-2.5">
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
                <span>{c.portion} {c.name}</span>
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

interface AlternativeCardProps {
  meal: SwapSheetMeal;
  index: number;
  onAccept: () => void;
}

function AlternativeCard({ meal, index, onAccept }: AlternativeCardProps) {
  return (
    <KyleCard
      variant="elevated"
      className="p-0 overflow-hidden group/altcard"
      style={{
        animation: `fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <KyleCardContent className="p-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wide leading-snug flex-1">
            {meal.title}
          </p>
          {/* USE THIS — always visible on mobile, hover-visible on desktop */}
          <button
            onClick={onAccept}
            className={cn(
              "shrink-0 rounded-[var(--radius-pill)]",
              "bg-[var(--color-orange)] text-white",
              "font-[var(--font-compadre)] text-[7px] uppercase tracking-widest",
              "px-2.5 h-6 leading-none",
              "transition-all duration-150",
              "hover:bg-[var(--color-orange-dark)] hover:shadow-[var(--shadow-glow-orange)]",
              // Desktop: only show fully on hover of the card
              "opacity-60 group-hover/altcard:opacity-100",
              "sm:opacity-60 sm:group-hover/altcard:opacity-100",
            )}
          >
            Use This
          </button>
        </div>

        {/* Components */}
        {meal.components.length > 0 && (
          <ul className="space-y-0 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {meal.components.slice(0, 3).map((c, i) => (
              <li key={i} className="flex gap-1 items-baseline">
                <span className="text-muted-foreground/40">·</span>
                <span>{c.portion} {c.name}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Macro chip + method tag */}
        <div className="flex items-center justify-between gap-2">
          {meal.methodTag && (
            <p className="font-[var(--font-apercu)] text-[7px] italic text-muted-foreground/50">
              {meal.methodTag}
            </p>
          )}
          <div className="ml-auto">
            <MacroChip carbG={meal.carbG} protG={meal.protG} fatG={meal.fatG} />
          </div>
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
