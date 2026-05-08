/**
 * JadeFillSheet — 3-step sheet flow for "Fill my week with Jade".
 *
 * Spec: 09_figma_analysis_and_widgets.md §4 Variant C integration
 *
 * Step 1 — CategoryPicker: user picks intent (Athletic Performance, Race Prep, etc.)
 * Step 2 — MacroSlider: user adjusts carb / protein / fat split (default = current target ratio)
 * Step 3 — AI fill: skeleton skeleton state while Jade runs proposeWeekPlan; on completion
 *            onComplete(pickMap) is called and the sheet closes.
 *
 * The AI call is a one-shot POST to /api/jade/chat?surface=c — no useChat needed.
 * Steps 1-2 are pure local state.
 */

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import CategoryPicker from "@/components/shared/widgets/category-picker";
import MacroSlider from "@/components/shared/widgets/macro-slider";
import { cn } from "@/lib/utils";
import type { ColumnOptions } from "@/lib/queries/columns-data.c";
import type { PickMap } from "@/lib/hooks/use-column-picks";
import type { DerivedWeekCharacter } from "@/lib/derive-week-character";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JadeFillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after Jade fills the week successfully. */
  onComplete: (pickMap: PickMap) => void;
  /** Current week start ISO date — passed to proposeWeekPlan. */
  weekStart: string;
  /** Column options for all slots — used to resolve food IDs from Jade's plan. */
  allColumns: Record<string, ColumnOptions>;
  /** Default macro split derived from the user's current target (0–100). */
  defaultMacroSplit?: { carb: number; protein: number; fat: number };
  /** Total unfilled meals — shown in header for context. */
  unfilledCount?: number;
  /** When present and workouts are scheduled, skip the category step entirely. */
  derived?: DerivedWeekCharacter | null;
}

type Step = "category" | "macros" | "filling";

interface CategoryChoice {
  id: string;
  label: string;
}

// ─── Default categories for Variant C ────────────────────────────────────────

const VARIANT_C_CATEGORIES = [
  { id: "athletic", label: "Athletic Performance", tone: "accent" as const },
  { id: "race",     label: "Race Prep",            tone: "primary" as const },
  { id: "recovery", label: "Recovery Week",        tone: "accent" as const },
  { id: "budget",   label: "Budget",               tone: "muted" as const },
  { id: "dietary",  label: "Specific Dietary",     tone: "muted" as const },
  { id: "weight",   label: "Weight Loss",          tone: "warning" as const },
  { id: "family",   label: "Family-Friendly",      tone: "muted" as const },
  { id: "pantry",   label: "Pantry-Only",          tone: "warning" as const },
];

// ─── Step indicator dots ───────────────────────────────────────────────────────

function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ["category", "macros", "filling"];
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            "block h-1.5 rounded-full transition-all duration-300",
            i < idx
              ? "w-5 bg-[var(--color-electrolyte)]"
              : i === idx
                ? "w-8 bg-[var(--color-orange)]"
                : "w-2.5 bg-muted",
          )}
        />
      ))}
    </div>
  );
}

// ─── Filling skeleton ─────────────────────────────────────────────────────────

function FillingState() {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3 mb-6">
        <JadeAvatar size={36} state="thinking" online glow />
        <div>
          <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
            Jade is planning your week…
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            Matching foods to your targets
          </p>
        </div>
      </div>
      {/* 7 skeleton rows for the 7 days */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-3 w-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div
            className="h-3 rounded-full bg-muted animate-pulse flex-1"
            style={{ opacity: 1 - i * 0.08 }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JadeFillSheet({
  open,
  onOpenChange,
  onComplete,
  weekStart,
  allColumns,
  defaultMacroSplit = { carb: 50, protein: 25, fat: 25 },
  unfilledCount,
  derived,
}: JadeFillSheetProps) {
  // Skip the category step when we have a meaningful inferred week character.
  const hasInferredContext = !!derived && derived.workoutDays > 0;
  const inferredCategory: CategoryChoice | null = hasInferredContext
    ? derived!.isRaceWeek
      ? { id: "race", label: "Race Prep" }
      : derived!.weekCharacter === "high-load training" || derived!.weekCharacter === "moderate training"
        ? { id: "athletic", label: "Athletic Performance" }
        : { id: "recovery", label: "Recovery Week" }
    : null;
  const initialStep: Step = hasInferredContext ? "macros" : "category";

  const [step, setStep] = useState<Step>(initialStep);
  const [category, setCategory] = useState<CategoryChoice | null>(inferredCategory);
  const [error, setError] = useState<string | null>(null);

  // Reset internal state when sheet opens/closes
  function handleOpenChange(next: boolean) {
    if (!next) {
      if (step !== "filling") {
        setStep(initialStep);
        setCategory(inferredCategory);
        setError(null);
      }
    }
    onOpenChange(next);
  }

  // Step 1 → 2: category picked
  function handleCategoryPick(choice: { id: string; label: string }) {
    setCategory(choice);
    setStep("macros");
  }

  // Step 2 → 3: macro split confirmed → trigger AI fill
  function handleMacroConfirm(split: { carbPct: number; proteinPct: number; fatPct: number }) {
    setStep("filling");
    void runFill(split);
  }

  async function runFill(split: { carbPct: number; proteinPct: number; fatPct: number }) {
    setError(null);
    try {
      const response = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "week",
          input: {
            week_start: weekStart,
            intent: category?.label ?? "Athletic Performance",
            macro_split: {
              carbPct: split.carbPct,
              proteinPct: split.proteinPct,
              fatPct: split.fatPct,
            },
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      // /api/jade/object returns the validated WeekPlan as JSON directly.
      const weekPlan = (await response.json()) as {
        days?: Array<{
          date: string;
          meals?: Record<
            string,
            { components?: Array<{ food_id?: string; name?: string }> }
          >;
        }>;
      };

      if (!weekPlan?.days) {
        throw new Error("Jade returned an incomplete plan");
      }

      // Build PickMap from weekPlan
      const SLOTS = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"] as const;
      const pickMap: PickMap = {};

      for (const day of weekPlan.days) {
        for (const slot of SLOTS) {
          const meal = day.meals?.[slot];
          if (!meal?.components) continue;
          const key = `${day.date}:${slot}`;
          const cols = allColumns[key];
          if (!cols) continue;

          let proteinId: string | null = null;
          let carbId: string | null = null;
          let vegId: string | null = null;

          // Match by food_id (when Jade has it) OR by case-insensitive name
          // overlap (when she only provided names — typical with the loose
          // schema).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matchByName = (col: any[], name: string) => {
            const n = name.toLowerCase();
            return col.find((o) =>
              o.name?.toLowerCase().includes(n) ||
              n.includes(String(o.name ?? "").toLowerCase()),
            );
          };
          for (const comp of meal.components) {
            const fid = comp.food_id;
            const nm = comp.name ?? "";
            if (fid) {
              if (!proteinId && cols.protein.some((o) => o.id === fid)) proteinId = fid;
              else if (!carbId && cols.carb.some((o) => o.id === fid)) carbId = fid;
              else if (!vegId && cols.veg.some((o) => o.id === fid)) vegId = fid;
            } else if (nm) {
              if (!proteinId) {
                const m = matchByName(cols.protein, nm);
                if (m) { proteinId = m.id; continue; }
              }
              if (!carbId) {
                const m = matchByName(cols.carb, nm);
                if (m) { carbId = m.id; continue; }
              }
              if (!vegId) {
                const m = matchByName(cols.veg, nm);
                if (m) { vegId = m.id; continue; }
              }
            }
          }

          pickMap[key] = { proteinId, carbId, vegId, locked: false };
        }
      }

      onComplete(pickMap);
      onOpenChange(false);
      // Reset for next time
      setStep("category");
      setCategory(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStep("macros"); // bounce back to step 2 so user can retry
    }
  }

  // ─── Titles per step ────────────────────────────────────────────────────────

  const stepTitle: Record<Step, string> = {
    category: "What kind of week?",
    macros:   "Adjust your macro split",
    filling:  "Jade is filling your week",
  };

  const stepDescription: Record<Step, string> = {
    category:
      unfilledCount != null && unfilledCount > 0
        ? `${unfilledCount} meals left to fill. Pick a focus and Jade will do the rest.`
        : "Pick a focus and Jade will fill every column.",
    macros:
      "Drag the sliders to dial in your carb / protein / fat ratio, then confirm.",
    filling:
      "Matching foods across 21 meals — just a moment…",
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[20px] pb-8">
        <SheetHeader className="mb-1">
          <div className="flex items-center gap-3">
            <JadeAvatar
              size={36}
              state={step === "filling" ? "thinking" : "idle"}
              online={step !== "filling"}
              className="shrink-0"
            />
            <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              {stepTitle[step]}
            </SheetTitle>
          </div>
          <SheetDescription className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground pl-[44px]">
            {stepDescription[step]}
          </SheetDescription>
        </SheetHeader>

        {/* Step dots */}
        <StepDots current={step} />

        {/* Step 1 — CategoryPicker */}
        {step === "category" && (
          <CategoryPicker
            output={{
              title: "",
              categories: VARIANT_C_CATEGORIES,
            }}
            onUserResponse={handleCategoryPick}
          />
        )}

        {/* Step 2 — MacroSlider */}
        {step === "macros" && (
          <div className="space-y-4">
            {/* Show chosen category as a breadcrumb */}
            {category && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-electrolyte)]/40 bg-[var(--color-electrolyte)]/10 px-3 py-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
                  {category.label}
                </span>
                <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                  selected
                </span>
              </div>
            )}

            <MacroSlider
              output={{
                label: "",
                initialCarb: defaultMacroSplit.carb,
                initialProtein: defaultMacroSplit.protein,
                initialFat: defaultMacroSplit.fat,
              }}
              onUserResponse={handleMacroConfirm}
            />

            {/* Error from a previous fill attempt */}
            {error && (
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-destructive">
                {error}. Try again.
              </p>
            )}
          </div>
        )}

        {/* Step 3 — Filling skeleton */}
        {step === "filling" && <FillingState />}

        {/* Back button — not shown during fill */}
        {step === "macros" && (
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("category")}
              className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Back
            </button>
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50">
              Press Apply to continue
            </span>
          </div>
        )}

        {/* Inline Jade fill indicator during step 3 */}
        {step === "filling" && (
          <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-[var(--color-electrolyte)]" />
            <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] uppercase tracking-widest">
              Filling…
            </span>
            <Sparkles size={13} className="text-[var(--color-orange)]" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
