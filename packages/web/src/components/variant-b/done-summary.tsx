/**
 * Variant B — DoneSummary (2026 facelift).
 *
 * Celebratory full-card layout when all 21 cards are decided.
 *
 * - Big "WEEK BUILT" headline (Sansita Bold) + week range subtitle
 * - Coach strip line
 * - Stats row: total meals / locked / flexible
 * - Week macro bar
 * - Collapsible day accordion (7 days × their meals)
 * - Two CTA buttons: SAVE WEEK (Mango pill) + VIEW AS GRID (outline → Sheet)
 * - CSS-only confetti on entry
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, LayoutGrid, RotateCcw, Save, Check } from "lucide-react";
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

const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(weekStart + "T12:00:00");
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export interface DoneSummaryProps {
  weekPlan: WeekPlan;
  decisions: SlotDecision[];
  onRebuild: () => void;
  onSave?: () => void;
  className?: string;
}

/** Tiny CSS-only confetti burst — purely visual, no library needed */
function ConfettiDots() {
  const dots = [
    { x: "10%", y: "8%", color: "var(--color-orange)", size: 8, delay: 0 },
    { x: "85%", y: "5%", color: "var(--color-electrolyte)", size: 6, delay: 0.1 },
    { x: "50%", y: "3%", color: "var(--color-dragonfruit)", size: 7, delay: 0.2 },
    { x: "25%", y: "12%", color: "var(--color-orange-light)", size: 5, delay: 0.05 },
    { x: "72%", y: "10%", color: "var(--color-electrolyte-light)", size: 6, delay: 0.15 },
    { x: "92%", y: "18%", color: "var(--color-orange)", size: 4, delay: 0.3 },
    { x: "8%", y: "22%", color: "var(--color-dragonfruit-light)", size: 5, delay: 0.08 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            background: dot.color,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], y: [0, -20, -30, -50] }}
          transition={{
            duration: 1.2,
            delay: dot.delay,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.15, 0.6, 1],
          }}
        />
      ))}
    </div>
  );
}

/** Accordion day row */
function DayAccordion({
  dayIndex,
  day,
  decisions,
}: {
  dayIndex: number;
  day: WeekPlan["days"][number];
  decisions: SlotDecision[];
}) {
  const [open, setOpen] = useState(false);
  const dayDecisions = decisions.filter((d) => d.date === day.date);
  const lockedCount = dayDecisions.filter((d) => d.decision === "lock").length;
  const meals = Object.entries(day.meals ?? {});

  return (
    <div className="border border-border/40 rounded-[var(--radius-card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-[var(--font-compadre)] text-[var(--font-size-label)] uppercase tracking-widest text-foreground font-bold">
            {DAY_NAMES_SHORT[dayIndex]}
          </span>
          {lockedCount > 0 && (
            <Badge variant="training-day" className="text-[8px] px-1.5 py-0.5">
              {lockedCount} locked
            </Badge>
          )}
          <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            {meals.length} meals
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 space-y-2 bg-muted/10">
              {meals.map(([slot, meal]) => {
                if (!meal) return null;
                const decision = dayDecisions.find((d) => d.slot === slot);
                const isLocked = decision?.decision === "lock";
                return (
                  <div
                    key={slot}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2",
                      "border border-border/30 bg-card",
                      isLocked && "border-accent/40",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-[var(--font-compadre)] text-[9px] uppercase tracking-[0.15em] text-muted-foreground shrink-0">
                        {SLOT_LABELS_SHORT[slot]}
                      </span>
                      <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground truncate">
                        {meal.title}
                      </span>
                    </div>
                    {isLocked && (
                      <span className="text-accent shrink-0" style={{ fontSize: "10px" }}>
                        🔒
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  const flexibleCount = totalMeals - lockedCount;
  const weekTotals = computeWeekTotals(weekPlan);
  const weekRange = formatWeekRange(weekPlan.week_start);

  const handleSave = () => {
    setSaved(true);
    onSave?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn("relative flex flex-col gap-5 px-4 py-8 max-w-md w-full mx-auto", className)}
      >
        {/* Confetti */}
        <ConfettiDots />

        {/* Headline block */}
        <div className="text-center space-y-3 relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
            className="flex justify-center"
          >
            <JadeAvatar size={96} state="idle" glow />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-[var(--font-sansita)] font-bold uppercase tracking-wide text-foreground"
              style={{ fontSize: "clamp(1.6rem, 5vw, 2rem)" }}
            >
              WEEK BUILT
            </h1>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground mt-1">
              {weekRange}
            </p>
          </motion.div>

          {weekPlan.coach_strip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex items-center justify-center gap-2"
            >
              <div
                className="px-3 py-1.5 rounded-full font-[var(--font-apercu)] italic text-[var(--font-size-caption)] text-muted-foreground"
                style={{
                  background: "rgba(28,249,207,0.08)",
                  border: "1px solid rgba(28,249,207,0.2)",
                }}
              >
                {weekPlan.coach_strip}
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[var(--radius-card)] border border-border/40 bg-card p-4 space-y-4"
          style={{ boxShadow: "var(--shadow-card-elevated-light)" }}
        >
          <div className="flex gap-0 divide-x divide-border/40">
            {[
              { value: totalMeals, label: "meals", color: "text-foreground" },
              { value: lockedCount, label: "locked", color: "text-[var(--color-electrolyte)]" },
              { value: flexibleCount, label: "flexible", color: "text-muted-foreground" },
            ].map(({ value, label, color }) => (
              <div key={label} className="flex-1 text-center px-3">
                <p className={cn("font-[var(--font-apercu-mono)] text-2xl font-bold tabular-nums", color)}>
                  {value}
                </p>
                <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <Separator className="opacity-40" />

          {/* Week macro bar */}
          <MacroBar
            carbG={weekTotals.carbG}
            protG={weekTotals.protG}
            fatG={weekTotals.fatG}
          />
        </motion.div>

        {/* Day accordion list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground px-1">
            Your week
          </p>
          {weekPlan.days.map((day, i) => (
            <DayAccordion
              key={day.date}
              dayIndex={i}
              day={day}
              decisions={decisions}
            />
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save week
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSheetOpen(true)}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            View as grid
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground normal-case"
            onClick={onRebuild}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rebuild stack
          </Button>
        </motion.div>
      </motion.div>

      {/* View-as-grid Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Week Grid
            </SheetTitle>
          </SheetHeader>

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
                      <div key={`${day.date}-${col}`} className="col-span-1 space-y-0.5">
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
                                "border border-border/40 bg-card truncate",
                                isLocked && "border-accent/50",
                              )}
                            >
                              <span className="text-muted-foreground">{SLOT_LABELS_SHORT[slot]}</span>
                              {" "}
                              <span className="truncate">{meal.title.split(" + ")[0]}</span>
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
