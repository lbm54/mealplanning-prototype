/**
 * Variant B — DoneSummary.
 *
 * Success screen shown after all cards are decided.
 *
 * Shows:
 * - Jade avatar (large 96px) + "YOUR WEEK IS BUILT."
 * - Jade's summary line (from weekPlan.coach_strip)
 * - Week stats: total meals, locked count, week macro totals
 * - "View as plan" button → opens WeekGrid Sheet
 * - "Save plan" pill → persists to Supabase (already done on done-state entry)
 * - "Rebuild stack" → calls rebuild callback
 *
 * Design ref: 06_five_uiux_approaches.md §1.B — "Done state" wireframe
 */
import { useState } from "react";
import { motion } from "motion/react";
import { LayoutGrid, RotateCcw, Save } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { MacroBar } from "@/components/shared/macro-bar";
import { cn } from "@/lib/utils";
import type { WeekPlan } from "@/server/jade/schema";
import type { SlotDecision } from "./types";

const SLOT_LABELS_SHORT: Record<string, string> = {
  breakfast: "B",
  lunch: "L",
  dinner: "D",
  snack: "S",
  pre_workout: "Pre",
  during_workout: "Dur",
  post_workout: "Post",
};

function computeWeekTotals(weekPlan: WeekPlan) {
  let carbG = 0, protG = 0, fatG = 0;
  for (const day of weekPlan.days) {
    for (const meal of Object.values(day.meals ?? {})) {
      if (!meal) continue;
      carbG += meal.totals.carb_g;
      protG += meal.totals.protein_g;
      fatG += meal.totals.fat_g;
    }
  }
  return { carbG: Math.round(carbG), protG: Math.round(protG), fatG: Math.round(fatG) };
}

const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface DoneSummaryProps {
  weekPlan: WeekPlan;
  decisions: SlotDecision[];
  onRebuild: () => void;
  onSave?: () => void;
  className?: string;
}

export function DoneSummary({
  weekPlan,
  decisions,
  onRebuild,
  onSave,
  className,
}: DoneSummaryProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalMeals = decisions.length;
  const lockedCount = decisions.filter((d) => d.decision === "lock").length;
  const weekTotals = computeWeekTotals(weekPlan);

  const handleSave = () => {
    setSaved(true);
    onSave?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("flex flex-col items-center gap-6 px-4 py-8 max-w-md w-full mx-auto", className)}
      >
        {/* Jade avatar */}
        <JadeAvatar size={96} state="idle" />

        {/* Headline */}
        <div className="text-center">
          <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
            Your week is built.
          </h1>
          {weekPlan.coach_strip && (
            <p className="mt-2 font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-relaxed max-w-sm">
              {weekPlan.coach_strip}
            </p>
          )}
        </div>

        {/* Stats card */}
        <div className="w-full rounded-[var(--radius-card)] border bg-card shadow-kyle-card p-5 space-y-4">
          <h2 className="font-[var(--font-compadre)] text-[var(--font-size-label)] uppercase tracking-wider text-muted-foreground">
            Week Summary
          </h2>

          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-data)] font-bold text-foreground">
                {totalMeals}
              </p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                meals
              </p>
            </div>
            <div className="flex-1 text-center">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-data)] font-bold text-accent">
                {lockedCount}
              </p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                locked
              </p>
            </div>
            <div className="flex-1 text-center">
              <p className="font-[var(--font-apercu-mono)] text-[var(--font-size-data)] font-bold text-muted-foreground">
                {totalMeals - lockedCount}
              </p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                flexible
              </p>
            </div>
          </div>

          <Separator />

          <MacroBar
            carbG={weekTotals.carbG}
            protG={weekTotals.protG}
            fatG={weekTotals.fatG}
            className="text-center justify-center font-[var(--font-apercu-mono)] text-[var(--font-size-body)]"
          />
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <Button
            className="w-full"
            onClick={() => setSheetOpen(true)}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            View week grid
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSave}
            disabled={saved}
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? "Saved" : "Save plan"}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onRebuild}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rebuild stack
          </Button>
        </div>

        {/* Jade follow-up */}
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground text-center">
          Tap the Jade avatar anytime to ask about your week.
        </p>
      </motion.div>

      {/* Week grid Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Week Grid
            </SheetTitle>
          </SheetHeader>

          {/* Read-only grid summary */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAY_NAMES_SHORT.map((d) => (
                <div
                  key={d}
                  className="font-[var(--font-compadre)] text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            {weekPlan.days.map((day, i) => {
              const slots = Object.keys(day.meals ?? {});
              return (
                <div key={day.date} className="grid grid-cols-7 gap-1 mb-1">
                  {Array.from({ length: 7 }).map((_, col) => {
                    if (col !== i) return <div key={col} />;
                    return (
                      <div
                        key={`${day.date}-${col}`}
                        className="col-span-1 space-y-0.5"
                      >
                        {slots.map((slot) => {
                          const meal = day.meals?.[slot as keyof typeof day.meals];
                          if (!meal) return null;
                          const isLocked = decisions.find(
                            (d) => d.date === day.date && d.slot === slot && d.decision === "lock",
                          );
                          return (
                            <div
                              key={slot}
                              className={cn(
                                "rounded px-1 py-0.5 text-[9px] font-[var(--font-apercu)]",
                                "border border-border/50 bg-card truncate",
                                isLocked && "border-accent/50",
                              )}
                            >
                              <span className="text-muted-foreground">{SLOT_LABELS_SHORT[slot]}</span>
                              {" "}
                              <span className="truncate">{meal.title.split(" + ")[0]}</span>
                              {isLocked && (
                                <Badge variant="outline" className="ml-1 text-[7px] px-0.5 border-accent text-accent">
                                  L
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="shrink-0 pt-2 border-t border-border">
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground text-center">
              Read-only view — swap meals by rebuilding the stack.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
